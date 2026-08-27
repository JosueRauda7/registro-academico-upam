import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { json, urlencoded } from 'express';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bodyParser: false });
  const configService = app.get(ConfigService);

  app.use(json({ limit: '10mb' }));
  app.use(urlencoded({ extended: true, limit: '10mb' }));
  app.use(helmet());
  app.enableCors({
    origin: configService.get<string>('FRONTEND_URL', 'http://localhost:5173'),
    credentials: true,
  });

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalInterceptors(new TransformInterceptor());

  const config = new DocumentBuilder()
    .setTitle('UPAM - Registro Academico API')
    .setDescription(
      'API del sistema de matricula e inscripcion de materias de la Universidad Panamericana de El Salvador.\n\n' +
      '## Autenticacion\n' +
      'Para acceder a los endpoints protegidos, incluya el header:\n' +
      '`Authorization: Bearer <token>`\n\n' +
      '## Roles\n' +
      '- **student**: Estudiante - inscribir materias, pagos, reportes propios\n' +
      '- **administrator**: Administrador - acceso total al sistema\n' +
      '- **collector**: Colector - pagos y recaudacion\n' +
      '- **administrative**: Administrativo - gestion de estudiantes e inscripciones',
    )
    .setVersion('1.0')
    .setContact('UPAM', 'https://upam.edu.sv', 'admin@upam.edu.sv')
    .setLicense('MIT', 'https://opensource.org/licenses/MIT')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Ingrese el token JWT obtenido del endpoint /auth/login',
      },
      'jwt-auth',
    )
    .addTag('Auth', 'Autenticacion y gestion de sesiones')
    .addTag('Cycles', 'Gestion de ciclos academicos')
    .addTag('Subjects', 'Gestion de materias y horarios')
    .addTag('Enrollments', 'Inscripcion de materias')
    .addTag('Payments', 'Pagos de matricula y mensualidades')
    .addTag('Students', 'Gestion de estudiantes')
    .addTag('Users', 'Gestion de usuarios del sistema')
    .addTag('Settings', 'Configuracion del sistema (logo, color, nombre)')
    .addTag('Pensum', 'Pensum de carreras y seguimiento del estudiante')
    .addTag('Careers', 'Mantenimiento de carreras')
    .addTag('Reports', 'Generacion de reportes Excel y PDF')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'none',
      filter: true,
      showRequestDuration: true,
    },
    customSiteTitle: 'UPAM API Docs',
    customCss: '.swagger-ui .topbar { background-color: #1B4F72; }',
  });

  const port = configService.get<number>('PORT', 3000);
  await app.listen(port);
  console.log(`🚀 Server running on http://localhost:${port}`);
  console.log(`📚 Swagger docs: http://localhost:${port}/api/docs`);
}
bootstrap();
