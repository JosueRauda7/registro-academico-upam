import { IsInt, IsNumber, IsOptional, IsString, Matches, Max, MaxLength, Min } from 'class-validator';

export class LegacyImportRowDto {
  @IsString() @MaxLength(50) @Matches(/^[\p{L}\p{N}._/-]+$/u)
  carnet: string;

  @IsString() @MaxLength(20) @Matches(/^[\p{L}\p{N}._/-]+$/u)
  subjectCode: string;

  @IsNumber({ allowNaN: false, allowInfinity: false, maxDecimalPlaces: 2 })
  @Min(0) @Max(10)
  score: number;

  @IsOptional() @IsInt() @Min(1900) @Max(new Date().getFullYear())
  year: number | null;

  @IsOptional() @IsInt() @Min(1) @Max(2)
  semester: number | null;

  @IsOptional() @IsString() @MaxLength(500)
  @Matches(/^[^\x00-\x08\x0B\x0C\x0E-\x1F]*$/)
  notes: string | null;
}
