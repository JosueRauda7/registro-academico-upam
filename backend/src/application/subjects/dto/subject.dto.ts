import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { ArrayMaxSize, ArrayUnique, IsArray, IsBoolean, IsInt, IsOptional, IsString, IsUUID, MaxLength, Min, MinLength, ValidateIf } from 'class-validator';

export class CreateSubjectDto {
  @ApiProperty() @IsString() @MinLength(1) @MaxLength(20) code: string;
  @ApiProperty() @IsString() @MinLength(1) @MaxLength(150) name: string;
  @ApiProperty() @IsString() @MinLength(1) @MaxLength(150) career: string;
  @ApiProperty() @IsInt() @Min(1) credits: number;
  @ApiProperty() @IsInt() @Min(1) year: number;
  @ApiProperty() @IsInt() @Min(1) semester: number;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isActive?: boolean;
  @ApiPropertyOptional({ type: [String], maxItems: 100, description: 'UUIDs de prerrequisitos. [] elimina todos; omitir conserva los existentes al editar.' })
  @ValidateIf((_, value) => value !== undefined)
  @IsArray() @ArrayMaxSize(100) @ArrayUnique() @IsUUID('all', { each: true })
  prerequisiteSubjectIds?: string[];
  // Backward-compatible single prerequisite. Cannot be combined with the array.
  @ApiPropertyOptional({ type: String, nullable: true, deprecated: true })
  @IsOptional() @IsUUID() prerequisiteSubjectId?: string | null;
}
export class UpdateSubjectDto extends PartialType(CreateSubjectDto) {}
