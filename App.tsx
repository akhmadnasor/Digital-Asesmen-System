import React, { useState, useEffect } from 'react';
import { User, UserRole, Exam, AppSettings } from './types';
import { db } from './services/database'; // SWITCHED TO REAL DB
import { cacheManager } from './utils/cache'; 
import { ExamInterface } from './components/ExamInterface';
import { AdminDashboard } from './components/AdminDashboard';
import { SuperAdminDashboard } from './components/SuperAdminDashboard';
import { StudentFlow } from './components/StudentFlow';
import { BackgroundShapes } from './components/BackgroundShapes';
import { LogIn, Lock, Eye, EyeOff } from 'lucide-react';
import { PWAInstallPrompt } from './components/PWAInstallPrompt';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeExam, setActiveExam] = useState<Exam | null>(null);
  const [loginInput, setLoginInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // App Settings State
  const [settings, setSettings] = useState<AppSettings>({
    appName: 'UJI TKA MANDIRI',
    themeColor: '#2459a9',
    gradientEndColor: '#60a5fa',
    logoStyle: 'circle',
    schoolLogoUrl: 'https://lh3.googleusercontent.com/d/1UXDrhKgeSjfFks_oXIMOVYgxFG_Bh1nm',
    antiCheat: { isActive: true, freezeDurationSeconds: 15, alertText: 'Violation!', enableSound: true }
  });

  useEffect(() => {
    cacheManager.initialize();
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const s = await db.getSettings();
      setSettings(s);
    } catch (error) {
      console.error("Failed to load settings", error);
    }
  };

  const refreshSettings = () => {
    loadSettings();
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const user = await db.login(loginInput, passwordInput);
    
    setLoading(false);
    if (user) {
      setCurrentUser(user);
    } else {
      alert('Data tidak ditemukan atau Password salah. \nPastikan Username dan Password benar.');
    }
  };

  const handleLogout = () => {
    cacheManager.clearSession();
    setCurrentUser(null);
    setActiveExam(null);
    setLoginInput('');
    setPasswordInput('');
    loadSettings(); 
  };

  const handleStartExam = (exam: Exam) => {
      setActiveExam(exam);
  };

  const handleExamComplete = () => {
      // Just clear active exam, let them go back to dashboard
      setActiveExam(null);
  };

  const loginBgStyle = {
    background: `linear-gradient(to bottom, ${settings.themeColor}, ${settings.gradientEndColor})`
  };

  return (
    <>
      <PWAInstallPrompt />
      {!currentUser ? (
        <div className="min-h-screen relative font-sans overflow-hidden" style={loginBgStyle}>
          
          <BackgroundShapes />

          <header className="fixed top-0 w-full z-50 bg-white/10 backdrop-blur-md border-b border-white/20 shadow-sm">
              <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                      <div className="bg-white p-1 rounded-full shadow">
                          <img 
                              src="https://upload.wikimedia.org/wikipedia/commons/9/9c/Logo_of_Ministry_of_Education_and_Culture_of_Republic_of_Indonesia.svg" 
                              className="h-10 w-10" 
                              alt="Logo Kemdikbud"
                          />
                      </div>
                      <div>
                          <h1 className="text-xl font-extrabold text-white tracking-wide drop-shadow-sm">{settings.appName}</h1>
                          <p className="text-xs text-blue-100 opacity-90">Digital Assessment System (DAS) - Jenjang SD</p>
                      </div>
                  </div>
              </div>
          </header>

          <div className="min-h-screen flex items-center justify-center p-4 pt-20">
              <div className="bg-white/95 backdrop-blur-sm p-8 md:p-12 rounded-2xl shadow-2xl w-full max-w-md relative z-10 border border-white/50 animate-in zoom-in-95 duration-500">
              
              <div className="flex justify-center mb-6">
                  <img 
                      src="https://lh3.googleusercontent.com/d/1UXDrhKgeSjfFks_oXIMOVYgxFG_Bh1nm" 
                      className="w-40 h-auto object-contain animate-float-slow filter drop-shadow-xl" 
                      alt="Logo Uji TKA Mandiri" 
                      referrerPolicy="no-referrer"
                  />
              </div>
              
              <h2 className="text-2xl font-bold text-center text-gray-800 mb-1">Selamat Datang</h2>
              <p className="text-gray-500 text-center mb-8 text-sm">Silakan login untuk memulai ujian</p>

              <form onSubmit={handleLogin} className="space-y-5">
                  <div>
                      <label className="block text-gray-700 text-sm font-bold mb-2">NISN / Username</label>
                      <div className="relative">
                          <UserCircleIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20}/>
                          <input 
                              type="text"
                              placeholder="NISN / Username" 
                              className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:ring-4 focus:ring-blue-100 outline-none transition text-gray-700"
                              style={{ borderColor: settings.themeColor }}
                              value={loginInput}
                              onChange={(e) => setLoginInput(e.target.value)}
                          />
                      </div>
                  </div>
                  
                  <div>
                      <label className="block text-gray-700 text-sm font-bold mb-2">Password</label>
                      <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20}/>
                          <input 
                              type={showPassword ? "text" : "password"}
                              placeholder="Password" 
                              className="w-full pl-10 pr-12 py-3 rounded-lg border border-gray-300 focus:ring-4 focus:ring-blue-100 outline-none transition text-gray-700"
                              style={{ borderColor: settings.themeColor }}
                              value={passwordInput}
                              onChange={(e) => setPasswordInput(e.target.value)}
                          />
                          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                      </div>
                  </div>

                  <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full text-white font-bold py-3.5 rounded-lg shadow-lg transition transform active:scale-95 flex items-center justify-center mt-4"
                  style={{ background: `linear-gradient(to right, ${settings.themeColor}, ${settings.gradientEndColor})` }}
                  >
                  {loading ? 'Memuat...' : <><LogIn className="mr-2" size={18}/> Masuk</>}
                  </button>
              </form>
              </div>
          </div>

          <div className="fixed bottom-6 w-full text-center z-20 pointer-events-none">
              <span className="inline-block bg-white/80 backdrop-blur rounded-full px-4 py-1.5 text-xs font-semibold shadow-lg border border-white/50" style={{ color: settings.themeColor }}>
                Digital Assessment System (DAS) @2026 | akhmadnasor
              </span>
          </div>

        </div>
      ) : currentUser.role === UserRole.SUPER_ADMIN ? (
        <SuperAdminDashboard user={currentUser} onLogout={handleLogout} settings={settings} onSettingsChange={refreshSettings} />
      ) : currentUser.role === UserRole.ADMIN ? (
        <AdminDashboard 
          user={currentUser} 
          onLogout={handleLogout} 
          appName={settings.appName} 
          onSettingsChange={refreshSettings} 
          themeColor={settings.themeColor} 
          settings={settings}
        />
      ) : activeExam ? (
        <ExamInterface 
          user={currentUser} 
          exam={activeExam} 
          onComplete={handleExamComplete} 
          appName={settings.appName}
          themeColor={settings.themeColor}
          settings={settings}
        />
      ) : (
        <StudentFlow 
            user={currentUser} 
            onStartExam={handleStartExam} 
            onLogout={handleLogout} 
            settings={settings}
        />
      )}
    </>
  );
};

const UserCircleIcon = ({className, size}: {className?: string, size?: number}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <circle cx="12" cy="12" r="10"></circle>
        <circle cx="12" cy="10" r="3"></circle>
        <path d="M7 20.662V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.662"></path>
    </svg>
);

export default App;