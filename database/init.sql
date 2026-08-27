-- ============================================================
-- BASE DE DATOS: Registro Academico UPAM
-- Universidad Panamericana de El Salvador
-- ============================================================

-- ENUMS
CREATE TYPE user_role AS ENUM ('student', 'administrator', 'collector', 'administrative');
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
-- TABLA: schedules
-- Horarios de las materias por ciclo
-- ============================================================
CREATE TABLE schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    cycle_id UUID NOT NULL REFERENCES cycles(id) ON DELETE CASCADE,
    day_of_week day_of_week NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    classroom VARCHAR(50) NOT NULL,
    capacity INTEGER NOT NULL DEFAULT 40,
    enrolled_count INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_schedules_cycle ON schedules(cycle_id);
CREATE INDEX idx_schedules_subject ON schedules(subject_id);
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

-- ============================================================
-- FUNCION: Validar capacidad al inscribir materia
-- ============================================================
CREATE OR REPLACE FUNCTION check_schedule_capacity()
RETURNS TRIGGER AS $$
BEGIN
    IF (SELECT enrolled_count FROM schedules WHERE id = NEW.schedule_id) >=
       (SELECT capacity FROM schedules WHERE id = NEW.schedule_id) THEN
        RAISE EXCEPTION 'No hay cupos disponibles en este horario';
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER check_capacity_before_enroll
    BEFORE INSERT ON enrollment_subjects
    FOR EACH ROW EXECUTE FUNCTION check_schedule_capacity();

-- ============================================================
-- FUNCION: Actualizar enrolled_count al inscribir/cancelar
-- ============================================================
CREATE OR REPLACE FUNCTION update_enrolled_count_on_insert()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE schedules SET enrolled_count = enrolled_count + 1 WHERE id = NEW.schedule_id;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_increment_enrolled
    AFTER INSERT ON enrollment_subjects
    FOR EACH ROW EXECUTE FUNCTION update_enrolled_count_on_insert();

CREATE OR REPLACE FUNCTION update_enrolled_count_on_cancel()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status != 'cancelled' AND NEW.status = 'cancelled' THEN
        UPDATE schedules SET enrolled_count = enrolled_count - 1 WHERE id = NEW.schedule_id;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_decrement_enrolled
    AFTER UPDATE ON enrollment_subjects
    FOR EACH ROW EXECUTE FUNCTION update_enrolled_count_on_cancel();

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
    sch.day_of_week,
    sch.start_time,
    sch.end_time,
    sch.classroom,
    es.status AS enrollment_status,
    e.enrolled_at
FROM enrollment_subjects es
JOIN enrollments e ON es.enrollment_id = e.id
JOIN students s ON e.student_id = s.id
JOIN users u ON s.user_id = u.id
JOIN cycles c ON e.cycle_id = c.id
JOIN subjects sub ON es.subject_id = sub.id
JOIN schedules sch ON es.schedule_id = sch.id;

-- Vista: Cupos disponibles por materia en un ciclo
CREATE VIEW v_available_seats AS
SELECT
    sch.id AS schedule_id,
    sub.code AS subject_code,
    sub.name AS subject_name,
    c.name AS cycle_name,
    sch.day_of_week,
    sch.start_time,
    sch.end_time,
    sch.classroom,
    sch.capacity,
    sch.enrolled_count,
    (sch.capacity - sch.enrolled_count) AS available_seats
FROM schedules sch
JOIN subjects sub ON sch.subject_id = sub.id
JOIN cycles c ON sch.cycle_id = c.id;

-- ============================================================
-- DATOS INICIALES (Seed)
-- ============================================================

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

-- Ciclo I 2026
INSERT INTO cycles (id, name, year, semester, start_date, end_date, tuition_amount, monthly_amount, monthly_count, is_active, enrollment_open)
VALUES (
    'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55',
    'Ciclo I 2026',
    2026,
    1,
    '2026-01-15',
    '2026-05-30',
    150.00,
    120.00,
    4,
    TRUE,
    TRUE
);

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

-- Horarios - Ciclo I 2026
-- MAT101: Lunes y Miercoles 7:00-9:00
INSERT INTO schedules (subject_id, cycle_id, day_of_week, start_time, end_time, classroom, capacity, enrolled_count)
SELECT s.id, 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 'monday', '07:00', '09:00', 'A-101', 40, 0
FROM subjects s WHERE s.code = 'MAT101';

INSERT INTO schedules (subject_id, cycle_id, day_of_week, start_time, end_time, classroom, capacity, enrolled_count)
SELECT s.id, 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 'wednesday', '07:00', '09:00', 'A-101', 40, 0
FROM subjects s WHERE s.code = 'MAT101';

-- INF101: Martes y Jueves 9:00-11:00
INSERT INTO schedules (subject_id, cycle_id, day_of_week, start_time, end_time, classroom, capacity, enrolled_count)
SELECT s.id, 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 'tuesday', '09:00', '11:00', 'Lab-1', 35, 0
FROM subjects s WHERE s.code = 'INF101';

INSERT INTO schedules (subject_id, cycle_id, day_of_week, start_time, end_time, classroom, capacity, enrolled_count)
SELECT s.id, 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 'thursday', '09:00', '11:00', 'Lab-1', 35, 0
FROM subjects s WHERE s.code = 'INF101';

-- FIS101: Lunes y Miercoles 11:00-13:00
INSERT INTO schedules (subject_id, cycle_id, day_of_week, start_time, end_time, classroom, capacity, enrolled_count)
SELECT s.id, 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 'monday', '11:00', '13:00', 'A-201', 40, 0
FROM subjects s WHERE s.code = 'FIS101';

INSERT INTO schedules (subject_id, cycle_id, day_of_week, start_time, end_time, classroom, capacity, enrolled_count)
SELECT s.id, 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 'wednesday', '11:00', '13:00', 'A-201', 40, 0
FROM subjects s WHERE s.code = 'FIS101';

-- ING101: Viernes 7:00-10:00
INSERT INTO schedules (subject_id, cycle_id, day_of_week, start_time, end_time, classroom, capacity, enrolled_count)
SELECT s.id, 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 'friday', '07:00', '10:00', 'A-301', 30, 0
FROM subjects s WHERE s.code = 'ING101';

-- MAT102: Martes y Jueves 7:00-9:00
INSERT INTO schedules (subject_id, cycle_id, day_of_week, start_time, end_time, classroom, capacity, enrolled_count)
SELECT s.id, 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 'tuesday', '07:00', '09:00', 'A-102', 40, 0
FROM subjects s WHERE s.code = 'MAT102';

INSERT INTO schedules (subject_id, cycle_id, day_of_week, start_time, end_time, classroom, capacity, enrolled_count)
SELECT s.id, 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 'thursday', '07:00', '09:00', 'A-102', 40, 0
FROM subjects s WHERE s.code = 'MAT102';

-- INF102: Lunes y Miercoles 14:00-16:00
INSERT INTO schedules (subject_id, cycle_id, day_of_week, start_time, end_time, classroom, capacity, enrolled_count)
SELECT s.id, 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 'monday', '14:00', '16:00', 'Lab-2', 35, 0
FROM subjects s WHERE s.code = 'INF102';

INSERT INTO schedules (subject_id, cycle_id, day_of_week, start_time, end_time, classroom, capacity, enrolled_count)
SELECT s.id, 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 'wednesday', '14:00', '16:00', 'Lab-2', 35, 0
FROM subjects s WHERE s.code = 'INF102';

-- INF201: Martes y Jueves 14:00-16:00
INSERT INTO schedules (subject_id, cycle_id, day_of_week, start_time, end_time, classroom, capacity, enrolled_count)
SELECT s.id, 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 'tuesday', '14:00', '16:00', 'Lab-3', 30, 0
FROM subjects s WHERE s.code = 'INF201';

INSERT INTO schedules (subject_id, cycle_id, day_of_week, start_time, end_time, classroom, capacity, enrolled_count)
SELECT s.id, 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 'thursday', '14:00', '16:00', 'Lab-3', 30, 0
FROM subjects s WHERE s.code = 'INF201';
