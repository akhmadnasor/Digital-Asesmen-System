import React, { useState, useEffect, useRef } from 'react';
import { User, Exam, UserRole, Question, ExamResult, AppSettings } from '../types';
import { db } from '../services/database'; // SWITCHED TO REAL DB
import { Plus, BookOpen, Save, LogOut, Loader2, Key, RotateCcw, Clock, Upload, Download, FileText, Image as ImageIcon, Type, LayoutDashboard, Settings, Printer, Filter, Calendar, FileSpreadsheet, Lock, Link, Edit, ShieldAlert, Speaker, AlertTriangle, Eye, X, Database, Activity, ClipboardList, Search, Unlock, Palette, Trash2, CheckCircle } from 'lucide-react';

interface AdminDashboardProps {
  user: User;
  onLogout: () => void;
  appName: string;
  onSettingsChange: () => void;
  themeColor: string;
}

const getExamStatus = (exam: Exam) => {
    if (!exam.startDate || !exam.endDate) return 'ongoing';
    const now = new Date();
    const start = new Date(exam.startDate);
    const end = new Date(exam.endDate);
    
    if (now < start) return 'upcoming';
    if (now > end) return 'completed';
    return 'ongoing';
};

// Default fallback logo (Updated to Google Drive Link)
const DEFAULT_LOGO = "https://lh3.googleusercontent.com/d/1UXDrhKgeSjfFks_oXIMOVYgxFG_Bh1nm";

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ user, onLogout, appName, onSettingsChange, themeColor }) => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [results, setResults] = useState<ExamResult[]>([]);
  
  // TABS
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'MONITORING' | 'HASIL_UJIAN' | 'BANK_SOAL' | 'JADWAL' | 'PESERTA' | 'CETAK_KARTU' | 'ANTI_CHEAT' | 'PENGATURAN'>('DASHBOARD');
  
  // Create/Edit Token & Schedule State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [editToken, setEditToken] = useState('');
  const [editDuration, setEditDuration] = useState(0);
  const [editStartDate, setEditStartDate] = useState('');
  const [editStartTime, setEditStartTime] = useState('');
  const [editEndDate, setEditEndDate] = useState('');
  const [editEndTime, setEditEndTime] = useState('');
  
  // Question Viewer State
  const [viewingQuestionsExam, setViewingQuestionsExam] = useState<Exam | null>(null);

  // Import State
  const [importTargetExamId, setImportTargetExamId] = useState<string | null>(null);
  const studentFileRef = useRef<HTMLInputElement>(null);
  const questionFileRef = useRef<HTMLInputElement>(null);

  // Settings State (Identitas Sekolah)
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [logoUrlInput, setLogoUrlInput] = useState('');
  const [newAppName, setNewAppName] = useState(appName);
  const [newThemeColor, setNewThemeColor] = useState(themeColor);

  // Anti Cheat State
  const [acActive, setAcActive] = useState(true);
  const [acFreeze, setAcFreeze] = useState(15);
  const [acText, setAcText] = useState('');
  const [acSound, setAcSound] = useState(true);
  
  // Print Settings
  const [printDate, setPrintDate] = useState(new Date().toISOString().split('T')[0]);

  // Filters
  const [selectedSchoolFilter, setSelectedSchoolFilter] = useState<string>('ALL');
  
  // Monitoring & Result Filters
  const [monitoringSearch, setMonitoringSearch] = useState('');
  const [resultFilterSchool, setResultFilterSchool] = useState<string>('ALL');
  
  // Monitoring Filter
  const [monitoringExamId, setMonitoringExamId] = useState<string>('');

  useEffect(() => {
    loadData();
    loadSettings();
  }, []);

  const loadData = async () => {
    const e = await db.getExams('SD'); 
    // Filter logic ensuring SD exams appear
    const cleanExams = e.filter(exam => 
        (exam.educationLevel === 'SD' || exam.title.includes('SD')) && 
        !exam.title.toLowerCase().includes('smp')
    );
    const u = await db.getUsers();
    const r = await db.getAllResults();

    setExams(cleanExams);
    setUsers(u.filter(x => x.role === 'STUDENT'));
    setResults(r);
    
    // Set default monitoring exam if available
    if (cleanExams.length > 0 && !monitoringExamId) {
        setMonitoringExamId(cleanExams[0].id);
    }
  };

  const loadSettings = async () => {
    const s = await db.getSettings();
    setSettings(s);
    setNewAppName(s.appName);
    setLogoUrlInput(s.schoolLogoUrl || '');
    setNewThemeColor(s.themeColor);
    
    // Load Anti Cheat
    if (s.antiCheat) {
        setAcActive(s.antiCheat.isActive);
        setAcFreeze(s.antiCheat.freezeDurationSeconds);
        setAcText(s.antiCheat.alertText);
        setAcSound(s.antiCheat.enableSound);
    }
  };

  const openEditModal = (exam: Exam) => {
      setEditingExam(exam);
      setEditToken(exam.token);
      setEditDuration(exam.durationMinutes);
      
      const start = new Date(exam.startDate || new Date().toISOString());
      const end = new Date(exam.endDate || new Date().toISOString());

      setEditStartDate(start.toISOString().split('T')[0]);
      setEditStartTime(start.toTimeString().slice(0,5));
      
      setEditEndDate(end.toISOString().split('T')[0]);
      setEditEndTime(end.toTimeString().slice(0,5));

      setIsEditModalOpen(true);
  };

  const handleSaveSchedule = async () => {
      if (!editingExam) return;
      if (editToken.length < 3) return alert("Token minimal 3 karakter");
      
      const startIso = new Date(`${editStartDate}T${editStartTime}`).toISOString();
      const endIso = new Date(`${editEndDate}T${editEndTime}`).toISOString();

      await db.updateExamSchedule(editingExam.id, editToken.toUpperCase(), editDuration, startIso, endIso);
      
      setIsEditModalOpen(false);
      setEditingExam(null);
      loadData();
      alert("Jadwal dan Token berhasil diperbarui! Perubahan langsung berlaku untuk siswa.");
  };

  const handleResetUser = async (userId: string) => {
      if(confirm("Reset status login peserta ini? (Unlock)")) {
          await db.resetUserStatus(userId);
          alert("Peserta berhasil di-reset.");
          loadData();
      }
  };
  
  const handleDeleteUser = async (userId: string) => {
      if(confirm("Hapus peserta ini secara permanen?")) {
          await db.deleteUser(userId);
          loadData();
      }
  };

  const handleResetPassword = async (userId: string) => {
      if(confirm("Apakah anda yakin ingin mereset password siswa ini menjadi '12345'?")) {
          await db.resetUserPassword(userId);
          alert("Password berhasil direset menjadi '12345'.");
          loadData();
      }
  };
  
  const handleSaveIdentity = async () => {
      if (newAppName.trim().length > 0) {
          await db.updateSettings({ 
              appName: newAppName, 
              schoolLogoUrl: logoUrlInput,
              themeColor: newThemeColor
          });
          onSettingsChange();
          alert("Identitas Sekolah berhasil diperbarui!");
      }
  };

  const handleSaveAntiCheat = async () => {
      await db.updateSettings({
          antiCheat: {
              isActive: acActive,
              freezeDurationSeconds: acFreeze,
              alertText: acText,
              enableSound: acSound
          }
      });
      onSettingsChange();
      alert("Konfigurasi Anti-Curang berhasil disimpan!");
  };

  const triggerImportQuestions = (examId: string) => {
      setImportTargetExamId(examId);
      setTimeout(() => {
          questionFileRef.current?.click();
      }, 100);
  };

  const handleExportQuestions = (exam: Exam) => {
      if (exam.questions.length === 0) return alert("Belum ada soal untuk diekspor.");
      
      const headers = ["Nomor", "Tipe Soal", "Jenis Soal", "Soal", "Url Gambar", "Opsi A", "Opsi B", "Opsi C", "Opsi D", "Kunci", "Bobot"];
      const rows = exam.questions.map((q, idx) => {
          const options = q.options || ["", "", "", ""];
          const keyMap = ['A', 'B', 'C', 'D'];
          
          let keyString = '';
          // Handle Key for PG vs CHECKLIST
          if (q.type === 'CHECKLIST' && q.correctIndices) {
               keyString = q.correctIndices.map(idx => keyMap[idx]).join(';');
          } else {
               keyString = typeof q.correctIndex === 'number' ? keyMap[q.correctIndex] : '';
          }
          
          const escape = (t: string) => `"${t.replace(/"/g, '""')}"`;

          return [
              idx + 1,
              q.type,
              q.type === 'CHECKLIST' ? "PILIHAN GANDA KOMPLEKS" : "PILIHAN GANDA",
              escape(q.text),
              q.imgUrl || "",
              escape(options[0] || ""),
              escape(options[1] || ""),
              escape(options[2] || ""),
              escape(options[3] || ""),
              keyString,
              q.points
          ].join(",");
      });

      const csvContent = headers.join(",") + "\n" + rows.join("\n");
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `BANK_SOAL_${exam.subject.replace(/\s/g, '_')}_${new Date().getTime()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  const onQuestionFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!e.target.files || !e.target.files[0] || !importTargetExamId) return;
      const file = e.target.files[0];
      const text = await file.text();
      const rows = text.trim().split('\n').slice(1); // Skip header
      
      const targetExam = exams.find(ex => ex.id === importTargetExamId);
      if (!targetExam) {
          alert(`Ujian target tidak ditemukan.`);
          return;
      }

      const parseRow = (row: string) => {
           const regex = /(?:,|\n|^)("(?:(?:"")*[^"]*)*"|[^",\n]*|(?:\n|$))/g;
           const result = [];
           let match;
           while ((match = regex.exec(row)) !== null) {
               if(match.index === regex.lastIndex) { regex.lastIndex++; } 
               if(match[1] !== undefined) {
                   let val = match[1].replace(/^"|"$/g, '').replace(/""/g, '"');
                   if (val.startsWith(',')) val = val.substring(1); 
                   result.push(val.trim());
               }
           }
           if(result.length <= 1) return row.split(',').map(s => s.trim());
           return result;
      };

      const newQuestions: Question[] = rows.map((rowStr, idx) => {
          const row = parseRow(rowStr);
          if (row.length < 5) return null; 
          
          const options = [row[5], row[6], row[7], row[8]].filter(o => o && o.length > 0);
          const keyMap: {[key: string]: number} = { 'A': 0, 'B': 1, 'C': 2, 'D': 3 };
          
          const type = row[1] ? row[1].trim() : 'PG';
          let correctIndex = 0;
          let correctIndices: number[] = [];

          // Parse Key based on type
          const rawKey = row[9] ? row[9].toUpperCase().trim() : '';

          if (type === 'CHECKLIST') {
              // Handle multiple keys e.g. "A;C" or "A,C"
              const keys = rawKey.split(/[,;]/).map(k => k.trim());
              correctIndices = keys.map(k => keyMap[k]).filter(i => i !== undefined);
          } else {
              correctIndex = keyMap[rawKey] || 0;
          }

          return {
              id: `imp-${Date.now()}-${idx}`,
              type: type as any,
              text: row[3],
              imgUrl: row[4] && row[4].startsWith('http') ? row[4] : undefined,
              options: options,
              correctIndex: correctIndex,
              correctIndices: correctIndices,
              points: parseInt(row[10]) || 10
          };
      }).filter(Boolean) as Question[];

      if (newQuestions.length > 0) {
          await db.addQuestions(targetExam.id, newQuestions);
          loadData();
          alert(`Berhasil mengimport ${newQuestions.length} soal ke ${targetExam.title}!`);
      } else {
          alert("Gagal membaca data CSV atau file kosong.");
      }
      e.target.value = '';
      setImportTargetExamId(null);
  };
  
  const handlePrintCards = () => {
    const originalTitle = document.title;
    document.title = `KARTU_UJIAN_SD_${selectedSchoolFilter}_${printDate}`;
    window.print();
    document.title = originalTitle;
  };
  
  const downloadTemplate = (type: 'USER' | 'QUESTION') => {
       let content = "";
      let filename = "";

      if (type === 'USER') {
          const headers = ["No", "NISN", "Username", "Password", "Nama Lengkap", "Asal Sekolah", "Jenis Kelamin (L/P)", "Tanggal Lahir (YYYY-MM-DD)", "Kelas"];
          const sampleData = ["1,1234567890,siswa01,12345,Ahmad Dahlan,SDN 1 BEJI,L,2012-05-20,6"];
          content = headers.join(",") + "\n" + sampleData.join("\n");
          filename = "TEMPLATE_DATA_PESERTA.csv";
      } else {
          // Updated Template for Questions to match new features
          const headers = [
              "Nomor", "Tipe Soal (PG/CHECKLIST)", "Jenis Soal", "Soal", "Url Gambar", "Opsi A", "Opsi B", "Opsi C", "Opsi D", "Kunci (Contoh: A untuk PG / A;C untuk Checklist)", "Bobot"
          ];
          const sampleDataPG = ["1,PG,PILIHAN GANDA,Siapa presiden pertama Indonesia?,,Soekarno,Hatta,Soeharto,Habibie,A,10"];
          const sampleDataChecklist = ["2,CHECKLIST,PILIHAN GANDA KOMPLEKS,Pilih dua warna bendera Indonesia,,Merah,Biru,Putih,Hijau,A;C,10"];
          
          content = headers.join(",") + "\n" + sampleDataPG.join("\n") + "\n" + sampleDataChecklist.join("\n");
          filename = "TEMPLATE_SOAL_SD_PG_CHECKLIST.csv";
      }

      const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  const schools = Array.from(new Set(users.map(u => u.school || 'Unknown'))).sort();
  const filteredUsers = selectedSchoolFilter === 'ALL' ? users : users.filter(u => u.school === selectedSchoolFilter);

  // Monitoring filtered users logic
  const getMonitoringUsers = () => {
      let filtered = users;
      if (selectedSchoolFilter !== 'ALL') {
          filtered = filtered.filter(u => u.school === selectedSchoolFilter);
      }
      if (monitoringSearch) {
          const searchLower = monitoringSearch.toLowerCase();
          filtered = filtered.filter(u => 
              u.name.toLowerCase().includes(searchLower) ||
              (u.nisn && u.nisn.includes(searchLower))
          );
      }
      return filtered;
  };
  
  // Results filtered logic
  const getFilteredResults = () => {
      let filtered = results;
      if (resultFilterSchool !== 'ALL') {
          // Find student IDs belonging to that school
          const schoolStudentIds = users.filter(u => u.school === resultFilterSchool).map(u => u.id);
          filtered = filtered.filter(r => schoolStudentIds.includes(r.studentId));
      }
      return filtered;
  };

  const NavItem = ({ id, label, icon: Icon }: { id: typeof activeTab, label: string, icon: any }) => (
      <button 
        onClick={() => setActiveTab(id)}
        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition mb-1 text-sm font-medium ${activeTab === id ? 'bg-white/10 text-white shadow-inner ring-1 ring-white/20' : 'text-blue-100 hover:bg-white/5'}`}
      >
          <Icon size={18} />
          <span>{label}</span>
      </button>
  );

  return (
    <div className="flex h-screen bg-gray-100 font-sans overflow-hidden">
      
      {/* Hidden Inputs for File Import */}
      <input type="file" ref={studentFileRef} className="hidden" accept=".csv" />
      <input type="file" ref={questionFileRef} className="hidden" accept=".csv" onChange={onQuestionFileChange} />

      {/* Sidebar - Hidden on Print */}
      <aside className="w-64 flex-shrink-0 text-white flex flex-col shadow-xl z-20 transition-all duration-300 print:hidden" style={{ backgroundColor: themeColor }}>
          <div className="p-6 border-b border-white/10 flex items-center space-x-3">
              <BookOpen size={28} className="text-white drop-shadow-md" />
              <div>
                  <h1 className="font-bold text-lg tracking-wide">ADMIN SD</h1>
                  <p className="text-xs text-blue-100 opacity-80">Panel Sekolah Dasar</p>
              </div>
          </div>
          
          <nav className="flex-1 p-4 overflow-y-auto custom-scrollbar">
              <p className="text-xs font-bold text-blue-200 uppercase tracking-wider mb-2 px-4 mt-2">Menu Utama</p>
              <NavItem id="DASHBOARD" label="Dashboard" icon={LayoutDashboard} />
              <NavItem id="MONITORING" label="Monitoring Ujian" icon={Activity} />
              <NavItem id="HASIL_UJIAN" label="Hasil Ujian" icon={ClipboardList} />
              
              <p className="text-xs font-bold text-blue-200 uppercase tracking-wider mb-2 px-4 mt-4">Manajemen Data</p>
              <NavItem id="BANK_SOAL" label="Bank Soal" icon={Database} />
              <NavItem id="JADWAL" label="Jadwal Ujian" icon={Clock} />
              <NavItem id="PESERTA" label="Data Peserta" icon={RotateCcw} />
              <NavItem id="CETAK_KARTU" label="Cetak Kartu" icon={Printer} />
              
              <p className="text-xs font-bold text-blue-200 uppercase tracking-wider mb-2 px-4 mt-4">Keamanan & Sistem</p>
              <NavItem id="ANTI_CHEAT" label="Sistem Anti-Curang" icon={ShieldAlert} />
              <NavItem id="PENGATURAN" label="Identitas Sekolah" icon={Settings} />
          </nav>

          <div className="p-4 border-t border-white/10 bg-black/10">
               <div className="flex items-center space-x-3 mb-3 px-2">
                   <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-bold">
                       {user.name.charAt(0)}
                   </div>
                   <div className="overflow-hidden">
                       <p className="text-sm font-bold truncate">{user.name}</p>
                       <p className="text-xs text-blue-200 truncate">Administrator</p>
                   </div>
               </div>
               <button onClick={onLogout} className="w-full flex items-center justify-center space-x-2 bg-red-500/20 hover:bg-red-500/40 text-red-100 py-2 rounded text-xs font-bold transition border border-red-500/30">
                   <LogOut size={14} /> <span>Keluar Aplikasi</span>
               </button>
          </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-8 bg-gray-50/50 print:p-0 print:bg-white print:overflow-visible print:h-auto print:static">
          
          <header className="flex justify-between items-center mb-8 bg-white p-4 rounded-xl shadow-sm border border-gray-100 print:hidden">
               <div>
                   <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                       {activeTab === 'DASHBOARD' && <LayoutDashboard className="mr-3 text-blue-600"/>}
                       {activeTab === 'MONITORING' && <Activity className="mr-3 text-blue-600"/>}
                       {activeTab === 'HASIL_UJIAN' && <ClipboardList className="mr-3 text-blue-600"/>}
                       {activeTab === 'PESERTA' && <RotateCcw className="mr-3 text-blue-600"/>}
                       {activeTab === 'CETAK_KARTU' && <Printer className="mr-3 text-blue-600"/>}
                       {activeTab === 'ANTI_CHEAT' && <ShieldAlert className="mr-3 text-blue-600"/>}
                       {activeTab === 'PENGATURAN' && <Settings className="mr-3 text-blue-600"/>}
                       
                       {activeTab === 'DASHBOARD' ? 'Overview' : 
                        activeTab === 'CETAK_KARTU' ? 'Cetak Kartu Ujian' :
                        activeTab === 'ANTI_CHEAT' ? 'Sistem Keamanan Ujian' :
                        activeTab === 'PENGATURAN' ? 'Pengaturan Aplikasi' : 
                        activeTab.replace('_', ' ')}
                   </h2>
               </div>
          </header>

          {/* DASHBOARD VIEW */}
          {activeTab === 'DASHBOARD' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 print:hidden">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex justify-between items-center hover:shadow-md transition">
                          <div>
                              <p className="text-sm text-gray-500 font-bold uppercase">Total Mapel SD</p>
                              <h3 className="text-3xl font-bold text-gray-800 mt-1">{exams.length}</h3>
                          </div>
                          <div className="p-4 bg-blue-50 rounded-full text-blue-600"><FileText size={24}/></div>
                      </div>
                      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex justify-between items-center hover:shadow-md transition">
                          <div>
                              <p className="text-sm text-gray-500 font-bold uppercase">Siswa Terdaftar</p>
                              <h3 className="text-3xl font-bold text-gray-800 mt-1">{users.length}</h3>
                          </div>
                          <div className="p-4 bg-green-50 rounded-full text-green-600"><RotateCcw size={24}/></div>
                      </div>
                      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex justify-between items-center hover:shadow-md transition">
                          <div>
                              <p className="text-sm text-gray-500 font-bold uppercase">Sekolah Terdata</p>
                              <h3 className="text-3xl font-bold text-gray-800 mt-1">{schools.length}</h3>
                          </div>
                          <div className="p-4 bg-purple-50 rounded-full text-purple-600"><BookOpen size={24}/></div>
                      </div>
                  </div>
              </div>
          )}

          {/* TAB: MONITORING (FUNCTIONAL) */}
          {activeTab === 'MONITORING' && (
              <div className="space-y-6 animate-in fade-in print:hidden">
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                          <div>
                              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Mata Ujian</label>
                              <select 
                                  value={monitoringExamId}
                                  onChange={(e) => setMonitoringExamId(e.target.value)}
                                  className="w-full border rounded p-2 text-sm"
                              >
                                  {exams.map(e => <option key={e.id} value={e.id}>{e.subject} ({e.educationLevel})</option>)}
                              </select>
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Sekolah</label>
                              <select 
                                  value={selectedSchoolFilter} 
                                  onChange={(e) => setSelectedSchoolFilter(e.target.value)}
                                  className="w-full border rounded p-2 text-sm"
                              >
                                  <option value="ALL">Semua Sekolah</option>
                                  {schools.map(s => <option key={s} value={s}>{s}</option>)}
                              </select>
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Cari Siswa</label>
                              <div className="relative">
                                <Search className="absolute left-2 top-2.5 text-gray-400" size={16} />
                                <input 
                                    type="text" 
                                    placeholder="Nama / NISN..." 
                                    className="w-full border rounded p-2 pl-8 text-sm"
                                    value={monitoringSearch}
                                    onChange={e => setMonitoringSearch(e.target.value)}
                                />
                              </div>
                          </div>
                      </div>

                      <div className="overflow-x-auto">
                          <table className="w-full text-sm text-left">
                              <thead className="bg-gray-50 text-gray-600 font-bold border-b">
                                  <tr>
                                      <th className="p-3">Nama Peserta</th>
                                      <th className="p-3">Sekolah</th>
                                      <th className="p-3">Status</th>
                                      <th className="p-3">Waktu Mulai</th>
                                      <th className="p-3 text-center">Aksi</th>
                                  </tr>
                              </thead>
                              <tbody className="divide-y">
                                  {getMonitoringUsers().map(student => {
                                      // Check if result exists
                                      const result = results.find(r => r.studentId === student.id && r.examId === monitoringExamId);
                                      const isFinished = !!result;
                                      
                                      return (
                                          <tr key={student.id} className="hover:bg-gray-50">
                                              <td className="p-3 font-medium text-gray-800">
                                                  {student.name}
                                                  <div className="text-xs text-gray-400 font-mono">{student.nisn}</div>
                                              </td>
                                              <td className="p-3 text-gray-600">{student.school}</td>
                                              <td className="p-3">
                                                  {isFinished ? (
                                                      <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold flex items-center w-fit">
                                                          <CheckCircle size={12} className="mr-1"/> Selesai
                                                      </span>
                                                  ) : (
                                                      <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-bold">Belum Mengerjakan</span>
                                                  )}
                                              </td>
                                              <td className="p-3 text-gray-500">
                                                  {result ? new Date(result.submittedAt).toLocaleTimeString() : '-'}
                                              </td>
                                              <td className="p-3 text-center">
                                                  <button 
                                                    onClick={() => handleResetUser(student.id)}
                                                    className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-2 rounded"
                                                    title="Reset Login Status"
                                                  >
                                                      <Unlock size={16} />
                                                  </button>
                                              </td>
                                          </tr>
                                      );
                                  })}
                              </tbody>
                          </table>
                      </div>
                  </div>
              </div>
          )}

          {/* TAB: HASIL UJIAN (FUNCTIONAL) */}
          {activeTab === 'HASIL_UJIAN' && (
              <div className="space-y-6 animate-in fade-in print:hidden">
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                      <div className="flex justify-between items-center mb-6">
                          <h3 className="font-bold text-lg text-gray-800">Rekap Hasil Ujian</h3>
                          <div className="flex gap-2">
                             <select 
                                  value={resultFilterSchool} 
                                  onChange={(e) => setResultFilterSchool(e.target.value)}
                                  className="border rounded p-2 text-sm"
                              >
                                  <option value="ALL">Semua Sekolah</option>
                                  {schools.map(s => <option key={s} value={s}>{s}</option>)}
                              </select>
                              <button 
                                onClick={() => alert("Fitur export akan mendownload semua data hasil ujian.")}
                                className="bg-green-600 text-white px-4 py-2 rounded text-sm font-bold flex items-center hover:bg-green-700"
                              >
                                  <FileSpreadsheet size={16} className="mr-2"/> Export Excel
                              </button>
                          </div>
                      </div>

                      <div className="overflow-x-auto">
                          <table className="w-full text-sm text-left">
                              <thead className="bg-gray-50 text-gray-600 font-bold border-b">
                                  <tr>
                                      <th className="p-3">Nama Peserta</th>
                                      <th className="p-3">Mata Ujian</th>
                                      <th className="p-3 text-center">Nilai</th>
                                      <th className="p-3 text-center">Indikasi Curang</th>
                                      <th className="p-3">Waktu Submit</th>
                                  </tr>
                              </thead>
                              <tbody className="divide-y">
                                  {getFilteredResults().map(res => (
                                      <tr key={res.id} className="hover:bg-gray-50">
                                          <td className="p-3 font-medium text-gray-800">{res.studentName}</td>
                                          <td className="p-3 text-gray-600">{res.examTitle}</td>
                                          <td className="p-3 text-center font-bold text-blue-600 text-lg">{res.score}</td>
                                          <td className="p-3 text-center">
                                              {res.cheatingAttempts > 0 ? (
                                                  <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold">
                                                      {res.cheatingAttempts}x Alert
                                                  </span>
                                              ) : (
                                                  <span className="text-gray-400">-</span>
                                              )}
                                          </td>
                                          <td className="p-3 text-gray-500 text-xs">
                                              {new Date(res.submittedAt).toLocaleString()}
                                          </td>
                                      </tr>
                                  ))}
                                  {getFilteredResults().length === 0 && (
                                      <tr><td colSpan={5} className="p-6 text-center text-gray-400">Belum ada data hasil ujian.</td></tr>
                                  )}
                              </tbody>
                          </table>
                      </div>
                  </div>
              </div>
          )}

          {/* TAB: DATA PESERTA (FUNCTIONAL) */}
          {activeTab === 'PESERTA' && (
              <div className="space-y-6 animate-in fade-in print:hidden">
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                      <div className="flex justify-between items-center mb-6">
                           <div>
                               <h3 className="font-bold text-lg text-gray-800">Data Peserta Ujian</h3>
                               <p className="text-sm text-gray-500">Kelola akun siswa dan reset password.</p>
                           </div>
                           <button 
                             onClick={() => alert("Gunakan fitur Import di menu Dashboard/Bank Soal untuk upload massal, atau fitur Tambah User di Super Admin.")}
                             className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-bold flex items-center hover:bg-blue-700"
                           >
                               <Plus size={16} className="mr-2"/> Tambah Siswa
                           </button>
                      </div>

                      <div className="flex gap-4 mb-4">
                           <input 
                              type="text" 
                              placeholder="Cari nama / NISN..."
                              className="border rounded p-2 text-sm flex-1"
                              value={monitoringSearch}
                              onChange={e => setMonitoringSearch(e.target.value)}
                           />
                           <select 
                               value={selectedSchoolFilter} 
                               onChange={(e) => setSelectedSchoolFilter(e.target.value)}
                               className="border rounded p-2 text-sm w-48"
                           >
                               <option value="ALL">Semua Sekolah</option>
                               {schools.map(s => <option key={s} value={s}>{s}</option>)}
                           </select>
                      </div>

                      <div className="overflow-x-auto">
                          <table className="w-full text-sm text-left">
                              <thead className="bg-gray-50 text-gray-600 font-bold border-b">
                                  <tr>
                                      <th className="p-3">Nama Lengkap</th>
                                      <th className="p-3">NISN / Username</th>
                                      <th className="p-3">Password</th>
                                      <th className="p-3">Sekolah</th>
                                      <th className="p-3 text-center">Aksi</th>
                                  </tr>
                              </thead>
                              <tbody className="divide-y">
                                  {getMonitoringUsers().map(student => (
                                      <tr key={student.id} className="hover:bg-gray-50">
                                          <td className="p-3 font-medium text-gray-800">{student.name}</td>
                                          <td className="p-3 text-gray-600 font-mono">{student.nisn || student.username}</td>
                                          <td className="p-3 text-gray-500 font-mono bg-gray-50 w-24 text-center rounded">{student.password || '*****'}</td>
                                          <td className="p-3 text-gray-600">{student.school}</td>
                                          <td className="p-3 flex justify-center gap-2">
                                              <button 
                                                  onClick={() => handleResetPassword(student.id)}
                                                  className="bg-yellow-50 text-yellow-700 p-2 rounded hover:bg-yellow-100 border border-yellow-200"
                                                  title="Reset Password ke 12345"
                                              >
                                                  <Key size={14} />
                                              </button>
                                              <button 
                                                  onClick={() => handleDeleteUser(student.id)}
                                                  className="bg-red-50 text-red-700 p-2 rounded hover:bg-red-100 border border-red-200"
                                                  title="Hapus Siswa"
                                              >
                                                  <Trash2 size={14} />
                                              </button>
                                          </td>
                                      </tr>
                                  ))}
                              </tbody>
                          </table>
                      </div>
                  </div>
              </div>
          )}

          {/* TAB 1: BANK SOAL (Import, Export, Template) */}
          {activeTab === 'BANK_SOAL' && (
              <div className="space-y-6 animate-in fade-in print:hidden">
                  
                   {/* Template Section */}
                   <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col md:flex-row items-center justify-between gap-4">
                        <div>
                            <h3 className="font-bold text-gray-800">Template Soal Excel/CSV</h3>
                            <p className="text-sm text-gray-500">Gunakan template ini untuk membuat soal secara offline lalu import ke sistem.</p>
                        </div>
                        <button onClick={() => downloadTemplate('QUESTION')} className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center shadow-md transition">
                            <FileSpreadsheet size={18} className="mr-2"/> Download Template
                        </button>
                   </div>

                   <h3 className="font-bold text-gray-800 text-lg mt-8 mb-4">Daftar Mata Pelajaran & Bank Soal</h3>
                   <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {exams.map(exam => (
                          <div key={exam.id} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h4 className="font-bold text-gray-800 text-lg">{exam.subject}</h4>
                                        <p className="text-xs text-gray-500">{exam.title}</p>
                                    </div>
                                    <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold">
                                        {exam.questions.length} Soal
                                    </span>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-2 mt-4">
                                    <button 
                                        onClick={() => setViewingQuestionsExam(exam)} 
                                        className="bg-gray-50 border border-gray-300 text-gray-700 px-3 py-2 rounded text-xs font-bold flex items-center justify-center hover:bg-gray-100"
                                    >
                                        <Eye size={14} className="mr-2" /> Lihat Soal
                                    </button>
                                    <button 
                                        onClick={() => handleExportQuestions(exam)}
                                        className="bg-green-50 border border-green-300 text-green-700 px-3 py-2 rounded text-xs font-bold flex items-center justify-center hover:bg-green-100"
                                    >
                                        <Download size={14} className="mr-2" /> Ekspor (CSV)
                                    </button>
                                    <button 
                                        onClick={() => triggerImportQuestions(exam.id)}
                                        className="col-span-2 bg-blue-600 text-white px-3 py-2.5 rounded text-sm font-bold flex items-center justify-center hover:bg-blue-700 shadow-sm"
                                    >
                                        <Upload size={16} className="mr-2" /> Import Soal Baru
                                    </button>
                                </div>
                          </div>
                      ))}
                   </div>
              </div>
          )}
          
          {/* TAB: CETAK KARTU (FUNCTIONAL) */}
          {activeTab === 'CETAK_KARTU' && (
              <div className="space-y-6 animate-in fade-in">
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 print:hidden">
                      <div className="flex justify-between items-center mb-6">
                          <div>
                            <h3 className="font-bold text-gray-800 text-lg">Cetak Kartu Login Peserta</h3>
                            <p className="text-sm text-gray-500">Silakan filter berdasarkan sekolah sebelum mencetak.</p>
                          </div>
                          <button 
                            onClick={handlePrintCards}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-bold flex items-center shadow transition"
                          >
                             <Printer size={18} className="mr-2"/> Cetak Sekarang
                          </button>
                      </div>

                      <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-lg">
                          <Filter size={18} className="text-gray-400"/>
                          <select 
                             value={selectedSchoolFilter} 
                             onChange={(e) => setSelectedSchoolFilter(e.target.value)}
                             className="border rounded px-3 py-2 text-sm w-64"
                          >
                              <option value="ALL">Semua Sekolah</option>
                              {schools.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                      </div>
                  </div>

                  {/* PRINT AREA */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:grid-cols-2 print:gap-4 print:block">
                      {filteredUsers.map((student, idx) => (
                          <div key={student.id} className="bg-white border-2 border-gray-800 rounded-lg p-0 overflow-hidden break-inside-avoid shadow-sm print:shadow-none print:border-black print:mb-4 print:inline-block print:w-[48%] print:mr-[1%] print:align-top">
                               {/* Card Header */}
                               <div className="bg-gray-100 border-b-2 border-gray-800 p-4 flex items-center gap-3 print:bg-gray-200 print:border-black">
                                   <img 
                                        src={settings?.schoolLogoUrl || DEFAULT_LOGO} 
                                        className="w-12 h-12 object-contain"
                                        referrerPolicy="no-referrer"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = DEFAULT_LOGO;
                                            (e.target as HTMLImageElement).onerror = null;
                                        }} 
                                   />
                                   <div className="flex-1">
                                       <h4 className="font-bold text-sm uppercase leading-tight">{appName}</h4>
                                       <p className="text-xs text-gray-600">KARTU PESERTA UJIAN</p>
                                   </div>
                               </div>

                               {/* Card Body */}
                               <div className="p-4 flex gap-4">
                                   <div className="w-24 h-32 bg-gray-100 border border-gray-300 flex items-center justify-center text-xs text-gray-400 text-center p-2">
                                       FOTO 3x4
                                   </div>
                                   <div className="flex-1 text-sm space-y-2">
                                       <div>
                                           <span className="block text-[10px] text-gray-500 uppercase font-bold">Nama Peserta</span>
                                           <span className="block font-bold text-gray-800">{student.name}</span>
                                       </div>
                                       <div>
                                           <span className="block text-[10px] text-gray-500 uppercase font-bold">Nomor Peserta / NISN</span>
                                           <span className="block font-mono bg-gray-50 border px-1 rounded inline-block">{student.nisn || student.username}</span>
                                       </div>
                                       <div>
                                           <span className="block text-[10px] text-gray-500 uppercase font-bold">Password Login</span>
                                           <span className="block font-mono bg-gray-50 border px-1 rounded inline-block">{student.password || '12345'}</span>
                                       </div>
                                       <div>
                                           <span className="block text-[10px] text-gray-500 uppercase font-bold">Sekolah Asal</span>
                                           <span className="block text-gray-800">{student.school}</span>
                                       </div>
                                   </div>
                               </div>
                               
                               {/* Footer */}
                               <div className="bg-gray-50 border-t border-gray-200 p-2 text-center text-[10px] text-gray-500 print:border-gray-400">
                                   Dicetak pada: {new Date().toLocaleDateString('id-ID')}
                               </div>
                          </div>
                      ))}
                  </div>
                  {filteredUsers.length === 0 && <p className="text-center text-gray-400">Tidak ada data siswa untuk dicetak.</p>}
              </div>
          )}

          {/* TAB: ANTI CURANG (FUNCTIONAL) */}
          {activeTab === 'ANTI_CHEAT' && (
              <div className="space-y-6 animate-in fade-in print:hidden">
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 max-w-2xl">
                      <div className="flex items-center justify-between mb-8 pb-6 border-b">
                          <div>
                              <h3 className="font-bold text-lg text-gray-800">Status Sistem Anti-Curang</h3>
                              <p className="text-sm text-gray-500">Aktifkan deteksi pindah tab/window blur.</p>
                          </div>
                          <button 
                              onClick={() => setAcActive(!acActive)}
                              className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${acActive ? 'bg-green-500' : 'bg-gray-300'}`}
                          >
                              <span className={`inline-block h-6 w-6 transform rounded-full bg-white transition ${acActive ? 'translate-x-7' : 'translate-x-1'}`} />
                          </button>
                      </div>

                      <div className={`space-y-6 ${!acActive ? 'opacity-50 pointer-events-none' : ''}`}>
                          <div>
                              <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center"><Clock size={16} className="mr-2"/> Durasi Pembekuan Layar (Freeze)</label>
                              <div className="flex items-center gap-3">
                                  <input 
                                      type="number" 
                                      min="0"
                                      value={acFreeze}
                                      onChange={(e) => setAcFreeze(parseInt(e.target.value))}
                                      className="w-24 border rounded-lg px-3 py-2 text-center font-bold"
                                  />
                                  <span className="text-sm text-gray-500">Detik</span>
                              </div>
                              <p className="text-xs text-gray-400 mt-1">Layar siswa akan terkunci selama durasi ini jika terdeteksi curang.</p>
                          </div>

                          <div>
                              <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center"><AlertTriangle size={16} className="mr-2"/> Pesan Peringatan</label>
                              <textarea 
                                  value={acText}
                                  onChange={(e) => setAcText(e.target.value)}
                                  className="w-full border rounded-lg px-3 py-2 text-sm h-24 focus:ring-2 focus:ring-blue-100 outline-none"
                                  placeholder="Contoh: Dilarang membuka aplikasi lain!"
                              />
                          </div>

                          <div className="flex items-center gap-3">
                              <input 
                                  type="checkbox" 
                                  id="soundToggle"
                                  checked={acSound}
                                  onChange={(e) => setAcSound(e.target.checked)}
                                  className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <label htmlFor="soundToggle" className="text-sm font-bold text-gray-700 flex items-center cursor-pointer">
                                  <Speaker size={16} className="mr-2"/> Aktifkan Suara Alert (Beep)
                              </label>
                          </div>
                      </div>

                      <div className="mt-8 pt-6 border-t flex justify-end">
                          <button 
                              onClick={handleSaveAntiCheat}
                              className="bg-slate-800 text-white px-6 py-3 rounded-lg font-bold hover:bg-slate-900 transition flex items-center shadow-md"
                          >
                              <Save size={18} className="mr-2" /> Simpan Konfigurasi
                          </button>
                      </div>
                  </div>
              </div>
          )}

          {/* TAB: IDENTITAS SEKOLAH / PENGATURAN (FUNCTIONAL) */}
          {activeTab === 'PENGATURAN' && (
              <div className="space-y-6 animate-in fade-in print:hidden">
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 max-w-2xl">
                        <h3 className="font-bold text-xl text-gray-800 mb-6">Identitas & Tampilan Aplikasi</h3>
                        
                        <div className="space-y-6">
                            {/* Logo URL */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Logo Sekolah (URL)</label>
                                <div className="flex gap-4 items-start">
                                    <div className="flex-1">
                                        <div className="relative">
                                            <Link className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                            <input 
                                                type="text"
                                                value={logoUrlInput}
                                                onChange={(e) => setLogoUrlInput(e.target.value)}
                                                placeholder="https://example.com/logo.png"
                                                className="w-full pl-10 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-gray-700"
                                            />
                                        </div>
                                        <p className="text-xs text-gray-400 mt-1">Masukkan URL gambar logo sekolah (Disarankan rasio 1:1 atau transparan).</p>
                                    </div>
                                    <div className="w-16 h-16 border rounded bg-gray-50 flex items-center justify-center p-1">
                                        {logoUrlInput ? <img src={logoUrlInput} className="max-w-full max-h-full object-contain" /> : <ImageIcon className="text-gray-300"/>}
                                    </div>
                                </div>
                            </div>

                            {/* App Name */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Nama Aplikasi / Sekolah</label>
                                <div className="relative">
                                    <Type className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                    <input 
                                        type="text"
                                        value={newAppName}
                                        onChange={(e) => setNewAppName(e.target.value)}
                                        className="w-full pl-10 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition font-bold text-gray-800"
                                    />
                                </div>
                            </div>

                            {/* Theme Color */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Warna Tema Utama</label>
                                <div className="flex items-center gap-4 p-3 border rounded-lg bg-gray-50">
                                    <input 
                                        type="color" 
                                        value={newThemeColor}
                                        onChange={(e) => setNewThemeColor(e.target.value)}
                                        className="h-10 w-10 p-0 border-0 rounded cursor-pointer shadow-sm"
                                    />
                                    <div className="flex-1">
                                        <p className="text-sm font-bold text-gray-700">{newThemeColor}</p>
                                        <p className="text-xs text-gray-500">Digunakan untuk header, tombol, dan aksen.</p>
                                    </div>
                                    <div className="px-4 py-2 rounded text-white text-xs font-bold" style={{ backgroundColor: newThemeColor }}>
                                        Preview
                                    </div>
                                </div>
                            </div>

                            <div className="pt-6 border-t flex justify-end">
                                <button 
                                    onClick={handleSaveIdentity}
                                    className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700 transition flex items-center shadow-md"
                                >
                                    <Save size={18} className="mr-2" /> Simpan Perubahan
                                </button>
                            </div>
                        </div>
                  </div>
              </div>
          )}

          {/* ... JADWAL, BANK SOAL, etc. are handled by activeTab logic above ... */}
          {activeTab === 'JADWAL' && (
              <div className="space-y-6 animate-in fade-in print:hidden">
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                      <h3 className="font-bold text-gray-800 mb-6 flex items-center"><Clock className="mr-2" size={20}/> Pengaturan Jadwal & Token</h3>
                      <div className="space-y-4">
                        {exams.map(exam => {
                            const status = getExamStatus(exam);
                            return (
                                <div key={exam.id} className="flex flex-col md:flex-row justify-between items-center bg-gray-50 p-5 rounded-xl border border-gray-200 hover:border-blue-300 transition gap-4 md:gap-0">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h4 className="font-bold text-gray-800 text-lg">{exam.subject}</h4>
                                            {status === 'ongoing' && <span className="bg-green-100 text-green-700 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase">Sedang Berlangsung</span>}
                                            {status === 'upcoming' && <span className="bg-blue-100 text-blue-700 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase">Akan Datang</span>}
                                            {status === 'completed' && <span className="bg-gray-200 text-gray-600 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase">Selesai</span>}
                                        </div>
                                        <p className="text-sm text-gray-500">{exam.title}</p>
                                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                            <span className="flex items-center"><Key size={12} className="mr-1"/> Token: <strong className="font-mono ml-1 text-gray-700 bg-gray-200 px-1 rounded">{exam.token}</strong></span>
                                            <span className="flex items-center"><Clock size={12} className="mr-1"/> Durasi: <strong>{exam.durationMinutes} Menit</strong></span>
                                        </div>
                                    </div>
                                    
                                    <button 
                                        onClick={() => openEditModal(exam)}
                                        className="bg-white border border-blue-200 text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-lg font-bold text-sm shadow-sm flex items-center"
                                    >
                                        <Edit size={16} className="mr-2"/> Atur Jadwal
                                    </button>
                                </div>
                            );
                        })}
                      </div>
                  </div>
              </div>
          )}

          {/* Edit Schedule Modal */}
          {isEditModalOpen && (
              <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm print:hidden">
                  <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in">
                      <h3 className="font-bold text-xl mb-4 text-gray-800">Atur Jadwal Ujian</h3>
                      <div className="space-y-4">
                          <div>
                              <label className="block text-sm font-bold text-gray-700 mb-1">Token Ujian</label>
                              <input className="w-full border p-2 rounded uppercase font-mono tracking-widest" value={editToken} onChange={e => setEditToken(e.target.value.toUpperCase())} maxLength={6} />
                          </div>
                          <div>
                              <label className="block text-sm font-bold text-gray-700 mb-1">Durasi (Menit)</label>
                              <input type="number" className="w-full border p-2 rounded" value={editDuration} onChange={e => setEditDuration(parseInt(e.target.value))} />
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2">
                              <div>
                                  <label className="block text-xs font-bold text-gray-500 mb-1">Mulai Tanggal</label>
                                  <input type="date" className="w-full border p-2 rounded text-sm" value={editStartDate} onChange={e => setEditStartDate(e.target.value)} />
                              </div>
                              <div>
                                  <label className="block text-xs font-bold text-gray-500 mb-1">Jam</label>
                                  <input type="time" className="w-full border p-2 rounded text-sm" value={editStartTime} onChange={e => setEditStartTime(e.target.value)} />
                              </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                              <div>
                                  <label className="block text-xs font-bold text-gray-500 mb-1">Selesai Tanggal</label>
                                  <input type="date" className="w-full border p-2 rounded text-sm" value={editEndDate} onChange={e => setEditEndDate(e.target.value)} />
                              </div>
                              <div>
                                  <label className="block text-xs font-bold text-gray-500 mb-1">Jam</label>
                                  <input type="time" className="w-full border p-2 rounded text-sm" value={editEndTime} onChange={e => setEditEndTime(e.target.value)} />
                              </div>
                          </div>
                      </div>
                      <div className="flex gap-2 mt-6">
                          <button onClick={() => setIsEditModalOpen(false)} className="flex-1 py-2 border rounded font-bold text-gray-600">Batal</button>
                          <button onClick={handleSaveSchedule} className="flex-1 py-2 bg-blue-600 text-white rounded font-bold hover:bg-blue-700">Simpan Jadwal</button>
                      </div>
                  </div>
              </div>
          )}
          
          {/* Question Viewer Modal */}
          {viewingQuestionsExam && (
              <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm print:hidden">
                  <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col animate-in zoom-in duration-200">
                      <div className="p-4 border-b flex justify-between items-center bg-gray-50 rounded-t-xl">
                          <div>
                              <h3 className="font-bold text-lg">Bank Soal: {viewingQuestionsExam.subject}</h3>
                              <p className="text-xs text-gray-500">Total {viewingQuestionsExam.questions.length} butir soal</p>
                          </div>
                          <button onClick={() => setViewingQuestionsExam(null)} className="p-2 hover:bg-gray-200 rounded-full"><X size={20}/></button>
                      </div>
                      <div className="flex-1 overflow-y-auto p-6 space-y-4">
                          {viewingQuestionsExam.questions.length === 0 ? <p className="text-center text-gray-400 my-10">Belum ada soal.</p> : 
                           viewingQuestionsExam.questions.map((q, idx) => (
                              <div key={q.id} className="border rounded-lg p-4 hover:border-blue-300 transition relative group">
                                  <span className="absolute top-2 right-2 text-xs font-bold text-gray-300 group-hover:text-blue-500">#{idx+1} ({q.type})</span>
                                  <div className="flex gap-4">
                                      <div className="flex-1">
                                          <p className="font-bold text-gray-800 mb-2">{q.text}</p>
                                          {q.imgUrl && <img src={q.imgUrl} className="h-32 object-contain border rounded mb-2 bg-gray-50" />}
                                          <div className="grid grid-cols-2 gap-2 text-sm">
                                              {q.options?.map((opt, i) => (
                                                  <div key={i} className={`p-2 rounded border ${
                                                      (q.type === 'PG' && i === q.correctIndex) ||
                                                      (q.type === 'CHECKLIST' && q.correctIndices?.includes(i))
                                                      ? 'bg-green-50 border-green-300 text-green-800 font-bold' 
                                                      : 'border-gray-100 text-gray-600'
                                                  }`}>
                                                      {String.fromCharCode(65+i)}. {opt}
                                                  </div>
                                              ))}
                                          </div>
                                      </div>
                                  </div>
                              </div>
                           ))
                          }
                      </div>
                  </div>
              </div>
          )}

      </main>
    </div>
  );
};