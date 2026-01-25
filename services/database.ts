import { supabase } from './supabaseClient';
import { User, Exam, ExamResult, AppSettings, Question } from '../types';

// Default Fallback Settings if DB is empty/error
const DEFAULT_SETTINGS: AppSettings = {
  appName: 'UJI TKA MANDIRI',
  themeColor: '#2459a9',
  gradientEndColor: '#60a5fa',
  logoStyle: 'circle',
  schoolLogoUrl: 'https://lh3.googleusercontent.com/d/1UXDrhKgeSjfFks_oXIMOVYgxFG_Bh1nm',
  antiCheat: {
    isActive: true,
    freezeDurationSeconds: 15,
    alertText: 'PERINGATAN! Dilarang berpindah aplikasi.',
    enableSound: true
  }
};

export const db = {
  getSettings: async (): Promise<AppSettings> => {
    const { data, error } = await supabase
      .from('app_settings')
      .select('*')
      .limit(1)
      .maybeSingle();

    if (error || !data) {
        return DEFAULT_SETTINGS;
    }

    return {
        appName: data.app_name,
        schoolLogoUrl: data.school_logo_url,
        logoStyle: data.logo_style as any,
        themeColor: data.theme_color,
        gradientEndColor: data.gradient_end_color,
        antiCheat: data.anti_cheat
    };
  },

  updateSettings: async (newSettings: Partial<AppSettings>): Promise<void> => {
    const { data } = await supabase.from('app_settings').select('id').limit(1);
    
    const dbPayload: any = {};
    if (newSettings.appName) dbPayload.app_name = newSettings.appName;
    if (newSettings.schoolLogoUrl) dbPayload.school_logo_url = newSettings.schoolLogoUrl;
    if (newSettings.logoStyle) dbPayload.logo_style = newSettings.logoStyle;
    if (newSettings.themeColor) dbPayload.theme_color = newSettings.themeColor;
    if (newSettings.gradientEndColor) dbPayload.gradient_end_color = newSettings.gradientEndColor;
    if (newSettings.antiCheat) dbPayload.anti_cheat = newSettings.antiCheat;

    if (!data || data.length === 0) {
        await supabase.from('app_settings').insert(dbPayload);
    } else {
        await supabase.from('app_settings').update(dbPayload).eq('id', data[0].id);
    }
  },

  login: async (input: string, password?: string): Promise<User | undefined> => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .or(`username.eq.${input},nisn.eq.${input}`)
      .single();

    if (error || !data) return undefined;

    // Check Password
    if (data.password !== password) {
        return undefined;
    }
    
    // Check if account is locked
    if (data.is_locked) {
        alert("Akun Anda sedang terkunci. Hubungi pengawas.");
        return undefined;
    }

    return {
        id: data.id,
        name: data.name,
        username: data.username,
        role: data.role,
        grade: data.grade,
        nisn: data.nisn,
        school: data.school,
        gender: data.gender,
        birthDate: data.birth_date,
        isLocked: data.is_locked,
        password: data.password // Return password for verification/display in admin panel
    };
  },

  getExams: async (level?: 'SD' | 'SMP'): Promise<Exam[]> => {
    let query = supabase.from('exams').select('*, questions(*)');
    
    if (level) {
        query = query.eq('education_level', level);
    }
    
    // Order by created_at descending
    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
        console.error("Error fetching exams:", error);
        return [];
    }

    return data.map((e: any) => ({
        id: e.id,
        title: e.title,
        subject: e.subject,
        educationLevel: e.education_level,
        durationMinutes: e.duration_minutes,
        isActive: e.is_active,
        token: e.token,
        startDate: e.start_date,
        endDate: e.end_date,
        questions: e.questions ? e.questions.map((q: any) => ({
            id: q.id,
            type: q.type,
            text: q.text,
            imgUrl: q.img_url,
            options: q.options,
            correctIndex: q.correct_index,
            correctIndices: q.correct_indices,
            points: q.points
        })) : []
    }));
  },

  updateExamToken: async (examId: string, newToken: string): Promise<void> => {
    await supabase.from('exams').update({ token: newToken }).eq('id', examId);
  },

  updateExamSchedule: async (examId: string, token: string, durationMinutes: number, startDate: string, endDate: string): Promise<void> => {
    await supabase.from('exams').update({ 
      token: token,
      duration_minutes: durationMinutes,
      start_date: startDate,
      end_date: endDate 
    }).eq('id', examId);
  },

  createExam: async (exam: Exam): Promise<void> => {
    // 1. Insert Exam
    const examPayload = {
        title: exam.title,
        subject: exam.subject,
        education_level: exam.educationLevel,
        duration_minutes: exam.durationMinutes,
        is_active: exam.isActive,
        token: exam.token,
        start_date: exam.startDate,
        end_date: exam.endDate
    };
    
    const { data: newExam, error: examError } = await supabase.from('exams').insert(examPayload).select().single();
    
    if (examError || !newExam) {
        console.error("Error creating exam", examError);
        return;
    }

    // 2. Insert Questions if any
    if (exam.questions.length > 0) {
        await db.addQuestions(newExam.id, exam.questions);
    }
  },

  addQuestions: async (examId: string, questions: Question[]): Promise<void> => {
      const questionsPayload = questions.map(q => ({
            exam_id: examId,
            type: q.type,
            text: q.text,
            img_url: q.imgUrl,
            options: q.options,
            correct_index: q.correctIndex,
            correct_indices: q.correctIndices,
            points: q.points
      }));
      
      const { error } = await supabase.from('questions').insert(questionsPayload);
      if (error) console.error("Error adding questions", error);
  },

  submitResult: async (result: ExamResult): Promise<void> => {
    const payload = {
        student_id: result.studentId,
        student_name: result.studentName,
        exam_id: result.examId,
        exam_title: result.examTitle,
        score: result.score,
        total_questions: result.totalQuestions,
        cheating_attempts: result.cheatingAttempts,
        submitted_at: result.submittedAt
    };
    await supabase.from('exam_results').insert(payload);
  },

  getAllResults: async (): Promise<ExamResult[]> => {
    const { data } = await supabase.from('exam_results').select('*').order('submitted_at', { ascending: false });
    if (!data) return [];
    
    return data.map((r: any) => ({
        id: r.id,
        studentId: r.student_id,
        studentName: r.student_name,
        examId: r.exam_id,
        examTitle: r.exam_title,
        score: r.score,
        totalQuestions: r.total_questions,
        cheatingAttempts: r.cheating_attempts,
        submittedAt: r.submitted_at
    }));
  },

  getUsers: async (): Promise<User[]> => {
    const { data } = await supabase.from('users').select('*').order('created_at', { ascending: false });
    if (!data) return [];

    return data.map((u: any) => ({
        id: u.id,
        name: u.name,
        username: u.username,
        role: u.role,
        grade: u.grade,
        nisn: u.nisn,
        school: u.school,
        gender: u.gender,
        birthDate: u.birth_date,
        isLocked: u.is_locked,
        password: u.password
    }));
  },
  
  addUser: async (user: User): Promise<void> => {
    let defaultPassword = '12345';
    if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
        defaultPassword = 'admin'; 
    }

    const payload = {
        name: user.name,
        username: user.username,
        password: defaultPassword,
        role: user.role,
        grade: user.grade,
        nisn: user.nisn,
        school: user.school || 'UMUM',
        gender: user.gender,
        birth_date: user.birthDate,
        is_locked: false
    };
    await supabase.from('users').insert(payload);
  },

  deleteUser: async (id: string): Promise<void> => {
    await supabase.from('users').delete().eq('id', id);
  },

  resetUserStatus: async (userId: string): Promise<void> => {
    await supabase.from('users').update({ is_locked: false }).eq('id', userId);
  },

  resetUserPassword: async (userId: string): Promise<void> => {
    await supabase.from('users').update({ password: '12345' }).eq('id', userId);
  }
};