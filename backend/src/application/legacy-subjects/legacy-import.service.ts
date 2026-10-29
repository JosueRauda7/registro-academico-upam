import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { LegacyCompletedSubjectRepository } from '../../infrastructure/database/repositories/legacy-completed-subject.repository';
import { StudentRepository } from '../../infrastructure/database/repositories/student.repository';
import { SubjectRepository } from '../../infrastructure/database/repositories/subject.repository';
import { LegacyImportRowDto } from './dto/legacy-import-row.dto';
import { inspectXlsx, MAX_XLSX_BYTES } from './safe-xlsx';

export const IMPORT_HEADERS = ['carnet', 'codigo_materia', 'nota', 'anio', 'semestre', 'observaciones'];
export const MAX_IMPORT_ROWS = 500;
const SHEET = 'Notas previas';

@Injectable()
export class LegacyImportService {
  private processing = false;

  constructor(
    private readonly legacyRepository: LegacyCompletedSubjectRepository,
    private readonly studentRepository: StudentRepository,
    private readonly subjectRepository: SubjectRepository,
  ) {}

  async template(): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(SHEET);
    sheet.addRow(IMPORT_HEADERS);
    sheet.columns = [{ width: 24 }, { width: 24 }, { width: 12 }, { width: 12 }, { width: 12 }, { width: 60 }];
    sheet.getColumn(1).numFmt = '@';
    sheet.getColumn(2).numFmt = '@';
    sheet.getRow(1).font = { bold: true };
    sheet.views = [{ state: 'frozen', ySplit: 1 }];
    const instructions = workbook.addWorksheet('Instrucciones');
    instructions.getColumn(1).width = 110;
    [
      'Completa únicamente la hoja Notas previas, sin cambiar sus encabezados.',
      'Cada fila registra una materia para un estudiante existente. Máximo 500 filas y 2 MB por archivo .xlsx.',
      'carnet: identificador del estudiante, como texto. Conserva ceros iniciales.',
      'codigo_materia: código exacto del catálogo, como texto; materia activa de la misma carrera del estudiante.',
      'nota: número de 0 a 10, con máximo dos decimales (también se admiten notas reprobadas).',
      'anio: opcional, entero de 1900 al año actual. semestre: opcional, 1 o 2.',
      'observaciones: opcional, texto de hasta 500 caracteres. No uses fórmulas ni texto que comience con =, +, - o @.',
      'No incluyas macros, fórmulas, vínculos, imágenes, objetos, celdas combinadas ni hojas adicionales.',
      'No repitas una materia para el mismo estudiante. Los registros existentes no se sobrescriben.',
      'Si una fila falla, no se guarda ninguna. Corrige los errores indicados y vuelve a cargar el archivo.',
      'La hoja Materias es una referencia. No se importan sus filas. No se incluyen datos personales en la plantilla.',
    ].forEach((text) => instructions.addRow([text]));
    const catalog = workbook.addWorksheet('Materias');
    catalog.addRow(['codigo_materia', 'nombre', 'carrera']);
    catalog.columns = [{ width: 24 }, { width: 60 }, { width: 40 }];
    // Keep the template inside the same resource limits enforced on imported workbooks.
    const subjects = await this.subjectRepository.findAll();
    for (const subject of subjects.slice(0, 2000)) catalog.addRow([subject.code, subject.name, subject.career]);
    return Buffer.from(await workbook.xlsx.writeBuffer());
  }

  async importFile(file: Express.Multer.File | undefined, actorId: string) {
    if (!file || !/\.xlsx$/i.test(file.originalname) || !file.buffer || file.buffer.length > MAX_XLSX_BYTES ||
      !['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/octet-stream'].includes(file.mimetype)) {
      throw new BadRequestException('Adjunta un archivo .xlsx de máximo 2 MB generado desde la plantilla.');
    }
    if (this.processing) throw new ConflictException('Ya se está procesando un Excel. Intenta nuevamente al finalizar.');
    this.processing = true;
    try {
      return await this.processFile(file.buffer, actorId);
    } finally {
      this.processing = false;
    }
  }

  private async processFile(buffer: Buffer, actorId: string) {
    await inspectXlsx(buffer);
    const workbook = new ExcelJS.Workbook();
    try {
      await workbook.xlsx.load(buffer as any);
    } catch {
      throw new BadRequestException('No se pudo leer el Excel. Usa un archivo .xlsx válido sin contraseña.');
    }
    if (workbook.worksheets.length > 3 || workbook.worksheets.some((s) => ![SHEET, 'Materias', 'Instrucciones'].includes(s.name))) {
      throw new BadRequestException('Usa las hojas de la plantilla: Notas previas, Materias e Instrucciones.');
    }
    const sheet = workbook.getWorksheet(SHEET);
    if (!sheet || sheet.state !== 'visible' || sheet.rowCount > MAX_IMPORT_ROWS + 1 || sheet.columnCount > IMPORT_HEADERS.length) {
      throw new BadRequestException('La hoja Notas previas debe estar visible y contener hasta 500 filas y las 6 columnas de la plantilla.');
    }
    // Reject complex values even on reference sheets. Formula cached results are never trusted.
    for (const worksheet of workbook.worksheets) {
      worksheet.eachRow((row) => row.eachCell((cell) => {
        if (cell.value !== null && !['string', 'number'].includes(typeof cell.value)) {
          throw new BadRequestException('Solo se admiten celdas de texto o números, sin fórmulas, enlaces, fechas ni objetos.');
        }
      }));
    }
    if (IMPORT_HEADERS.some((header, i) => sheet.getRow(1).getCell(i + 1).value !== header)) {
      throw new BadRequestException('Los encabezados no coinciden con la plantilla. Descarga una plantilla nueva.');
    }
    const errors: string[] = [];
    const parsed: { row: number; data: LegacyImportRowDto }[] = [];
    for (let index = 2; index <= sheet.rowCount; index++) {
      const values = IMPORT_HEADERS.map((_, c) => sheet.getRow(index).getCell(c + 1).value);
      if (values.every((v) => v === null || v === '')) continue;
      const clean = values.map((v) => typeof v === 'string' ? v.trim() : v);
      if (clean.some((v) => typeof v === 'string' && /^[=+\-@]/.test(v))) {
        errors.push(`Fila ${index}: no se permite texto que comience con =, +, - o @.`);
        continue;
      }
      const number = (value: unknown) => typeof value === 'number' ? value :
        typeof value === 'string' && /^\d+(?:[.,]\d{1,2})?$/.test(value) ? Number(value.replace(',', '.')) : NaN;
      const optionalNumber = (value: unknown) => value === null || value === '' ? null : number(value);
      const data = plainToInstance(LegacyImportRowDto, {
        carnet: clean[0], subjectCode: clean[1], score: number(clean[2]),
        year: optionalNumber(clean[3]), semester: optionalNumber(clean[4]), notes: clean[5] === '' ? null : clean[5],
      });
      const validation = await validate(data, { whitelist: true, forbidNonWhitelisted: true });
      if (validation.length) {
        const fields = { carnet: 'carnet (texto)', subjectCode: 'codigo_materia (texto)', score: 'nota (0 a 10, hasta 2 decimales)', year: 'anio (1900 al actual)', semester: 'semestre (1 o 2)', notes: 'observaciones (hasta 500 caracteres)' };
        errors.push(`Fila ${index}: revisa ${validation.map((v) => fields[v.property]).join(', ')}.`);
      } else parsed.push({ row: index, data });
    }
    if (!parsed.length && !errors.length) throw new BadRequestException('El archivo no contiene notas para importar.');
    if (errors.length) throw new BadRequestException(errors.slice(0, 50));

    const students = new Map<string, Awaited<ReturnType<StudentRepository['findByCarnet']>>>();
    const subjects = new Map<string, Awaited<ReturnType<SubjectRepository['findByCode']>>>();
    const existing = new Map<string, Set<string>>();
    const seen = new Set<string>();
    const rows: { studentId: string; subjectId: string; score: number; year: number | null; semester: number | null; notes: string | null; registeredById: string }[] = [];
    for (const { row, data } of parsed) {
      if (!students.has(data.carnet)) students.set(data.carnet, await this.studentRepository.findByCarnet(data.carnet));
      if (!subjects.has(data.subjectCode)) subjects.set(data.subjectCode, await this.subjectRepository.findByCode(data.subjectCode));
      const student = students.get(data.carnet);
      const subject = subjects.get(data.subjectCode);
      if (!student) { errors.push(`Fila ${row}: el carnet no corresponde a un estudiante existente.`); continue; }
      if (!subject || !subject.isActive || subject.career !== student.career) {
        errors.push(`Fila ${row}: la materia debe existir, estar activa y pertenecer a la carrera del estudiante.`); continue;
      }
      if (!existing.has(student.id)) existing.set(student.id, new Set((await this.legacyRepository.findByStudent(student.id)).map((r) => r.subjectId)));
      const key = `${student.id}:${subject.id}`;
      if (seen.has(key) || existing.get(student.id)!.has(subject.id)) {
        errors.push(`Fila ${row}: materia repetida en el archivo o ya registrada para este estudiante.`); continue;
      }
      seen.add(key);
      rows.push({ studentId: student.id, subjectId: subject.id, score: data.score, year: data.year, semester: data.semester, notes: data.notes, registeredById: actorId });
    }
    if (errors.length) throw new BadRequestException(errors.slice(0, 50));
    await this.legacyRepository.importBatch(rows);
    return { imported: rows.length, students: new Set(rows.map((r) => r.studentId)).size };
  }
}
