
export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  STUDENT = 'STUDENT'
}

export interface User {
  id: string;
  name: string;
  username: string;
  role: UserRole;
  grade?: number; // 1-6 for SD, 7-9 for SMP
  nisn?: string;
  school?: string; // New field for School Origin
  gender?: 'Laki-laki' | 'Perempuan';
  birthDate?: string;
  isLocked?: boolean; 
}

export type QuestionType = 'PG' | 'PG_KOMPLEKS' | 'CHECKLIST' | 'URAIAN';

export interface Question {
  id: string;
  type: QuestionType;
  text: string;
  imgUrl?: string; 
  options?: string[]; 
  correctIndex?: number; 
  correctIndices?: number[]; 
  points: number;
}

export interface Exam {
  id: string;
  title: string;
  subject: string; 
  educationLevel: 'SD' | 'SMP';
  durationMinutes: number;
  questions: Question[];
  isActive: boolean;
  token: string;
  startDate?: string; // ISO String
  endDate?: string;   // ISO String
}

export interface ExamResult {
  id: string;
  studentId: string;
  studentName: string;
  examId: string;
  examTitle: string;
  score: number;
  totalQuestions: number;
  cheatingAttempts: number;
  submittedAt: string;
}

export interface AntiCheatConfig {
  isActive: boolean;
  freezeDurationSeconds: number;
  alertText: string;
  enableSound: boolean;
}

export interface AppSettings {
  appName: string;
  schoolLogoUrl?: string;
  logoStyle: 'circle' | 'rect_4_3' | 'rect_3_4_vert'; // Added 3:4 Vertical
  themeColor: string; 
  gradientEndColor: string; 
  antiCheat: AntiCheatConfig; 
}

export interface AppState {
  currentUser: User | null;
  currentView: 'LOGIN' | 'STUDENT_FLOW' | 'ADMIN' | 'SUPER_ADMIN';
  activeExam: Exam | null;
}
