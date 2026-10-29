# Registro Académico - Universidad Panamericana de El Salvador

Sistema web completo para la gestión de matrícula e inscripción de materias de la **Universidad Panamericana de El Salvador (UPAM)**. Proyecto ficticio desarrollado con arquitectura limpia en backend y buenas practicas en frontend.

---

## Tabla de contenidos

- [Descripción del proyecto](#descripción-del-proyecto)
- [Flujo principal](#flujo-principal)
- [Roles de usuario](#roles-de-usuario)
- [Stack tecnologico](#stack-tecnologico)
- [Arquitectura del proyecto](#arquitectura-del-proyecto)
- [Estructura de la base de datos](#estructura-de-la-base-de-datos)
- [Instalación y ejecución](#instalación-y-ejecución)
- [Credenciales de prueba](#credenciales-de-prueba)
- [Endpoints API](#endpoints-api)
- [Funcionalidades por rol](#funcionalidades-por-rol)
- [Configuración del sistema](#configuración-del-sistema)
- [Reportes disponibles](#reportes-disponibles)
- [Configuración de Wompi](#configuración-de-wompi)
- [Docker](#docker)
- [Buenas practicas aplicadas](#buenas-practicas-aplicadas)

---

## Descripción del proyecto

Este sistema permite a los estudiantes de la UPAM realizar el proceso completo de matrícula academica:

1. **Pago de matrícula** del ciclo mediante la pasarela de pagos Wompi
2. **Inscripción de materias** con validación automatica de prerrequisitos, cupos disponibles y choques de horario
3. **Reserva de cupo** en las materias seleccionadas
4. **Pago de mensualidades** mes a mes durante el ciclo
5. **Generación de reportes** en Excel y PDF para administración y contabilidad

El sistema cuenta con 5 roles de usuario con permisos diferenciados, un panel de administración completo (usuarios, materias, docentes, salones, planificación y configuración del sistema) y una interfaz personalizable (logo y color institucional).

---

## Flujo principal

```
┌─────────────────────────────────────────────────────────────┐
│                      FLUJO DEL ESTUDIANTE                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. Login ────────────────────────────────────────┐          │
│                                                   │          │
│  2. Pagar matrícula del ciclo (Wompi) ◄───────────┘          │
│         │                                                     │
│         ▼                                                     │
│  3. Se habilita inscripción de materias                      │
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
│  6. Confirmar inscripción (reservado → confirmado)           │
│         │                                                     │
│         ▼                                                     │
│  7. Pagar mensualidades mensuales (4 meses)                  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Roles de usuario

| Rol | Descripción | Permisos principales |
|-----|-------------|----------------------|
| **Estudiante** | Persona matriculada en la universidad | Inscribir materias, pagar matrícula/mensualidades, ver horario, ver historial, generar reportes propios |
| **Administrador** | Administrador del sistema con acceso total | Gestionar ciclos, estudiantes, materias, docentes, salones, usuarios y configuración; abrir/cerrar inscripciones; todos los reportes |
| **Colector** | Personal encargado de cobros | Ver pagos, reportes de recaudación, comprobantes de pago |
| **Administrativo** | Personal administrativo | Gestionar estudiantes, materias, docentes, salones y planificación; ver inscripciones y reportes |

| **Docente** | Catedrático con cuenta de acceso | Registrar notas de sus grupos, ver lista de estudiantes de cada materia y exportar reporte de notas en Excel |

---

## Stack tecnologico

### Backend

| Tecnologia | Version | Uso |
|------------|---------|-----|
| NestJS | 10.x | Framework Node.js con arquitectura modular |
| TypeORM | 0.3.x | ORM para PostgreSQL con entidades tipadas |
| PostgreSQL | 16 | Base de datos relacional |
| Passport + JWT | 0.7 / 10.x | Autenticación por tokens JWT |
| ExcelJS | 4.x | Generación de reportes en formato Excel |
| PDFKit | 0.15.x | Generación de reportes en formato PDF |
| class-validator | 0.14.x | Validación de DTOs con decoradores |
| bcryptjs | 2.x | Hashing de contraseñas |
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
| Docker Compose | Orquestación multi-servicio |
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
│   │   └── career.enum.ts          ← Ingeniería en Sistemas, Civil, etc.
│   ├── entities/
│   │   └── index.ts                ← Interfaces de todas las entidades del dominio
│   └── interfaces/
│       ├── payment-gateway.interface.ts  ← Contrato para pasarelas de pago
│       └── email-service.interface.ts    ← Contrato para servicio de email
│
├── application/                     ← Capa de aplicación (casos de uso)
│   ├── auth/
│   │   ├── auth.module.ts          ← Modulo de autenticación
│   │   ├── auth.service.ts         ← Login, register, forgot/reset password, profile
│   │   ├── auth.controller.ts      ← Rutas: /auth/login, /auth/register, etc.
│   │   └── dto/                    ← LoginDto, RegisterDto, ForgotPasswordDto, ResetPasswordDto
│   ├── cycles/
│   │   ├── cycles.service.ts       ← CRUD ciclos, abrir/cerrar inscripción
│   │   ├── cycles.controller.ts    ← Rutas: /cycles/*
│   │   └── cycles.module.ts
│   ├── subjects/
│   │   ├── subjects.service.ts     ← Materias y prerrequisitos
│   │   ├── subjects.controller.ts  ← Rutas: /subjects/* (CRUD admin/administrativo)
│   │   └── subjects.module.ts
│   ├── subject-groups/
│   │   ├── subject-groups.service.ts ← Grupos por materia/ciclo con horarios, capacidad y docente
│   │   ├── subject-groups.controller.ts ← Rutas: /subject-groups/*
│   │   └── subject-groups.module.ts
│   ├── teachers/
│   │   ├── teachers.service.ts     ← CRUD docentes
│   │   ├── teachers.controller.ts  ← Rutas: /teachers/* (admin/administrativo)
│   │   └── teachers.module.ts
│   ├── classrooms/
│   │   ├── classrooms.service.ts   ← CRUD salones
│   │   ├── classrooms.controller.ts ← Rutas: /classrooms/* (admin/administrativo)
│   │   └── classrooms.module.ts
│   ├── enrollments/
│   │   ├── enrollments.service.ts  ← Inscripción ciclo, reservar/cancelar materias, confirmar
│   │   ├── enrollments.controller.ts ← Rutas: /enrollments/*
│   │   └── enrollments.module.ts
│   ├── payments/
│   │   ├── payments.service.ts     ← Matrícula Wompi, mensualidades, webhook
│   │   ├── payments.controller.ts  ← Rutas: /payments/*
│   │   └── payments.module.ts
│   ├── students/
│   │   ├── students.service.ts     ← CRUD estudiantes (crea cuenta + perfil, gestiona estado)
│   │   ├── students.controller.ts  ← Rutas: /students/* (crear/editar admin y administrativo)
│   │   └── students.module.ts
│   ├── users/
│   │   ├── users.service.ts        ← CRUD de cuentas de usuario (solo admin)
│   │   ├── users.controller.ts     ← Rutas: /users/* (solo administrador)
│   │   └── users.module.ts
│   ├── settings/
│   │   ├── settings.service.ts     ← Configuración del sistema (logo, color, nombre)
│   │   ├── settings.controller.ts  ← Rutas: /settings/public y /settings (admin)
│   │   └── settings.module.ts
│   ├── pensum/
│   │   ├── pensum.service.ts       ← Pensum por carrera + estado/historial por materia (estudiante)
│   │   ├── pensum.controller.ts    ← Ruta: /pensum (estudiante, admin, administrativo)
│   │   └── pensum.module.ts
│   ├── careers/
│   │   ├── careers.service.ts      ← Mantenimiento de carreras (estructura del pensum: años/semestres)
│   │   ├── careers.controller.ts   ← Rutas: /careers/* (lectura todos, escritura admin/administrativo)
│   │   └── careers.module.ts
│   ├── grades/
│   │   ├── grades.service.ts       ← Notas por grupo (docente), CUM e historial de notas del estudiante
│   │   ├── grades.controller.ts    ← Rutas: /grades/* (docente, estudiante, admin/administrativo)
│   │   └── grades.module.ts
│   ├── legacy-subjects/
│   │   ├── legacy-subjects.service.ts ← Materias cursadas previas al sistema (carga historica)
│   │   ├── legacy-subjects.controller.ts ← Rutas: /legacy-subjects/* (admin/administrativo)
│   │   └── legacy-subjects.module.ts
│   └── reports/
│       ├── reports.service.ts      ← Generación de Excel (ExcelJS) y PDF (PDFKit)
│       ├── reports.controller.ts   ← Rutas: /reports/*
│       └── reports.module.ts
│
├── infrastructure/                  ← Capa de infraestructura (implementaciones concretas)
│   ├── database/
│   │   ├── database.module.ts      ← Configuración TypeORM + PostgreSQL
│   │   ├── entities/               ← Entidades TypeORM decoradas con @Entity, @Column, etc.
│   │   │   ├── user.entity.ts
│   │   │   ├── student.entity.ts
│   │   │   ├── cycle.entity.ts
│   │   │   ├── subject.entity.ts
│   │   │   ├── prerequisite.entity.ts
│   │   │   ├── subject-group.entity.ts
│   │   │   ├── schedule.entity.ts
│   │   │   ├── teacher.entity.ts
│   │   │   ├── classroom.entity.ts
│   │   │   ├── enrollment.entity.ts
│   │   │   ├── enrollment-subject.entity.ts
│   │   │   ├── system-setting.entity.ts
│   │   │   ├── career.entity.ts
│   │   │   ├── grade.entity.ts
│   │   │   ├── legacy-completed-subject.entity.ts
│   │   │   └── payment.entity.ts
│   │   ├── repositories/           ← Repositorios TypeORM con metodos de acceso a datos
│   │   │   ├── user.repository.ts
│   │   │   ├── student.repository.ts
│   │   │   ├── cycle.repository.ts
│   │   │   ├── subject.repository.ts
│   │   │   ├── subject-group.repository.ts
│   │   │   ├── schedule.repository.ts
│   │   │   ├── teacher.repository.ts
│   │   │   ├── classroom.repository.ts
│   │   │   ├── enrollment.repository.ts
│   │   │   ├── enrollment-subject.repository.ts
│   │   │   ├── payment.repository.ts
│   │   │   ├── system-setting.repository.ts
│   │   │   ├── career.repository.ts
│   │   │   ├── grade.repository.ts
│   │   │   └── legacy-completed-subject.repository.ts
│   │   └── seeds/
│   │       └── seed.ts             ← Script de semilla con datos de prueba
│   ├── payment/
│   │   └── wompi.gateway.ts        ← Implementación concreta de Wompi API
│   └── email/
│       └── email.service.ts        ← Implementación de servicio de email
│
└── common/                          ← Utilidades compartidas
    ├── guards/
    │   ├── jwt-auth.guard.ts       ← Guard de autenticación JWT
    │   └── roles.guard.ts          ← Guard de autorización por roles
    ├── decorators/
    │   ├── roles.decorator.ts      ← @Roles(UserRole.ADMINISTRATOR)
    │   └── current-user.decorator.ts ← @CurrentUser('sub')
    ├── filters/
    │   └── http-exception.filter.ts ← Filtro global de excepciones
    └── interceptors/
        └── transform.interceptor.ts ← Interceptor de transformación de respuesta
```

### Frontend

```
frontend/src/
│
├── main.tsx                          ← Punto de entrada de la aplicación
├── App.tsx                           ← Configuración de rutas (React Router)
├── index.css                         ← Estilos globales (Tailwind)
│
├── api/                              ← Capa de acceso a la API
│   ├── axios.ts                      ← Cliente Axios con interceptores JWT
│   ├── auth.api.ts                   ← Login, register, forgot/reset password, profile
│   ├── cycles.api.ts                 ← Ciclos académicos
│   ├── subjects.api.ts               ← Materias (CRUD) y prerrequisitos
│   ├── subject-groups.api.ts         ← Grupos por materia/ciclo con horarios
│   ├── teachers.api.ts               ← Docentes
│   ├── classrooms.api.ts             ← Salones
│   ├── enrollments.api.ts            ← Inscripciones
│   ├── payments.api.ts               ← Pagos matrícula/mensualidades
│   ├── reports.api.ts                ← Descarga de reportes Excel/PDF
│   ├── users.api.ts                  ← Gestión de usuarios (admin)
│   ├── settings.api.ts               ← Configuración del sistema (logo, color)
│   ├── pensum.api.ts                 ← Pensum del estudiante y de carreras
│   ├── grades.api.ts                 ← Notas y CUM del estudiante, grupos y notas del docente
│   ├── legacySubjects.api.ts         ← Materias cursadas previas al sistema (admin/administrativo)
│   └── careers.api.ts                ← Mantenimiento de carreras
│
├── components/
│   ├── layout/
│   │   ├── Layout.tsx                ← Layout principal (sidebar + header + contenido)
│   │   ├── Sidebar.tsx               ← Barra lateral con navegación filtrada por rol y logo/color institucional
│   │   └── Header.tsx                ← Cabecera con nombre de institución, usuario y cerrar sesión
│   ├── ui/
│   │   ├── Button.tsx                ← Boton con variantes (primary, secondary, danger, ghost, outline)
│   │   ├── Input.tsx                 ← Input con label y mensaje de error
│   │   ├── Card.tsx                  ← Tarjeta contenedora con titulo opcional
│   │   ├── Badge.tsx                 ← Etiqueta de estado con colores automaticos
│   │   └── Modal.tsx                 ← Ventana modal con overlay
│   └── common/
│       └── ProtectedRoute.tsx        ← Ruta protegida con verificación JWT y roles
│
├── context/
│   ├── AuthContext.tsx               ← Contexto de autenticación (user, student, login, logout)
│   └── SettingsContext.tsx           ← Contexto de configuración (aplica logo/color via CSS vars)
│
├── pages/
│   ├── auth/
│   │   ├── LoginPage.tsx             ← Formulario de inicio de sesión con credenciales de prueba
│   │   ├── ForgotPasswordPage.tsx    ← Solicitar recuperación de contraseña
│   │   └── ResetPasswordPage.tsx     ← Establecer nueva contraseña con token
│   │   └── ChangePasswordPage.tsx    ← Cambiar contraseña (verificación por correo)
│   ├── dashboard/
│   │   └── DashboardPage.tsx         ← Panel principal con ciclo actual y acciones rapidas
│   ├── enrollments/
│   │   ├── EnrollmentPage.tsx        ← Inscripción de materias (reservar, cancelar, confirmar)
│   │   └── EnrollmentHistoryPage.tsx ← Historial de inscripciones por ciclo
│   ├── payments/
│   │   ├── PaymentsPage.tsx          ← Pagos de matrícula y mensualidades con resumen
│   │   └── ColecturiaPage.tsx        ← Consulta y cobros de la colecturia (colector/admin)
│   ├── planning/
│   │   └── PlanningPage.tsx          ← Planificación academica: grupos/horarios, docentes y salones
│   ├── schedule/
│   │   └── SchedulePage.tsx          ← Horario semanal del estudiante
│   ├── subjects/
│   │   └── SubjectsPage.tsx          ← Gestión del catálogo de materias (admin/administrativo)
│   ├── users/
│   │   └── UsersPage.tsx             ← Gestión de usuarios del sistema (solo admin)
│   ├── settings/
│   │   └── SettingsPage.tsx          ← Configuración del sistema: logo y color principal (solo admin)
│   ├── pensum/
│   │   ├── MyPensumPage.tsx          ← Pensum del estudiante con indicadores cursada/inscrita/pendiente
│   │   └── PensumPage.tsx            ← Gestión del pensum por carrera (admin/administrativo)
│   ├── careers/
│   │   └── CareersPage.tsx           ← Mantenimiento de carreras: CRUD y estructura del pensum (años/semestres)
│   ├── grades/
│   │   ├── TeacherGroupsPage.tsx     ← Lista de grupos del docente
│   │   └── GradeEntryPage.tsx        ← Registro y export de notas del grupo (bloqueado si el ciclo finalizo)
│   ├── legacy-subjects/
│   │   └── LegacySubjectsPage.tsx    ← Materias previas al sistema que afectan el CUM (admin/administrativo)
│   ├── reports/
│   │   └── ReportsPage.tsx           ← Descarga de reportes Excel/PDF
│   ├── cycles/
│   │   └── CyclesPage.tsx            ← Gestión de ciclos (admin: abrir/cerrar inscripción)
│   └── students/
│       └── StudentsListPage.tsx      ← Gestión de estudiantes: crear, editar y activar/desactivar (admin/administrativo)
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
┌──────────────────┐   │   ┌──────────────────┐    ┌──────────────────┐
│     cycles       │   │   │    subjects      │    │   teachers      │
├──────────────────┤   │   ├──────────────────┤    ├──────────────────┤
│ id (UUID, PK)    │   │   │ id (UUID, PK)    │    │ id (UUID, PK)    │
│ name             │   │   │ code (UNIQUE)    │    │ first_name       │
│ year             │   │   │ name             │    │ last_name        │
│ semester         │   │   │ credits          │    │ specialty        │
│ start_date       │   │   │ career           │    │ is_active        │
│ end_date         │   │   │ year             │    └──────────────────┘
│ tuition_amount   │   │   │ semester         │
│ monthly_amount   │   │   │ is_active        │    ┌──────────────────┐
│ monthly_count    │   │   └──────────────────┘    │  classrooms      │
│ is_active        │   │                           ├──────────────────┤
│ enrollment_open  │   │   ┌──────────────────┐    │ id (UUID, PK)    │
└──────────────────┘   │   │  subject_groups  │    │ name             │
                       │   ├──────────────────┤    │ capacity         │
┌──────────────────┐   │   │ id (UUID, PK)    │    │ is_active        │
│  enrollments     │   │   │ subject_id (FK)  │──► │└──────────────────┘
├──────────────────┤   │   │ cycle_id (FK)    │──► │
│ id (UUID, PK)    │◄──┤   │ teacher_id (FK)  │──► │
│ student_id (FK)  │──►│   │ classroom_id (FK)│──► │
│ cycle_id (FK)    │──►│   │ group_number     │    ┌──────────────────┐
│ status           │   │   │ capacity         │    │   schedules      │
│ enrolled_at      │   │   │ enrolled_count   │    ├──────────────────┤
│ tuition_paid     │   │   │ is_active        │    │ id (UUID, PK)    │
└──────────────────┘   │   └──────────────────┘    │ subject_group FK │──► subject_groups.id
                       │                           │ day_of_week      │
┌──────────────────┐   │                           │ start_time       │
│ enrollment_      │   │                           │ end_time         │
│   subjects       │   │                           └──────────────────┘
├──────────────────┤   │
│ id (UUID, PK)    │   │   ┌──────────────────┐
│ enrollment_id FK │──►│   │  prerequisites   │
│ subject_id (FK)  │──►│   ├──────────────────┤
│ schedule_id (FK) │──►│   │ id (UUID, PK)    │
│ status           │   │   │ subject_id (FK)  │──► subjects.id
│ reserved_at      │   │   │ prerequisite_    │
└──────────────────┘   │   │   subject_id(FK) │──► subjects.id
                       │   └──────────────────┘
┌──────────────────┐   │   ┌──────────────────────────┐
│    payments      │   │   │    system_settings       │
├──────────────────┤   │   ├──────────────────────────┤
│ id (UUID, PK)    │   │   │ id (PK, CHECK=1)         │
│ student_id (FK)  │──►│   │ logo_url                 │
│ cycle_id (FK)    │──►│   │ primary_color            │
│ amount           │   │   │ institution_name         │
│ payment_date     │   │   │ updated_at               │
│ payment_method   │   │   └──────────────────────────┘
│ wompi_txn_id     │   │
│ status           │   │   ┌──────────────────┐
│ type             │   │   │     careers      │
│ month            │   │   ├──────────────────┤
│ description      │   │   │ id (UUID, PK)    │
│ reference        │   │   │ code (UNIQUE)    │
│ created_at       │   │   │ name (UNIQUE)    │
└──────────────────┘   │   │ description      │
                        │   │ years            │
                        │   │ semesters_per_yr │
                        │   │ is_active        │
                        │   └──────────────────┘
```

#### Tablas de notas y materias previas al sistema

| Tabla | Columnas | Notas |
|---|---|---|
| `grades` | `id`, `student_id (FK)`, `subject_id (FK)`, `cycle_id (FK)`, `group_id (FK)`, `score`, `is_approved`, `created_at` | Notas de un grupo cargadas por el docente en un ciclo |
| `legacy_completed_subjects` | `id`, `student_id (FK)`, `subject_id (FK)`, `score (0-10)`, `year`, `semester`, `notes`, `registered_by (FK → users)`, `created_at`, `updated_at` | Materias cursadas previas al sistema (carga historica). `UNIQUE(student_id, subject_id)`; las notas se incluyen en el calculo del CUM |

---

## Instalación y ejecución

### Requisitos previos

- Node.js 20+
- PostgreSQL 16+ (o usar Docker)
- npm o yarn

### Opción 1: Docker (recomendado)

```bash
# Clonar el repositorio
git clone https://github.com/JosueRauda7/registro-academico-upam.git
cd registro-academico-upam

# En un clon nuevo: generar .env con secretos independientes (no sobrescribe uno existente)
node scripts/secure-local-docker.cjs --init-env

# Para ejecutar en tu computadora, añadir al .env generado:
# FRONTEND_URL=http://localhost:8082
# En un servidor, usar la URL por la que accederán los usuarios.

# Levantar todos los servicios
docker compose up -d --build
```

> **Nota**: Una base nueva se inicializa con `database/init.sql` y el rol limitado `upam_app`. Compose exige secretos externos; la web publica 8082 en las interfaces del servidor, mientras API directa y DB permanecen en 127.0.0.1. Para una base local existente, `node scripts/secure-local-docker.cjs` rota credenciales conservando datos; después recrear los servicios. No eliminar volúmenes para aplicar cambios. Véase `docs/architecture.md` para configuración y límites de Wompi.

Los servicios estarán disponibles en:
- **Frontend remoto (LAN)**: http://192.168.0.151:8082 (o la dirección del servidor que utilices, puerto 8082)
- **Frontend desde el servidor**: http://localhost:8082
- **Backend API**: http://localhost:3002/api
- **Swagger docs**: http://localhost:3002/api/docs
- **Swagger vía frontend**: http://localhost:8082/api/docs
- **PostgreSQL**: localhost:5434

### Opción 2: Desarrollo local

#### Backend

```bash
cd backend

# Instalar dependencias
npm install

# Copiar archivo de variables de entorno
cp .env.example .env

# Cargar el esquema de la base de datos en PostgreSQL
psql -U postgres upam_academico < database/init.sql

# Ejecutar el servidor en modo desarrollo
npm run start:dev
```

#### Frontend

```bash
cd frontend

# Instalar dependencias
npm install

# Ejecutar el servidor de desarrollo
npm run dev
```

El frontend estará disponible en http://localhost:5173 y proxiara las llamadas /api al backend en http://localhost:3000.

### Comandos utiles

```bash
# Backend
npm run start:dev          # Servidor con hot-reload
npm run build              # Compilar para producción
npm run start:prod         # Ejecutar compilación
npm run typecheck          # Verificar tipos TypeScript
npm run lint               # Linting
npm run seed               # Semilla de datos de prueba

# Frontend
npm run dev                # Servidor de desarrollo
npm run build              # Compilar para producción
npm run typecheck          # Verificar tipos TypeScript
npm run lint               # Linting
```

---

## Credenciales de prueba

| Rol | Email | Contraseña | Descripción |
|-----|-------|------------|-------------|
| Administrador | `admin@upam.edu.sv` | `admin123` | Acceso total al sistema |
| Estudiante | `estudiante@upam.edu.sv` | `estudiante123` | Josué Rauda - Ing. en Sistemas |
| Colector | `colector@upam.edu.sv` | `colector123` | Consulta de pagos y recaudación |
| Administrativo | `administrativo@upam.edu.sv` | `adminstaff123` | Gestión de estudiantes e inscripciones |
| Docente | docente@upam.edu.sv | docente123 | Catedrático con acceso para registrar notas |

> **Nota**: Estas cuentas se crean al ejecutar `npm run seed` o al levantar Docker por primera vez.

---

## Endpoints API

Todas las rutas están prefijadas con `/api`.

### Autenticación

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| POST | `/api/auth/register` | Registrar nuevo usuario | No |
| POST | `/api/auth/login` | Iniciar sesión | No |
| POST | `/api/auth/forgot-password` | Solicitar recuperación de contraseña | No |
| POST | `/api/auth/reset-password` | Restablecer contraseña con token | No |
| POST | `/api/auth/change-password` | Solicitar cambio de contraseña (envía enlace de verificación al correo del usuario autenticado) | Si |
| GET | `/api/auth/profile` | Obtener perfil del usuario autenticado | Si |

> **Cambio de contraseña con verificación por correo**: un usuario autenticado inicia el cambio desde "Cambiar contraseña" (cabecera). El backend envía un enlace de verificación por correo (token JWT de 1 hora, de un solo uso) que lleva a `/reset-password`, donde el usuario define su nueva contraseña. El flujo es identico al de "olvidar contraseña" y aplica a todos los roles. El envío real de correos depende de la variable `RESEND_API_KEY`.

### Ciclos

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| GET | `/api/cycles` | Listar todos los ciclos | Si |
| GET | `/api/cycles/active` | Listar ciclos activos | Si |
| GET | `/api/cycles/open-enrollment` | Obtener ciclo con inscripción abierta | Si |
| GET | `/api/cycles/:id` | Obtener ciclo por ID | Si |
| POST | `/api/cycles` | Crear nuevo ciclo | Admin |
| PUT | `/api/cycles/:id` | Actualizar ciclo | Admin |
| PUT | `/api/cycles/:id/open-enrollment` | Abrir inscripción del ciclo | Admin |
| PUT | `/api/cycles/:id/close-enrollment` | Cerrar inscripción del ciclo | Admin |

### Materias

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| GET | `/api/subjects` | Listar todas las materias (filtro por carrera) | Si |
| GET | `/api/subjects/:id` | Obtener materia por ID | Si |
| GET | `/api/subjects/:id/schedules` | Horarios de una materia en un ciclo | Si |
| GET | `/api/subjects/:id/prerequisites` | Prerrequisitos de una materia | Si |
| GET | `/api/subjects/schedules/cycle/:cycleId` | Todos los horarios de un ciclo | Si |
| POST | `/api/subjects` | Crear materia | Admin, Administrativo |
| PUT | `/api/subjects/:id` | Actualizar materia | Admin, Administrativo |
| DELETE | `/api/subjects/:id` | Desactivar materia (baja logica) | Admin, Administrativo |

### Grupos, docentes y salones

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| GET | `/api/subject-groups` | Listar grupos (filtro por ciclo) | Si |
| GET | `/api/subject-groups/:id` | Obtener grupo con horarios | Si |
| POST | `/api/subject-groups` | Crear grupo de materia con horarios | Admin, Administrativo |
| PUT | `/api/subject-groups/:id` | Actualizar grupo (docente, salón, capacidad) | Admin, Administrativo |
| DELETE | `/api/subject-groups/:id` | Cancelar grupo (decrementa cupos) | Admin, Administrativo |
| POST | `/api/subject-groups/:id/schedules` | Agregar horario a un grupo | Admin, Administrativo |
| DELETE | `/api/subject-groups/:id/schedules/:scheduleId` | Eliminar un horario del grupo | Admin, Administrativo |
| GET | `/api/teachers` | Listar docentes | Si |
| GET | `/api/grades/my` | Mis notas y CUM del estudiante | Estudiante |
| GET | `/api/grades/teacher/groups` | Grupos del docente autenticado | Docente |
| GET | `/api/grades/teacher/groups/:groupId` | Roster de estudiantes y notas de un grupo | Docente, Admin, Administrativo |
| PUT | `/api/grades/teacher/groups/:groupId` | Guardar notas del grupo (bloqueado si el ciclo finalizo) | Docente |
| GET | `/api/grades/teacher/groups/:groupId/export` | Exportar notas del grupo a Excel | Docente, Admin, Administrativo |
| GET | `/api/legacy-subjects?studentId=` | Listar materias previas al sistema de un estudiante (incluye datos del estudiante y la materia) | Admin, Administrativo |
| POST | `/api/legacy-subjects` | Registrar materia cursada previa al sistema (afecta el CUM; no permite duplicar materia por estudiante) | Admin, Administrativo |
| PUT | `/api/legacy-subjects/:id` | Editar la nota, año, semestre u observaciones de una materia previa | Admin, Administrativo |
| DELETE | `/api/legacy-subjects/:id` | Eliminar una materia previa registrada | Admin, Administrativo |
| POST/PUT/DELETE | `/api/teachers/:id` | CRUD de docentes | Admin, Administrativo |
| GET | `/api/classrooms` | Listar salones | Si |
| POST/PUT/DELETE | `/api/classrooms/:id` | CRUD de salones | Admin, Administrativo |

### Usuarios

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| GET | `/api/users` | Listar usuarios (filtro por rol) | Admin |
| GET | `/api/users/:id` | Obtener usuario por ID | Admin |
| POST | `/api/users` | Crear usuario (crea perfil de estudiante o docente segun el rol) | Admin |
| PUT | `/api/users/:id` | Actualizar usuario (nombre, rol, estado, contraseña) | Admin |
| DELETE | `/api/users/:id` | Desactivar cuenta (no permite desactivar administradores) | Admin |

### Estudiantes

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| GET | `/api/students` | Listar todos los estudiantes (con datos de la cuenta) | Admin, Administrativo, Colector |
| GET | `/api/students/me` | Perfil de estudiante del usuario autenticado | Estudiante |
| GET | `/api/students/:id` | Obtener estudiante por ID | Autenticados |
| POST | `/api/students` | Crear estudiante (cuenta + perfil académico; carnet y código autogenerados) | Admin, Administrativo |
| PUT | `/api/students/:id` | Actualizar estudiante (datos de cuenta, contraseña y perfil; incluye activar/desactivar) | Admin, Administrativo |

**Reglas de validación en crear/editar estudiante:**

- El carnet y el código se **autogeneran** al crear (`C####` y `UPAM-AAAA-####`) y son inmutables (solo lectura en edición).
- El **correo** debe pertenecer al dominio `@upam.edu.sv` (caso se normaliza a minusculas).
- El **teléfono** debe tener **8 digitos** y se normaliza al formato `XXXX-XXXX` (opcional).
- La **fecha de nacimiento** no puede ser futura y el estudiante debe ser **mayor de 18 años** (opcional).
- El **carnet** es unico: se valida que no exista otro estudiante con el mismo (evita duplicados).
- La **contraseña** debe tener mínimo 6 caracteres y el correo no puede repetirse (409).

### Importar notas anteriores al sistema desde Excel

En **Materias previas**, con rol administrador o administrativo:

1. Pulsa **Descargar plantilla**. Incluye instrucciones y un catálogo de materias.
2. Completa únicamente la hoja **Notas previas**: `carnet`, `codigo_materia`, `nota`, `anio`, `semestre`, `observaciones`. Puedes incluir varios estudiantes existentes; carnet y código deben conservarse como texto.
3. Adjunta el archivo `.xlsx` y pulsa **Validar e importar**. No hace falta seleccionar un estudiante en el formulario individual.

Hasta 500 notas y 2 MiB por archivo. Nota obligatoria de 0 a 10, máximo dos decimales; año opcional desde 1900 al actual, semestre opcional 1/2 y observaciones opcionales de hasta 500 caracteres. Las materias deben estar activas y pertenecer a la carrera del estudiante. Las notas reprobadas también forman parte del historial.

Si hay errores, se indican sus filas y no se guarda ninguna nota del lote. No se sobrescriben registros existentes. Usa la plantilla simple, sin fórmulas, macros, enlaces, imágenes, objetos, celdas combinadas ni hojas adicionales. El archivo se valida y procesa en memoria; no queda publicado ni almacenado.

Swagger documenta `GET /api/legacy-subjects/template` y `POST /api/legacy-subjects/import`. Pruebas aisladas: desde backend, `node --test test/legacy-import.test.cjs`.

## Configuración del sistema

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| GET | `/api/settings/public` | Obtener configuración publica (logo, color, nombre) | No |
| GET | `/api/settings` | Obtener configuración completa | Admin |
| PUT | `/api/settings` | Actualizar logo, color principal y nombre de la institución | Admin |

### Pensum

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| GET | `/api/pensum` | Pensum estructurado por año y semestre. **Estudiante**: retorna su carrera con el estado de cada materia (`cursada`/`inscrita`/`pendiente`) y el historial de ciclos en que curso o se inscribio. **Admin/Administrativo**: requiere `?career=` y retorna además las materias inactivas para gestionar el plan de estudios. La estructura (cantidad de años/semestres) proviene de la carrera e incluye `careerConfig` | Estudiante, Admin, Administrativo |

### Carreras

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| GET | `/api/careers` | Listar carreras (con `all=true` incluye inactivas) | Autenticados |
| GET | `/api/careers/:id` | Obtener carrera por ID | Autenticados |
| POST | `/api/careers` | Crear carrera (código, nombre, descripción, años y semestres por año del pensum) | Admin, Administrativo |
| PUT | `/api/careers/:id` | Actualizar carrera y estructura del pensum | Admin, Administrativo |
| DELETE | `/api/careers/:id` | Desactivar carrera (bloqueado si tiene materias activas asignadas) | Admin, Administrativo |
| PUT | `/api/careers/:id/reactivate` | Reactivar carrera | Admin, Administrativo |

### Inscripciones

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| GET | `/api/enrollments/my` | Mis inscripciones | Estudiante |
| GET | `/api/enrollments/my/:cycleId` | Mi inscripción en un ciclo | Estudiante |
| POST | `/api/enrollments/cycle/:cycleId` | Inscribirse al ciclo (requiere matrícula pagada) | Estudiante |
| POST | `/api/enrollments/subject` | Reservar cupo en una materia | Estudiante |
| PUT | `/api/enrollments/subject/:id/cancel` | Cancelar reserva de una materia | Estudiante |
| POST | `/api/enrollments/confirm/:cycleId` | Confirmar inscripción completa | Estudiante |
| GET | `/api/enrollments/all` | Todas las inscripciones (filtro por ciclo) | Admin, Administrativo |
| GET | `/api/enrollments/stats/:cycleId` | Estadisticas de inscripción | Admin, Administrativo |

### Pagos

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| POST | `/api/payments/tuition/:cycleId` | Crear pago de matrícula | Estudiante |
| POST | `/api/payments/monthly/:cycleId` | Crear pago de mensualidad | Estudiante |
| POST | `/api/payments/webhook` | Webhook de Wompi (callback de pago) | No |
| GET | `/api/payments/my` | Mis pagos | Estudiante |
| GET | `/api/payments/my/:cycleId` | Mis pagos de un ciclo | Estudiante |
| GET | `/api/payments/my/:cycleId/monthly` | Mis pagos mensuales de un ciclo | Estudiante |
| GET | `/api/payments/my/:cycleId/summary` | Resumen de pagos del ciclo | Estudiante |
| GET | `/api/payments/all` | Todos los pagos (filtro por ciclo) | Admin, Colector |
| GET | `/api/payments/stats/:cycleId` | Estadisticas de recaudación | Admin, Colector |
| GET | `/api/payments/:id` | Detalle de un pago | Si |

### Reportes

| Método | Ruta | Formato | Descripción | Auth |
|--------|------|---------|-------------|------|
| GET | `/api/reports/student-payments/:studentId` | Excel | Reporte de pagos de un estudiante | Estudiante, Admin, Colector |
| GET | `/api/reports/enrollments/:cycleId` | Excel | Reporte de inscripciones del ciclo | Admin, Administrativo |
| GET | `/api/reports/collection/:cycleId` | Excel | Reporte de recaudación del ciclo | Admin, Colector |
| GET | `/api/reports/student-list/:cycleId` | Excel | Lista de estudiantes del ciclo | Admin, Administrativo |
| GET | `/api/reports/payment-receipt/:paymentId` | PDF | Comprobante de pago individual | Si |

---

## Funcionalidades por rol

### Estudiante

- Ver dashboard con información personal y ciclo actual
- Pagar matrícula del ciclo via Wompi
- Inscribir materias seleccionando horarios
  - Validación automatica de prerrequisitos aprobados
  - Validación de cupos disponibles en tiempo real
  - Detección y prevención de choques de horario
- Reservar cupo en materias (asiento temporal)
- Cancelar reserva de materias
- Confirmar inscripción completa
- Ver horario semanal con aulas, docentes y grupos
- Pagar mensualidades mes a mes (hasta 4 meses)
- Ver resumen de pagos por ciclo (pagado/pendiente)
- Ver historial de inscripciones
- Ver sus notas y CUM (incluye materias previas al sistema registradas por administración, marcadas como historicas)
- Descargar reporte de pagos propios (Excel)

### Administrador

- Todo lo del estudiante, además:
- Gestionar ciclos académicos (crear, editar)
- Abrir/cerrar inscripción de materias por ciclo
- Gestionar estudiantes (crear, editar datos, activar/desactivar cuentas)
- Gestionar materias, docentes y salones
- Planificar grupos y horarios por ciclo (asignar docente, salón y capacidad)
- Gestionar usuarios del sistema (crear, editar, desactivar cuentas)
- Configurar el sistema (logo institucional, color principal, nombre)
- Ver todas las inscripciones del sistema
- Ver estadisticas de inscripción por ciclo
- Gestionar materias previas al sistema (registrar, editar y eliminar notas historicas que afectan el CUM del estudiante)
- Descargar todos los reportes (inscripciones, recaudación, lista de estudiantes)

### Colector

- Ver pagos de todos los estudiantes
- Ver estadisticas de recaudación por ciclo
- Descargar reporte de recaudación (Excel)
- Descargar reporte de pagos de estudiantes (Excel)
- Descargar comprobantes de pago (PDF)

### Docente

- Ver los grupos de materias asignados en el ciclo actual
- Ver el roster de estudiantes de cada grupo
- Registrar y editar las notas de sus grupos (bloqueado si el ciclo ya finalizo)
- Exportar las notas de un grupo a Excel

### Administrativo

- Gestionar estudiantes (crear, editar datos, activar/desactivar cuentas)
- Gestionar materias, docentes y salones
- Planificar grupos y horarios por ciclo
- Ver todas las inscripciones del sistema
- Gestionar materias previas al sistema (registrar, editar y eliminar notas historicas que afectan el CUM del estudiante)
- Descargar reporte de inscripciones (Excel)
- Descargar lista de estudiantes (Excel)

---

## Importar notas anteriores al sistema desde Excel

En **Materias previas**, con rol administrador o administrativo:

1. Pulsa **Descargar plantilla**. Incluye instrucciones y un catálogo de materias.
2. Completa únicamente la hoja **Notas previas**: `carnet`, `codigo_materia`, `nota`, `anio`, `semestre`, `observaciones`. Puedes incluir varios estudiantes existentes; carnet y código deben conservarse como texto.
3. Adjunta el archivo `.xlsx` y pulsa **Validar e importar**. No hace falta seleccionar un estudiante en el formulario individual.

Hasta 500 notas y 2 MiB por archivo. Nota obligatoria de 0 a 10, máximo dos decimales; año opcional desde 1900 al actual, semestre opcional 1/2 y observaciones opcionales de hasta 500 caracteres. Las materias deben estar activas y pertenecer a la carrera del estudiante. Las notas reprobadas también forman parte del historial.

Si hay errores, se indican sus filas y no se guarda ninguna nota del lote. No se sobrescriben registros existentes. Usa la plantilla simple, sin fórmulas, macros, enlaces, imágenes, objetos, celdas combinadas ni hojas adicionales. El archivo se valida y procesa en memoria; no queda publicado ni almacenado.

Swagger documenta `GET /api/legacy-subjects/template` y `POST /api/legacy-subjects/import`. Pruebas aisladas: desde backend, `node --test test/legacy-import.test.cjs`.

## Configuración del sistema

El modulo de configuración (solo administradores) permite personalizar la identidad visual de la aplicación en tiempo real:

- **Logo institucional**: imagen (JPG, PNG o SVG de hasta 2MB) que se muestra en el login, la barra lateral y las vistas publicas.
- **Color principal**: selector de color hexadecimal que se aplica a la barra lateral, la cabecera y los acentos del sistema. Los tonos secundarios se derivan automaticamente.
- **Nombre de la institución**: se muestra en el login, la barra lateral y la cabecera.

La configuración se almacena en la tabla `system_settings` (una sola fila) y se sirve publicamente a traves de `GET /api/settings/public`, de modo que la interfaz aplica el branding sin requerir autenticación previa. El frontend guarda una copia en el navegador (localStorage) para mostrarla de inmediato.

---

## Reportes disponibles

### Excel (.xlsx)

| Reporte | Contenido | Generado por |
|---------|-----------|--------------|
| **Reporte de Pagos** | Fecha, referencia, tipo (matrícula/mensualidad), monto, estado, descripción | Estudiante (propio), Admin, Colector |
| **Reporte de Inscripciones** | Carnet, nombre, carrera, materias inscritas, total créditos, estado, fecha | Admin, Administrativo |
| **Reporte de Recaudación** | Fecha, referencia, estudiante, tipo, monto, estado + totales recaudado/pendiente | Admin, Colector |
| **Lista de Estudiantes** | Carnet, código, nombre, carrera, email, teléfono | Admin, Administrativo |
| **Notas por Grupo** | Carnet, código, estudiante, materia, nota, estado | Docente, Admin, Administrativo |

### PDF

| Reporte | Contenido | Generado por |
|---------|-----------|--------------|
| **Comprobante de Pago** | Encabezado UPAM, referencia, fecha, tipo, descripción, monto, estado | Cualquier usuario autenticado |

---

## Configuración de Wompi

El sistema esta integrado con la API de **Wompi** en modo sandbox para procesar pagos.

### Variables de entorno

```env
WOMPI_PUBLIC_KEY=pk_test_abc123      # Clave publica (sandbox)
WOMPI_PRIVATE_KEY=sk_test_abc123     # Clave privada (sandbox)
WOMPI_BASE_URL=https://sandbox.wompi.co/v1
RESEND_API_KEY=re_xxx                # Clave de Resend para envío de correos (recuperación de contraseña, pagos, inscripciones)
RESEND_FROM_EMAIL=UPAM <no-reply@upam.edu.sv>
FRONTEND_URL=http://192.168.0.151:8082 # URL del frontend usada en los enlaces de los correos; ajustar al servidor
```

### Flujo de pago

1. El frontend llama al endpoint `POST /api/payments/tuition/:cycleId`
2. El backend crea un registro de pago con estado `pending` y una referencia unica
3. El backend llama a la API de Wompi para crear la transacción
4. Se retorna el `wompiOrderId` al frontend
5. Wompi notifica al backend via `POST /api/payments/webhook` cuando el pago se procesa
6. El backend actualiza el estado del pago (completed/failed)

> **Nota**: En sandbox, los pagos se simulan. En producción se requiere integrar el checkout de Wompi.

---

## Docker

### docker-compose.yml

El archivo `docker-compose.yml` define 3 servicios:

```yaml
services:
  db:           # PostgreSQL 16 Alpine (esquema y seed desde database/init.sql)
  backend:      # NestJS app (localhost:3002 → 3000 interno)
  frontend:     # React app via Nginx (localhost:8082 → 80 interno)
```

### Comandos Docker

```bash
# Levantar todo
docker compose up -d --build

# Ver logs
docker compose logs -f backend
docker compose logs -f frontend

# Detener todo
docker compose down

# Aplicar cambios de código conservando datos y volúmenes
docker compose up -d --build backend frontend
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

- **Arquitectura Limpia**: Separación en capas domain, application, infrastructure y common
- **Inyección de dependencias**: Uso de modulos NestJS con providers y exports
- **DTOs con validación**: class-validator con decoradores (@IsEmail, @MinLength, @IsEnum, etc.)
- **Guard de autenticación JWT**: Verificación de tokens en cada petición protegida
- **Guard de roles**: Autorización basada en roles con decorador @Roles()
- **Filtro global de excepciones**: Manejo centralizado de errores HTTP
- **Interceptor de transformación**: Respuestas estandarizadas con formato { data, message }
- **Repositorios tipados**: Acceso a datos abstraido en repositorios con TypeORM
- **Secretos fuera del código**: Variables de entorno via @nestjs/config
- **Helmet**: Headers de seguridad HTTP
- **CORS configurado**: Origenes permitidos desde el frontend

### Frontend

- **Componentes reutilizables**: UI library propia (Button, Input, Card, Badge, Modal)
- **Contexto de autenticación**: AuthContext con JWT persistido en localStorage
- **Rutas protegidas**: ProtectedRoute con verificación de token y roles
- **Navegación filtrada por rol**: Sidebar muestra solo las opciones permitidas
- **Manjo de errores**: Toast notifications con react-hot-toast
- **Tipado completo**: Todas las interfaces TypeScript definidas en types/
- **API layer abstrauida**: Servicios HTTP separados por dominio
- **Proxy de desarrollo**: Vite proxea /api al backend
- **Build optimizado**: Vite con tree-shaking y code splitting
- **CSS utility-first**: Tailwind CSS para estilos consistentes y rapidos

---

## Licencia

Este es un proyecto ficticio desarrollado con fines académicos.






