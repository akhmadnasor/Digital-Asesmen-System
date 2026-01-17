import React, { useState, useEffect } from 'react';
import { User, Exam } from '../types';
import { mockDb } from '../services/mockStore';
import { Plus, BookOpen, Save, LogOut, Loader2, Key, RotateCcw, Clock, Upload, Download, FileText, Image as ImageIcon, Type, LayoutDashboard, Settings, Printer, Filter, Calendar, FileSpreadsheet, Lock } from 'lucide-react';

interface AdminDashboardProps {
  user: User;
  onLogout: () => void;
  appName: string;
  onSettingsChange: () => void;
  themeColor: string;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ user, onLogout, appName, onSettingsChange, themeColor }) => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'SOAL' | 'PESERTA' | 'CETAK_KARTU' | 'PENGATURAN'>('DASHBOARD');
  
  // Create/Edit State
  const [editingTokenId, setEditingTokenId] = useState<string | null>(null);
  const [newToken, setNewToken] = useState('');
  
  // Settings State
  const [customLogo, setCustomLogo] = useState<string | null>(null);
  const [newAppName, setNewAppName] = useState(appName);
  
  // Print Settings
  const [printDate, setPrintDate] = useState(new Date().toISOString().split('T')[0]);

  // Filters
  const [selectedSchoolFilter, setSelectedSchoolFilter] = useState<string>('ALL');

  useEffect(() => {
    loadData();
    setNewAppName(appName);
  }, [appName]);

  const loadData = async () => {
    const e = await mockDb.getExams();
    const u = await mockDb.getUsers();
    setExams(e);
    setUsers(u.filter(x => x.role === 'STUDENT'));
  };

  const handleUpdateToken = async (examId: string) => {
      if(newToken.length < 3) return alert("Token terlalu pendek");
      await mockDb.updateExamToken(examId, newToken.toUpperCase());
      setEditingTokenId(null);
      setNewToken('');
      loadData();
  };

  const handleResetUser = async (userId: string) => {
      if(confirm("Reset status login peserta ini?")) {
          await mockDb.resetUserStatus(userId);
          alert("Peserta berhasil di-reset.");
          loadData();
      }
  };
  
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const url = URL.createObjectURL(e.target.files[0]);
          setCustomLogo(url);
          alert("Logo berhasil diperbarui (Simulasi)");
      }
  };

  const handleSaveAppName = async () => {
      if (newAppName.trim().length > 0) {
          await mockDb.updateSettings({ appName: newAppName });
          onSettingsChange();
          alert("Nama Aplikasi berhasil diperbarui!");
      }
  };

  const downloadTemplate = (type: 'USER' | 'QUESTION') => {
      let content = "";
      let filename = "";

      if (type === 'USER') {
          // Comprehensive Student Template
          const headers = [
              "No", "NISN", "Username", "Password", "Nama Lengkap", 
              "Asal Sekolah", "Jenis Kelamin (L/P)", "Tanggal Lahir (YYYY-MM-DD)", "Kelas"
          ];
          const sampleData = [
              "1,1234567890,siswa01,12345,Ahmad Dahlan,SDN 1 BEJI,L,2012-05-20,6",
              "2,0987654321,siswa02,12345,Siti Aminah,SDIT NURUL FIKRI,P,2012-08-17,6"
          ];
          content = headers.join(",") + "\n" + sampleData.join("\n");
          filename = "TEMPLATE_DATA_PESERTA.csv";
      } else {
          // Comprehensive Question Template covering all types
          const headers = [
              "Tipe Soal (PG/PG_KOMPLEKS/CHECKLIST/URAIAN/DRAG_DROP)",
              "Pertanyaan",
              "Opsi Jawaban (Pisahkan dengan pipe |)",
              "Kunci Jawaban (Index 0-3 untuk PG | Index dipisah koma untuk Multi | Teks untuk Uraian)",
              "Poin",
              "URL Gambar (Opsional)"
          ];
          const sampleData = [
              "PG,Apa ibukota Jawa Barat?,Bandung|Jakarta|Semarang|Surabaya,0,10,",
              "PG_KOMPLEKS,Pilih bilangan prima di bawah 10,2|4|6|7,0;3,10,",
              "CHECKLIST,Manakah yang termasuk bangun datar?,Kubus|Persegi|Bola|Segitiga,1;3,10,",
              "URAIAN,Jelaskan proses fotosintesis secara singkat!,,,Kata kunci: matahari;klorofil,10,",
              "DRAG_DROP,Pasangkan Ibukota Provinsi berikut,Jawa Barat-Bandung|Jawa Timur-Surabaya|Bali-Denpasar,,10,"
          ];
          content = headers.join(",") + "\n" + sampleData.join("\n");
          filename = "TEMPLATE_BANK_SOAL_LENGKAP.csv";
      }

      const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
  };

  const handlePrintPDF = () => {
    // This leverages the browser's built-in print-to-pdf functionality
    window.print();
  };

  const getExamStatus = (exam: Exam) => {
      if (!exam.startDate || !exam.endDate) return 'unknown';
      const now = new Date();
      const start = new Date(exam.startDate);
      const end = new Date(exam.endDate);

      if (now < start) return 'upcoming';
      if (now >= start && now <= end) return 'ongoing';
      return 'completed';
  };

  // Helper to extract unique schools
  const schools = Array.from(new Set(users.map(u => u.school || 'Unknown'))).sort();

  const filteredUsers = selectedSchoolFilter === 'ALL' 
    ? users 
    : users.filter(u => u.school === selectedSchoolFilter);

  // Format Date for Signature
  const formatDateIndo = (dateStr: string) => {
      const date = new Date(dateStr);
      return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const NavItem = ({ id, label, icon: Icon }: { id: typeof activeTab, label: string, icon: any }) => (
      <button 
        onClick={() => setActiveTab(id)}
        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition mb-1 text-sm font-medium ${activeTab === id ? 'bg-white/10 text-white shadow-inner' : 'text-blue-100 hover:bg-white/5'}`}
      >
          <Icon size={18} />
          <span>{label}</span>
      </button>
  );

  return (
    <div className="flex h-screen bg-gray-100 font-sans overflow-hidden">
      
      {/* Sidebar - Hidden on Print */}
      <aside className="w-64 flex-shrink-0 text-white flex flex-col shadow-xl z-20 transition-all duration-300 print:hidden" style={{ backgroundColor: themeColor }}>
          <div className="p-6 border-b border-white/10 flex items-center space-x-3">
              <BookOpen size={28} className="text-white drop-shadow-md" />
              <div>
                  <h1 className="font-bold text-lg tracking-wide">ADMIN CBT</h1>
                  <p className="text-xs text-blue-100 opacity-80">Panel Sekolah</p>
              </div>
          </div>
          
          <nav className="flex-1 p-4 overflow-y-auto custom-scrollbar">
              <p className="text-xs font-bold text-blue-200 uppercase tracking-wider mb-2 px-4 mt-2">Menu Utama</p>
              <NavItem id="DASHBOARD" label="Dashboard" icon={LayoutDashboard} />
              <NavItem id="SOAL" label="Bank Soal" icon={FileText} />
              <NavItem id="PESERTA" label="Data Peserta" icon={RotateCcw} />
              <NavItem id="CETAK_KARTU" label="Cetak Kartu" icon={Printer} />
              
              <p className="text-xs font-bold text-blue-200 uppercase tracking-wider mb-2 px-4 mt-6">Konfigurasi</p>
              <NavItem id="PENGATURAN" label="Pengaturan" icon={Settings} />
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
          
          {/* Header - Hidden on Print */}
          <header className="flex justify-between items-center mb-8 bg-white p-4 rounded-xl shadow-sm border border-gray-100 print:hidden">
               <div>
                   <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                       {activeTab === 'DASHBOARD' && <LayoutDashboard className="mr-3 text-blue-600"/>}
                       {activeTab === 'SOAL' && <FileText className="mr-3 text-blue-600"/>}
                       {activeTab === 'PESERTA' && <RotateCcw className="mr-3 text-blue-600"/>}
                       {activeTab === 'CETAK_KARTU' && <Printer className="mr-3 text-blue-600"/>}
                       {activeTab === 'PENGATURAN' && <Settings className="mr-3 text-blue-600"/>}
                       {activeTab === 'DASHBOARD' ? 'Overview' : 
                        activeTab === 'SOAL' ? 'Manajemen Bank Soal' :
                        activeTab === 'PESERTA' ? 'Manajemen Peserta' :
                        activeTab === 'CETAK_KARTU' ? 'Cetak Kartu Ujian' :
                        'Pengaturan Aplikasi'}
                   </h2>
                   <p className="text-gray-500 text-sm mt-1">Selamat datang kembali di panel administrasi.</p>
               </div>
               <div className="text-right hidden md:block">
                   <p className="text-sm font-bold text-gray-700">{new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                   <p className="text-xs text-gray-400">System Ready</p>
               </div>
          </header>

          {/* DASHBOARD VIEW */}
          {activeTab === 'DASHBOARD' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 print:hidden">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex justify-between items-center hover:shadow-md transition">
                          <div>
                              <p className="text-sm text-gray-500 font-bold uppercase">Total Ujian</p>
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

                  {/* Exam Schedule Overview */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                      <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                          <h3 className="font-bold text-gray-800 flex items-center"><Calendar className="mr-2" size={18}/> Monitoring Jadwal Ujian</h3>
                      </div>
                      <div className="p-6">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                              {/* Ongoing */}
                              <div className="space-y-3">
                                  <h4 className="text-sm font-bold text-green-600 flex items-center"><span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span> Sedang Berlangsung</h4>
                                  {exams.filter(e => getExamStatus(e) === 'ongoing').length === 0 ? <p className="text-xs text-gray-400 italic">Tidak ada ujian.</p> : 
                                    exams.filter(e => getExamStatus(e) === 'ongoing').map(e => (
                                      <div key={e.id} className="bg-green-50 border border-green-100 p-3 rounded-lg">
                                          <p className="font-bold text-sm text-gray-800">{e.title}</p>
                                          <p className="text-xs text-gray-500">{new Date(e.startDate!).toLocaleTimeString()} - {new Date(e.endDate!).toLocaleTimeString()}</p>
                                      </div>
                                    ))
                                  }
                              </div>
                              {/* Upcoming */}
                              <div className="space-y-3">
                                  <h4 className="text-sm font-bold text-blue-600 flex items-center"><span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span> Akan Datang</h4>
                                  {exams.filter(e => getExamStatus(e) === 'upcoming').length === 0 ? <p className="text-xs text-gray-400 italic">Tidak ada ujian.</p> : 
                                    exams.filter(e => getExamStatus(e) === 'upcoming').map(e => (
                                      <div key={e.id} className="bg-blue-50 border border-blue-100 p-3 rounded-lg">
                                          <p className="font-bold text-sm text-gray-800">{e.title}</p>
                                          <p className="text-xs text-gray-500">{new Date(e.startDate!).toLocaleString()}</p>
                                      </div>
                                    ))
                                  }
                              </div>
                              {/* Completed */}
                              <div className="space-y-3">
                                  <h4 className="text-sm font-bold text-gray-600 flex items-center"><span className="w-2 h-2 bg-gray-500 rounded-full mr-2"></span> Telah Selesai</h4>
                                  {exams.filter(e => getExamStatus(e) === 'completed').length === 0 ? <p className="text-xs text-gray-400 italic">Tidak ada ujian.</p> : 
                                    exams.filter(e => getExamStatus(e) === 'completed').map(e => (
                                      <div key={e.id} className="bg-gray-50 border border-gray-200 p-3 rounded-lg opacity-75">
                                          <p className="font-bold text-sm text-gray-800">{e.title}</p>
                                          <p className="text-xs text-gray-500">Selesai: {new Date(e.endDate!).toLocaleString()}</p>
                                      </div>
                                    ))
                                  }
                              </div>
                          </div>
                      </div>
                  </div>
              </div>
          )}

          {/* BANK SOAL VIEW */}
          {activeTab === 'SOAL' && (
              <div className="space-y-6 animate-in fade-in print:hidden">
                  {/* Token Management */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                      <h3 className="font-bold text-gray-800 mb-4 flex items-center"><Key className="mr-2" size={20}/> Token Ujian Aktif</h3>
                      <div className="space-y-3">
                        {exams.map(exam => (
                            <div key={exam.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border">
                                <div>
                                    <p className="font-bold text-gray-700">{exam.title}</p>
                                    <p className="text-xs text-gray-500">{exam.subject} | {exam.durationMinutes} Menit</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    {editingTokenId === exam.id ? (
                                        <div className="flex gap-1">
                                            <input 
                                                className="border rounded px-2 py-1 w-24 uppercase font-mono text-sm"
                                                value={newToken}
                                                onChange={e => setNewToken(e.target.value)}
                                                placeholder="TOKEN"
                                                maxLength={6}
                                            />
                                            <button onClick={() => handleUpdateToken(exam.id)} className="bg-green-500 text-white px-2 rounded text-xs font-bold">OK</button>
                                        </div>
                                    ) : (
                                        <span className="font-mono bg-yellow-100 text-yellow-800 px-3 py-1 rounded font-bold tracking-widest border border-yellow-200">
                                            {exam.token}
                                        </span>
                                    )}
                                    <button onClick={() => { setEditingTokenId(exam.id); setNewToken(exam.token); }} className="text-blue-600 hover:text-blue-800">
                                        <RotateCcw size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                      </div>
                  </div>

                  {/* Import/Export */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                      <h3 className="font-bold text-gray-800 mb-4 flex items-center"><FileText className="mr-2" size={20}/> Import & Export Soal</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="p-4 border rounded-lg bg-orange-50/30 border-orange-100">
                              <h4 className="font-bold text-sm text-gray-700 mb-2">Template Soal Lengkap</h4>
                              <p className="text-xs text-gray-500 mb-3">Mendukung PG, PG Kompleks, Checklist, Uraian, dan Drag & Drop.</p>
                              <button onClick={() => downloadTemplate('QUESTION')} className="bg-white border border-gray-300 text-gray-700 px-3 py-2 rounded text-xs font-bold flex items-center hover:bg-gray-50 w-full justify-center">
                                  <FileSpreadsheet size={14} className="mr-2"/> Download Template Excel/CSV
                              </button>
                          </div>
                          <div className="p-4 border rounded-lg bg-blue-50/30 border-blue-100">
                              <h4 className="font-bold text-sm text-gray-700 mb-2">Upload Data</h4>
                              <div className="flex gap-2">
                                  <button className="bg-blue-600 text-white px-3 py-2 rounded text-xs font-bold flex items-center hover:bg-blue-700 w-full justify-center">
                                      <Upload size={14} className="mr-2"/> Import Soal
                                  </button>
                              </div>
                          </div>
                      </div>
                  </div>
              </div>
          )}

          {/* PESERTA VIEW */}
          {activeTab === 'PESERTA' && (
              <div className="space-y-6 animate-in fade-in print:hidden">
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                      <div className="flex justify-between items-center mb-4">
                          <h3 className="font-bold text-gray-800">Daftar Peserta & Status Login</h3>
                          <div className="flex gap-2">
                               <button onClick={() => downloadTemplate('USER')} className="bg-white border border-gray-300 text-gray-600 px-3 py-2 rounded text-xs font-bold flex items-center hover:bg-gray-50">
                                  <FileSpreadsheet size={14} className="mr-2"/> Template Data Peserta
                               </button>
                               <button className="bg-blue-600 text-white px-3 py-2 rounded text-xs font-bold flex items-center hover:bg-blue-700">
                                  <Upload size={14} className="mr-2"/> Import Data
                               </button>
                          </div>
                      </div>
                      
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 text-gray-600 border-b border-gray-200">
                                <tr>
                                    <th className="p-3">Nama</th>
                                    <th className="p-3">NISN</th>
                                    <th className="p-3">Asal Sekolah</th>
                                    <th className="p-3">Password</th>
                                    <th className="p-3">Status</th>
                                    <th className="p-3">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {users.map(u => (
                                    <tr key={u.id} className="hover:bg-gray-50">
                                        <td className="p-3 font-medium">{u.name}</td>
                                        <td className="p-3 text-gray-500 font-mono">{u.nisn}</td>
                                        <td className="p-3 text-gray-500">{u.school || '-'}</td>
                                        <td className="p-3 text-gray-500 font-mono tracking-widest">12345*</td>
                                        <td className="p-3">
                                            {u.isLocked ? 
                                                <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold">Terkunci</span> : 
                                                <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold">Ready</span>
                                            }
                                        </td>
                                        <td className="p-3">
                                            <button 
                                                onClick={() => handleResetUser(u.id)}
                                                className="text-red-600 hover:text-red-800 text-xs font-bold border border-red-200 bg-red-50 px-3 py-1 rounded"
                                            >
                                                Reset Login
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

          {/* CETAK KARTU VIEW */}
          {activeTab === 'CETAK_KARTU' && (
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 animate-in fade-in">
                  
                  {/* Left Filter Panel - Hidden on Print */}
                  <div className="lg:col-span-1 print:hidden">
                      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sticky top-6">
                          <h3 className="font-bold text-gray-800 mb-4 flex items-center"><Filter size={18} className="mr-2"/> Filter Data</h3>
                          <div className="space-y-4">
                              <div>
                                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Pilih Sekolah</label>
                                  <div className="space-y-2">
                                      <button 
                                        onClick={() => setSelectedSchoolFilter('ALL')}
                                        className={`w-full text-left px-3 py-2 text-sm rounded transition ${selectedSchoolFilter === 'ALL' ? 'bg-blue-50 text-blue-700 font-bold border border-blue-200' : 'text-gray-600 hover:bg-gray-50'}`}
                                      >
                                          Semua Sekolah
                                      </button>
                                      {schools.map(school => (
                                          <button 
                                            key={school}
                                            onClick={() => setSelectedSchoolFilter(school)}
                                            className={`w-full text-left px-3 py-2 text-sm rounded transition ${selectedSchoolFilter === school ? 'bg-blue-50 text-blue-700 font-bold border border-blue-200' : 'text-gray-600 hover:bg-gray-50'}`}
                                          >
                                              {school}
                                          </button>
                                      ))}
                                  </div>
                              </div>
                          </div>
                      </div>
                  </div>

                  {/* Right Content: Cards Grid */}
                  <div className="lg:col-span-3 print:col-span-4 print:w-full">
                      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 min-h-[500px] print:border-0 print:shadow-none print:p-0">
                           {/* Print Controls & Header */}
                           <div className="mb-6 print:hidden">
                               <div className="flex justify-between items-center mb-4">
                                   <div>
                                       <h3 className="font-bold text-gray-800 text-lg">Preview Kartu Ujian ({filteredUsers.length})</h3>
                                       <p className="text-xs text-gray-500">Menampilkan siswa dari {selectedSchoolFilter === 'ALL' ? 'Semua Sekolah' : selectedSchoolFilter}</p>
                                   </div>
                               </div>
                               
                               {/* Print Settings Area */}
                               <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex flex-col md:flex-row items-end md:items-center gap-4">
                                   <div className="flex-1 w-full">
                                       <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Tanggal Cetak (Titik Mangsa)</label>
                                       <input 
                                         type="date"
                                         value={printDate}
                                         onChange={(e) => setPrintDate(e.target.value)}
                                         className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                       />
                                   </div>
                                   <button 
                                      onClick={handlePrintPDF}
                                      className="w-full md:w-auto bg-slate-800 text-white px-6 py-2.5 rounded-lg font-bold text-sm flex items-center justify-center hover:bg-slate-900 transition shadow-sm"
                                  >
                                      <Printer size={16} className="mr-2"/> Download PDF / Cetak
                                  </button>
                               </div>
                           </div>

                           <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:grid print:grid-cols-2 print:gap-4 print-grid">
                                {filteredUsers.map(u => (
                                    <div key={u.id} className="border border-gray-300 rounded-lg overflow-hidden flex flex-col bg-white break-inside-avoid shadow-sm print:shadow-none print:border-gray-800">
                                        {/* Card Header */}
                                        <div className="bg-white border-b border-gray-200 p-3 flex items-center space-x-3 print:border-gray-800" style={{ borderTop: `4px solid ${themeColor}` }}>
                                            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center print:border print:border-gray-300">
                                                {customLogo ? 
                                                    <img src={customLogo} className="w-8 h-8 object-contain" /> : 
                                                    <ImageIcon className="text-gray-400" size={20}/>
                                                }
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-sm text-gray-800 uppercase tracking-tight">{appName}</h4>
                                                <p className="text-[10px] text-gray-500 uppercase">Kartu Peserta Ujian</p>
                                            </div>
                                        </div>

                                        {/* Card Body */}
                                        <div className="p-4 text-sm space-y-2 flex-1">
                                            <div className="grid grid-cols-3">
                                                <span className="text-gray-500 text-xs font-bold uppercase print:text-black">Nama</span>
                                                <span className="col-span-2 font-bold text-gray-800 print:text-black">{u.name}</span>
                                            </div>
                                            <div className="grid grid-cols-3">
                                                <span className="text-gray-500 text-xs font-bold uppercase print:text-black">NISN</span>
                                                <span className="col-span-2 font-mono text-gray-700 print:text-black">{u.nisn || '-'}</span>
                                            </div>
                                            <div className="grid grid-cols-3">
                                                <span className="text-gray-500 text-xs font-bold uppercase print:text-black">Username</span>
                                                <span className="col-span-2 font-mono font-bold print:text-black">{u.username}</span>
                                            </div>
                                            <div className="grid grid-cols-3">
                                                <span className="text-gray-500 text-xs font-bold uppercase print:text-black">Password</span>
                                                <span className="col-span-2 font-mono print:text-black">12345*</span>
                                            </div>
                                            <div className="grid grid-cols-3">
                                                <span className="text-gray-500 text-xs font-bold uppercase print:text-black">Sekolah</span>
                                                <span className="col-span-2 text-gray-700 print:text-black">{u.school}</span>
                                            </div>
                                        </div>

                                        {/* Card Footer: Signature & Schedule */}
                                        <div className="bg-white p-3 text-xs border-t border-gray-200 print:border-gray-800 flex justify-between items-end">
                                            <div className="flex-1">
                                                <p className="font-bold text-gray-500 mb-1 uppercase flex items-center print:text-black"><Clock size={10} className="mr-1"/> Jadwal</p>
                                                {exams.filter(e => getExamStatus(e) === 'upcoming' || getExamStatus(e) === 'ongoing').slice(0, 1).map(e => (
                                                     <div key={e.id} className="print:text-black">
                                                         <span className="block font-bold">{e.subject}</span>
                                                         <span className="text-[10px]">{new Date(e.startDate!).toLocaleDateString()}</span>
                                                     </div>
                                                ))}
                                                {exams.filter(e => getExamStatus(e) === 'upcoming' || getExamStatus(e) === 'ongoing').length === 0 && (
                                                    <span className="text-gray-400 italic"> - </span>
                                                )}
                                            </div>
                                            <div className="text-center min-w-[100px]">
                                                <p className="mb-6 print:text-black">Kota, {formatDateIndo(printDate)}</p>
                                                <p className="font-bold border-t border-gray-400 pt-1 print:border-black print:text-black">Panitia Ujian</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {filteredUsers.length === 0 && (
                                    <div className="col-span-2 text-center py-10 text-gray-400">
                                        Tidak ada data siswa untuk sekolah ini.
                                    </div>
                                )}
                           </div>
                      </div>
                  </div>
              </div>
          )}

          {/* PENGATURAN VIEW */}
          {activeTab === 'PENGATURAN' && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-in fade-in print:hidden">
                  <h3 className="font-bold text-gray-800 mb-6 pb-2 border-b">Konfigurasi Identitas Sekolah</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div>
                          <label className="block text-sm font-bold text-gray-700 mb-2">Logo Sekolah</label>
                          <div className="flex items-center gap-4">
                                <div className="w-24 h-24 bg-gray-50 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
                                    {customLogo ? <img src={customLogo} className="w-full h-full object-contain p-2" /> : <ImageIcon className="text-gray-300" />}
                                </div>
                                <div>
                                    <input type="file" accept="image/*" onChange={handleLogoUpload} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition mb-1" />
                                    <span className="text-xs text-gray-400">Max 2MB (PNG/JPG)</span>
                                </div>
                          </div>
                      </div>

                      <div>
                          <label className="block text-sm font-bold text-gray-700 mb-2">Nama Aplikasi</label>
                          <div className="flex gap-2">
                              <input 
                                  value={newAppName}
                                  onChange={(e) => setNewAppName(e.target.value)}
                                  className="flex-1 border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  placeholder="Contoh: Digital Assessment System"
                              />
                              <button 
                                  onClick={handleSaveAppName} 
                                  className="bg-blue-600 text-white px-4 py-2 rounded font-bold text-sm hover:bg-blue-700"
                              >
                                  Simpan
                              </button>
                          </div>
                          <p className="text-xs text-gray-400 mt-2">Digunakan pada Header Login dan Kartu Ujian.</p>
                      </div>
                  </div>
              </div>
          )}

      </main>
    </div>
  );
};