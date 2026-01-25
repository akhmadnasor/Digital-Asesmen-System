-- 1. Tabel Users
CREATE TABLE users (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT NOT NULL,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('SUPER_ADMIN', 'ADMIN', 'STUDENT')),
    grade INTEGER,
    nisn TEXT,
    school TEXT,
    gender TEXT,
    birth_date TEXT,
    is_locked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Tabel Exams
CREATE TABLE exams (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    title TEXT NOT NULL,
    subject TEXT NOT NULL,
    education_level TEXT NOT NULL,
    duration_minutes INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    token TEXT NOT NULL,
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. Tabel Questions
CREATE TABLE questions (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    exam_id TEXT REFERENCES exams(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    text TEXT NOT NULL,
    img_url TEXT,
    options JSONB, -- Array of strings
    correct_index INTEGER,
    correct_indices JSONB, -- Array of integers
    points INTEGER DEFAULT 10,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 4. Tabel Exam Results
CREATE TABLE exam_results (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    student_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    student_name TEXT NOT NULL,
    exam_id TEXT REFERENCES exams(id) ON DELETE SET NULL,
    exam_title TEXT NOT NULL,
    score INTEGER NOT NULL,
    total_questions INTEGER NOT NULL,
    cheating_attempts INTEGER DEFAULT 0,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 5. Tabel App Settings
CREATE TABLE app_settings (
    id SERIAL PRIMARY KEY,
    app_name TEXT DEFAULT 'UJI TKA MANDIRI',
    school_logo_url TEXT,
    logo_style TEXT DEFAULT 'circle',
    theme_color TEXT DEFAULT '#2459a9',
    gradient_end_color TEXT DEFAULT '#60a5fa',
    anti_cheat JSONB DEFAULT '{"isActive": true, "freezeDurationSeconds": 15, "alertText": "Dilarang curang!", "enableSound": true}'::jsonb
);

-- SEED DATA: Super Admin Default
INSERT INTO users (id, name, username, password, role, school)
VALUES (
    'admin-init-001', 
    'Super Admin', 
    'superadmin', 
    'admin', 
    'SUPER_ADMIN', 
    'PUSAT'
);

-- SEED DATA: App Settings Default
INSERT INTO app_settings (app_name, school_logo_url, theme_color, gradient_end_color)
VALUES (
    'UJI TKA MANDIRI', 
    'https://lh3.googleusercontent.com/d/1UXDrhKgeSjfFks_oXIMOVYgxFG_Bh1nm', 
    '#2459a9', 
    '#60a5fa'
);

-- Enable Row Level Security (RLS) is recommended but kept off for simplicity in this specific request scope
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE exam_results ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;