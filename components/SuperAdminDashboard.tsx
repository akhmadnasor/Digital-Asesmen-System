import React, { useState, useEffect } from 'react';
import { User, UserRole, AppSettings } from '../types';
import { mockDb } from '../services/mockStore';
import { Users, LogOut, Shield, UserPlus, Trash2, Edit, Search, LayoutDashboard, Palette, Save, AlertTriangle, Speaker, Clock, Upload, Image as ImageIcon } from 'lucide-react';

interface Props {
    user: User;
    onLogout: () => void;
    settings: AppSettings;
    onSettingsChange: () => void;
}

export const SuperAdminDashboard: React.FC<Props> = ({ user, onLogout, settings, onSettingsChange }) => {
    const [users, setUsers] = useState<User[]>([]);
    const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'USERS' | 'THEME' | 'ANTI_CHEAT'>('DASHBOARD');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    
    // Theme State
    const [primaryColor, setPrimaryColor] = useState(settings.themeColor);
    const [gradientEnd, setGradientEnd] = useState(settings.gradientEndColor);
    const [logoStyle, setLogoStyle] = useState<'circle' | 'rect_4_3'>(settings.logoStyle);
    const [logoUrl, setLogoUrl] = useState<string | undefined>(settings.schoolLogoUrl);

    // Anti Cheat State
    const [acActive, setAcActive] = useState(settings.antiCheat.isActive);
    const [acFreeze, setAcFreeze] = useState(settings.antiCheat.freezeDurationSeconds);
    const [acText, setAcText] = useState(settings.antiCheat.alertText);
    const [acSound, setAcSound] = useState(settings.antiCheat.enableSound);

    // Form State for User
    const [newUserRole, setNewUserRole] = useState<UserRole>(UserRole.ADMIN);
    const [newName, setNewName] = useState('');
    const [newUsername, setNewUsername] = useState('');
    const [newNisn, setNewNisn] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = () => {
        mockDb.getUsers().then(setUsers);
    };

    const handleDeleteUser = async (id: string) => {
        if (confirm('Apakah Anda yakin ingin menghapus user ini?')) {
            await mockDb.deleteUser(id);
            loadData();
        }
    };

    const handleAddUser = async (e: React.FormEvent) => {
        e.preventDefault();
        const newUser: User = {
            id: `usr-${Date.now()}`,
            name: newName,
            username: newUsername,
            role: newUserRole,
            nisn: newNisn,
            grade: newUserRole === UserRole.STUDENT ? 6 : undefined
        };
        await mockDb.addUser(newUser);
        setIsAddModalOpen(false);
        setNewName('');
        setNewUsername('');
        setNewNisn('');
        loadData();
    };

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const url = URL.createObjectURL(e.target.files[0]);
            setLogoUrl(url);
        }
    };

    const handleSaveTheme = async () => {
        await mockDb.updateSettings({
            themeColor: primaryColor,
            gradientEndColor: gradientEnd,
            logoStyle: logoStyle,
            schoolLogoUrl: logoUrl
        });
        onSettingsChange();
        alert("Tema warna dan logo berhasil disimpan!");
    };

    const handleSaveAntiCheat = async () => {
        await mockDb.updateSettings({
            antiCheat: {
                isActive: acActive,
                freezeDurationSeconds: acFreeze,
                alertText: acText,
                enableSound: acSound
            }
        });
        onSettingsChange();
        alert("Pengaturan Anti-Kecurangan berhasil disimpan!");
    };

    const NavItem = ({ id, label, icon: Icon }: { id: typeof activeTab, label: string, icon: any }) => (
      <button 
        onClick={() => setActiveTab(id)}
        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition mb-1 text-sm font-medium ${activeTab === id ? 'bg-white/10 text-white' : 'text-blue-100 hover:bg-white/5'}`}
      >
          <Icon size={18} />
          <span>{label}</span>
      </button>
    );

    return (
        <div className="flex h-screen bg-gray-100 font-sans overflow-hidden">
             
             {/* Sidebar */}
             <aside className="w-64 flex-shrink-0 bg-slate-900 text-white flex flex-col shadow-xl z-20">
                <div className="p-6 border-b border-white/10 flex items-center space-x-3">
                    <Shield size={28} className="text-yellow-400" />
                    <div>
                        <h1 className="font-bold text-lg tracking-wide">SUPER ADMIN</h1>
                        <p className="text-xs text-slate-400">Root Access</p>
                    </div>
                </div>
                
                <nav className="flex-1 p-4 overflow-y-auto">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 px-4 mt-2">Main Menu</p>
                    <NavItem id="DASHBOARD" label="Dashboard" icon={LayoutDashboard} />
                    <NavItem id="USERS" label="Manajemen User" icon={Users} />
                    <NavItem id="THEME" label="Tema & Logo" icon={Palette} />
                    <NavItem id="ANTI_CHEAT" label="Anti Kecurangan" icon={AlertTriangle} />
                </nav>

                <div className="p-4 border-t border-white/10 bg-black/20">
                    <button onClick={onLogout} className="w-full flex items-center justify-center space-x-2 bg-red-600 hover:bg-red-700 text-white py-2 rounded text-xs font-bold transition">
                        <LogOut size={14} /> <span>Keluar System</span>
                    </button>
                </div>
             </aside>

             <main className="flex-1 overflow-y-auto p-8">
                {/* Dashboard View */}
                {activeTab === 'DASHBOARD' && (
                    <div className="animate-in fade-in">
                        <h2 className="text-2xl font-bold text-gray-800 mb-6">System Overview</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                                <p className="text-gray-500 text-xs font-bold uppercase mb-1">Total Admin</p>
                                <h3 className="text-4xl font-bold text-slate-700">{users.filter(u => u.role === UserRole.ADMIN).length}</h3>
                            </div>
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                                <p className="text-gray-500 text-xs font-bold uppercase mb-1">Total Siswa</p>
                                <h3 className="text-4xl font-bold text-green-600">{users.filter(u => u.role === UserRole.STUDENT).length}</h3>
                            </div>
                        </div>
                    </div>
                )}

                {/* User Management View */}
                {activeTab === 'USERS' && (
                    <div className="animate-in fade-in">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-gray-800">Manajemen Pengguna</h2>
                            <button 
                                onClick={() => setIsAddModalOpen(true)}
                                className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center shadow-sm transition"
                            >
                                <UserPlus size={18} className="mr-2" /> Tambah User
                            </button>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                             <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center gap-4">
                                <div className="relative flex-1 max-w-md">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18}/>
                                    <input placeholder="Cari user..." className="pl-10 pr-4 py-2 border rounded-lg w-full text-sm focus:outline-none focus:border-slate-500" />
                                </div>
                             </div>
                             <table className="w-full text-left">
                                <thead className="bg-gray-50 text-gray-500 font-bold text-xs uppercase border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-4">Nama</th>
                                        <th className="px-6 py-4">Role</th>
                                        <th className="px-6 py-4">NISN/Username</th>
                                        <th className="px-6 py-4 text-center">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 text-sm">
                                    {users.map((u) => (
                                        <tr key={u.id} className="hover:bg-gray-50 transition">
                                            <td className="px-6 py-4 font-bold text-gray-700">{u.name}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded text-xs font-bold 
                                                    ${u.role === UserRole.SUPER_ADMIN ? 'bg-purple-100 text-purple-700' : 
                                                      u.role === UserRole.ADMIN ? 'bg-blue-100 text-blue-700' : 
                                                      'bg-green-100 text-green-700'}`}>
                                                    {u.role}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-gray-500 font-mono">{u.nisn || u.username}</td>
                                            <td className="px-6 py-4 text-center">
                                                {u.role !== UserRole.SUPER_ADMIN && (
                                                    <button onClick={() => handleDeleteUser(u.id)} className="p-2 text-red-500 hover:bg-red-50 rounded"><Trash2 size={16}/></button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                             </table>
                        </div>
                    </div>
                )}

                {/* Theme Management View */}
                {activeTab === 'THEME' && (
                    <div className="animate-in fade-in">
                        <h2 className="text-xl font-bold text-gray-800 mb-6">Pengaturan Tema & Logo</h2>
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 max-w-2xl">
                            
                            <div className="mb-8 border-b pb-6">
                                <label className="block text-sm font-bold text-gray-700 mb-3">Logo Aplikasi (Custom)</label>
                                <div className="flex items-start gap-6">
                                    <div className="flex-shrink-0">
                                        <div className={`flex items-center justify-center bg-gray-100 border-2 border-dashed border-gray-300 overflow-hidden ${logoStyle === 'circle' ? 'w-24 h-24 rounded-full' : 'w-32 h-24 rounded-lg'}`}>
                                            {logoUrl ? (
                                                <img src={logoUrl} alt="Preview" className="w-full h-full object-cover" />
                                            ) : (
                                                <ImageIcon className="text-gray-400 w-8 h-8" />
                                            )}
                                        </div>
                                        <p className="text-[10px] text-gray-400 mt-2 text-center">Preview ({logoStyle})</p>
                                    </div>
                                    <div className="flex-1 space-y-4">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Upload Gambar Baru</label>
                                            <div className="flex gap-2">
                                                <input 
                                                    type="file" 
                                                    accept="image/*"
                                                    onChange={handleLogoUpload}
                                                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" 
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Bentuk Logo</label>
                                            <div className="flex gap-3">
                                                <button 
                                                    onClick={() => setLogoStyle('circle')}
                                                    className={`px-3 py-1.5 rounded text-xs font-bold border transition ${logoStyle === 'circle' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'border-gray-300 text-gray-600'}`}
                                                >
                                                    Circle (Bulat)
                                                </button>
                                                <button 
                                                    onClick={() => setLogoStyle('rect_4_3')}
                                                    className={`px-3 py-1.5 rounded text-xs font-bold border transition ${logoStyle === 'rect_4_3' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'border-gray-300 text-gray-600'}`}
                                                >
                                                    Persegi (4:3)
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Warna Utama (Primary)</label>
                                    <div className="flex items-center gap-3">
                                        <input 
                                            type="color" 
                                            value={primaryColor}
                                            onChange={(e) => setPrimaryColor(e.target.value)}
                                            className="h-10 w-10 p-0 border-0 rounded cursor-pointer"
                                        />
                                        <span className="font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded">{primaryColor}</span>
                                    </div>
                                    <p className="text-xs text-gray-400 mt-2">Warna dasar header dan tombol utama.</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Warna Gradasi (Secondary)</label>
                                    <div className="flex items-center gap-3">
                                        <input 
                                            type="color" 
                                            value={gradientEnd}
                                            onChange={(e) => setGradientEnd(e.target.value)}
                                            className="h-10 w-10 p-0 border-0 rounded cursor-pointer"
                                        />
                                        <span className="font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded">{gradientEnd}</span>
                                    </div>
                                    <p className="text-xs text-gray-400 mt-2">Warna akhir untuk efek gradasi background.</p>
                                </div>
                            </div>

                            <button 
                                onClick={handleSaveTheme}
                                className="bg-slate-800 text-white px-6 py-3 rounded-lg font-bold hover:bg-slate-900 transition flex items-center"
                            >
                                <Save size={18} className="mr-2" /> Simpan Perubahan
                            </button>
                        </div>
                    </div>
                )}

                {/* Anti Cheat Management View */}
                {activeTab === 'ANTI_CHEAT' && (
                    <div className="animate-in fade-in">
                        <h2 className="text-xl font-bold text-gray-800 mb-6">Pengaturan Sistem Keamanan</h2>
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
                                        className="w-full border rounded-lg px-3 py-2 text-sm h-24"
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

                            <div className="mt-8 pt-6 border-t">
                                <button 
                                    onClick={handleSaveAntiCheat}
                                    className="bg-slate-800 text-white px-6 py-3 rounded-lg font-bold hover:bg-slate-900 transition flex items-center"
                                >
                                    <Save size={18} className="mr-2" /> Simpan Konfigurasi
                                </button>
                            </div>

                        </div>
                    </div>
                )}
             </main>

             {/* Add User Modal */}
             {isAddModalOpen && (
                 <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                     <div className="bg-white rounded-xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in duration-200">
                         <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                             <h3 className="font-bold text-lg text-gray-800">Tambah User Baru</h3>
                             <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-gray-600">✕</button>
                         </div>
                         <form onSubmit={handleAddUser} className="p-6 space-y-4">
                             <div>
                                 <label className="block text-sm font-bold text-gray-700 mb-1">Role User</label>
                                 <div className="grid grid-cols-2 gap-4">
                                     <button 
                                        type="button"
                                        onClick={() => setNewUserRole(UserRole.ADMIN)}
                                        className={`py-2 rounded border font-bold text-sm ${newUserRole === UserRole.ADMIN ? 'bg-blue-50 border-blue-500 text-blue-600' : 'border-gray-200 text-gray-500'}`}
                                     >
                                         Admin Sekolah
                                     </button>
                                     <button 
                                        type="button"
                                        onClick={() => setNewUserRole(UserRole.STUDENT)}
                                        className={`py-2 rounded border font-bold text-sm ${newUserRole === UserRole.STUDENT ? 'bg-green-50 border-green-500 text-green-600' : 'border-gray-200 text-gray-500'}`}
                                     >
                                         Siswa
                                     </button>
                                 </div>
                             </div>
                             
                             <div>
                                 <label className="block text-sm font-bold text-gray-700 mb-1">Nama Lengkap</label>
                                 <input required className="w-full border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" value={newName} onChange={e => setNewName(e.target.value)} placeholder="Contoh: Budi Santoso" />
                             </div>

                             <div>
                                 <label className="block text-sm font-bold text-gray-700 mb-1">Username Login</label>
                                 <input required className="w-full border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" value={newUsername} onChange={e => setNewUsername(e.target.value)} placeholder="username" />
                             </div>

                             {newUserRole === UserRole.STUDENT && (
                                 <div>
                                     <label className="block text-sm font-bold text-gray-700 mb-1">NISN (Nomor Induk Siswa Nasional)</label>
                                     <input className="w-full border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" value={newNisn} onChange={e => setNewNisn(e.target.value)} placeholder="10 digit NISN" maxLength={10} />
                                 </div>
                             )}

                             <div className="pt-4 flex gap-3">
                                 <button type="button" onClick={() => setIsAddModalOpen(false)} className="flex-1 py-2.5 border border-gray-300 text-gray-600 rounded-lg font-bold text-sm hover:bg-gray-50">Batal</button>
                                 <button type="submit" className="flex-1 py-2.5 bg-btn-primary text-white rounded-lg font-bold text-sm hover:bg-blue-600 shadow-md">Simpan</button>
                             </div>
                         </form>
                     </div>
                 </div>
             )}
        </div>
    );
};