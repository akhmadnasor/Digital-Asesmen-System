-- Reset Schema (Hati-hati: Menghapus data lama)
DROP TABLE IF EXISTS results CASCADE;
DROP TABLE IF EXISTS questions CASCADE;
DROP TABLE IF EXISTS subjects CASCADE;
DROP TABLE IF EXISTS students CASCADE;

-- 1. Tabel Siswa (students)
CREATE TABLE students (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nisn TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  school TEXT NOT NULL,
  password TEXT DEFAULT '12345',
  is_login BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'idle', -- 'idle', 'working', 'finished', 'blocked'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Tabel Mata Pelajaran / Ujian (subjects)
CREATE TABLE subjects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  duration INT NOT NULL, -- dalam menit
  question_count INT DEFAULT 0,
  token TEXT NOT NULL,
  exam_date DATE, -- Tanggal Ujian
  session TEXT, -- Sesi Ujian (Sesi 1, Sesi 2, dll)
  school_access JSONB DEFAULT '[]'::jsonb, -- Array nama sekolah yang boleh akses
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. Tabel Soal (questions)
create table public.questions (
  id uuid not null default gen_random_uuid (),
  subject_id uuid null,
  "Nomor" text not null,
  "Tipe Soal" text null,
  "Jenis Soal" text null,
  "Soal" text null,
  "Opsi A" text null,
  "Opsi B" text null,
  "Opsi C" text null,
  "Opsi D" text null,
  "Kunci" text null,
  "Bobot" text null,
  "Created_at" timestamp without time zone null,
  "Url Gambar" text not null,
  constraint questions_subject_id_fkey foreign KEY (subject_id) references subjects (id) on delete CASCADE
) TABLESPACE pg_default;

-- 4. Tabel Hasil Ujian (results)
CREATE TABLE results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES students(id),
  subject_id UUID REFERENCES subjects(id),
  score NUMERIC NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 5. Seed Data Mata Pelajaran
INSERT INTO subjects (name, duration, question_count, token, exam_date, session, school_access) VALUES 
('Simulasi', 30, 0, 'SIMUL1', NOW(), 'Sesi 1', '[]'::jsonb),
('Matematika', 120, 0, 'MATH01', NOW(), 'Sesi 1', '[]'::jsonb),
('Bahasa Indonesia', 120, 0, 'INDO01', NOW(), 'Sesi 1', '[]'::jsonb);

-- 6. Enable Row Level Security (RLS)
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE results ENABLE ROW LEVEL SECURITY;

-- 7. Policy Public (Allow All)
CREATE POLICY "Public Access Students" ON students FOR ALL USING (true);
CREATE POLICY "Public Access Subjects" ON subjects FOR ALL USING (true);
CREATE POLICY "Public Access Questions" ON questions FOR ALL USING (true);
CREATE POLICY "Public Access Results" ON results FOR ALL USING (true);
