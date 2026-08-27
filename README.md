# Registro Academico - Universidad Panamericana de El Salvador

Sistema web completo para la gestion de matricula e inscripcion de materias de la **Universidad Panamericana de El Salvador (UPAM)**. Proyecto ficticio desarrollado con arquitectura limpia en backend y buenas practicas en frontend.

---

## Tabla de contenidos

- [Descripcion del proyecto](#descripcion-del-proyecto)
- [Flujo principal](#flujo-principal)
- [Roles de usuario](#roles-de-usuario)
- [Stack tecnologico](#stack-tecnologico)
- [Arquitectura del proyecto](#arquitectura-del-proyecto)
- [Estructura de la base de datos](#estructura-de-la-base-de-datos)
- [Instalacion y ejecucion](#instalacion-y-ejecucion)
- [Credenciales de prueba](#credenciales-de-prueba)
- [Endpoints API](#endpoints-api)
- [Funcionalidades por rol](#funcionalidades-por-rol)
- [Reportes disponibles](#reportes-disponibles)
- [Configuracion de Wompi](#configuracion-de-wompi)
- [Docker](#docker)
- [Buenas practicas aplicadas](#buenas-practicas-aplicadas)

---

## Descripcion del proyecto

Este sistema permite a los estudiantes de la UPAM realizar el proceso completo de matricula academica:

1. **Pago de matricula** del ciclo mediante la pasarela de pagos Wompi
2. **Inscripcion de materias** con validacion automatica de prerrequisitos, cupos disponibles y choques de horario
3. **Reserva de cupo** en las materias seleccionadas
4. **Pago de mensualidades** mes a mes durante el ciclo
5. **Generacion de reportes** en Excel y PDF para administracion y contabilidad

El sistema cuenta con 4 roles de usuario con permisos diferenciados y un panel de administracion completo.

---

## Flujo principal

```
┌─────────────────────────────────────────────────────────────┐
│                      FLUJO DEL ESTUDIANTE                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. Login ────────────────────────────────────────┐          │
│                                                   │          │
│  2. Pagar matricula del ciclo (Wompi) ◄───────────┘          │
│         │                                                     │
│         ▼                                                     │
│  3. Se habilita inscripcion de materias                      │
│         │                                                     │
│         ▼                                                     │
│  4. Seleccionar materias                                     │
│         │                                                     │
│         ├──► Validar prerrequisitos aprobados                │
│         ├──► Validar cupos disponibles                       │
│         └──► Validar que no haya choque de horario           │
│         │                                                     │
│         ▼                                                     │
│  5. Reserva de cupo (asiento temporalmente ocupado)          │
│         │                                                     │
│         ▼                                                     │
│  6. Confirmar inscripcion (reservado → confirmado)           │
│         │                                                     │
│         ▼                                                     │
│  7. Pagar mensualidades mensuales (4 meses)                  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Roles de usuario

| Rol | Descripcion | Permisos principales |
|-----|-------------|----------------------|
| **Estudiante** | Persona matriculada en la universidad | Inscribir materias, pagar matricula/mensualidades, ver historial, generar reportes propios |
| **Administrador** | Administrador del sistema con acceso total | Gestionar ciclos, estudiantes, abrir/cerrar inscripciones, todos los reportes |
| **Colector** | Personal encargado de cobros | Ver pagos, reportes de recaudacion, comprobantes de pago |
| **Administrativo** | Personal administrativo | Gestionar estudiantes, ver inscripciones, reportes de inscripcion y lista de estudiantes |

---

## Stack tecnologico

### Backend

| Tecnologia | Version | Uso |
|------------|---------|-----|
| NestJS | 10.x | Framework Node.js con arquitectura modular |
| TypeORM | 0.3.x | ORM para PostgreSQL con entidades tipadas |
| PostgreSQL | 16 | Base de datos relacional |
| Passport + JWT | 0.7 / 10.x | Autenticacion por tokens JWT |
| ExcelJS | 4.x | Generacion de reportes en formato Excel |
| PDFKit | 0.15.x | Generacion de reportes en formato PDF |
| class-validator | 0.14.x | Validacion de DTOs con decoradores |
| bcryptjs | 2.x | Hashing de contrasenas |
| helmet | 7.x | Seguridad HTTP headers |
| Wompi API | - | Pasarela de pagos (sandbox) |

### Frontend

| Tecnologia | Version | Uso |
|------------|---------|-----|
| React | 18.x | Libreria de interfaces |
| TypeScript | 5.3 | Tipado estatico |
| Vite | 5.x | Build tool y dev server |
| Tailwind CSS | 3.4 | Framework CSS utility-first |
| React Router | 6.x | Enrutamiento SPA |
| Axios | 1.6 | Cliente HTTP |
| Lucide React | 0.303 | Biblioteca de iconos |
| React Hot Toast | 2.4 | Notificaciones toast |

### Infraestructura

| Tecnologia | Uso |
|------------|-----|
| Docker | Contenedores |
| Docker Compose | Orquestacion multi-servicio |
| Nginx | Servidor reverse proxy para frontend |

---

## Arquitectura del proyecto

### Backend - Arquitectura Limpia (Clean Architecture)

```
backend/src/
│
├── domain/                          ← Capa de dominio (entidades puras, sin dependencias)
│   ├── enums/
│   │   ├── role.enum.ts            ← UserRole: student, administrator, collector, administrative
│   │   ├── payment-status.enum.ts  ← pending, completed, failed, refunded
│   │   ├── payment-type.enum.ts    ← tuition, monthly
│   │   ├── day-of-week.enum.ts     ← monday-saturday
│   │   ├── enrollment-status.enum.ts ← active, cancelled, completed
│   │   └── career.enum.ts          ← Ingenieria en Sistemas, Civil, etc.
│   ├── entities/
│   │   └── index.ts                ← Interfaces de todas las entidades del dominio
│   └── interfaces/
│       ├── payment-gateway.interface.ts  ← Contrato para pasarelas de pago
│       └── email-service.interface.ts    ← Contrato para servicio de email
│
├── application/                     ← Capa de aplicacion (casos de uso)
│   ├── auth/
│   │   ├── auth.module.ts          ← Modulo de autenticacion
│   │   ├── auth.service.ts         ← Login, register, forgot/reset password, profile
│   │   ├── auth.controller.ts      ← Rutas: /auth/login, /auth/register, etc.
│   │   └── dto/                    ← LoginDto, RegisterDto, ForgotPasswordDto, ResetPasswordDto
│   ├── cycles/
│   │   ├── cycles.service.ts       ← CRUD ciclos, abrir/cerrar inscripcion
│   │   ├── cycles.controller.ts    ← Rutas: /cycles/*
│   │   └── cycles.module.ts
│   ├── subjects/
│   │   ├── subjects.service.ts     ← Materias, horarios, prerrequisitos
│   │   ├── subjects.controller.ts  ← Rutas: /subjects/*
│   │   └── subjects.module.ts
│   ├── enrollments/
│   │   ├── enrollments.service.ts  ← Inscripcion ciclo, reservar/cancelar materias, confirmar
│   │   ├── enrollments.controller.ts ← Rutas: /enrollments/*
│   │   └── enrollments.module.ts
│   ├── payments/
│   │   ├── payments.service.ts     ← Matricula Wompi, mensualidades, webhook
│   │   ├── payments.controller.ts  ← Rutas: /payments/*
│   │   └── payments.module.ts
│   ├── students/
│   │   ├── students.service.ts     ← CRUD estudiantes
│   │   ├── students.controller.ts  ← Rutas: /students/*
│   │   └── students.module.ts
│   └── reports/
│       ├── reports.service.ts      ← Generacion de Excel (ExcelJS) y PDF (PDFKit)
│       ├── reports.controller.ts   ← Rutas: /reports/*
│       └── reports.module.ts
│
├── infrastructure/                  ← Capa de infraestructura (implementaciones concretas)
│   ├── database/
│   │   ├── database.module.ts      ← Configuracion TypeORM + PostgreSQL
│   │   ├── entities/               ← Entidades TypeORM decoradas con @Entity, @Column, etc.
│   │   │   ├── user.entity.ts
│   │   │   ├── student.entity.ts
│   │   │   ├── cycle.entity.ts
│   │   │   ├── subject.entity.ts
│   │   │   ├── prerequisite.entity.ts
│   │   │   ├── schedule.entity.ts
│   │   │   ├── enrollment.entity.ts
│   │   │   ├── enrollment-subject.entity.ts
│   │   │   └── payment.entity.ts
│   │   ├── repositories/           ← Repositorios TypeORM con metodos de acceso a datos
│   │   │   ├── user.repository.ts
│   │   │   ├── student.repository.ts
│   │   │   ├── cycle.repository.ts
│   │   │   ├── subject.repository.ts
│   │   │   ├── schedule.repository.ts
│   │   │   ├── enrollment.repository.ts
│   │   │   ├── enrollment-subject.repository.ts
│   │   │   └── payment.repository.ts
│   │   └── seeds/
│   │       └── seed.ts             ← Script de semilla con datos de prueba
│   ├── payment/
│   │   └── wompi.gateway.ts        ← Implementacion concreta de Wompi API
│   └── email/
│       └── email.service.ts        ← Implementacion de servicio de email
│
└── common/                          ← Utilidades compartidas
    ├── guards/
    │   ├── jwt-auth.guard.ts       ← Guard de autenticacion JWT
    │   └── roles.guard.ts          ← Guard de autorizacion por roles
    ├── decorators/
    │   ├── roles.decorator.ts      ← @Roles(UserRole.ADMINISTRATOR)
    │   └── current-user.decorator.ts ← @CurrentUser('sub')
    ├── filters/
    │   └── http-exception.filter.ts ← Filtro global de excepciones
    └── interceptors/
        └── transform.interceptor.ts ← Interceptor de transformacion de respuesta
```

### Frontend

```
frontend/src/
│
├── main.tsx                          ← Punto de entrada de la aplicacion
├── App.tsx                           ← Configuracion de rutas (React Router)
├── index.css                         ← Estilos globales (Tailwind)
│
├── api/                              ← Capa de acceso a la API
│   ├── axios.ts                      ← Cliente Axios con interceptores JWT
│   ├── auth.api.ts                   ← Login, register, forgot/reset password, profile
│   ├── cycles.api.ts                 ← Ciclos academicos
│   ├── subjects.api.ts               ← Materias y horarios
│   ├── enrollments.api.ts            ← Inscripciones
│   ├── payments.api.ts               ← Pagos matricula/mensualidades
│   └── reports.api.ts                ← Descarga de reportes Excel/PDF
│
├── components/
│   ├── layout/
│   │   ├── Layout.tsx                ← Layout principal (sidebar + header + contenido)
│   │   ├── Sidebar.tsx               ← Barra lateral con navegacion filtrada por rol
│   │   └── Header.tsx                ← Cabecera con nombre de usuario y cerrar sesion
│   ├── ui/
│   │   ├── Button.tsx                ← Boton con variantes (primary, secondary, danger, ghost, outline)
│   │   ├── Input.tsx                 ← Input con label y mensaje de error
│   │   ├── Card.tsx                  ← Tarjeta contenedora con titulo opcional
│   │   ├── Badge.tsx                 ← Etiqueta de estado con colores automaticos
│   │   └── Modal.tsx                 ← Ventana modal con overlay
│   └── common/
│       └── ProtectedRoute.tsx        ← Ruta protegida con verificacion JWT y roles
│
├── context/
│   └── AuthContext.tsx               ← Contexto de autenticacion (user, student, login, logout)
│
├── pages/
│   ├── auth/
│   │   ├── LoginPage.tsx             ← Formulario de inicio de sesion con credenciales de prueba
│   │   ├── ForgotPasswordPage.tsx    ← Solicitar recuperacion de contrasena
│   │   └── ResetPasswordPage.tsx     ← Establecer nueva contrasena con token
│   ├── dashboard/
│   │   └── DashboardPage.tsx         ← Panel principal con estadisticas y acciones rapidas
│   ├── enrollments/
│   │   ├── EnrollmentPage.tsx        ← Inscripcion de materias (reservar, cancelar, confirmar)
│   │   └── EnrollmentHistoryPage.tsx ← Historial de inscripciones por ciclo
│   ├── payments/
│   │   └── PaymentsPage.tsx          ← Pagos de matricula y mensualidades con resumen
│   ├── reports/
│   │   └── ReportsPage.tsx           ← Descarga de reportes Excel/PDF
│   ├── cycles/
│   │   └── CyclesPage.tsx            ← Gestion de ciclos (admin: abrir/cerrar inscripcion)
│   └── students/
│       └── StudentsListPage.tsx      ← Listado de estudiantes (admin)
│
├── types/
│   └── index.ts                      ← Todas las interfaces TypeScript del proyecto
│
└── utils/
    ├── formatDate.ts                 ← formatDate, formatCurrency, formatTime, getDayName, getMonthName
    └── validators.ts                 ← cn (clsx+twMerge), getStatusColor, getStatusLabel
```

---

## Estructura de la base de datos

```
┌──────────────────┐       ┌──────────────────┐
│      users       │       │    students      │
├──────────────────┤       ├──────────────────┤
│ id (UUID, PK)    │◄──┐   │ id (UUID, PK)    │
│ email            │   │   │ user_id (FK)     │──► users.id
│ password_hash    │   │   │ student_code     │
│ role             │   │   │ carnet           │
│ first_name       │   │   │ career           │
│ last_name        │   │   │ enrollment_year  │
│ is_active        │   │   │ phone            │
│ reset_token      │   │   │ address          │
│ reset_token_exp  │   │   │ date_of_birth    │
│ created_at       │   │   └──────────────────┘
│ updated_at       │   │
└──────────────────┘   │
                       │
┌──────────────────┐   │   ┌──────────────────┐
│     cycles       │   │   │    subjects      │
├──────────────────┤   │   ├──────────────────┤
│ id (UUID, PK)    │   │   │ id (UUID, PK)    │
│ name             │   │   │ code (UNIQUE)    │
│ year             │   │   │ name             │
│ semester         │   │   │ credits          │
│ start_date       │   │   │ career           │
│ end_date         │   │   │ year             │
│ tuition_amount   │   │   │ semester         │
│ monthly_amount   │   │   │ is_active        │
│ monthly_count    │   │   └──────────────────┘
│ is_active        │   │
│ enrollment_open  │   │
└──────────────────┘   │
                       │
┌──────────────────┐   │   ┌──────────────────┐
│  enrollments     │   │   │ enrollment_      │
├──────────────────┤   │   │   subjects       │
│ id (UUID, PK)    │◄──┤   ├──────────────────┤
│ student_id (FK)  │──►│   │ id (UUID, PK)    │
│ cycle_id (FK)    │──►│   │ enrollment_id FK │──► enrollments.id
│ status           │   │   │ subject_id (FK)  │──► subjects.id
│ enrolled_at      │   │   │ schedule_id (FK) │──► schedules.id
│ tuition_paid     │   │   │ status           │
└──────────────────┘   │   │ reserved_at      │
                       │   └──────────────────┘
┌──────────────────┐   │
│   schedules      │   │   ┌──────────────────┐
├──────────────────┤   │   │   prerequisites  │
│ id (UUID, PK)    │   │   ├──────────────────┤
│ subject_id (FK)  │──►│   │ id (UUID, PK)    │
│ cycle_id (FK)    │──►│   │ subject_id (FK)  │──► subjects.id
│ day_of_week      │   │   │ prerequisite_    │
│ start_time       │   │   │   subject_id(FK) │──► subjects.id
│ end_time         │   │   └──────────────────┘
│ classroom        │   │
│ capacity         │   │
│ enrolled_count   │   │
└──────────────────┘   │
                       │
┌──────────────────┐   │
│    payments      │   │
├──────────────────┤   │
│ id (UUID, PK)    │   │
│ student_id (FK)  │──►│
│ cycle_id (FK)    │──►│
│ amount           │   │
│ payment_date     │   │
│ payment_method   │   │
│ wompi_txn_id     │   │
│ status           │   │
│ type             │   │
│ month            │   │
│ description      │   │
│ reference        │   │
│ created_at       │   │
└──────────────────┘   │
```

---

## Instalacion y ejecucion

### Requisitos previos

- Node.js 20+
- PostgreSQL 16+ (o usar Docker)
- npm o yarn

### Opcion 1: Docker (recomendado)

```bash
# Clonar el repositorio
git clone <url-del-repositorio>
cd registro-academico-upam

# Levantar todos los servicios
docker-compose up -d

# Verificar que esten corriendo
docker-compose ps

# Ejecutar el seed de datos de prueba
docker-compose exec backend npm run seed
```

Los servicios estaran disponibles en:
- **Frontend**: http://localhost:80
- **Backend API**: http://localhost:3000/api
- **PostgreSQL**: localhost:5432

### Opcion 2: Desarrollo local

#### Backend

```bash
cd backend

# Instalar dependencias
npm install

# Copiar archivo de variables de entorno
cp .env.example .env

# Crear la base de datos en PostgreSQL
# (crear manualmente una base de datos llamada "upam_academico")

# Ejecutar el servidor en modo desarrollo
npm run start:dev

# Ejecutar el seed de datos de prueba (en otra terminal)
npm run seed
```

#### Frontend

```bash
cd frontend

# Instalar dependencias
npm install

# Ejecutar el servidor de desarrollo
npm run dev
```

El frontend estara disponible en http://localhost:5173 y proxiara las llamadas /api al backend en http://localhost:3000.

### Comandos utiles

```bash
# Backend
npm run start:dev          # Servidor con hot-reload
npm run build              # Compilar para produccion
npm run start:prod         # Ejecutar compilacion
npm run typecheck          # Verificar tipos TypeScript
npm run lint               # Linting
npm run seed               # Semilla de datos de prueba

# Frontend
npm run dev                # Servidor de desarrollo
npm run build              # Compilar para produccion
npm run typecheck          # Verificar tipos TypeScript
npm run lint               # Linting
```

---

## Credenciales de prueba

| Rol | Email | Contrasena | Descripcion |
|-----|-------|------------|-------------|
| Administrador | `admin@upam.edu.sv` | `admin123` | Acceso total al sistema |
| Estudiante | `estudiante@upam.edu.sv` | `estudiante123` | Josue Rauda - Ing. en Sistemas |
| Colector | `colector@upam.edu.sv` | `colector123` | Consulta de pagos y recaudacion |
| Administrativo | `administrativo@upam.edu.sv` | `adminstaff123` | Gestion de estudiantes e inscripciones |

> **Nota**: Estas cuentas se crean al ejecutar `npm run seed` o al levantar Docker por primera vez.

---

## Endpoints API

Todas las rutas estan prefijadas con `/api`.

### Autenticacion

| Metodo | Ruta | Descripcion | Auth |
|--------|------|-------------|------|
| POST | `/api/auth/register` | Registrar nuevo usuario | No |
| POST | `/api/auth/login` | Iniciar sesion | No |
| POST | `/api/auth/forgot-password` | Solicitar recuperacion de contrasena | No |
| POST | `/api/auth/reset-password` | Restablecer contrasena con token | No |
| GET | `/api/auth/profile` | Obtener perfil del usuario autenticado | Si |

### Ciclos

| Metodo | Ruta | Descripcion | Auth |
|--------|------|-------------|------|
| GET | `/api/cycles` | Listar todos los ciclos | Si |
| GET | `/api/cycles/active` | Listar ciclos activos | Si |
| GET | `/api/cycles/open-enrollment` | Obtener ciclo con inscripcion abierta | Si |
| GET | `/api/cycles/:id` | Obtener ciclo por ID | Si |
| POST | `/api/cycles` | Crear nuevo ciclo | Admin |
| PUT | `/api/cycles/:id` | Actualizar ciclo | Admin |
| PUT | `/api/cycles/:id/open-enrollment` | Abrir inscripcion del ciclo | Admin |
| PUT | `/api/cycles/:id/close-enrollment` | Cerrar inscripcion del ciclo | Admin |

### Materias

| Metodo | Ruta | Descripcion | Auth |
|--------|------|-------------|------|
| GET | `/api/subjects` | Listar todas las materias (filtro por carrera) | Si |
| GET | `/api/subjects/:id` | Obtener materia por ID | Si |
| GET | `/api/subjects/:id/schedules` | Horarios de una materia en un ciclo | Si |
| GET | `/api/subjects/:id/prerequisites` | Prerrequisitos de una materia | Si |
| GET | `/api/subjects/schedules/cycle/:cycleId` | Todos los horarios de un ciclo | Si |
| POST | `/api/subjects` | Crear materia | Admin |
| PUT | `/api/subjects/:id` | Actualizar materia | Admin |
| POST | `/api/subjects/schedules` | Crear horario | Admin |

### Inscripciones

| Metodo | Ruta | Descripcion | Auth |
|--------|------|-------------|------|
| GET | `/api/enrollments/my` | Mis inscripciones | Estudiante |
| GET | `/api/enrollments/my/:cycleId` | Mi inscripcion en un ciclo | Estudiante |
| POST | `/api/enrollments/cycle/:cycleId` | Inscribirse al ciclo (requiere matricula pagada) | Estudiante |
| POST | `/api/enrollments/subject` | Reservar cupo en una materia | Estudiante |
| PUT | `/api/enrollments/subject/:id/cancel` | Cancelar reserva de una materia | Estudiante |
| POST | `/api/enrollments/confirm/:cycleId` | Confirmar inscripcion completa | Estudiante |
| GET | `/api/enrollments/all` | Todas las inscripciones (filtro por ciclo) | Admin, Administrativo |
| GET | `/api/enrollments/stats/:cycleId` | Estadisticas de inscripcion | Admin, Administrativo |

### Pagos

| Metodo | Ruta | Descripcion | Auth |
|--------|------|-------------|------|
| POST | `/api/payments/tuition/:cycleId` | Crear pago de matricula | Estudiante |
| POST | `/api/payments/monthly/:cycleId` | Crear pago de mensualidad | Estudiante |
| POST | `/api/payments/webhook` | Webhook de Wompi (callback de pago) | No |
| GET | `/api/payments/my` | Mis pagos | Estudiante |
| GET | `/api/payments/my/:cycleId` | Mis pagos de un ciclo | Estudiante |
| GET | `/api/payments/my/:cycleId/monthly` | Mis pagos mensuales de un ciclo | Estudiante |
| GET | `/api/payments/my/:cycleId/summary` | Resumen de pagos del ciclo | Estudiante |
| GET | `/api/payments/all` | Todos los pagos (filtro por ciclo) | Admin, Colector |
| GET | `/api/payments/stats/:cycleId` | Estadisticas de recaudacion | Admin, Colector |
| GET | `/api/payments/:id` | Detalle de un pago | Si |

### Reportes

| Metodo | Ruta | Formato | Descripcion | Auth |
|--------|------|---------|-------------|------|
| GET | `/api/reports/student-payments/:studentId` | Excel | Reporte de pagos de un estudiante | Estudiante, Admin, Colector |
| GET | `/api/reports/enrollments/:cycleId` | Excel | Reporte de inscripciones del ciclo | Admin, Administrativo |
| GET | `/api/reports/collection/:cycleId` | Excel | Reporte de recaudacion del ciclo | Admin, Colector |
| GET | `/api/reports/student-list/:cycleId` | Excel | Lista de estudiantes del ciclo | Admin, Administrativo |
| GET | `/api/reports/payment-receipt/:paymentId` | PDF | Comprobante de pago individual | Si |

---

## Funcionalidades por rol

### Estudiante

- Ver dashboard con informacion personal y ciclo actual
- Pagar matricula del ciclo via Wompi
- Inscribir materias seleccionando horarios
  - Validacion automatica de prerrequisitos aprobados
  - Validacion de cupos disponibles en tiempo real
  - Deteccion y prevencion de choques de horario
- Reservar cupo en materias (asiento temporal)
- Cancelar reserva de materias
- Confirmar inscripcion completa
- Pagar mensualidades mes a mes (hasta 4 meses)
- Ver resumen de pagos por ciclo (pagado/pendiente)
- Ver historial de inscripciones
- Descargar reporte de pagos propios (Excel)

### Administrador

- Todo lo del estudiante, ademas:
- Gestionar ciclos academicos (crear, editar)
- Abrir/cerrar inscripcion de materias por ciclo
- Gestionar estudiantes (ver listado, datos)
- Ver todas las inscripciones del sistema
- Ver estadisticas de inscripcion por ciclo
- Descargar todos los reportes (inscripciones, recaudacion, lista de estudiantes)

### Colector

- Ver pagos de todos los estudiantes
- Ver estadisticas de recaudacion por ciclo
- Descargar reporte de recaudacion (Excel)
- Descargar reporte de pagos de estudiantes (Excel)
- Descargar comprobantes de pago (PDF)

### Administrativo

- Gestionar estudiantes (ver listado, datos)
- Ver todas las inscripciones del sistema
- Descargar reporte de inscripciones (Excel)
- Descargar lista de estudiantes (Excel)

---

## Reportes disponibles

### Excel (.xlsx)

| Reporte | Contenido | Generado por |
|---------|-----------|--------------|
| **Reporte de Pagos** | Fecha, referencia, tipo (matricula/mensualidad), monto, estado, descripcion | Estudiante (propio), Admin, Colector |
| **Reporte de Inscripciones** | Carnet, nombre, carrera, materias inscritas, total creditos, estado, fecha | Admin, Administrativo |
| **Reporte de Recaudacion** | Fecha, referencia, estudiante, tipo, monto, estado + totales recaudado/pendiente | Admin, Colector |
| **Lista de Estudiantes** | Carnet, codigo, nombre, carrera, email, telefono | Admin, Administrativo |

### PDF

| Reporte | Contenido | Generado por |
|---------|-----------|--------------|
| **Comprobante de Pago** | Encabezado UPAM, referencia, fecha, tipo, descripcion, monto, estado | Cualquier usuario autenticado |

---

## Configuracion de Wompi

El sistema esta integrado con la API de **Wompi** en modo sandbox para procesar pagos.

### Variables de entorno

```env
WOMPI_PUBLIC_KEY=pk_test_abc123      # Clave publica (sandbox)
WOMPI_PRIVATE_KEY=sk_test_abc123     # Clave privada (sandbox)
WOMPI_BASE_URL=https://sandbox.wompi.co/v1
```

### Flujo de pago

1. El frontend llama al endpoint `POST /api/payments/tuition/:cycleId`
2. El backend crea un registro de pago con estado `pending` y una referencia unica
3. El backend llama a la API de Wompi para crear la transaccion
4. Se retorna el `wompiOrderId` al frontend
5. Wompi notifica al backend via `POST /api/payments/webhook` cuando el pago se procesa
6. El backend actualiza el estado del pago (completed/failed)

> **Nota**: En sandbox, los pagos se simulan. En produccion se requiere integrar el checkout de Wompi.

---

## Docker

### docker-compose.yml

El archivo `docker-compose.yml` define 3 servicios:

```yaml
services:
  db:           # PostgreSQL 16 Alpine
  backend:      # NestJS app (puerto 3000)
  frontend:     # React app via Nginx (puerto 80)
```

### Comandos Docker

```bash
# Levantar todo
docker-compose up -d

# Ver logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Ejecutar seed en el contenedor
docker-compose exec backend npm run seed

# Detener todo
docker-compose down

# Detener y eliminar volumenes (limpiar base de datos)
docker-compose down -v
```

### Dockerfile Backend (multi-stage)

```dockerfile
# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist
EXPOSE 3000
CMD ["node", "dist/main"]
```

### Dockerfile Frontend (multi-stage + Nginx)

```dockerfile
# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

---

## Buenas practicas aplicadas

### Backend

- **Arquitectura Limpia**: Separacion en capas domain, application, infrastructure y common
- **Inyeccion de dependencias**: Uso de modulos NestJS con providers y exports
- **DTOs con validacion**: class-validator con decoradores (@IsEmail, @MinLength, @IsEnum, etc.)
- **Guard de autenticacion JWT**: Verificacion de tokens en cada peticion protegida
- **Guard de roles**: Autorizacion basada en roles con decorador @Roles()
- **Filtro global de excepciones**: Manejo centralizado de errores HTTP
- **Interceptor de transformacion**: Respuestas estandarizadas con formato { data, message }
- **Repositorios tipados**: Acceso a datos abstraido en repositorios con TypeORM
- **Secretos fuera del codigo**: Variables de entorno via @nestjs/config
- **Helmet**: Headers de seguridad HTTP
- **CORS configurado**: Origenes permitidos desde el frontend

### Frontend

- **Componentes reutilizables**: UI library propia (Button, Input, Card, Badge, Modal)
- **Contexto de autenticacion**: AuthContext con JWT persistido en localStorage
- **Rutas protegidas**: ProtectedRoute con verificacion de token y roles
- **Navegacion filtrada por rol**: Sidebar muestra solo las opciones permitidas
- **Manjo de errores**: Toast notifications con react-hot-toast
- **Tipado completo**: Todas las interfaces TypeScript definidas en types/
- **API layer abstrauida**: Servicios HTTP separados por dominio
- **Proxy de desarrollo**: Vite proxea /api al backend
- **Build optimizado**: Vite con tree-shaking y code splitting
- **CSS utility-first**: Tailwind CSS para estilos consistentes y rapidos

---

## Licencia

Este es un proyecto ficticio desarrollado con fines academicos.
