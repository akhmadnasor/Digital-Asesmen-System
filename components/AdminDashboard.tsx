import React, { useState, useEffect, useRef } from 'react';
import { User, Exam, UserRole, Question, QuestionType, ExamResult, AppSettings } from '../types';
import { db } from '../services/database'; 
import { Plus, BookOpen, Save, LogOut, Loader2, Key, RotateCcw, Clock, Upload, Download, FileText, LayoutDashboard, Settings, Printer, Filter, Calendar, FileSpreadsheet, Lock, Link, Edit, ShieldAlert, Activity, ClipboardList, Search, Unlock, Trash2, Database, School, Shuffle, X, CheckSquare, Map, CalendarDays, Flame } from 'lucide-react';
import * as XLSX from 'xlsx';

interface AdminDashboardProps {
  user: User;
  onLogout: () => void;
  appName: string;
  onSettingsChange: () => void;
  themeColor: string;
}

// Fixed Logo for Card Printing
const FIXED_LOGO_URL = "https://lh3.googleusercontent.com/d/1UXDrhKgeSjfFks_oXIMOVYgxFG_Bh1nm";

const getExamStatus = (exam: Exam) => {
    return 'active'; 
};

// --- ROBUST CSV PARSER ---
const parseCSV = (text: string): string[][] => {
    const cleanText = text.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const firstLine = cleanText.split('\n')[0];
    const delimiter = firstLine.includes(';') ? ';' : ',';

    const rows: string[][] = [];
    let currentRow: string[] = [];
    let currentField = '';
    let insideQuotes = false;

    for (let i = 0; i < cleanText.length; i++) {
        const char = cleanText[i];
        if (char === '"') {
            if (insideQuotes && cleanText[i + 1] === '"') {
                currentField += '"';
                i++; 
            } else {
                insideQuotes = !insideQuotes;
            }
        } else if (char === delimiter && !insideQuotes) {
            currentRow.push(currentField);
            currentField = '';
        } else if (char === '\n' && !insideQuotes) {
            currentRow.push(currentField);
            rows.push(currentRow);
            currentRow = [];
            currentField = '';
        } else {
            currentField += char;
        }
    }
    if (currentField || currentRow.length > 0) {
        currentRow.push(currentField);
        rows.push(currentRow);
    }
    return rows;
};

const escapeCSV = (field: any): string => {
    if (field === null || field === undefined) return '';
    const stringField = String(field);
    if (stringField.includes('"') || stringField.includes(',') || stringField.includes(';') || stringField.includes('\n')) {
        return `"${stringField.replace(/"/g, '""')}"`;
    }
    return stringField;
};

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ user, onLogout, appName, onSettingsChange, themeColor }) => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [results, setResults] = useState<ExamResult[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isProcessingImport, setIsProcessingImport] = useState(false);
  
  // TABS
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'MONITORING' | 'HASIL_UJIAN' | 'BANK_SOAL' | 'MAPPING' | 'PESERTA' | 'CETAK_KARTU'>('DASHBOARD');
  
  // MAPPING / SCHEDULE STATE
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [editToken, setEditToken] = useState('');
  const [editDuration, setEditDuration] = useState(0);
  const [editDate, setEditDate] = useState('');
  const [editSession, setEditSession] = useState('');
  const [editSchoolAccess, setEditSchoolAccess] = useState<string[]>([]);
  
  // QUESTION BANK STATE
  const [viewingQuestionsExam, setViewingQuestionsExam] = useState<Exam | null>(null);
  const [isAddQuestionModalOpen, setIsAddQuestionModalOpen] = useState(false);
  const [targetExamForAdd, setTargetExamForAdd] = useState<Exam | null>(null);
  
  // MANUAL QUESTION FORM
  const [nqType, setNqType] = useState<QuestionType>('PG');
  const [nqText, setNqText] = useState<string>('');
  const [nqImg, setNqImg] = useState<string>('');
  const [nqOptions, setNqOptions] = useState<string[]>(['', '', '', '']);
  const [nqCorrectIndex, setNqCorrectIndex] = useState<number>(0);
  const [nqPoints, setNqPoints] = useState<number>(10);

  // IMPORT REFS
  const [importTargetExamId, setImportTargetExamId] = useState<string | null>(null);
  const studentFileRef = useRef<HTMLInputElement>(null);
  const questionFileRef = useRef<HTMLInputElement>(null);
  
  // FILTERS & CARD PRINTING
  const [selectedSchoolFilter, setSelectedSchoolFilter] = useState<string>('ALL'); // For Peserta & Monitoring
  const [resultSchoolFilter, setResultSchoolFilter] = useState<string>('ALL'); // For Results
  const [cardSchoolFilter, setCardSchoolFilter] = useState<string>('ALL'); // For Cards
  const [monitoringSearch, setMonitoringSearch] = useState<string>('');
  const [printDate, setPrintDate] = useState(new Date().toISOString().split('T')[0]); // YYYY-MM-DD
  
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoadingData(true);
    const e = await db.getExams(); 
    const u = await db.getUsers();
    const r = await db.getAllResults();
    setExams(e);
    setUsers(u); // All users are students in new schema
    setResults(r);
    setIsLoadingData(false);
  };

  const handleCreateExam = async () => {
      const title = prompt("Nama Mata Pelajaran (Contoh: Matematika):");
      if(!title) return;
      
      const newExam: Exam = {
          id: `temp`, // Will be generated by DB
          title: title,
          subject: title,
          educationLevel: 'SD',
          durationMinutes: 60,
          isActive: true,
          token: '12345',
          questions: [],
          questionCount: 0
      };
      await db.createExam(newExam);
      loadData();
  };

  // --- MAPPING / SCHEDULE LOGIC ---
  const openMappingModal = (exam: Exam) => {
      setEditingExam(exam);
      setEditToken(exam.token);
      setEditDuration(exam.durationMinutes);
      setEditDate(exam.examDate || new Date().toISOString().split('T')[0]);
      setEditSession(exam.session || 'Sesi 1');
      setEditSchoolAccess(exam.schoolAccess || []); // Should be array of school names
      setIsEditModalOpen(true);
  };

  const toggleSchoolAccess = (schoolName: string) => {
      setEditSchoolAccess(prev => {
          if (prev.includes(schoolName)) return prev.filter(s => s !== schoolName);
          return [...prev, schoolName];
      });
  };

  const toggleAllSchools = () => {
      if (editSchoolAccess.length === schools.length) {
          setEditSchoolAccess([]);
      } else {
          setEditSchoolAccess([...schools]);
      }
  };

  const handleSaveMapping = async () => {
      if (!editingExam) return;
      if (editToken.length < 3) return alert("Token minimal 3 karakter");
      
      await db.updateExamMapping(
          editingExam.id, 
          editToken.toUpperCase(), 
          editDuration,
          editDate,
          editSession,
          editSchoolAccess
      );
      setIsEditModalOpen(false);
      setEditingExam(null);
      loadData();
      alert("Mapping Jadwal & Akses Sekolah berhasil diperbarui!");
  };

  // --- QUESTION BANK LOGIC ---
  const handleSaveQuestion = async () => {
      if (!targetExamForAdd) return;
      if (!nqText.trim()) return alert("Teks soal wajib diisi!");
      const newQuestion: Question = {
          id: `manual`,
          type: nqType,
          text: nqText,
          imgUrl: nqImg || undefined,
          points: Number(nqPoints) || 0,
          options: nqOptions,
          correctIndex: nqCorrectIndex,
      };
      await db.addQuestions(targetExamForAdd.id, [newQuestion]);
      setIsAddQuestionModalOpen(false);
      loadData();
      alert("Soal berhasil ditambahkan!");
  };

  // --- IMPORT/EXPORT LOGIC ---
  const downloadQuestionTemplate = () => {
      // Template matched with parser logic (Header Row + Example Row)
      const headers = "No,Tipe,Jenis,Soal,Url Gambar,Opsi A,Opsi B,Opsi C,Opsi D,Kunci,Bobot";
      const example1 = "1,PG,UMUM,Siapa presiden pertama RI?,,Soekarno,Hatta,Habibie,Gus Dur,A,10";
      const blob = new Blob([headers + "\n" + example1], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = 'TEMPLATE_SOAL_DB.csv'; link.click();
  };
  
  const downloadStudentTemplate = () => {
      // Template matched with user import logic
      const headers = "NISN,NAMA,SEKOLAH,PASSWORD";
      const example = "1234567890,Ahmad Siswa,SD NEGERI 1,12345";
      const blob = new Blob([headers + "\n" + example], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = 'TEMPLATE_SISWA_DB.csv'; link.click();
  };

  const triggerImportQuestions = (examId: string) => { setImportTargetExamId(examId); setTimeout(() => questionFileRef.current?.click(), 100); };
  
  const handleExportQuestions = (exam: Exam) => {
      const headers = ["No", "Tipe", "Jenis", "Soal", "Url Gambar", "Opsi A", "Opsi B", "Opsi C", "Opsi D", "Kunci", "Bobot"];
      const rows = exam.questions.map((q, idx) => {
          const options = q.options || ["", "", "", ""];
          const keyMap = ['A', 'B', 'C', 'D'];
          const keyString = typeof q.correctIndex === 'number' ? keyMap[q.correctIndex] : 'A';
          return [String(idx + 1), q.type, "UMUM", escapeCSV(q.text), escapeCSV(q.imgUrl), escapeCSV(options[0]), escapeCSV(options[1]), escapeCSV(options[2]), escapeCSV(options[3]), keyString, String(q.points)].join(",");
      });
      const blob = new Blob([headers.join(",") + "\n" + rows.join("\n")], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.setAttribute('download', `BANK_SOAL_${exam.subject}.csv`); document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  const onQuestionFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!e.target.files?.[0] || !importTargetExamId) return;
      const file = e.target.files[0];
      const targetExam = exams.find(ex => ex.id === importTargetExamId);
      if (!targetExam) return;

      const processRows = (rows: any[]) => {
          const newQuestions: Question[] = rows.map((row, idx) => {
             // Handle both CSV array row and Excel object row (if using headers)
             // Assumption: Standard Template format
             // CSV Parser returns array of strings. Excel Parser (sheet_to_json) returns object or array of array.
             // Let's normalize. If it's Excel json, map keys to indices.
             
             let text, img, oa, ob, oc, od, key, points;
             
             if (Array.isArray(row)) {
                 if (row.length < 4) return null;
                 text = row[3]; img = row[4]; oa = row[5]; ob = row[6]; oc = row[7]; od = row[8]; key = row[9]; points = row[10];
             } else {
                 // Try to match Keys from Template
                 text = row['Soal'] || row['soal'];
                 img = row['Url Gambar'] || row['url_gambar'];
                 oa = row['Opsi A'] || row['opsi_a'];
                 ob = row['Opsi B'] || row['opsi_b'];
                 oc = row['Opsi C'] || row['opsi_c'];
                 od = row['Opsi D'] || row['opsi_d'];
                 key = row['Kunci'] || row['kunci'];
                 points = row['Bobot'] || row['bobot'];
             }

             if (!text) return null;

             const rawKey = key ? String(key).toUpperCase().trim() : 'A';
             let cIndex = rawKey.charCodeAt(0) - 65;
             if (cIndex < 0 || cIndex > 3) cIndex = 0; 

             return {
                  id: `imp-${idx}-${Date.now()}`,
                  type: 'PG',
                  text: text || 'Soal',
                  imgUrl: img && String(img).startsWith('http') ? img : undefined,
                  options: [oa || '', ob || '', oc || '', od || ''],
                  correctIndex: cIndex,
                  points: parseInt(points || '10')
             };
          }).filter(Boolean) as Question[];

          if (newQuestions.length) { 
              db.addQuestions(targetExam.id, newQuestions).then(() => {
                  loadData();
                  alert(`Berhasil import ${newQuestions.length} soal!`);
              }); 
          }
      };

      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
          const reader = new FileReader();
          reader.onload = (evt) => {
              const bstr = evt.target?.result;
              const wb = XLSX.read(bstr, { type: 'binary' });
              const wsname = wb.SheetNames[0];
              const ws = wb.Sheets[wsname];
              const data = XLSX.utils.sheet_to_json(ws);
              processRows(data);
          };
          reader.readAsBinaryString(file);
      } else {
          try {
              const text = await file.text();
              const rows = parseCSV(text).slice(1);
              processRows(rows);
          } catch (e: any) { console.error(e); alert("Format Salah atau file corrupt."); }
      }
      e.target.value = '';
  };

  const triggerImportStudents = () => { setTimeout(() => studentFileRef.current?.click(), 100); };
  
  const onStudentFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!e.target.files?.[0]) return;
      setIsProcessingImport(true);
      try {
          const text = await e.target.files[0].text();
          const rows = parseCSV(text).slice(1); // Skip header row
          
          const newUsers = rows.map((row, idx) => {
              // Row format: NISN, NAMA, SEKOLAH, PASSWORD
              if (!row[0] || !row[0].trim()) return null; // Skip empty rows
              
              const nisn = row[0].trim();
              const name = row[1] ? row[1].trim() : 'Siswa';
              const school = row[2] ? row[2].trim() : 'UMUM';
              const password = row[3] ? row[3].trim() : '12345';

              return {
                  id: `temp-${idx}`,
                  name: name,
                  nisn: nisn,
                  username: nisn,
                  password: password,
                  school: school,
                  role: UserRole.STUDENT
              };
          }).filter(Boolean) as User[];
          
          if (newUsers.length > 0) { 
              await db.importStudents(newUsers); 
              await loadData(); 
              alert(`Berhasil import ${newUsers.length} siswa!`); 
          } else {
              alert("File kosong atau format salah.");
          }
      } catch (e: any) { 
          console.error(e);
          alert("Gagal import siswa. Pastikan menggunakan Template CSV yang benar."); 
      }
      setIsProcessingImport(false);
      e.target.value = '';
  };

  const handleExportResultsExcel = () => {
      const filteredResults = results.filter(r => {
          if (resultSchoolFilter === 'ALL') return true;
          // Find user school from users array based on result studentId/Name (approx)
          const student = users.find(u => u.id === r.studentId);
          return student?.school === resultSchoolFilter;
      });

      if (filteredResults.length === 0) return alert("Tidak ada data untuk diexport");

      const headers = ["Nama Siswa", "Sekolah", "Mata Pelajaran", "Nilai", "Waktu Submit"];
      const rows = filteredResults.map(r => {
          const student = users.find(u => u.id === r.studentId);
          return [
              escapeCSV(r.studentName),
              escapeCSV(student?.school || '-'),
              escapeCSV(r.examTitle),
              String(r.score),
              new Date(r.submittedAt).toLocaleString()
          ].join(",");
      });

      const blob = new Blob([headers.join(",") + "\n" + rows.join("\n")], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.setAttribute('download', `HASIL_UJIAN_${resultSchoolFilter}.csv`); document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  const getMonitoringUsers = (schoolFilter: string) => {
      let filtered = users;
      if (schoolFilter !== 'ALL') filtered = filtered.filter(u => u.school === schoolFilter);
      if (monitoringSearch) filtered = filtered.filter(u => u.name.toLowerCase().includes(monitoringSearch.toLowerCase()) || u.nisn?.includes(monitoringSearch));
      return filtered;
  };

  // Derived Values
  const schools = (Array.from(new Set(users.map(u => u.school || 'Unknown'))).filter(Boolean) as string[]).sort();
  const totalSchools = schools.length;

  const NavItem = ({ id, label, icon: Icon }: { id: typeof activeTab, label: string, icon: any }) => (
      <button onClick={() => setActiveTab(id)} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition mb-1 text-sm font-medium ${activeTab === id ? 'bg-white/10 text-white shadow-inner ring-1 ring-white/20' : 'text-blue-100 hover:bg-white/5'}`}>
          <Icon size={18} /><span>{label}</span>
      </button>
  );

  return (
    <div className="flex h-screen bg-gray-100 font-sans overflow-hidden print:h-auto print:overflow-visible">
      <input type="file" ref={studentFileRef} className="hidden" accept=".csv" onChange={onStudentFileChange} />
      <input type="file" ref={questionFileRef} className="hidden" accept=".csv,.xlsx,.xls" onChange={onQuestionFileChange} />

      <aside className="w-64 flex-shrink-0 text-white flex flex-col shadow-xl z-20 transition-all duration-300 print:hidden" style={{ backgroundColor: themeColor }}>
          <div className="p-6 border-b border-white/10 flex items-center space-x-3">
              <BookOpen size={28} className="text-white drop-shadow-md" />
              <div><h1 className="font-bold text-lg tracking-wide">ADMIN SD</h1><p className="text-xs text-blue-100 opacity-80">Panel Sekolah Dasar</p></div>
          </div>
          <nav className="flex-1 p-4 overflow-y-auto custom-scrollbar">
              <NavItem id="DASHBOARD" label="Dashboard" icon={LayoutDashboard} />
              <NavItem id="MONITORING" label="Monitoring Ujian" icon={Activity} />
              <NavItem id="HASIL_UJIAN" label="Hasil Ujian" icon={ClipboardList} />
              <div className="my-2 border-t border-white/10"></div>
              <NavItem id="BANK_SOAL" label="Bank Soal" icon={Database} />
              <NavItem id="MAPPING" label="Mapping Sekolah" icon={Map} />
              <NavItem id="PESERTA" label="Data Peserta" icon={RotateCcw} />
              <NavItem id="CETAK_KARTU" label="Cetak Kartu" icon={Printer} />
          </nav>
          <div className="p-4 border-t border-white/10 bg-black/10">
               <button onClick={onLogout} className="w-full flex items-center justify-center space-x-2 bg-red-500/20 hover:bg-red-500/40 text-red-100 py-2 rounded text-xs font-bold transition border border-red-500/30">
                   <LogOut size={14} /> <span>Keluar</span>
               </button>
          </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-8 bg-gray-50/50 print:overflow-visible print:h-auto print:absolute print:top-0 print:left-0 print:w-full print:m-0 print:p-0 print:bg-white">
          {/* HEADER */}
          <header className="flex justify-between items-center mb-8 bg-white p-4 rounded-xl shadow-sm border border-gray-100 print:hidden">
               <h2 className="text-2xl font-bold text-gray-800 flex items-center">{activeTab.replace('_', ' ')}</h2>
               {isLoadingData && <span className="text-xs text-blue-500 animate-pulse flex items-center"><Loader2 size={12} className="animate-spin mr-1"/> Memuat Data...</span>}
          </header>

          {/* DASHBOARD */}
          {activeTab === 'DASHBOARD' && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-in fade-in print:hidden">
                  <div className="bg-white p-6 rounded-xl shadow-sm border hover:shadow-md transition border-l-4 border-l-blue-500"><p className="text-gray-500 text-xs font-bold uppercase">Total Mapel</p><h3 className="text-4xl font-bold text-gray-800 mt-2">{exams.length}</h3></div>
                  <div className="bg-white p-6 rounded-xl shadow-sm border hover:shadow-md transition border-l-4 border-l-green-500"><p className="text-gray-500 text-xs font-bold uppercase">Siswa Terdaftar</p><h3 className="text-4xl font-bold text-gray-800 mt-2">{users.length}</h3></div>
                  <div className="bg-white p-6 rounded-xl shadow-sm border hover:shadow-md transition border-l-4 border-l-purple-500"><p className="text-gray-500 text-xs font-bold uppercase">Jumlah Sekolah</p><h3 className="text-4xl font-bold text-gray-800 mt-2">{totalSchools}</h3></div>
                  <div className="bg-white p-6 rounded-xl shadow-sm border hover:shadow-md transition border-l-4 border-l-orange-500"><p className="text-gray-500 text-xs font-bold uppercase">Ujian Selesai</p><h3 className="text-4xl font-bold text-gray-800 mt-2">{results.length}</h3></div>
              </div>
          )}

          {/* MONITORING */}
          {activeTab === 'MONITORING' && (
               <div className="bg-white rounded-xl shadow-sm border p-6 animate-in fade-in print:hidden">
                   <h3 className="font-bold text-lg mb-4 flex items-center"><Activity size={20} className="mr-2 text-blue-600"/> Live Status Siswa</h3>
                   <div className="overflow-x-auto border rounded bg-white">
                       <table className="w-full text-sm text-left">
                           <thead className="bg-gray-50 font-bold border-b">
                                <tr>
                                    <th className="p-3">Nama</th>
                                    <th className="p-3">NISN</th>
                                    <th className="p-3">Sekolah</th>
                                    <th className="p-3">Status</th>
                                    <th className="p-3 text-center">Kontrol</th>
                                </tr>
                           </thead>
                           <tbody className="divide-y">
                               {getMonitoringUsers('ALL').filter(u => u.isLogin).map(u => (
                                   <tr key={u.id} className="hover:bg-gray-50">
                                       <td className="p-3">{u.name}</td>
                                       <td className="p-3 font-mono">{u.nisn}</td>
                                       <td className="p-3">{u.school}</td>
                                       <td className="p-3">
                                           <span className={`px-2 py-1 rounded text-xs font-bold ${u.status === 'working' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                               {u.status === 'working' ? 'Mengerjakan' : 'Login'}
                                           </span>
                                       </td>
                                       <td className="p-3 text-center">
                                           <button 
                                                title="Buka Freeze (Reset Status)" 
                                                onClick={async () => { await db.resetUserStatus(u.id); alert('Status siswa di-reset (Unfreeze).'); loadData(); }} 
                                                className="text-orange-600 bg-orange-50 border border-orange-200 p-1.5 rounded hover:bg-orange-100 transition"
                                            >
                                                <Flame size={16} />
                                           </button>
                                       </td>
                                   </tr>
                               ))}
                               {getMonitoringUsers('ALL').filter(u => u.isLogin).length === 0 && (
                                   <tr><td colSpan={5} className="p-4 text-center text-gray-500">Tidak ada siswa yang sedang online.</td></tr>
                               )}
                           </tbody>
                       </table>
                   </div>
               </div>
          )}

          {/* BANK SOAL */}
          {activeTab === 'BANK_SOAL' && (
              <div className="space-y-6 animate-in fade-in print:hidden">
                  <div className="flex justify-between items-center">
                      <h3 className="font-bold text-lg">Bank Soal & Materi</h3>
                      <button onClick={handleCreateExam} className="bg-blue-600 text-white px-4 py-2 rounded font-bold text-sm hover:bg-blue-700 flex items-center shadow-sm"><Plus size={16} className="mr-2"/> Tambah Mapel Baru</button>
                  </div>
                  {viewingQuestionsExam ? (
                      <div className="bg-white p-6 rounded-xl shadow-sm border">
                          <button onClick={() => setViewingQuestionsExam(null)} className="text-blue-600 mb-4 text-sm font-bold flex items-center hover:underline">← Kembali ke Daftar</button>
                          <h4 className="text-xl font-bold mb-4 border-b pb-2 flex justify-between items-center">
                              <span>{viewingQuestionsExam.title}</span>
                              <span className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-full">{viewingQuestionsExam.questions.length} Soal</span>
                          </h4>
                          <div className="flex flex-wrap gap-2 mb-6 bg-gray-50 p-4 rounded-lg border">
                               <button onClick={() => {setTargetExamForAdd(viewingQuestionsExam); setIsAddQuestionModalOpen(true);}} className="bg-green-600 text-white px-4 py-2 rounded text-sm font-bold flex items-center hover:bg-green-700 transition"><Plus size={16} className="mr-2"/> Input Manual</button>
                               <div className="h-8 w-px bg-gray-300 mx-2"></div>
                               <button onClick={downloadQuestionTemplate} className="bg-gray-600 text-white px-4 py-2 rounded text-sm font-bold flex items-center hover:bg-gray-700 transition"><FileText size={16} className="mr-2"/> Download Template</button>
                               <button onClick={() => triggerImportQuestions(viewingQuestionsExam.id)} className="bg-orange-500 text-white px-4 py-2 rounded text-sm font-bold flex items-center hover:bg-orange-600 transition"><Upload size={16} className="mr-2"/> Import Excel/CSV</button>
                               <button onClick={() => handleExportQuestions(viewingQuestionsExam)} className="bg-blue-500 text-white px-4 py-2 rounded text-sm font-bold flex items-center hover:bg-blue-600 transition"><Download size={16} className="mr-2"/> Export CSV</button>
                          </div>
                          <div className="space-y-3">
                              {viewingQuestionsExam.questions.map((q, i) => (
                                  <div key={q.id} className="p-4 border rounded-lg bg-white hover:bg-gray-50 transition flex justify-between items-start shadow-sm">
                                      <div className="flex-1 pr-4">
                                          <div className="flex items-center gap-2 mb-1">
                                              <span className="font-bold bg-gray-200 w-8 h-8 flex items-center justify-center rounded-full text-sm">{i+1}</span>
                                              <span className="text-xs font-bold px-2 py-0.5 bg-blue-100 text-blue-700 rounded">{q.type}</span>
                                          </div>
                                          <p className="text-gray-800 mt-2 text-sm">{q.text}</p>
                                      </div>
                                  </div>
                              ))}
                          </div>
                      </div>
                  ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {exams.map(ex => (
                              <div key={ex.id} className="bg-white p-5 rounded-xl border hover:shadow-lg transition cursor-pointer group" onClick={() => setViewingQuestionsExam(ex)}>
                                  <div className="flex justify-between items-start mb-4">
                                      <div className="bg-blue-50 p-3 rounded-lg group-hover:bg-blue-100 transition"><Database size={24} className="text-blue-600"/></div>
                                      <span className="text-xs font-bold bg-gray-100 px-2 py-1 rounded text-gray-600">{ex.questionCount} Items</span>
                                  </div>
                                  <h4 className="font-bold text-gray-800 text-lg mb-1">{ex.subject}</h4>
                                  <p className="text-sm text-gray-500 line-clamp-1">Token: {ex.token}</p>
                              </div>
                          ))}
                      </div>
                  )}
              </div>
          )}

          {/* MAPPING SEKOLAH */}
          {activeTab === 'MAPPING' && (
              <div className="bg-white rounded-xl shadow-sm border p-6 animate-in fade-in print:hidden">
                  <h3 className="font-bold text-lg mb-4 flex items-center"><Map size={20} className="mr-2 text-blue-600"/> Mapping Jadwal & Akses Sekolah</h3>
                  <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left">
                          <thead className="bg-gray-50 font-bold border-b">
                            <tr>
                                <th className="p-3">Mapel</th>
                                <th className="p-3">Tanggal & Sesi</th>
                                <th className="p-3">Durasi</th>
                                <th className="p-3">Token</th>
                                <th className="p-3">Akses Sekolah</th>
                                <th className="p-3">Aksi</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y">
                              {exams.map(ex => (
                                  <tr key={ex.id}>
                                      <td className="p-3 font-medium">{ex.title}</td>
                                      <td className="p-3">
                                          <div className="flex flex-col">
                                              <span className="font-bold">{ex.examDate || '-'}</span>
                                              <span className="text-xs text-gray-500">{ex.session || 'Sesi 1'}</span>
                                          </div>
                                      </td>
                                      <td className="p-3">{ex.durationMinutes} Menit</td>
                                      <td className="p-3 font-mono bg-yellow-50 font-bold">{ex.token}</td>
                                      <td className="p-3">
                                          {ex.schoolAccess && ex.schoolAccess.length > 0 ? (
                                              <div className="flex items-center">
                                                  <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold">{ex.schoolAccess.length} Sekolah</span>
                                              </div>
                                          ) : (
                                              <span className="bg-gray-100 text-gray-500 px-2 py-1 rounded text-xs">Belum di-set</span>
                                          )}
                                      </td>
                                      <td className="p-3"><button onClick={() => openMappingModal(ex)} className="bg-blue-50 text-blue-600 px-3 py-1 rounded font-bold text-xs hover:bg-blue-100 transition flex items-center"><Edit size={12} className="mr-1"/> Mapping</button></td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>
              </div>
          )}

          {/* PESERTA */}
          {activeTab === 'PESERTA' && (
               <div className="bg-white rounded-xl shadow-sm border p-6 animate-in fade-in print:hidden">
                   <div className="flex justify-between items-center mb-6">
                       <h3 className="font-bold text-lg">Data Peserta</h3>
                       <div className="flex gap-2">
                           <button onClick={downloadStudentTemplate} className="bg-green-600 text-white px-3 py-2 rounded text-sm font-bold flex items-center"><FileText size={16} className="mr-2"/> Template CSV</button>
                           <button onClick={triggerImportStudents} className="bg-blue-600 text-white px-3 py-2 rounded text-sm font-bold flex items-center hover:bg-blue-700"><Upload size={16} className="mr-2"/> Import Data</button>
                       </div>
                   </div>
                   <div className="mb-4 flex gap-4 bg-gray-50 p-4 rounded-lg border">
                       <div className="flex-1 relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                            <input placeholder="Cari nama atau NISN..." className="border rounded pl-9 pr-3 py-2 text-sm w-full" value={monitoringSearch} onChange={e => setMonitoringSearch(e.target.value)} />
                       </div>
                       <select className="border rounded p-2 text-sm min-w-[200px]" value={selectedSchoolFilter} onChange={e => setSelectedSchoolFilter(e.target.value)}>
                           <option value="ALL">Semua Sekolah</option>
                           {schools.map(s => <option key={s} value={s}>{s}</option>)}
                       </select>
                   </div>
                   <div className="overflow-x-auto border rounded bg-white">
                       <table className="w-full text-sm text-left">
                           <thead className="bg-gray-50 font-bold border-b"><tr><th className="p-3">Nama</th><th className="p-3">NISN</th><th className="p-3">Sekolah</th><th className="p-3 text-center">Kontrol</th></tr></thead>
                           <tbody className="divide-y">
                               {getMonitoringUsers(selectedSchoolFilter).map(u => (
                                   <tr key={u.id} className="hover:bg-gray-50">
                                       <td className="p-3">{u.name}</td><td className="p-3 font-mono">{u.nisn}</td><td className="p-3">{u.school}</td>
                                       <td className="p-3 text-center flex justify-center gap-2">
                                           <button title="Reset Login (Unlock)" onClick={async () => { await db.resetUserStatus(u.id); alert('Status login siswa di-reset (Unlock).'); loadData(); }} className="text-yellow-600 bg-yellow-50 border border-yellow-200 p-1.5 rounded hover:bg-yellow-100 transition"><Unlock size={14}/></button>
                                           <button title="Reset Password (12345)" onClick={async () => { if(confirm('Reset password jadi 12345?')) { await db.resetUserPassword(u.id); alert('Password di-reset menjadi 12345'); } }} className="text-blue-600 bg-blue-50 border border-blue-200 p-1.5 rounded hover:bg-blue-100 transition"><Key size={14}/></button>
                                           <button title="Hapus Siswa" onClick={() => {if(confirm('Hapus siswa?')) {db.deleteUser(u.id); loadData();}}} className="text-red-600 bg-red-50 border border-red-200 p-1.5 rounded hover:bg-red-100 transition"><Trash2 size={14}/></button>
                                       </td>
                                   </tr>
                               ))}
                           </tbody>
                       </table>
                   </div>
               </div>
          )}

          {/* HASIL UJIAN */}
          {activeTab === 'HASIL_UJIAN' && (
              <div className="bg-white rounded-xl shadow-sm border p-6 animate-in fade-in print:hidden">
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="font-bold text-lg">Rekap Hasil Ujian</h3>
                      <button onClick={handleExportResultsExcel} className="bg-green-600 text-white px-4 py-2 rounded font-bold text-sm flex items-center hover:bg-green-700 shadow-sm"><FileSpreadsheet size={16} className="mr-2"/> Export Excel (.csv)</button>
                  </div>
                  
                  <div className="mb-4 bg-gray-50 p-4 rounded-lg border flex items-center gap-4">
                      <Filter size={18} className="text-gray-500"/>
                      <span className="text-sm font-bold text-gray-700">Filter Lembaga:</span>
                      <select className="border rounded p-2 text-sm min-w-[250px]" value={resultSchoolFilter} onChange={e => setResultSchoolFilter(e.target.value)}>
                           <option value="ALL">Semua Lembaga/Sekolah</option>
                           {schools.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                  </div>

                  <div className="overflow-x-auto border rounded">
                      <table className="w-full text-sm text-left">
                          <thead className="bg-gray-50 font-bold border-b"><tr><th className="p-3">Nama</th><th className="p-3">Sekolah</th><th className="p-3">Mapel</th><th className="p-3">Nilai</th><th className="p-3">Waktu Submit</th></tr></thead>
                          <tbody className="divide-y">
                              {results
                                .filter(r => {
                                    if(resultSchoolFilter === 'ALL') return true;
                                    const st = users.find(u => u.id === r.studentId);
                                    return st?.school === resultSchoolFilter;
                                })
                                .map(r => {
                                  const student = users.find(u => u.id === r.studentId);
                                  return (
                                    <tr key={r.id} className="hover:bg-gray-50">
                                        <td className="p-3 font-medium">{r.studentName}</td>
                                        <td className="p-3 text-gray-600">{student?.school || '-'}</td>
                                        <td className="p-3">{r.examTitle}</td>
                                        <td className="p-3 font-bold text-blue-600">{r.score}</td>
                                        <td className="p-3 text-gray-500">{new Date(r.submittedAt).toLocaleString()}</td>
                                    </tr>
                                  );
                                })
                              }
                          </tbody>
                      </table>
                  </div>
              </div>
          )}

          {/* CETAK KARTU */}
          {activeTab === 'CETAK_KARTU' && (
              <div className="bg-white rounded-xl shadow-sm border p-6 animate-in fade-in print:shadow-none print:border-none print:p-0">
                  <div className="flex flex-col md:flex-row justify-between items-center mb-6 no-print gap-4 print:hidden">
                      <h3 className="font-bold text-lg">Cetak Kartu Peserta</h3>
                      <div className="flex flex-wrap gap-4 items-center bg-gray-50 p-3 rounded-lg border">
                          <div>
                              <label className="block text-xs font-bold text-gray-500 mb-1">Filter Sekolah</label>
                              <select className="border rounded p-1.5 text-sm w-48" value={cardSchoolFilter} onChange={e => setCardSchoolFilter(e.target.value)}>
                                  <option value="ALL">Semua Sekolah</option>
                                  {schools.map(s => <option key={s} value={s}>{s}</option>)}
                              </select>
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-gray-500 mb-1">Tanggal Cetak</label>
                              <input type="date" className="border rounded p-1.5 text-sm" value={printDate} onChange={e => setPrintDate(e.target.value)}/>
                          </div>
                          <button onClick={() => window.print()} className="bg-blue-600 text-white px-4 py-2 rounded font-bold text-sm flex items-center hover:bg-blue-700 h-full mt-4 md:mt-0"><Printer size={16} className="mr-2"/> Print</button>
                      </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 print:grid-cols-2 print:gap-4 print:w-full">
                      {getMonitoringUsers(cardSchoolFilter).map(u => (
                          <div key={u.id} className="border-2 border-gray-800 rounded-lg p-4 flex gap-4 break-inside-avoid relative bg-white">
                              <div className="w-24 flex flex-col items-center justify-center border-r-2 border-dashed border-gray-300 pr-4">
                                  <img src={FIXED_LOGO_URL} className="w-16 h-16 object-contain mb-2" alt="Logo"/>
                                  <div className="w-20 h-24 bg-gray-100 border border-gray-300 flex items-center justify-center text-[10px] text-center text-gray-400 font-bold rounded">FOTO 3x4</div>
                              </div>
                              <div className="flex-1 flex flex-col justify-between">
                                  <div className="border-b-2 border-gray-800 mb-2 pb-1 text-center">
                                      <h4 className="font-bold text-sm uppercase tracking-wider bg-blue-50 text-blue-900 rounded py-1 mb-1">UJI TKA MANDIRI</h4>
                                      <p className="text-[10px] text-gray-600 font-bold tracking-widest">KARTU PESERTA UJIAN</p>
                                  </div>
                                  <div className="text-xs space-y-1.5 flex-1 mt-2">
                                      <div className="grid grid-cols-3"><span className="font-bold text-gray-600">NAMA</span><span className="col-span-2 uppercase font-bold">: {u.name}</span></div>
                                      <div className="grid grid-cols-3"><span className="font-bold text-gray-600">NISN/USER</span><span className="col-span-2 font-mono font-bold">: {u.nisn || u.username}</span></div>
                                      <div className="grid grid-cols-3"><span className="font-bold text-gray-600">PASSWORD</span><span className="col-span-2 font-mono font-bold">: {u.password}</span></div>
                                      <div className="grid grid-cols-3"><span className="font-bold text-gray-600">SEKOLAH</span><span className="col-span-2">: {u.school || '-'}</span></div>
                                      <div className="grid grid-cols-3"><span className="font-bold text-gray-600">RUANG</span><span className="col-span-2">: 01</span></div>
                                  </div>
                                  <div className="mt-2 text-[10px] text-right text-gray-500 pt-2 border-t border-dotted border-gray-400">
                                      <p>Dicetak: {new Date(printDate).toLocaleDateString('id-ID', { dateStyle: 'long' })}</p>
                                      <p className="mt-4 font-bold underline">Panitia Ujian</p>
                                  </div>
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
          )}

      </main>

      {/* EDIT MODAL FOR MAPPING / SCHEDULE */}
      {isEditModalOpen && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm print:hidden">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
                  <h3 className="font-bold text-lg mb-4 flex items-center"><Map className="mr-2"/> Mapping Sekolah & Jadwal</h3>
                  <div className="space-y-4">
                      {/* Token */}
                      <div>
                          <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Token Ujian</label>
                          <div className="flex gap-2">
                              <input className="border rounded p-2 w-full font-mono uppercase font-bold text-lg tracking-wider" value={editToken} onChange={e => setEditToken(e.target.value.toUpperCase())}/>
                              <button onClick={() => setEditToken(Math.random().toString(36).substring(2,8).toUpperCase())} className="bg-gray-100 hover:bg-gray-200 border px-3 rounded"><Shuffle size={16}/></button>
                          </div>
                      </div>

                      {/* Date & Duration */}
                      <div className="grid grid-cols-2 gap-4">
                           <div>
                               <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Tanggal Ujian</label>
                               <input type="date" className="border rounded p-2 w-full" value={editDate} onChange={e => setEditDate(e.target.value)}/>
                           </div>
                           <div>
                               <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Durasi (Menit)</label>
                               <input type="number" className="border rounded p-2 w-full" value={editDuration} onChange={e => setEditDuration(Number(e.target.value))}/>
                           </div>
                      </div>

                      {/* Session */}
                      <div>
                          <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Sesi Ujian</label>
                          <select className="border rounded p-2 w-full" value={editSession} onChange={e => setEditSession(e.target.value)}>
                              <option value="Sesi 1">Sesi 1 (Pagi)</option>
                              <option value="Sesi 2">Sesi 2 (Siang)</option>
                              <option value="Sesi 3">Sesi 3 (Sore)</option>
                          </select>
                      </div>

                      {/* School Mapping Checklist */}
                      <div className="border rounded-lg bg-gray-50 overflow-hidden">
                           <div className="bg-gray-100 p-2 border-b flex justify-between items-center">
                               <label className="text-xs font-bold uppercase text-gray-600">Akses Sekolah (Checklist)</label>
                               <button onClick={toggleAllSchools} className="text-xs text-blue-600 font-bold hover:underline">Pilih Semua</button>
                           </div>
                           <div className="p-3 max-h-40 overflow-y-auto space-y-2">
                               {schools.length === 0 && <p className="text-xs text-center text-gray-400">Belum ada data sekolah siswa.</p>}
                               {schools.map(s => (
                                   <label key={s} className="flex items-center space-x-3 p-2 bg-white rounded border cursor-pointer hover:border-blue-400 transition">
                                       <input 
                                          type="checkbox" 
                                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" 
                                          checked={editSchoolAccess.includes(s)} 
                                          onChange={() => toggleSchoolAccess(s)}
                                       /> 
                                       <span className="text-sm font-medium text-gray-700">{s}</span>
                                   </label>
                               ))}
                           </div>
                      </div>

                      <button onClick={handleSaveMapping} className="bg-blue-600 text-white w-full py-2.5 rounded-lg font-bold mt-2 hover:bg-blue-700 transition shadow-sm">Simpan Mapping</button>
                      <button onClick={() => setIsEditModalOpen(false)} className="text-gray-500 w-full py-2 text-sm hover:underline">Batal</button>
                  </div>
              </div>
          </div>
      )}

      {/* ADD MANUAL QUESTION MODAL */}
      {isAddQuestionModalOpen && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm print:hidden">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl p-6 h-[90vh] overflow-y-auto animate-in zoom-in-95">
                  <div className="flex justify-between items-center mb-4"><h3 className="font-bold text-lg">Tambah Soal Manual</h3><button onClick={() => setIsAddQuestionModalOpen(false)}><X/></button></div>
                  <div className="space-y-4">
                      <select className="border rounded p-2 w-full" value={nqType} onChange={e => setNqType(e.target.value as QuestionType)}><option value="PG">Pilihan Ganda</option></select>
                      <textarea className="border rounded p-2 w-full h-24" placeholder="Teks Soal..." value={nqText} onChange={e => setNqText(e.target.value)}></textarea>
                      <div className="grid grid-cols-1 gap-2">
                          {nqOptions.map((opt, i) => (
                              <div key={i} className="flex items-center gap-2">
                                  <span className="font-bold w-6">{String.fromCharCode(65+i)}.</span>
                                  <input className="border rounded p-2 flex-1" value={opt} onChange={e => {const n = [...nqOptions]; n[i] = e.target.value; setNqOptions(n);}} placeholder={`Opsi ${String.fromCharCode(65+i)}`}/>
                                  <input type="radio" name="correct" checked={nqCorrectIndex === i} onChange={() => setNqCorrectIndex(i)}/>
                              </div>
                          ))}
                      </div>
                      <button onClick={handleSaveQuestion} className="bg-green-600 text-white w-full py-3 rounded font-bold">Simpan Soal</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};