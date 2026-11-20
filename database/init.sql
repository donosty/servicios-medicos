BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS medical_specialties (
    specialty_id SMALLSERIAL PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL,
    icon_path TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    display_order SMALLINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT medical_specialties_name_not_blank CHECK (btrim(name) <> ''),
    CONSTRAINT medical_specialties_slug_format CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

CREATE TABLE IF NOT EXISTS doctors (
    doctor_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    professional_title TEXT NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    description TEXT NOT NULL,
    image_path TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT doctors_title_not_blank CHECK (btrim(professional_title) <> ''),
    CONSTRAINT doctors_first_name_not_blank CHECK (btrim(first_name) <> ''),
    CONSTRAINT doctors_last_name_not_blank CHECK (btrim(last_name) <> '')
);

CREATE UNIQUE INDEX IF NOT EXISTS doctors_full_name_unique
    ON doctors (professional_title, first_name, last_name);

CREATE TABLE IF NOT EXISTS doctor_specialties (
    doctor_id UUID NOT NULL,
    specialty_id SMALLINT NOT NULL,
    PRIMARY KEY (doctor_id, specialty_id),
    CONSTRAINT doctor_specialties_doctor_fk
        FOREIGN KEY (doctor_id) REFERENCES doctors (doctor_id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT doctor_specialties_specialty_fk
        FOREIGN KEY (specialty_id) REFERENCES medical_specialties (specialty_id)
        ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS doctor_availability_slots (
    slot_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doctor_id UUID NOT NULL,
    day_of_week SMALLINT NOT NULL,
    start_time TIME NOT NULL,
    duration_minutes SMALLINT NOT NULL DEFAULT 30,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT doctor_availability_slots_doctor_fk
        FOREIGN KEY (doctor_id) REFERENCES doctors (doctor_id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT doctor_availability_slots_day_check
        CHECK (day_of_week BETWEEN 0 AND 6),
    CONSTRAINT doctor_availability_slots_duration_check
        CHECK (duration_minutes BETWEEN 15 AND 240)
);

CREATE UNIQUE INDEX IF NOT EXISTS doctor_availability_slots_unique
    ON doctor_availability_slots (doctor_id, day_of_week, start_time);

CREATE TABLE IF NOT EXISTS patients (
    patient_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT patients_full_name_not_blank CHECK (btrim(full_name) <> ''),
    CONSTRAINT patients_phone_not_blank CHECK (btrim(phone) <> ''),
    CONSTRAINT patients_email_format
        CHECK (email ~* '^[A-Za-z0-9.!#$%&''*+/=?^_`{|}~-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*$')
);

CREATE UNIQUE INDEX IF NOT EXISTS patients_email_unique
    ON patients (lower(email));

CREATE TABLE IF NOT EXISTS appointment_statuses (
    status_id SMALLSERIAL PRIMARY KEY,
    status_code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    CONSTRAINT appointment_statuses_code_format
        CHECK (status_code ~ '^[a-z_]+$')
);

CREATE TABLE IF NOT EXISTS appointments (
    appointment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    folio TEXT NOT NULL UNIQUE,
    patient_id UUID NOT NULL,
    doctor_id UUID NOT NULL,
    specialty_id SMALLINT NOT NULL,
    start_at TIMESTAMPTZ NOT NULL,
    end_at TIMESTAMPTZ NOT NULL,
    status_id SMALLINT NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT appointments_patient_fk
        FOREIGN KEY (patient_id) REFERENCES patients (patient_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT appointments_doctor_specialty_fk
        FOREIGN KEY (doctor_id, specialty_id) REFERENCES doctor_specialties (doctor_id, specialty_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT appointments_status_fk
        FOREIGN KEY (status_id) REFERENCES appointment_statuses (status_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT appointments_time_order CHECK (end_at > start_at)
);

CREATE TABLE IF NOT EXISTS appointment_registrations (
    registration_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id UUID NOT NULL UNIQUE,
    folio TEXT NOT NULL UNIQUE,
    specialty_name TEXT NOT NULL,
    doctor_name TEXT NOT NULL,
    patient_name TEXT NOT NULL,
    patient_phone TEXT NOT NULL,
    patient_email TEXT NOT NULL,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT appointment_registrations_appointment_fk
        FOREIGN KEY (appointment_id) REFERENCES appointments (appointment_id)
        ON UPDATE CASCADE ON DELETE CASCADE
);

ALTER TABLE appointments
    ADD COLUMN IF NOT EXISTS folio TEXT;

UPDATE appointments
SET folio = 'MED-' || to_char(created_at, 'YYYYMMDD') || '-' ||
            upper(substr(replace(appointment_id::text, '-', ''), 1, 8))
WHERE folio IS NULL;

ALTER TABLE appointments
    ALTER COLUMN folio SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS appointments_folio_unique
    ON appointments (folio);

CREATE UNIQUE INDEX IF NOT EXISTS appointments_doctor_start_unique
    ON appointments (doctor_id, start_at)
    WHERE status_id != 4;

CREATE INDEX IF NOT EXISTS appointments_patient_idx
    ON appointments (patient_id, start_at DESC);

CREATE INDEX IF NOT EXISTS appointments_status_idx
    ON appointments (status_id, start_at);

CREATE TABLE IF NOT EXISTS care_benefits (
    benefit_id SMALLSERIAL PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL,
    icon_path TEXT,
    display_order SMALLINT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS patient_testimonials (
    testimonial_id SMALLSERIAL PRIMARY KEY,
    patient_name TEXT NOT NULL,
    comment TEXT NOT NULL,
    portrait_path TEXT,
    initials TEXT,
    rating SMALLINT NOT NULL DEFAULT 5,
    display_order SMALLINT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT patient_testimonials_rating_check
        CHECK (rating BETWEEN 1 AND 5),
    CONSTRAINT patient_testimonials_name_not_blank CHECK (btrim(patient_name) <> '')
);

CREATE UNIQUE INDEX IF NOT EXISTS patient_testimonials_name_unique
    ON patient_testimonials (patient_name);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS doctors_set_updated_at ON doctors;
CREATE TRIGGER doctors_set_updated_at
BEFORE UPDATE ON doctors
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS patients_set_updated_at ON patients;
CREATE TRIGGER patients_set_updated_at
BEFORE UPDATE ON patients
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS appointments_set_updated_at ON appointments;
CREATE TRIGGER appointments_set_updated_at
BEFORE UPDATE ON appointments
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

INSERT INTO medical_specialties (slug, name, description, icon_path, display_order)
VALUES
    ('neurologia', 'Neurología', 'Diagnóstico y atención integral de trastornos del sistema nervioso.', '/assets/icons/neurologia.webp', 1),
    ('traumatologia', 'Traumatología', 'Atención especializada de lesiones traumáticas y del sistema musculoesquelético.', '/assets/icons/traumatologia.webp', 2),
    ('ortopedia', 'Ortopedia', 'Tratamiento de huesos, articulaciones y problemas de movimiento.', '/assets/icons/ortopedia.webp', 3),
    ('cardiologia', 'Cardiología', 'Prevención, diagnóstico y cuidado integral de tu corazón.', '/assets/icons/cardiologia.webp', 4),
    ('pediatria', 'Pediatría', 'Cuidamos la salud y el desarrollo de niñas y niños.', '/assets/icons/pediatria.webp', 5),
    ('nutricion', 'Nutrición', 'Acompañamiento personalizado para una alimentación saludable.', '/assets/icons/nutricion.webp', 6),
    ('cirugia-maxilofacial', 'Cirugía Maxilofacial', 'Atención quirúrgica de boca, cara, mandíbula y estructuras relacionadas.', '/assets/icons/cirugia-maxilofacial.webp', 7),
    ('cirugia-plastica', 'Cirugía Plástica', 'Procedimientos reconstructivos y estéticos con atención especializada.', '/assets/icons/cirugia-plastica.webp', 8),
    ('psiquiatria', 'Psiquiatría', 'Evaluación y tratamiento especializado de la salud mental.', '/assets/icons/psiquiatria.webp', 9)
ON CONFLICT (slug) DO UPDATE
SET name = EXCLUDED.name,
    description = EXCLUDED.description,
    icon_path = EXCLUDED.icon_path,
    display_order = EXCLUDED.display_order;

UPDATE medical_specialties
SET is_active = (slug IN (
    'neurologia',
    'traumatologia',
    'ortopedia',
    'cardiologia',
    'pediatria',
    'nutricion',
    'cirugia-maxilofacial',
    'cirugia-plastica',
    'psiquiatria'
));

INSERT INTO doctors (doctor_id, professional_title, first_name, last_name, description, image_path)
VALUES
    ('1f2b7e21-72dc-4f0d-b27a-8a4a1f4c6e10', 'Dr.', 'Daniel', 'Vega',
     'Especialista en diagnóstico y tratamiento neurológico.', '/assets/photo 2.jpg'),
    ('2f5e3e32-83ed-4a1e-c38b-9b5b2f5d7f21', 'Dra.', 'Laura', 'Morales',
     'Especialista en lesiones traumáticas y recuperación funcional.', '/assets/photo 3.jpg'),
    ('3f6a4f43-94fe-5b2f-d49c-ac6c3f6e8f32', 'Dr.', 'Ricardo', 'Navarro',
     'Especialista en traumatología y salud de las articulaciones.', '/assets/photo 4.jpg'),
    ('4d170f18-a7d8-4c73-bc8d-6a51ec8f7ed7', 'Dr.', 'Carlos', 'Ramírez',
     'Cardiólogo. Prevención y cuidado integral de tu corazón.', '/assets/photo 5.jpg'),
    ('6baf45e3-9a30-4d90-9ec3-5b9bd8d4fb41', 'Dra.', 'Sofía', 'Martínez',
     'Pediatra. Especialista en atención integral infantil.', '/assets/photo 2.jpg'),
    ('5f7b5f54-a50f-6c30-e5ad-bd7d4f7f9f43', 'Lic.', 'Mariana', 'Cruz',
     'Nutrióloga clínica con atención personalizada.', '/assets/photo 3.jpg'),
    ('6f8c6f65-b610-7d41-f6be-ce8e5f8fa054', 'Dr.', 'Alejandro', 'Ibarra',
     'Especialista en cirugía oral y cirugía maxilofacial.', '/assets/photo 4.jpg'),
    ('7f9d7f76-c721-8e52-f7cf-df9f6f9fb165', 'Dra.', 'Valeria', 'Santos',
     'Especialista en cirugía reconstructiva y plástica.', '/assets/photo 5.jpg'),
    ('8fac8077-d832-9f63-f8df-ffaf718fc276', 'Dr.', 'Andrés', 'Herrera',
     'Psiquiatra enfocado en atención integral de la salud mental.', '/assets/photo 2.jpg')
ON CONFLICT (doctor_id) DO UPDATE
SET professional_title = EXCLUDED.professional_title,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    description = EXCLUDED.description,
    image_path = EXCLUDED.image_path;

UPDATE doctors
SET is_active = FALSE
WHERE doctor_id NOT IN (
    '1f2b7e21-72dc-4f0d-b27a-8a4a1f4c6e10',
    '2f5e3e32-83ed-4a1e-c38b-9b5b2f5d7f21',
    '3f6a4f43-94fe-5b2f-d49c-ac6c3f6e8f32',
    '4d170f18-a7d8-4c73-bc8d-6a51ec8f7ed7',
    '6baf45e3-9a30-4d90-9ec3-5b9bd8d4fb41',
    '5f7b5f54-a50f-6c30-e5ad-bd7d4f7f9f43',
    '6f8c6f65-b610-7d41-f6be-ce8e5f8fa054',
    '7f9d7f76-c721-8e52-f7cf-df9f6f9fb165',
    '8fac8077-d832-9f63-f8df-ffaf718fc276'
);

INSERT INTO doctor_specialties (doctor_id, specialty_id)
SELECT doctor_id, specialty_id
FROM (
    VALUES
        ('1f2b7e21-72dc-4f0d-b27a-8a4a1f4c6e10'::uuid, 'neurologia'),
        ('2f5e3e32-83ed-4a1e-c38b-9b5b2f5d7f21'::uuid, 'traumatologia'),
        ('3f6a4f43-94fe-5b2f-d49c-ac6c3f6e8f32'::uuid, 'ortopedia'),
        ('4d170f18-a7d8-4c73-bc8d-6a51ec8f7ed7'::uuid, 'cardiologia'),
        ('6baf45e3-9a30-4d90-9ec3-5b9bd8d4fb41'::uuid, 'pediatria'),
        ('5f7b5f54-a50f-6c30-e5ad-bd7d4f7f9f43'::uuid, 'nutricion'),
        ('6f8c6f65-b610-7d41-f6be-ce8e5f8fa054'::uuid, 'cirugia-maxilofacial'),
        ('7f9d7f76-c721-8e52-f7cf-df9f6f9fb165'::uuid, 'cirugia-plastica'),
        ('8fac8077-d832-9f63-f8df-ffaf718fc276'::uuid, 'psiquiatria')
) AS assignments (doctor_id, specialty_slug)
JOIN medical_specialties ON specialty_slug = slug
ON CONFLICT (doctor_id, specialty_id) DO NOTHING;

INSERT INTO appointment_statuses (status_code, name)
VALUES
    ('pending', 'Pendiente'),
    ('confirmed', 'Confirmada'),
    ('completed', 'Completada'),
    ('cancelled', 'Cancelada'),
    ('no_show', 'No asistió')
ON CONFLICT (status_code) DO UPDATE
SET name = EXCLUDED.name;

INSERT INTO doctor_availability_slots (doctor_id, day_of_week, start_time, duration_minutes)
SELECT d.doctor_id,
       weekday,
       slot_time::time,
       30
FROM doctors d
CROSS JOIN generate_series(1, 6) AS weekday
CROSS JOIN (VALUES
    ('08:00:00'),
    ('09:30:00'),
    ('11:00:00'),
    ('12:30:00'),
    ('16:00:00'),
    ('17:30:00'),
    ('18:30:00'),
    ('19:30:00')
) AS schedule(slot_time)
ON CONFLICT (doctor_id, day_of_week, start_time) DO NOTHING;

INSERT INTO care_benefits (slug, name, description, icon_path, display_order)
VALUES
    ('profesionales', 'Profesionales calificados', 'Un equipo de especialistas dedicado a tu salud.', '/assets/icons/profesionales.webp', 1),
    ('tecnologia', 'Tecnología de vanguardia', 'Herramientas que apoyan a tu médico en cada consulta.', '/assets/icons/tecnologia.webp', 2),
    ('atencion', 'Atención personalizada', 'Escuchamos tus inquietudes y dedicamos tiempo a tus preguntas.', '/assets/icons/atencion.webp', 3),
    ('servicio', 'Servicio accesible', 'Información clara para encontrar la atención que buscas.', '/assets/icons/servicio.webp', 4)
ON CONFLICT (slug) DO UPDATE
SET name = EXCLUDED.name,
    description = EXCLUDED.description,
    icon_path = EXCLUDED.icon_path,
    display_order = EXCLUDED.display_order;

INSERT INTO patient_testimonials (patient_name, comment, portrait_path, initials, rating, display_order)
VALUES
    ('Mariana López', 'La pediatra escuchó todas mis preguntas. Mi hija se sintió en confianza desde el primer momento.', '/assets/testimonio-1.webp', NULL, 5, 1),
    ('Elena Ruiz', 'Me explicaron cada paso de mi consulta con calma. Agradecí mucho ese trato tan cercano.', '/assets/testimonio-2.webp', NULL, 5, 2),
    ('Diego Torres', 'Encontré la especialidad que buscaba y desde recepción me orientaron con mucha amabilidad.', '/assets/testimonio-3.webp', NULL, 5, 3),
    ('Ana Vega', 'Pude acompañar a mi mamá a su consulta. El equipo nos dedicó tiempo para resolver nuestras dudas.', NULL, 'AV', 5, 4)
ON CONFLICT (patient_name) DO UPDATE
SET comment = EXCLUDED.comment,
    portrait_path = EXCLUDED.portrait_path,
    initials = EXCLUDED.initials,
    rating = EXCLUDED.rating,
    display_order = EXCLUDED.display_order;

COMMIT;
