import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, Max, Min } from 'class-validator';
export class UpdateStudentFeesDto {
  @ApiPropertyOptional({ type: Number, nullable: true, minimum: 0.01, maximum: 99999999.99, description: 'USD, hasta dos decimales; null restaura el valor del ciclo.' })
  @IsOptional() @IsNumber({ allowNaN: false, allowInfinity: false, maxDecimalPlaces: 2 }) @Min(0.01) @Max(99999999.99)
  tuitionAmount?: number | null;

  @ApiPropertyOptional({ type: Number, nullable: true, minimum: 0.01, maximum: 99999999.99, description: 'USD, hasta dos decimales; null restaura el valor del ciclo.' })
  @IsOptional() @IsNumber({ allowNaN: false, allowInfinity: false, maxDecimalPlaces: 2 }) @Min(0.01) @Max(99999999.99)
  monthlyAmount?: number | null;
}
