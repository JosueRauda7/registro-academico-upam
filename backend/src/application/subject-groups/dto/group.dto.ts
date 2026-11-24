import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsEnum, IsInt, IsUUID, Matches, Max, Min, ValidateIf, ValidateNested } from 'class-validator';
import { DayOfWeek } from '../../../domain/enums/day-of-week.enum';

export class ScheduleDto {
  @IsEnum(DayOfWeek)
  @ApiProperty({ enum: DayOfWeek })
  dayOfWeek: DayOfWeek;

  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  @ApiProperty({ example: '07:00', pattern: '^([01]\\d|2[0-3]):[0-5]\\d$' })
  startTime: string;

  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  @ApiProperty({ example: '09:00', description: 'HH:mm, posterior al inicio.' })
  endTime: string;
}

export class CreateGroupDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID() subjectId: string;
  @ApiProperty({ format: 'uuid' })
  @IsUUID() cycleId: string;
  @ApiProperty({ format: 'uuid' })
  @IsUUID() classroomId: string;
  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  @ValidateIf((_, v) => v !== undefined && v !== null) @IsUUID() teacherId?: string | null;
  @ApiPropertyOptional({ minimum: 1, maximum: 2147483647 })
  @ValidateIf((_, v) => v !== undefined) @IsInt() @Min(1) @Max(2147483647) groupNumber?: number;
  @ApiPropertyOptional({ minimum: 1, maximum: 2147483647 })
  @ValidateIf((_, v) => v !== undefined) @IsInt() @Min(1) @Max(2147483647) capacity?: number;
  @ApiPropertyOptional({ type: [ScheduleDto], maxItems: 30 })
  @ValidateIf((_, v) => v !== undefined) @IsArray() @ArrayMaxSize(30) @ValidateNested({ each: true }) @Type(() => ScheduleDto)
  schedules?: ScheduleDto[];
}

export class UpdateGroupDto {
  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  @ValidateIf((_, v) => v !== undefined && v !== null) @IsUUID() teacherId?: string | null;
  @ApiPropertyOptional({ format: 'uuid' })
  @ValidateIf((_, v) => v !== undefined) @IsUUID() classroomId?: string;
  @ApiPropertyOptional({ minimum: 1, maximum: 2147483647 })
  @ValidateIf((_, v) => v !== undefined) @IsInt() @Min(1) @Max(2147483647) capacity?: number;
}

export class CreateSubjectScheduleDto extends ScheduleDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID() groupId: string;
}
