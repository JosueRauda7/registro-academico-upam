import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsBoolean, IsDateString, IsInt, IsNotEmpty, IsNumber, IsString, Matches, Max, MaxLength, Min, ValidateIf } from 'class-validator';

export class CreateCycleDto {
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsString() @IsNotEmpty() @MaxLength(100)
  @ApiProperty({ maxLength: 100, example: 'Ciclo I 2027' })
  name: string;

  @IsInt() @Min(1900) @Max(2200)
  @ApiProperty({ minimum: 1900, maximum: 2200, example: 2027 })
  year: number;

  @IsInt() @Min(1) @Max(3)
  @ApiProperty({ minimum: 1, maximum: 3 })
  semester: number;

  @IsDateString({ strict: true }) @Matches(/^\d{4}-\d{2}-\d{2}$/)
  @ApiProperty({ format: 'date', example: '2027-01-15' })
  startDate: string;

  @IsDateString({ strict: true }) @Matches(/^\d{4}-\d{2}-\d{2}$/)
  @ApiProperty({ format: 'date', example: '2027-05-31' })
  endDate: string;

  @IsNumber({ maxDecimalPlaces: 2, allowInfinity: false, allowNaN: false }) @Min(0.01) @Max(99999999.99)
  @ApiProperty({ minimum: 0.01, maximum: 99999999.99, description: 'Matrícula base USD para estudiantes sin importe propio.' })
  tuitionAmount: number;

  @IsNumber({ maxDecimalPlaces: 2, allowInfinity: false, allowNaN: false }) @Min(0.01) @Max(99999999.99)
  @ApiProperty({ minimum: 0.01, maximum: 99999999.99, description: 'Mensualidad base USD para estudiantes sin importe propio.' })
  monthlyAmount: number;

  @IsInt() @Min(1) @Max(12)
  @ApiProperty({ minimum: 1, maximum: 12 })
  monthlyCount: number;
}

export class UpdateCycleDto extends PartialType(CreateCycleDto) {
  @ValidateIf((_, value) => value !== undefined) @IsBoolean()
  @ApiPropertyOptional({ description: 'Desactivar cierra inscripciones. Reactivar valida cruces.' })
  isActive?: boolean;
}
