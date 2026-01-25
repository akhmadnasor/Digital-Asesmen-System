import React, { useState, useEffect } from 'react';
import { User, Exam, AppSettings } from '../types';
import { db } from '../services/database'; // SWITCHED TO REAL DB
import { UserCircle, RefreshCcw, Lock, CheckCircle, Play } from 'lucide-react';
import { BackgroundShapes } from './BackgroundShapes';

interface StudentFlowProps {
  user: User;
  onStartExam: (exam: Exam) => void;
  onLogout: () => void;
  settings: AppSettings;
}

type Step = 'DASHBOARD' | 'DATA_CONFIRM' | 'TEST_CONFIRM';

// FIXED: Reliable Icon URLs (Flaticon)
const getSubjectIcon = (subject: string) => {
    const lower = subject.toLowerCase();
    
    // Bahasa Indonesia (Updated to Book Icon as requested)
    if (lower.includes('indonesia') || lower.includes('bahasa')) 
        return 'https://cdn-icons-png.flaticon.com/128/3389/3389081.png'; // 3D Book Icon

    // Matematika
    if (lower.includes('matematika') || lower.includes('math')) 
        return 'https://cdn-icons-png.flaticon.com/128/3965/3965108.png';
    
    // IPA (Remains for fallback, though removed from Mock Data)
    if (lower.includes('ipa') || lower.includes('alam') || lower.includes('sains')) 
        return 'https://cdn-icons-png.flaticon.com/128/2082/2082491.png';
    
    // IPS
    if (lower.includes('ips') || lower.includes('sosial')) 
        return 'https://cdn-icons-png.flaticon.com/128/921/921490.png';
    
    // PKN
    if (lower.includes('pkn') || lower.includes('kewarganegaraan')) 
        return 'https://cdn-icons-png.flaticon.com/128/9255/9255558.png';
    
    // PAI / Agama
    if (lower.includes('agama') || lower.includes('pai')) 
        return 'https://cdn-icons-png.flaticon.com/128/3004/3004458.png';

    // PJOK
    if (lower.includes('pjok') || lower.includes('olahraga')) 
        return 'https://cdn-icons-png.flaticon.com/128/2544/2544087.png';

    // SBdP / Seni
    if (lower.includes('seni') || lower.includes('budaya')) 
        return 'https://cdn-icons-png.flaticon.com/128/1048/1048944.png';

    // Default
    return 'https://cdn-icons-png.flaticon.com/128/2232/2232688.png';
};

export const StudentFlow: React.FC<StudentFlowProps> = ({ user, onStartExam, onLogout, settings }) => {
  const [step, setStep] = useState<Step>('DASHBOARD');
  const [availableExams, setAvailableExams] = useState<Exam[]>([]);
  const [completedExams, setCompletedExams] = useState<string[]>([]);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  
  // Confirmation Form State
  const [inputName, setInputName] = useState('');
  const [inputToken, setInputToken] = useState('');
  const [inputDay, setInputDay] = useState('01');
  const [inputMonth, setInputMonth] = useState('01');
  const [inputYear, setInputYear] = useState('2012');
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadExamsAndResults();
  }, [user.id]);

  const loadExamsAndResults = async () => {
    // 1. Get Exams
    const exams = await db.getExams('SD');
    
    // STRICT FILTER: Ensure only SD subjects and remove SMP if accidentally in DB
    const cleanExams = exams.filter(e => 
        (e.educationLevel === 'SD' || e.title.includes('SD')) && 
        !e.title.toLowerCase().includes('smp')
    );

    setAvailableExams(cleanExams);

    // 2. Get Results for this user to check what is done
    const allResults = await db.getAllResults();
    const myResults = allResults.filter(r => r.studentId === user.id);
    const finishedExamIds = myResults.map(r => r.examId);
    setCompletedExams(finishedExamIds);
  };

  const handleSelectExam = (exam: Exam) => {
    if (completedExams.includes(exam.id)) return; 
    
    setSelectedExam(exam);
    setStep('DATA_CONFIRM');
    // Pre-fill name for convenience
    setInputName(''); 
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

  // --- VIEW 1: DASHBOARD (Halaman 2) ---
  if (step === 'DASHBOARD') {
    const sortedExams = availableExams; 

    return (
      <div className="min-h-screen flex flex-col items-center pt-10 px-4 pb-10 overflow-hidden relative" style={themeStyle}>
        
        <BackgroundShapes />

        {/* Header/Logo Area - KEMDIKBUD LOGO */}
        <div className="flex flex-col items-center mb-6 text-white animate-in slide-in-from-top-10 fade-in duration-700 z-10">
             <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-6 py-2 rounded-full border border-white/20 shadow-lg">
                <img 
                    src="https://upload.wikimedia.org/wikipedia/commons/9/9c/Logo_of_Ministry_of_Education_and_Culture_of_Republic_of_Indonesia.svg" 
                    className="w-8 h-8 drop-shadow-md" 
                    alt="Logo Kemdikbud" 
                />
                <h1 className="text-lg font-bold tracking-wide drop-shadow-md">{settings.appName}</h1>
             </div>
             <p className="opacity-90 font-light drop-shadow-sm mt-2 text-sm">Selamat Datang, <strong>{user.name}</strong>!</p>
        </div>

        {/* Dashboard Grid Container */}
        <div className="w-full max-w-5xl z-10">
            
            {/* User Info Bar */}
            <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-4 mb-8 flex flex-col md:flex-row items-center justify-between border border-white/50">
                 <div className="flex items-center gap-4">
                     <div className="bg-blue-100 p-2 rounded-full border-2 border-blue-200">
                         <UserCircle className="text-blue-600" size={32}/>
                     </div>
                     <div>
                         <p className="text-xs text-gray-500 font-bold uppercase">Peserta Ujian</p>
                         <h2 className="text-lg font-bold text-gray-800">{user.name}</h2>
                         <p className="text-xs text-gray-500 font-mono">{user.nisn} | Kelas {user.grade || 6}</p>
                     </div>
                 </div>
                 
                 <div className="mt-4 md:mt-0 flex gap-3">
                     <div className="px-4 py-2 bg-green-50 text-green-700 rounded-lg text-xs font-bold border border-green-200 flex items-center">
                         <Lock size={14} className="mr-2"/> Akun Aman
                     </div>
                     <button onClick={onLogout} className="px-4 py-2 bg-red-50 text-red-700 rounded-lg text-xs font-bold border border-red-200 hover:bg-red-100 transition">
                         Keluar
                     </button>
                 </div>
            </div>

            <div className="text-center mb-6">
                 <h2 className="text-2xl font-bold text-white drop-shadow-md mb-2">Pilih Mata Pelajaran</h2>
                 <p className="text-blue-100 text-sm">Silakan pilih ujian yang tersedia di bawah ini untuk mulai mengerjakan.</p>
            </div>

            {/* 3D CARD GRID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
                {sortedExams.map((exam) => {
                    const isDone = completedExams.includes(exam.id);
                    return (
                        <div 
                            key={exam.id}
                            onClick={() => !isDone && handleSelectExam(exam)}
                            className={`
                                relative group rounded-3xl p-6 transition-all duration-300 transform flex flex-col items-center justify-between min-h-[280px] overflow-hidden
                                ${isDone 
                                    ? 'bg-white/80 border-4 border-green-200 grayscale-[0.3]' 
                                    : 'bg-white border-b-[10px] border-blue-200 hover:-translate-y-3 hover:shadow-2xl cursor-pointer hover:border-blue-400'
                                }
                            `}
                        >
                             {/* Floating Icon Container */}
                             <div className="relative w-full flex justify-center mt-4 mb-6 h-32 items-center">
                                 {/* Glowing effect behind */}
                                 <div className="absolute inset-0 bg-blue-400/20 blur-2xl rounded-full scale-50 group-hover:scale-100 transition-transform duration-500"></div>
                                 
                                 <img 
                                    src={getSubjectIcon(exam.subject)} 
                                    alt={exam.subject}
                                    className={`w-32 h-32 object-contain filter drop-shadow-xl z-10 transition-transform duration-500 ${!isDone && 'group-hover:scale-110 group-hover:-rotate-3'}`}
                                 />
                             </div>

                             <div className="text-center w-full z-10">
                                 <h3 className="text-xl font-extrabold text-gray-800 mb-1 leading-tight line-clamp-2">{exam.subject}</h3>
                                 <p className="text-xs text-gray-500 mb-4 font-semibold line-clamp-1">{exam.title}</p>
                                 
                                 <div className="flex justify-center gap-2 text-xs font-bold text-gray-500 mb-6 bg-gray-50 p-2 rounded-lg inline-flex">
                                     <span className="flex items-center"><span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-1"></span>{exam.durationMinutes} Menit</span>
                                     <span className="flex items-center"><span className="w-1.5 h-1.5 bg-orange-500 rounded-full mr-1"></span>{exam.questions.length} Soal</span>
                                 </div>

                                 {isDone ? (
                                     <div className="w-full py-3 bg-green-100 text-green-700 rounded-xl font-bold text-sm flex items-center justify-center shadow-inner">
                                         <CheckCircle size={18} className="mr-2"/> Sudah Dikerjakan
                                     </div>
                                 ) : (
                                     <button className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold text-sm shadow-blue-300 shadow-lg group-hover:bg-blue-700 transition flex items-center justify-center transform group-hover:scale-105 active:scale-95">
                                         <Play size={18} className="mr-2 fill-current"/> Kerjakan Sekarang
                                     </button>
                                 )}
                             </div>
                        </div>
                    );
                })}

                {sortedExams.length === 0 && (
                    <div className="col-span-full bg-white/50 backdrop-blur-sm rounded-xl p-12 text-center text-white border border-white/20 shadow-xl">
                        <div className="mb-4 text-6xl animate-pulse">📝</div>
                        <h3 className="text-xl font-bold mb-2">Belum Ada Jadwal Ujian SD</h3>
                        <p className="opacity-80">Silakan hubungi proktor atau admin sekolah untuk info lebih lanjut.</p>
                    </div>
                )}
            </div>

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
                     {/* KEMDIKBUD LOGO */}
                     <img 
                        src="https://upload.wikimedia.org/wikipedia/commons/9/9c/Logo_of_Ministry_of_Education_and_Culture_of_Republic_of_Indonesia.svg" 
                        className="w-12 h-12 drop-shadow-md" 
                        alt="Logo Kemdikbud" 
                     />
                     <div>
                         <h1 className="font-bold text-xl tracking-wide">{settings.appName}</h1>
                         <p className="text-sm opacity-90">Digital Assessment System (DAS) - SD</p>
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
                    </div>
                    
                    <button onClick={() => setStep('DASHBOARD')} className="w-full py-2 border border-gray-300 rounded text-gray-600 hover:bg-gray-50 font-bold text-sm">
                        Kembali ke Menu
                    </button>
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

                       <div className="flex gap-2 mt-8">
                           <button 
                             onClick={() => setStep('DATA_CONFIRM')}
                             className="flex-1 border border-gray-300 text-gray-600 font-bold py-3.5 rounded-full shadow-sm hover:bg-gray-50"
                           >
                               Batal
                           </button>
                           <button 
                             onClick={handleStartTest}
                             className="flex-1 text-white font-bold py-3.5 rounded-full shadow-lg transition transform hover:-translate-y-1 hover:shadow-xl"
                             style={{ backgroundColor: settings.themeColor }}
                           >
                               Mulai
                           </button>
                       </div>
                  </div>
             </div>
        </div>
     );
  }

  return <div>Error State</div>;
};