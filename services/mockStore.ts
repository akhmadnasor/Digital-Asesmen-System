import { User, UserRole, Exam, ExamResult, AppSettings } from '../types';

// Initial Mock Data
let MOCK_SETTINGS: AppSettings = {
  appName: 'CBT MANDIRI BEJI',
  themeColor: '#2459a9', // Default Pusmendik Blue
  gradientEndColor: '#60a5fa', // Blue-400
  logoStyle: 'circle',
  antiCheat: {
    isActive: true,
    freezeDurationSeconds: 15,
    alertText: 'PERINGATAN! Dilarang berpindah aplikasi atau membuka tab lain.',
    enableSound: true
  }
};

// Simulation of 4 Schools
const SCHOOLS = [
  "SDN 1 BEJI",
  "SDN 2 DEPOK", 
  "SDIT NURUL FIKRI",
  "MI AL-HUDA"
];

let MOCK_USERS: User[] = [
  { id: '1', name: 'Kepala Sekolah', username: 'superadmin', role: UserRole.SUPER_ADMIN, school: 'PUSAT' },
  { id: '2', name: 'Admin Sekolah', username: 'admin', role: UserRole.ADMIN, school: 'PUSAT' },
  // Students from different schools
  { 
    id: '3', 
    name: 'Ahmad Siswa', 
    username: 'siswa1', 
    role: UserRole.STUDENT, 
    grade: 6,
    nisn: '1001',
    school: SCHOOLS[0],
    gender: 'Laki-laki',
    birthDate: '2012-05-15',
    isLocked: false
  },
  { 
    id: '4', 
    name: 'Budi Santoso', 
    username: 'siswa2', 
    role: UserRole.STUDENT, 
    grade: 6,
    nisn: '1002',
    school: SCHOOLS[1],
    gender: 'Laki-laki',
    birthDate: '2012-06-20',
    isLocked: false
  },
  { 
    id: '5', 
    name: 'Siti Aminah', 
    username: 'siswa3', 
    role: UserRole.STUDENT, 
    grade: 6,
    nisn: '1003',
    school: SCHOOLS[2],
    gender: 'Perempuan',
    birthDate: '2012-01-10',
    isLocked: false
  },
  { 
    id: '6', 
    name: 'Rudi Hartono', 
    username: 'siswa4', 
    role: UserRole.STUDENT, 
    grade: 6,
    nisn: '1004',
    school: SCHOOLS[3],
    gender: 'Laki-laki',
    birthDate: '2012-08-17',
    isLocked: false
  },
];

// Current Date for scheduling
const now = new Date();
const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1);
const tomorrow = new Date(now); tomorrow.setDate(now.getDate() + 1);

let MOCK_EXAMS: Exam[] = [
  {
    id: 'ex-sd-mat',
    title: 'Matematika - SD Sederajat',
    subject: 'Matematika',
    educationLevel: 'SD',
    durationMinutes: 15,
    isActive: true,
    token: 'SRSWUA',
    startDate: now.toISOString(), // Ongoing
    endDate: tomorrow.toISOString(),
    questions: [
      { id: 'q1', type: 'PG', text: 'Perhatikan gambar dadu berikut. Jika jumlah titik pada dua sisi berlawanan adalah 7, berapakah titik di sisi bawah?', imgUrl: 'https://cdn-icons-png.flaticon.com/512/565/565654.png', options: ['2', '3', '4', '5'], correctIndex: 3, points: 10 },
      { id: 'q2', type: 'PG_KOMPLEKS', text: 'Manakah dari berikut ini yang merupakan bilangan prima? (Pilih lebih dari satu)', options: ['2', '4', '9', '11', '15'], correctIndices: [0, 3], points: 10 },
      { id: 'q3', type: 'CHECKLIST', text: 'Centang benda yang berbentuk kubus.', options: ['Dadu', 'Bola', 'Kotak Kapur', 'Kaleng Susu'], correctIndices: [0, 2], points: 10 },
      { id: 'q4', type: 'URAIAN', text: 'Jelaskan apa yang dimaksud dengan pecahan senilai!', points: 10 }, 
    ]
  },
  {
    id: 'ex-sd-ind',
    title: 'Bahasa Indonesia - SD Sederajat',
    subject: 'Bahasa Indonesia',
    educationLevel: 'SD',
    durationMinutes: 60,
    isActive: false,
    token: 'INDO01',
    startDate: yesterday.toISOString(), // Finished
    endDate: yesterday.toISOString(),
    questions: [
      { id: 'q1', type: 'PG', text: 'Sinonim dari kata "Indah" adalah...', options: ['Jelek', 'Buruk', 'Cantik', 'Kotor'], correctIndex: 2, points: 10 },
    ]
  },
  {
    id: 'ex-smp-mat',
    title: 'Matematika - SMP Sederajat',
    subject: 'Matematika',
    educationLevel: 'SMP',
    durationMinutes: 90,
    isActive: true,
    token: 'SMP123',
    startDate: tomorrow.toISOString(), // Upcoming
    endDate: new Date(tomorrow.getTime() + 86400000).toISOString(),
    questions: [
      { id: 'q1', type: 'PG', text: 'Akar kuadrat dari 144 adalah...', options: ['10', '11', '12', '13'], correctIndex: 2, points: 10 },
    ]
  }
];

const MOCK_RESULTS: ExamResult[] = [];

// Mimic Async DB Calls
export const mockDb = {
  getSettings: async (): Promise<AppSettings> => {
    return Promise.resolve({ ...MOCK_SETTINGS });
  },

  updateSettings: async (newSettings: Partial<AppSettings>): Promise<void> => {
    MOCK_SETTINGS = { ...MOCK_SETTINGS, ...newSettings };
    return Promise.resolve();
  },

  login: async (input: string): Promise<User | undefined> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const user = MOCK_USERS.find(u => u.username === input || u.nisn === input);
        resolve(user);
      }, 500);
    });
  },

  getExams: async (level?: 'SD' | 'SMP'): Promise<Exam[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        if (level) {
          resolve(MOCK_EXAMS.filter(e => e.isActive && e.educationLevel === level));
        } else {
          resolve(MOCK_EXAMS);
        }
      }, 300);
    });
  },

  updateExamToken: async (examId: string, newToken: string): Promise<void> => {
    const exam = MOCK_EXAMS.find(e => e.id === examId);
    if (exam) exam.token = newToken;
    return Promise.resolve();
  },

  createExam: async (exam: Exam): Promise<void> => {
    MOCK_EXAMS.push(exam);
    return Promise.resolve();
  },

  submitResult: async (result: ExamResult): Promise<void> => {
    MOCK_RESULTS.push(result);
    return Promise.resolve();
  },

  getAllResults: async (): Promise<ExamResult[]> => {
    return Promise.resolve(MOCK_RESULTS);
  },

  getUsers: async (): Promise<User[]> => {
    return Promise.resolve(MOCK_USERS);
  },
  
  addUser: async (user: User): Promise<void> => {
    MOCK_USERS.push(user);
    return Promise.resolve();
  },

  deleteUser: async (id: string): Promise<void> => {
    MOCK_USERS = MOCK_USERS.filter(u => u.id !== id);
    return Promise.resolve();
  },

  resetUserStatus: async (userId: string): Promise<void> => {
    const user = MOCK_USERS.find(u => u.id === userId);
    if (user) user.isLocked = false;
    return Promise.resolve();
  }
};