import {
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  Get, Param, Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
  ApiResponse,
} from '@nestjs/swagger';
import { UploadsService } from './uploads.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../domain/enums/role.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Response } from 'express';

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

@ApiTags('Uploads')
@ApiBearerAuth('jwt-auth')
@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.COLLECTOR, UserRole.ADMINISTRATOR, UserRole.ADMINISTRATIVE)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: MAX_IMAGE_SIZE },
    }),
  )
  @ApiOperation({
    summary: 'Subir imagen',
    description: 'Sube un comprobante privado. Se optimiza a WebP y se descarga con autenticación en /api/uploads/receipts/:filename. Para logos usar /uploads/logos.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: { type: 'string', format: 'binary', description: 'Imagen (max 5MB)' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Imagen subida, retorna la URL', schema: { type: 'object', properties: { url: { type: 'string', example: '/uploads/uuid.webp' } } } })
  @ApiResponse({ status: 400, description: 'El archivo debe ser una imagen válida' })
  uploadImage(@UploadedFile() file: Express.Multer.File) {
    return this.uploadsService.saveImage(file);
  }

  @Post('logos')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMINISTRATOR)
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_IMAGE_SIZE } }))
  uploadLogo(@UploadedFile() file: Express.Multer.File) {
    return this.uploadsService.saveImage(file, 'logos');
  }

  @Get('receipts/:filename')
  @UseGuards(JwtAuthGuard)
  async receipt(@Param('filename') filename: string,
    @CurrentUser() actor: { sub: string; role: UserRole }, @Res() response: Response) {
    const image = await this.uploadsService.readReceipt(filename, actor);
    response.set({ 'Content-Type': 'image/webp', 'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff' });
    response.send(image);
  }
}
