import { BadRequestException } from '@nestjs/common';
import { inflateRaw } from 'zlib';
import { promisify } from 'util';

export const MAX_XLSX_BYTES = 2 * 1024 * 1024;
const MAX_EXPANDED_BYTES = 8 * 1024 * 1024;
const inflate = promisify(inflateRaw);
const allowedPart = /^(?:\[Content_Types\]\.xml|_rels\/\.rels|docProps\/(?:app|core|custom)\.xml|xl\/(?:workbook\.xml|styles\.xml|sharedStrings\.xml|theme\/theme\d+\.xml|worksheets\/sheet\d+\.xml|_rels\/workbook\.xml\.rels|worksheets\/_rels\/sheet\d+\.xml\.rels))$/;

function invalid(message = 'El archivo no es un XLSX simple válido. Usa la plantilla sin macros, fórmulas, enlaces ni objetos.') {
  throw new BadRequestException(message);
}

// Validate and bound the ZIP before ExcelJS can allocate objects from untrusted XML.
// No extraction to disk and no network access. ZIP64/encryption/unknown parts are rejected.
export async function inspectXlsx(buffer: Buffer): Promise<void> {
  try {
    if (buffer.length < 22 || buffer.length > MAX_XLSX_BYTES || buffer.readUInt32LE(0) !== 0x04034b50) invalid();
    const end = buffer.length - 22;
    // A canonical archive without trailing bytes/comments avoids ambiguous ZIP interpretations.
    if (buffer.readUInt32LE(end) !== 0x06054b50 || buffer.readUInt16LE(end + 20) !== 0) invalid();
    if (buffer.readUInt16LE(end + 4) || buffer.readUInt16LE(end + 6)) invalid();
    const count = buffer.readUInt16LE(end + 10);
    if (!count || count > 100 || count !== buffer.readUInt16LE(end + 8)) invalid();
    const size = buffer.readUInt32LE(end + 12);
    let offset = buffer.readUInt32LE(end + 16);
    if (offset + size !== end) invalid();
    const centralStart = offset;
    const names = new Set<string>();
    const ranges: [number, number][] = [];
    let expanded = 0;
    for (let i = 0; i < count; i++) {
      if (offset + 46 > end || buffer.readUInt32LE(offset) !== 0x02014b50) invalid();
      const flags = buffer.readUInt16LE(offset + 8);
      const method = buffer.readUInt16LE(offset + 10);
      const compressed = buffer.readUInt32LE(offset + 20);
      const declared = buffer.readUInt32LE(offset + 24);
      const nameLength = buffer.readUInt16LE(offset + 28);
      const extraLength = buffer.readUInt16LE(offset + 30);
      const commentLength = buffer.readUInt16LE(offset + 32);
      const local = buffer.readUInt32LE(offset + 42);
      if ((flags & ~0x0808) || ![0, 8].includes(method) || declared > MAX_EXPANDED_BYTES || buffer.readUInt16LE(offset + 34)) invalid();
      const next = offset + 46 + nameLength + extraLength + commentLength;
      if (next > end || !nameLength || extraLength) invalid();
      const name = buffer.subarray(offset + 46, offset + 46 + nameLength).toString('utf8');
      if (names.has(name)) invalid();
      names.add(name);
      const directory = name.endsWith('/');
      if (directory ? !/^(?:_rels|docProps|xl|xl\/(?:theme|worksheets|_rels)|xl\/worksheets\/_rels)\/$/.test(name) : !allowedPart.test(name)) invalid();
      if (local + 30 > centralStart || buffer.readUInt32LE(local) !== 0x04034b50 || buffer.readUInt16LE(local + 6) !== flags || buffer.readUInt16LE(local + 8) !== method) invalid();
      const localNameLength = buffer.readUInt16LE(local + 26);
      if (buffer.readUInt16LE(local + 28)) invalid();
      const start = local + 30 + localNameLength + buffer.readUInt16LE(local + 28);
      const finish = start + compressed;
      if (start > centralStart || finish > centralStart || buffer.subarray(local + 30, local + 30 + localNameLength).toString('utf8') !== name) invalid();
      ranges.push([local, finish]);
      const remaining = MAX_EXPANDED_BYTES - expanded;
      if (declared > remaining) invalid('El Excel descomprimido excede el límite de 8 MB.');
      const data = method === 0 ? buffer.subarray(start, finish) : await inflate(buffer.subarray(start, finish), { maxOutputLength: Math.max(1, remaining) });
      expanded += data.length;
      if (data.length !== declared || expanded > MAX_EXPANDED_BYTES) invalid();
      if (!directory) {
        // This import supports UTF-8 OOXML only. Reject DTD/entities before XML parsing.
        const xml = data.toString('utf8');
        if (xml.includes('\0') || xml.includes('\uFFFD') || /<!\s*(?:DOCTYPE|ENTITY)/i.test(xml)) invalid();
        if (/<(?:\w+:)?(?:f|hyperlink|oleObject|externalReference|definedName|mergeCell)\b/i.test(xml) || /TargetMode\s*=\s*["']External["']/i.test(xml) || /(?:macroEnabled|vbaProject|\/hyperlink["'])/i.test(xml)) invalid();
        if (name.endsWith('.rels') && /&#/.test(xml)) invalid();
        if ((xml.match(/</g) || []).length > 100000) invalid();
        if (name.startsWith('xl/worksheets/') && name.endsWith('.xml')) {
          if ((xml.match(/<(?:\w+:)?row\b/g) || []).length > 2001) invalid();
          for (const col of xml.matchAll(/<(?:\w+:)?col\b[^>]*>/g)) {
            for (const bound of col[0].matchAll(/\b(?:min|max)\s*=\s*["']([^"']+)["']/g)) {
              if (!/^\d+$/.test(bound[1]) || Number(bound[1]) > 10 || Number(bound[1]) < 1) invalid();
            }
          }
          // Bound sparse row/cell coordinates as well as actual XML length.
          for (const match of xml.matchAll(/<(?:\w+:)?(?:row|c)\b[^>]*\br\s*=\s*["']([^"']+)["']/g)) {
            const address = /^([A-Z]*)(\d+)$/.exec(match[1]);
            if (!address || Number(address[2]) < 1 || Number(address[2]) > 2001 || (address[1] && !/^[A-J]$/.test(address[1]))) invalid('La hoja excede los límites de filas o columnas de la plantilla.');
          }
        }
      } else if (declared !== 0) invalid();
      offset = next;
    }
    if (offset !== end || !names.has('[Content_Types].xml') || !names.has('xl/workbook.xml')) invalid();
    ranges.sort((a, b) => a[0] - b[0]);
    if (ranges.some((r, i) => i > 0 && r[0] < ranges[i - 1][1])) invalid();
  } catch (error) {
    if (error instanceof BadRequestException) throw error;
    invalid();
  }
}
