-- ============================================================
-- BASE DE DATOS: Registro Academico UPAM
-- Universidad Panamericana de El Salvador
-- ============================================================

-- ENUMS
CREATE TYPE user_role AS ENUM ('student', 'administrator', 'collector', 'administrative', 'teacher');
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded', 'cancelled');
CREATE TYPE payment_type AS ENUM ('tuition', 'monthly');
CREATE TYPE day_of_week AS ENUM ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday');
CREATE TYPE enrollment_status AS ENUM ('active', 'cancelled', 'completed');
CREATE TYPE enrollment_subject_status AS ENUM ('reserved', 'confirmed', 'cancelled');

-- ============================================================
-- TABLA: users
-- Usuarios del sistema (estudiantes, administradores, etc.)
-- ============================================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'student',
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    reset_token VARCHAR(255),
    reset_token_expires TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLA: students
-- Datos academicos de los estudiantes
-- ============================================================
CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    student_code VARCHAR(50) NOT NULL UNIQUE,
    carnet VARCHAR(50) NOT NULL UNIQUE,
    career VARCHAR(150) NOT NULL,
    enrollment_year INTEGER NOT NULL,
    phone VARCHAR(30),
    address TEXT,
    date_of_birth DATE
);

CREATE INDEX idx_students_user_id ON students(user_id);
CREATE INDEX idx_students_career ON students(career);

-- ============================================================
-- TABLA: cycles
-- Ciclos academicos (Ciclo I 2026, Ciclo II 2026, etc.)
-- ============================================================
CREATE TABLE cycles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    year INTEGER NOT NULL,
    semester INTEGER NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    tuition_amount DECIMAL(10,2) NOT NULL,
    monthly_amount DECIMAL(10,2) NOT NULL,
    monthly_count INTEGER NOT NULL DEFAULT 4,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    enrollment_open BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_cycles_year_semester ON cycles(year, semester);

-- ============================================================
-- TABLA: subjects
-- Materias por carrera y semestre
-- ============================================================
CREATE TABLE subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    credits INTEGER NOT NULL,
    career VARCHAR(150) NOT NULL,
    year INTEGER NOT NULL,
    semester INTEGER NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE INDEX idx_subjects_career ON subjects(career);
CREATE INDEX idx_subjects_code ON subjects(code);

-- ============================================================
-- TABLA: careers
-- Carreras academicas de la universidad (mantenimiento)
-- years: total de anos del pensum
-- semesters_per_year: cantidad de semestres por ano
-- ============================================================
CREATE TABLE careers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL UNIQUE,
    description TEXT,
    years INTEGER NOT NULL DEFAULT 5,
    semesters_per_year INTEGER NOT NULL DEFAULT 2,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_careers_code ON careers(code);

-- ============================================================
-- TABLA: prerequisites
-- Prerrequisitos de cada materia
-- ============================================================
CREATE TABLE prerequisites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    prerequisite_subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    UNIQUE(subject_id, prerequisite_subject_id)
);

CREATE INDEX idx_prerequisites_subject ON prerequisites(subject_id);

-- ============================================================
-- TABLA: teachers
-- Catedraticos de la universidad
-- ============================================================
CREATE TABLE teachers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE REFERENCES users(id) ON DELETE SET NULL,
    name VARCHAR(200) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(30),
    department VARCHAR(150),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_teachers_user_id ON teachers(user_id);

-- ============================================================
-- TABLA: classrooms
-- Salones o aulas de la universidad
-- ============================================================
CREATE TABLE classrooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL UNIQUE,
    building VARCHAR(100),
    capacity INTEGER NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLA: subject_groups
-- Grupos de una materia en un ciclo (seccion A, B, etc.)
-- Cada grupo tiene docente, salon, capacidad y horario propio
-- ============================================================
CREATE TABLE subject_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    cycle_id UUID NOT NULL REFERENCES cycles(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES teachers(id),
    classroom_id UUID NOT NULL REFERENCES classrooms(id),
    group_number INTEGER NOT NULL DEFAULT 1,
    capacity INTEGER NOT NULL,
    enrolled_count INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(subject_id, cycle_id, group_number)
);

CREATE INDEX idx_subject_groups_cycle ON subject_groups(cycle_id);
CREATE INDEX idx_subject_groups_subject ON subject_groups(subject_id);
CREATE INDEX idx_subject_groups_teacher ON subject_groups(teacher_id);

-- ============================================================
-- TABLA: schedules
-- Horarios que pertenecen a un grupo de materia (dias y horas)
-- ============================================================
CREATE TABLE schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES subject_groups(id) ON DELETE CASCADE,
    day_of_week day_of_week NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL
);

CREATE INDEX idx_schedules_group ON schedules(group_id);
CREATE INDEX idx_schedules_day_time ON schedules(day_of_week, start_time, end_time);

-- ============================================================
-- TABLA: enrollments
-- Inscripcion de un estudiante a un ciclo
-- ============================================================
CREATE TABLE enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    cycle_id UUID NOT NULL REFERENCES cycles(id) ON DELETE CASCADE,
    status enrollment_status NOT NULL DEFAULT 'active',
    enrolled_at TIMESTAMP NOT NULL DEFAULT NOW(),
    tuition_paid BOOLEAN NOT NULL DEFAULT FALSE,
    UNIQUE(student_id, cycle_id)
);

CREATE INDEX idx_enrollments_student ON enrollments(student_id);
CREATE INDEX idx_enrollments_cycle ON enrollments(cycle_id);

-- ============================================================
-- TABLA: enrollment_subjects
-- Materia inscrita dentro de una inscripcion (reserva/confirmacion)
-- ============================================================
CREATE TABLE enrollment_subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enrollment_id UUID NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    schedule_id UUID NOT NULL REFERENCES schedules(id) ON DELETE CASCADE,
    status enrollment_subject_status NOT NULL DEFAULT 'reserved',
    reserved_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_enrollment_subjects_enrollment ON enrollment_subjects(enrollment_id);
CREATE INDEX idx_enrollment_subjects_subject ON enrollment_subjects(subject_id);
CREATE INDEX idx_enrollment_subjects_schedule ON enrollment_subjects(schedule_id);

-- ============================================================
-- TABLA: grades
-- Notas de los estudiantes en las materias registradas
-- (calificaciones registradas por el catedratico)
-- ============================================================
CREATE TYPE grade_status AS ENUM ('approved', 'failed');

CREATE TABLE grades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enrollment_subject_id UUID NOT NULL UNIQUE REFERENCES enrollment_subjects(id) ON DELETE CASCADE,
    score DECIMAL(5,2) NOT NULL CHECK (score >= 0 AND score <= 10),
    status grade_status NOT NULL,
    graded_by UUID REFERENCES teachers(id),
    graded_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_grades_enrollment_subject ON grades(enrollment_subject_id);
CREATE INDEX idx_grades_graded_by ON grades(graded_by);

-- ============================================================
-- TABLA: legacy_completed_subjects
-- Materias cursadas por el estudiante ANTES de la creacion del
-- sistema (carga inicial para dejar al dia a los estudiantes).
-- Registra la nota con la que aprobo/reprobo la materia.
-- ============================================================
CREATE TABLE legacy_completed_subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    score DECIMAL(5,2) NOT NULL CHECK (score >= 0 AND score <= 10),
    year INTEGER,
    semester INTEGER,
    notes TEXT,
    registered_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(student_id, subject_id)
);

CREATE INDEX idx_legacy_subjects_student ON legacy_completed_subjects(student_id);
CREATE INDEX idx_legacy_subjects_subject ON legacy_completed_subjects(subject_id);

-- ============================================================
-- TABLA: system_settings
-- Configuracion global del sistema (logo, color principal, nombre)
-- ============================================================
CREATE TABLE system_settings (
    id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    logo_url TEXT,
    primary_color VARCHAR(9) NOT NULL DEFAULT '#1B4F72',
    institution_name VARCHAR(200) NOT NULL DEFAULT 'Universidad Panamericana de El Salvador',
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLA: payments
-- Pagos de matricula y mensualidades
-- ============================================================
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    cycle_id UUID NOT NULL REFERENCES cycles(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    payment_date TIMESTAMP,
    payment_method VARCHAR(50) NOT NULL DEFAULT 'wompi',
    wompi_transaction_id VARCHAR(255),
    status payment_status NOT NULL DEFAULT 'pending',
    type payment_type NOT NULL,
    month INTEGER,
    description TEXT,
    reference VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payments_student ON payments(student_id);
CREATE INDEX idx_payments_cycle ON payments(cycle_id);
CREATE INDEX idx_payments_reference ON payments(reference);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_type ON payments(type);

-- ============================================================
-- FUNCION: Actualizar updated_at automaticamente
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_teachers_updated_at BEFORE UPDATE ON teachers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_classrooms_updated_at BEFORE UPDATE ON classrooms
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subject_groups_updated_at BEFORE UPDATE ON subject_groups
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON system_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- FUNCION: Validar capacidad del grupo al inscribir materia
-- ============================================================
CREATE OR REPLACE FUNCTION check_group_capacity()
RETURNS TRIGGER AS $$
DECLARE
    gid UUID;
BEGIN
    SELECT group_id INTO gid FROM schedules WHERE id = NEW.schedule_id;
    IF (SELECT enrolled_count FROM subject_groups WHERE id = gid) >=
       (SELECT capacity FROM subject_groups WHERE id = gid) THEN
        RAISE EXCEPTION 'No hay cupos disponibles en este grupo';
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER check_capacity_before_enroll
    BEFORE INSERT ON enrollment_subjects
    FOR EACH ROW EXECUTE FUNCTION check_group_capacity();

-- ============================================================
-- NOTA: El incremento/decremento de enrolled_count en los grupos
-- se maneja a nivel de aplicacion (EnrollmentsService) para evitar
-- doble conteo con triggers de base de datos.
-- ============================================================

-- ============================================================
-- VER VISTAS UTILES
-- ============================================================

-- Vista: Resumen de pagos por estudiante y ciclo
CREATE VIEW v_payment_summary AS
SELECT
    p.student_id,
    s.student_code,
    s.carnet,
    u.first_name || ' ' || u.last_name AS student_name,
    u.email AS student_email,
    c.id AS cycle_id,
    c.name AS cycle_name,
    p.type,
    p.month,
    p.amount,
    p.status,
    p.reference,
    p.created_at AS payment_date
FROM payments p
JOIN students s ON p.student_id = s.id
JOIN users u ON s.user_id = u.id
JOIN cycles c ON p.cycle_id = c.id;

-- Vista: Inscripciones con detalle de materias
CREATE VIEW v_enrollment_detail AS
SELECT
    e.id AS enrollment_id,
    s.student_code,
    s.carnet,
    u.first_name || ' ' || u.last_name AS student_name,
    c.name AS cycle_name,
    sub.code AS subject_code,
    sub.name AS subject_name,
    sub.credits,
    g.group_number,
    t.name AS teacher_name,
    cl.name AS classroom,
    sch.day_of_week,
    sch.start_time,
    sch.end_time,
    es.status AS enrollment_status,
    e.enrolled_at
FROM enrollment_subjects es
JOIN enrollments e ON es.enrollment_id = e.id
JOIN students s ON e.student_id = s.id
JOIN users u ON s.user_id = u.id
JOIN cycles c ON e.cycle_id = c.id
JOIN subjects sub ON es.subject_id = sub.id
JOIN schedules sch ON es.schedule_id = sch.id
JOIN subject_groups g ON sch.group_id = g.id
LEFT JOIN teachers t ON g.teacher_id = t.id
JOIN classrooms cl ON g.classroom_id = cl.id;

-- Vista: Cupos disponibles por grupo en un ciclo
CREATE VIEW v_available_seats AS
SELECT
    g.id AS group_id,
    sub.code AS subject_code,
    sub.name AS subject_name,
    c.name AS cycle_name,
    g.group_number,
    cl.name AS classroom,
    g.capacity,
    g.enrolled_count,
    (g.capacity - g.enrolled_count) AS available_seats
FROM subject_groups g
JOIN subjects sub ON g.subject_id = sub.id
JOIN cycles c ON g.cycle_id = c.id
JOIN classrooms cl ON g.classroom_id = cl.id;

-- ============================================================
-- DATOS INICIALES (Seed)
-- ============================================================

-- Configuracion del sistema (fila unica id=1)
INSERT INTO system_settings (id, logo_url, primary_color, institution_name)
VALUES (1, NULL, '#1B4F72', 'Universidad Panamericana de El Salvador') ON CONFLICT DO NOTHING;

-- Usuarios de prueba con hashes bcrypt generados con bcryptjs
-- Todas las contrasenas estan en texto plano abajo:
-- admin123, colector123, adminstaff123, estudiante123

-- Administrador (admin123)
INSERT INTO users (id, email, password_hash, role, first_name, last_name, is_active)
VALUES (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'admin@upam.edu.sv',
    '$2a$10$bR2lF0aKLYmSzKDWhJFBo.3tluPEFZ3UD8X4JpIdwDrkzAAwLw.Tm',
    'administrator',
    'Administrador',
    'UPAM',
    TRUE
);

-- Colector (colector123)
INSERT INTO users (id, email, password_hash, role, first_name, last_name, is_active)
VALUES (
    'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
    'colector@upam.edu.sv',
    '$2a$10$3YeBPpTfsXe7vynITRjLfetyTZtQL1GyzrvYdnU.jmeOc1FeeOFZK',
    'collector',
    'Maria',
    'Gonzalez',
    TRUE
);

-- Administrativo (adminstaff123)
INSERT INTO users (id, email, password_hash, role, first_name, last_name, is_active)
VALUES (
    'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33',
    'administrativo@upam.edu.sv',
    '$2a$10$P5ECIXJSvSkN4eRKUGh36.K3iPwKXZqka0/c9ROqVCU5qRWCbLfgm',
    'administrative',
    'Carlos',
    'Ramirez',
    TRUE
);

-- Estudiante (estudiante123)
INSERT INTO users (id, email, password_hash, role, first_name, last_name, is_active)
VALUES (
    'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44',
    'estudiante@upam.edu.sv',
    '$2a$10$HAo7PgoeKOZw.0VnlWLh3.Zx2Xdt7N9gkO5rmE0ZxBLOFDUEKHJbS',
    'student',
    'Josue',
    'Rauda',
    TRUE
);

-- Datos del estudiante
INSERT INTO students (user_id, student_code, carnet, career, enrollment_year, phone, address, date_of_birth)
VALUES (
    'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44',
    'UPAM-2026-0001',
    'LR021501',
    'Ingenieria en Sistemas',
    2026,
    '7012-3456',
    'San Salvador, El Salvador',
    '2000-05-15'
);

-- Docente (docente123) vinculado al catedratico "Ing. Ana Martinez"
INSERT INTO users (id, email, password_hash, role, first_name, last_name, is_active)
VALUES (
    'e1eebc99-9c0b-4ef8-bb6d-6bb9bd380a6a',
    'docente@upam.edu.sv',
    '$2a$10$gwlulrzA6nuBuLHaPNkX5OQHgrOSvgkNdgodi.nau/n4LPudDEedq',
    'teacher',
    'Ana',
    'Martinez',
    TRUE
);

-- Ciclo I 2026
INSERT INTO cycles (id, name, year, semester, start_date, end_date, tuition_amount, monthly_amount, monthly_count, is_active, enrollment_open)
VALUES (
    'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55',
    'Ciclo I 2026',
    2026,
    1,
    '2026-01-15',
    '2026-12-15',
    150.00,
    120.00,
    4,
    TRUE,
    TRUE
);

-- Carreras disponibles
INSERT INTO careers (code, name, description, years, semesters_per_year) VALUES
('IIS', 'Ingenieria en Sistemas', 'Ingenieria en Sistemas Informaticos', 5, 2),
('IC', 'Ingenieria Civil', 'Ingenieria Civil', 5, 2),
('II', 'Ingenieria Industrial', 'Ingenieria Industrial', 5, 2),
('ADE', 'Administracion de Empresas', 'Licenciatura en Administracion de Empresas', 4, 2),
('CP', 'Contaduria Publica', 'Licenciatura en Contaduria Publica', 5, 2),
('DER', 'Derecho', 'Licenciatura en Ciencias Juridicas', 5, 2),
('MED', 'Medicina', 'Doctorado en Medicina', 6, 2),
('PSI', 'Psicologia', 'Licenciatura en Psicologia', 5, 2);

-- Materias - Semestre 1
INSERT INTO subjects (code, name, credits, career, year, semester, is_active) VALUES
('MAT101', 'Matematica I', 4, 'Ingenieria en Sistemas', 1, 1, TRUE),
('INF101', 'Introduccion a la Programacion', 4, 'Ingenieria en Sistemas', 1, 1, TRUE),
('FIS101', 'Fisica I', 4, 'Ingenieria en Sistemas', 1, 1, TRUE),
('ING101', 'Ingles I', 3, 'Ingenieria en Sistemas', 1, 1, TRUE);

-- Materias - Semestre 2
INSERT INTO subjects (code, name, credits, career, year, semester, is_active) VALUES
('MAT102', 'Matematica II', 4, 'Ingenieria en Sistemas', 1, 2, TRUE),
('INF102', 'Programacion II', 4, 'Ingenieria en Sistemas', 1, 2, TRUE),
('FIS102', 'Fisica II', 4, 'Ingenieria en Sistemas', 1, 2, TRUE),
('ING102', 'Ingles II', 3, 'Ingenieria en Sistemas', 1, 2, TRUE);

-- Materias - Semestre 3
INSERT INTO subjects (code, name, credits, career, year, semester, is_active) VALUES
('MAT201', 'Matematica III', 4, 'Ingenieria en Sistemas', 2, 1, TRUE),
('INF201', 'Estructuras de Datos', 4, 'Ingenieria en Sistemas', 2, 1, TRUE);

-- Materias - Semestre 4
INSERT INTO subjects (code, name, credits, career, year, semester, is_active) VALUES
('INF202', 'Base de Datos', 4, 'Ingenieria en Sistemas', 2, 2, TRUE),
('INF203', 'Redes de Computadoras', 3, 'Ingenieria en Sistemas', 2, 2, TRUE);

-- Prerrequisitos
INSERT INTO prerequisites (subject_id, prerequisite_subject_id)
SELECT s1.id, s2.id FROM subjects s1, subjects s2
WHERE s1.code = 'MAT102' AND s2.code = 'MAT101';

INSERT INTO prerequisites (subject_id, prerequisite_subject_id)
SELECT s1.id, s2.id FROM subjects s1, subjects s2
WHERE s1.code = 'INF102' AND s2.code = 'INF101';

INSERT INTO prerequisites (subject_id, prerequisite_subject_id)
SELECT s1.id, s2.id FROM subjects s1, subjects s2
WHERE s1.code = 'MAT201' AND s2.code = 'MAT102';

INSERT INTO prerequisites (subject_id, prerequisite_subject_id)
SELECT s1.id, s2.id FROM subjects s1, subjects s2
WHERE s1.code = 'INF201' AND s2.code = 'INF102';

-- Catedraticos (Docentes)
-- Ing. Ana Martinez esta vinculada a la cuenta docente@upam.edu.sv (e1eebc99-...-a6a)
INSERT INTO teachers (id, user_id, name, email, phone, department, is_active) VALUES
('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01', 'e1eebc99-9c0b-4ef8-bb6d-6bb9bd380a6a', 'Ing. Ana Martinez', 'ana.martinez@upam.edu.sv', '7011-1111', 'Matematicas', TRUE),
('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a02', NULL, 'Ing. Luis Perez', 'luis.perez@upam.edu.sv', '7011-2222', 'Sistemas', TRUE),
('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a03', NULL, 'Lic. Maria Lopez', 'maria.lopez@upam.edu.sv', '7011-3333', 'Fisica', TRUE),
('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a04', NULL, 'Msc. Carlos Chavez', 'carlos.chavez@upam.edu.sv', '7011-4444', 'Idiomas', TRUE);

-- Salones (Aulas)
INSERT INTO classrooms (id, name, building, capacity, is_active) VALUES
('a1eebc99-9c0b-4ef8-bb6d-6bb9bd380a01', 'Aula 101', 'Edificio A', 40, TRUE),
('a1eebc99-9c0b-4ef8-bb6d-6bb9bd380a02', 'Aula 201', 'Edificio A', 40, TRUE),
('a1eebc99-9c0b-4ef8-bb6d-6bb9bd380a03', 'Lab-1', 'Edificio B', 35, TRUE),
('a1eebc99-9c0b-4ef8-bb6d-6bb9bd380a04', 'Lab-2', 'Edificio B', 35, TRUE);

-- Grupos de materias - Ciclo I 2026
-- MAT101: Grupo 1 - Ing. Ana Martinez - Aula 101
INSERT INTO subject_groups (subject_id, cycle_id, teacher_id, classroom_id, group_number, capacity, enrolled_count)
SELECT s.id, 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01', 'a1eebc99-9c0b-4ef8-bb6d-6bb9bd380a01', 1, 40, 0
FROM subjects s WHERE s.code = 'MAT101';

-- INF101: Grupo 1 - Ing. Luis Perez - Lab-1
INSERT INTO subject_groups (subject_id, cycle_id, teacher_id, classroom_id, group_number, capacity, enrolled_count)
SELECT s.id, 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a02', 'a1eebc99-9c0b-4ef8-bb6d-6bb9bd380a03', 1, 35, 0
FROM subjects s WHERE s.code = 'INF101';

-- FIS101: Grupo 1 - Lic. Maria Lopez - Aula 201
INSERT INTO subject_groups (subject_id, cycle_id, teacher_id, classroom_id, group_number, capacity, enrolled_count)
SELECT s.id, 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a03', 'a1eebc99-9c0b-4ef8-bb6d-6bb9bd380a02', 1, 40, 0
FROM subjects s WHERE s.code = 'FIS101';

-- ING101: Grupo 1 - Msc. Carlos Chavez - Aula 101
INSERT INTO subject_groups (subject_id, cycle_id, teacher_id, classroom_id, group_number, capacity, enrolled_count)
SELECT s.id, 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a04', 'a1eebc99-9c0b-4ef8-bb6d-6bb9bd380a01', 1, 30, 0
FROM subjects s WHERE s.code = 'ING101';

-- MAT102: Grupo 1 - Ing. Ana Martinez - Aula 101
INSERT INTO subject_groups (subject_id, cycle_id, teacher_id, classroom_id, group_number, capacity, enrolled_count)
SELECT s.id, 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01', 'a1eebc99-9c0b-4ef8-bb6d-6bb9bd380a01', 1, 40, 0
FROM subjects s WHERE s.code = 'MAT102';

-- INF102: Grupo 1 - Ing. Luis Perez - Lab-2
INSERT INTO subject_groups (subject_id, cycle_id, teacher_id, classroom_id, group_number, capacity, enrolled_count)
SELECT s.id, 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a02', 'a1eebc99-9c0b-4ef8-bb6d-6bb9bd380a04', 1, 35, 0
FROM subjects s WHERE s.code = 'INF102';

-- INF201: Grupo 1 - Ing. Luis Perez - Aula 201
INSERT INTO subject_groups (subject_id, cycle_id, teacher_id, classroom_id, group_number, capacity, enrolled_count)
SELECT s.id, 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a02', 'a1eebc99-9c0b-4ef8-bb6d-6bb9bd380a02', 1, 35, 0
FROM subjects s WHERE s.code = 'INF201';

-- Horarios - Ciclo I 2026 (pertenecientes a los grupos)
-- MAT101: Lunes y Miercoles 7:00-9:00 (Aula 101)
INSERT INTO schedules (group_id, day_of_week, start_time, end_time)
SELECT g.id, 'monday', '07:00', '09:00'
FROM subject_groups g JOIN subjects s ON g.subject_id = s.id
WHERE s.code = 'MAT101' AND g.cycle_id = 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55';

INSERT INTO schedules (group_id, day_of_week, start_time, end_time)
SELECT g.id, 'wednesday', '07:00', '09:00'
FROM subject_groups g JOIN subjects s ON g.subject_id = s.id
WHERE s.code = 'MAT101' AND g.cycle_id = 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55';

-- INF101: Martes y Jueves 9:00-11:00 (Lab-1)
INSERT INTO schedules (group_id, day_of_week, start_time, end_time)
SELECT g.id, 'tuesday', '09:00', '11:00'
FROM subject_groups g JOIN subjects s ON g.subject_id = s.id
WHERE s.code = 'INF101' AND g.cycle_id = 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55';

INSERT INTO schedules (group_id, day_of_week, start_time, end_time)
SELECT g.id, 'thursday', '09:00', '11:00'
FROM subject_groups g JOIN subjects s ON g.subject_id = s.id
WHERE s.code = 'INF101' AND g.cycle_id = 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55';

-- FIS101: Lunes y Miercoles 11:00-13:00 (Aula 201)
INSERT INTO schedules (group_id, day_of_week, start_time, end_time)
SELECT g.id, 'monday', '11:00', '13:00'
FROM subject_groups g JOIN subjects s ON g.subject_id = s.id
WHERE s.code = 'FIS101' AND g.cycle_id = 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55';

INSERT INTO schedules (group_id, day_of_week, start_time, end_time)
SELECT g.id, 'wednesday', '11:00', '13:00'
FROM subject_groups g JOIN subjects s ON g.subject_id = s.id
WHERE s.code = 'FIS101' AND g.cycle_id = 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55';

-- ING101: Viernes 7:00-10:00 (Aula 101)
INSERT INTO schedules (group_id, day_of_week, start_time, end_time)
SELECT g.id, 'friday', '07:00', '10:00'
FROM subject_groups g JOIN subjects s ON g.subject_id = s.id
WHERE s.code = 'ING101' AND g.cycle_id = 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55';

-- MAT102: Martes y Jueves 7:00-9:00 (Aula 101)
INSERT INTO schedules (group_id, day_of_week, start_time, end_time)
SELECT g.id, 'tuesday', '07:00', '09:00'
FROM subject_groups g JOIN subjects s ON g.subject_id = s.id
WHERE s.code = 'MAT102' AND g.cycle_id = 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55';

INSERT INTO schedules (group_id, day_of_week, start_time, end_time)
SELECT g.id, 'thursday', '07:00', '09:00'
FROM subject_groups g JOIN subjects s ON g.subject_id = s.id
WHERE s.code = 'MAT102' AND g.cycle_id = 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55';

-- INF102: Lunes y Miercoles 14:00-16:00 (Lab-2)
INSERT INTO schedules (group_id, day_of_week, start_time, end_time)
SELECT g.id, 'monday', '14:00', '16:00'
FROM subject_groups g JOIN subjects s ON g.subject_id = s.id
WHERE s.code = 'INF102' AND g.cycle_id = 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55';

INSERT INTO schedules (group_id, day_of_week, start_time, end_time)
SELECT g.id, 'wednesday', '14:00', '16:00'
FROM subject_groups g JOIN subjects s ON g.subject_id = s.id
WHERE s.code = 'INF102' AND g.cycle_id = 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55';

-- INF201: Martes y Jueves 14:00-16:00 (Aula 201)
INSERT INTO schedules (group_id, day_of_week, start_time, end_time)
SELECT g.id, 'tuesday', '14:00', '16:00'
FROM subject_groups g JOIN subjects s ON g.subject_id = s.id
WHERE s.code = 'INF201' AND g.cycle_id = 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55';

INSERT INTO schedules (group_id, day_of_week, start_time, end_time)
SELECT g.id, 'thursday', '14:00', '16:00'
FROM subject_groups g JOIN subjects s ON g.subject_id = s.id
WHERE s.code = 'INF201' AND g.cycle_id = 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55';