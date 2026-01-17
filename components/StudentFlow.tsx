import React, { useState, useEffect } from 'react';
import { User, Exam, AppSettings } from '../types';
import { db } from '../services/database';
import { GraduationCap, UserCircle, RefreshCcw, Lock } from 'lucide-react';
import { BackgroundShapes } from './BackgroundShapes';

interface StudentFlowProps {
  user: User;
  onStartExam: (exam: Exam) => void;
  onLogout: () => void;
  settings: AppSettings;
}

type Step = 'DASHBOARD' | 'DATA_CONFIRM' | 'TEST_CONFIRM';

export const StudentFlow: React.FC<StudentFlowProps> = ({ user, onStartExam, onLogout, settings }) => {
  const [step, setStep] = useState<Step>('DASHBOARD');
  const [selectedLevel, setSelectedLevel] = useState<'SD' | 'SMP'>('SD');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [availableExams, setAvailableExams] = useState<Exam[]>([]);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  
  // Confirmation Form State
  const [inputName, setInputName] = useState('');
  const [inputToken, setInputToken] = useState('');
  const [inputDay, setInputDay] = useState('01');
  const [inputMonth, setInputMonth] = useState('01');
  const [inputYear, setInputYear] = useState('2010');
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    db.getExams(selectedLevel).then(setAvailableExams);
  }, [selectedLevel]);

  const handleLevelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedLevel(e.target.value as 'SD' | 'SMP');
    setSelectedSubject(''); // Reset subject when level changes
  };

  const handleSubjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedSubject(e.target.value);
  };

  const handleStartSimulation = () => {
    if (!selectedSubject) {
      alert("Pilih mata pelajaran terlebih dahulu!");
      return;
    }
    const exam = availableExams.find(e => e.subject === selectedSubject);
    if (!exam) {
      alert("Ujian tidak ditemukan untuk mata pelajaran ini.");
      return;
    }
    setSelectedExam(exam);
    setStep('DATA_CONFIRM');
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
        setIsRefreshing(false);
    }, 1000);
  };

  const handleSubmitData = () => {
    if (!selectedExam) return;
    
    // Validate Input Name
    if (inputName.trim().toLowerCase() !== user.name.toLowerCase()) {
        alert(`Nama Peserta tidak sesuai! \nHarap ketik: "${user.name}"`);
        return;
    }

    // Validate Token
    if (inputToken.toUpperCase() !== selectedExam.token) {
        alert("Token Salah! Silakan hubungi pengawas/admin untuk token yang benar.");
        return;
    }

    setStep('TEST_CONFIRM');
  };

  const handleStartTest = () => {
    if (selectedExam) {
      onStartExam(selectedExam);
    }
  };

  const themeStyle = {
      background: `linear-gradient(to bottom, ${settings.themeColor}, ${settings.gradientEndColor})`
  };

  // Logo Container Logic
  const getLogoContainerClasses = () => {
      switch(settings.logoStyle) {
          case 'rect_3_4_vert': return 'rounded-xl w-24 h-32';
          case 'rect_4_3': return 'rounded-xl w-32 h-24';
          default: return 'rounded-full w-24 h-24';
      }
  };

  const getLogoImageClasses = () => {
    return settings.logoStyle === 'circle'
      ? 'rounded-full w-full h-full object-cover bg-white'
      : 'rounded w-full h-full object-contain bg-white';
  };

  // --- VIEW 1: DASHBOARD (Halaman 2) ---
  if (step === 'DASHBOARD') {
    return (
      <div className="min-h-screen flex flex-col items-center pt-20 px-4 pb-10 overflow-hidden relative" style={themeStyle}>
        
        <BackgroundShapes />

        {/* Header/Logo Area */}
        <div className="flex flex-col items-center mb-10 text-white animate-in slide-in-from-top-10 fade-in duration-700 z-10">
             <img src="https://upload.wikimedia.org/wikipedia/commons/9/9c/Logo_of_Ministry_of_Education_and_Culture_of_Republic_of_Indonesia.svg" className="w-20 h-20 mb-4 drop-shadow-lg" alt="Tut Wuri Handayani" />
             <h1 className="text-3xl font-bold tracking-wide text-center drop-shadow-md">{settings.appName}</h1>
             <p className="opacity-90 font-light drop-shadow-sm">Digital Assessment System (DAS)</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-lg text-center animate-in zoom-in-95 duration-500 z-10 relative mt-12">
             <div className={`flex items-center justify-center mx-auto absolute left-1/2 -translate-x-1/2 -top-12 ring-4 ring-white shadow-md ${getLogoContainerClasses()}`} style={{ backgroundColor: settings.themeColor }}>
                {settings.schoolLogoUrl ? (
                    <img src={settings.schoolLogoUrl} className={getLogoImageClasses()} alt="Logo" />
                ) : (
                    <GraduationCap className="text-white w-10 h-10" />
                )}
             </div>
             
             <h2 className="text-2xl font-bold text-gray-800 mb-2 mt-12">Simulasi TKA</h2>
             <p className="text-gray-500 mb-6 text-sm">Pilih jenjang dan mata pelajaran untuk memulai simulasi</p>

             {/* User Info "Menu" */}
             <div className="bg-gray-50 border border-gray-100 rounded-lg p-3 mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="bg-blue-100 p-2 rounded-full">
                        <UserCircle className="text-blue-600" size={20}/>
                    </div>
                    <div className="text-left">
                        <p className="text-xs text-gray-500 font-bold uppercase">Peserta</p>
                        <p className="text-sm font-bold text-gray-800">{user.name}</p>
                    </div>
                </div>
                <div className="bg-green-100 p-2 rounded-full" title="Akun Terkunci & Aman">
                    <Lock className="text-green-600" size={16}/>
                </div>
             </div>

             <div className="space-y-4 text-left">
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1 flex items-center gap-2">
                         Jenjang Pendidikan:
                    </label>
                    <select 
                        className="w-full border border-gray-300 rounded-lg p-3 text-gray-700 focus:ring-2 outline-none transition"
                        style={{ '--tw-ring-color': settings.themeColor } as React.CSSProperties}
                        value={selectedLevel}
                        onChange={handleLevelChange}
                    >
                        <option value="SD">SD/MI/Sederajat</option>
                        <option value="SMP">SMP/MTS/Sederajat</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1 flex items-center gap-2">
                         Jenis Mata Pelajaran:
                    </label>
                    <select disabled className="w-full border border-gray-300 rounded-lg p-3 text-gray-500 bg-gray-100 cursor-not-allowed">
                        <option>Mata Pelajaran Wajib</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1 flex items-center gap-2">
                         Mata Pelajaran:
                    </label>
                    <select 
                        className="w-full border border-gray-300 rounded-lg p-3 text-gray-700 focus:ring-2 outline-none transition"
                        style={{ '--tw-ring-color': settings.themeColor } as React.CSSProperties}
                        value={selectedSubject}
                        onChange={handleSubjectChange}
                    >
                        <option value="">-- Pilih Mata Pelajaran --</option>
                        {availableExams.map(e => (
                            <option key={e.id} value={e.subject}>{e.subject}</option>
                        ))}
                    </select>
                </div>
             </div>

             <button 
                onClick={handleStartSimulation}
                className="w-full mt-8 text-white font-bold py-3 rounded-lg shadow-lg transition transform active:scale-95 flex items-center justify-center hover:opacity-90"
                style={{ backgroundColor: settings.themeColor }}
             >
                Mulai Simulasi
             </button>
             
             <button onClick={onLogout} className="mt-4 text-sm text-gray-400 hover:text-red-500 underline">Logout</button>
        </div>
      </div>
    );
  }

  // --- VIEW 2: DATA CONFIRMATION (Halaman 3) ---
  if (step === 'DATA_CONFIRM' && selectedExam) {
    return (
        <div className="min-h-screen bg-white flex flex-col font-sans overflow-x-hidden">
            {/* Background Header Block */}
            <div className="h-48 w-full absolute top-0 z-0 shadow-md" style={{ backgroundColor: settings.themeColor }}></div>
            
            <header className="relative z-10 flex justify-between items-center p-6 text-white max-w-7xl mx-auto w-full">
                 <div className="flex items-center gap-4">
                     <img src="https://upload.wikimedia.org/wikipedia/commons/9/9c/Logo_of_Ministry_of_Education_and_Culture_of_Republic_of_Indonesia.svg" className="w-12 h-12 drop-shadow-md" />
                     <div>
                         <h1 className="font-bold text-xl tracking-wide">{settings.appName}</h1>
                         <p className="text-sm opacity-90">Digital Assessment System (DAS)</p>
                     </div>
                 </div>
                 <div className="text-right text-xs md:text-sm bg-black/20 px-3 py-1 rounded">
                     <p className="font-mono">{user.id} - PESERTA TKA</p>
                 </div>
            </header>

            <main className="relative z-10 max-w-6xl mx-auto w-full mt-4 flex flex-col md:flex-row gap-6 px-4 pb-12">
                 {/* Left Panel: Token & User Menu */}
                 <div className="w-full md:w-1/3 space-y-4">
                    <div className="bg-white rounded shadow-md p-4 flex items-center justify-between border-l-4 animate-in slide-in-from-left-4 duration-500" style={{ borderColor: settings.themeColor }}>
                        <div>
                            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Status Token</p>
                            <div className="flex items-center space-x-2">
                                <div className={`h-2 w-2 rounded-full ${isRefreshing ? 'bg-yellow-400 animate-pulse' : 'bg-green-500'}`}></div>
                                <p className="text-sm font-bold text-gray-700">{isRefreshing ? 'Memuat...' : 'Aktif'}</p>
                            </div>
                        </div>
                        <button 
                            onClick={handleRefresh}
                            className="text-white px-3 py-1.5 text-xs font-bold rounded hover:opacity-90 transition flex items-center shadow-sm"
                            style={{ backgroundColor: settings.themeColor }}
                        >
                            <RefreshCcw size={12} className={`mr-1 ${isRefreshing ? 'animate-spin' : ''}`} /> Refresh
                        </button>
                    </div>

                    {/* User Profile "Menu" */}
                    <div className="bg-white rounded shadow-md p-4 border-l-4 border-gray-300">
                         <div className="flex items-center gap-3">
                            <div className="bg-gray-100 p-2 rounded-full">
                                <UserCircle className="text-gray-600" size={24}/>
                            </div>
                            <div>
                                <p className="text-sm font-bold text-gray-800">{user.name}</p>
                                <p className="text-xs text-gray-500">{user.nisn} <span className="mx-1">•</span> {user.school || 'Sekolah'}</p>
                            </div>
                         </div>
                         <div className="mt-3 pt-3 border-t flex justify-between items-center text-xs text-gray-500">
                             <span>Akun Terproteksi</span>
                             <Lock size={12} />
                         </div>
                    </div>
                 </div>

                 {/* Right Panel: Form */}
                 <div className="w-full md:w-2/3 bg-white rounded shadow-lg p-6 md:p-8 animate-in slide-in-from-right-4 duration-500 mb-8">
                      <h2 className="text-xl font-bold text-gray-700 mb-6 border-b pb-4">Konfirmasi data Peserta</h2>
                      
                      <div className="grid grid-cols-1 gap-y-4 text-sm">
                          {/* Static Data Fields */}
                          <div className="grid grid-cols-1 md:grid-cols-3 md:items-center gap-1">
                              <label className="font-bold text-gray-700">NISN</label>
                              <div className="md:col-span-2 text-gray-600 font-mono bg-gray-50 p-2 rounded border border-gray-100">{user.nisn || '-'}</div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 md:items-center gap-1">
                              <label className="font-bold text-gray-700">Nama Peserta</label>
                              <div className="md:col-span-2 text-gray-600 font-bold uppercase bg-gray-50 p-2 rounded border border-gray-100">{user.name}</div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 md:items-center gap-1">
                              <label className="font-bold text-gray-700">Jenis Kelamin</label>
                              <div className="md:col-span-2 text-gray-600 bg-gray-50 p-2 rounded border border-gray-100">{user.gender || '-'}</div>
                          </div>
                           {/* School Origin Field */}
                          <div className="grid grid-cols-1 md:grid-cols-3 md:items-center gap-1">
                              <label className="font-bold text-gray-700">Asal Sekolah</label>
                              <div className="md:col-span-2 text-gray-600 bg-gray-50 p-2 rounded border border-gray-100">{user.school || 'Tidak Diketahui'}</div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 md:items-center gap-1">
                              <label className="font-bold text-gray-700">Mata Ujian</label>
                              <div className="md:col-span-2 text-gray-600 bg-gray-50 p-2 rounded border border-gray-100">{selectedExam.title}</div>
                          </div>

                          <div className="border-t my-2 border-gray-100"></div>

                          {/* Interactive Inputs */}
                          <div className="grid grid-cols-1 md:grid-cols-3 md:items-center gap-1 mt-2">
                              <label className="font-bold text-gray-700">Nama Peserta</label>
                              <input 
                                className="md:col-span-2 border rounded p-2.5 focus:ring-2 w-full outline-none transition" 
                                style={{ '--tw-ring-color': settings.themeColor } as React.CSSProperties}
                                placeholder="Ketikkan Nama Peserta"
                                value={inputName}
                                onChange={e => setInputName(e.target.value)}
                              />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 md:items-center gap-1">
                              <label className="font-bold text-gray-700">Tanggal Lahir</label>
                              <div className="md:col-span-2 flex gap-2">
                                  <select value={inputDay} onChange={e => setInputDay(e.target.value)} className="border rounded p-2.5 flex-1 focus:ring-2 outline-none" style={{ '--tw-ring-color': settings.themeColor } as React.CSSProperties}>
                                      {Array.from({length: 31}, (_, i) => i + 1).map(d => (
                                          <option key={d} value={d < 10 ? `0${d}` : d}>{d}</option>
                                      ))}
                                  </select>
                                  <select value={inputMonth} onChange={e => setInputMonth(e.target.value)} className="border rounded p-2.5 flex-1 focus:ring-2 outline-none" style={{ '--tw-ring-color': settings.themeColor } as React.CSSProperties}>
                                     {['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'].map((m, i) => (
                                         <option key={i} value={i < 9 ? `0${i+1}` : i+1}>{m}</option>
                                     ))}
                                  </select>
                                  <select value={inputYear} onChange={e => setInputYear(e.target.value)} className="border rounded p-2.5 flex-1 focus:ring-2 outline-none" style={{ '--tw-ring-color': settings.themeColor } as React.CSSProperties}>
                                     {Array.from({length: 15}, (_, i) => 2005 + i).map(y => (
                                         <option key={y} value={y}>{y}</option>
                                     ))}
                                  </select>
                              </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 md:items-center gap-1 mt-2 bg-blue-50 p-3 rounded border border-blue-100">
                              <label className="font-bold text-gray-700">Token</label>
                              <div className="md:col-span-2">
                                <input 
                                    className="border rounded p-2.5 focus:ring-2 w-full uppercase font-mono tracking-widest text-lg font-bold" 
                                    style={{ '--tw-ring-color': settings.themeColor } as React.CSSProperties}
                                    placeholder="Ketikkan token"
                                    maxLength={6}
                                    value={inputToken}
                                    onChange={e => setInputToken(e.target.value.toUpperCase())}
                                />
                                <p className="text-xs text-gray-500 mt-1 italic">*Token didapat dari proktor (Hint: <strong>{selectedExam.token}</strong>)</p>
                              </div>
                          </div>
                      </div>

                      <button 
                        onClick={handleSubmitData}
                        className="w-full text-white font-bold py-3.5 rounded mt-8 shadow-md hover:shadow-lg transition transform active:scale-95"
                        style={{ backgroundColor: settings.themeColor }}
                      >
                          Submit
                      </button>
                 </div>
            </main>
        </div>
    );
  }

  // --- VIEW 3: TEST CONFIRMATION MODAL (Halaman 4) ---
  if (step === 'TEST_CONFIRM' && selectedExam) {
     return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
             <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-300">
                  <div className="p-4 text-white text-center" style={{ backgroundColor: settings.themeColor }}>
                    <h3 className="font-bold tracking-wide">{settings.appName}</h3>
                  </div>
                  <div className="p-8">
                       <div className="flex justify-center mb-4">
                           <div className="bg-red-50 p-3 rounded-full animate-pulse">
                               <Lock className="text-red-500" size={32}/>
                           </div>
                       </div>
                       <h2 className="text-2xl font-bold text-gray-800 mb-2 text-center">Konfirmasi Tes</h2>
                       <p className="text-center text-gray-500 text-sm mb-6">Pastikan anda siap mengerjakan. Sistem anti-curang akan aktif.</p>
                       
                       <div className="space-y-4 text-sm bg-gray-50 p-4 rounded-lg border border-gray-100">
                           <div className="flex justify-between border-b border-gray-200 pb-2">
                               <span className="font-bold text-gray-500">Nama Tes</span>
                               <span className="font-bold text-gray-800">{selectedExam.title}</span>
                           </div>
                           <div className="flex justify-between border-b border-gray-200 pb-2">
                               <span className="font-bold text-gray-500">Waktu</span>
                               <span className="font-bold text-gray-800">{selectedExam.durationMinutes} Menit</span>
                           </div>
                           <div className="flex justify-between">
                               <span className="font-bold text-gray-500">Token</span>
                               <span className="font-bold text-gray-800 font-mono tracking-wider">{selectedExam.token}</span>
                           </div>
                       </div>

                       <button 
                         onClick={handleStartTest}
                         className="w-full text-white font-bold py-3.5 rounded-full mt-8 shadow-lg transition transform hover:-translate-y-1 hover:shadow-xl"
                         style={{ backgroundColor: settings.themeColor }}
                       >
                           Mulai Mengerjakan
                       </button>
                  </div>
             </div>
        </div>
     );
  }

  return <div>Error State</div>;
};
