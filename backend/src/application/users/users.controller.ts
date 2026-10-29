import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../domain/enums/role.enum';

@ApiTags('Users')
@ApiBearerAuth('jwt-auth')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMINISTRATOR)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'Listar usuarios', description: 'Retorna todos los usuarios, opcionalmente filtrados por rol. Solo administradores.' })
  @ApiQuery({ name: 'role', required: false, enum: UserRole })
  @ApiResponse({ status: 200, description: 'Lista de usuarios' })
  findAll(@Query('role') role?: UserRole) {
    return this.usersService.findAll(role);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener usuario por ID' })
  @ApiParam({ name: 'id', description: 'UUID del usuario' })
  @ApiResponse({ status: 200, description: 'Usuario encontrado' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  findById(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Crear usuario', description: 'Crea un usuario del sistema. Si el rol es estudiante, también crea su perfil académico.' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['email', 'password', 'firstName', 'lastName', 'role'],
      properties: {
        email: { type: 'string', example: 'nuevo@upam.edu.sv' },
        password: { type: 'string', example: 'segura123' },
        firstName: { type: 'string', example: 'Juan' },
        lastName: { type: 'string', example: 'Pérez' },
        role: { type: 'string', enum: ['student', 'administrator', 'collector', 'administrative', 'teacher'] },
        career: { type: 'string', example: 'Ingeniería en Sistemas' },
        carnet: { type: 'string', example: 'LR021502' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Usuario creado' })
  @ApiResponse({ status: 409, description: 'Correo ya registrado' })
  create(@Body() body: any) {
    return this.usersService.create(body);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar usuario', description: 'Actualiza nombre, rol, estado o contraseña de un usuario.' })
  @ApiParam({ name: 'id', description: 'UUID del usuario' })
  @ApiResponse({ status: 200, description: 'Usuario actualizado' })
  update(@Param('id') id: string, @Body() body: any) {
    return this.usersService.update(id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Desactivar usuario', description: 'Desactiva (eliminación logica) una cuenta de usuario. No se puede desactivar administradores.' })
  @ApiParam({ name: 'id', description: 'UUID del usuario' })
  @ApiResponse({ status: 200, description: 'Usuario desactivado' })
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}