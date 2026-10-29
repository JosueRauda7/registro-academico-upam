import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { json, urlencoded } from 'express';
import { join } from 'path';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { bodyParser: false });
  const configService = app.get(ConfigService);

  app.use(json({ limit: '10mb' }));
  app.use(urlencoded({ extended: true, limit: '10mb' }));
  // HTTP development hosts cannot serve assets upgraded to HTTPS by the browser.
  const frontendUsesHttps = configService.get<string>('FRONTEND_URL', '').startsWith('https://');
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        upgradeInsecureRequests: frontendUsesHttps ? [] : null,
      },
    },
    strictTransportSecurity: frontendUsesHttps ? undefined : false,
  }));
  app.enableCors({
    origin: configService.get<string>('FRONTEND_URL', 'http://localhost:5173'),
    credentials: true,
  });

  app.setGlobalPrefix('api');

  app.useStaticAssets(join(process.cwd(), 'uploads', 'logos'), { prefix: '/uploads/logos/' });

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
    .setTitle('UPAM - Registro Académico API')
    .setDescription(
      'API del sistema de matrícula e inscripción de materias de la Universidad Panamericana de El Salvador.\n\n' +
      '## Autenticación\n' +
      'Para acceder a los endpoints protegidos, incluya el header:\n' +
      '`Authorization: Bearer <token>`\n\n' +
      '## Roles\n' +
      '- **student**: Estudiante - inscribir materias, pagos, reportes propios\n' +
      '- **administrator**: Administrador - acceso total al sistema\n' +
      '- **collector**: Colector - pagos y recaudación\n' +
      '- **administrative**: Administrativo - gestión de estudiantes e inscripciones',
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
    .addTag('Auth', 'Autenticación y gestión de sesiones')
    .addTag('Cycles', 'Gestión de ciclos académicos')
    .addTag('Subjects', 'Gestión de materias y horarios')
    .addTag('Enrollments', 'Inscripción de materias')
    .addTag('Payments', 'Pagos de matrícula y mensualidades')
    .addTag('Students', 'Gestión de estudiantes')
    .addTag('Users', 'Gestión de usuarios del sistema')
    .addTag('Settings', 'Configuración del sistema (logo, color, nombre)')
    .addTag('Pensum', 'Pensum de carreras y seguimiento del estudiante')
    .addTag('Careers', 'Mantenimiento de carreras')
    .addTag('Reports', 'Generación de reportes Excel y PDF')
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
