import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const AuthPopup = ({ isOpen, onClose }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [form, setForm] = useState({ no_hp: '', password: '', name: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login, register } = useAuth();

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      if (isRegister) {
        await register(form.no_hp, form.password, form.name);
        alert("Registrasi berhasil!");
        onClose();
      } else {
        await login(form.no_hp, form.password);
        onClose();
      }
      
      // Reset form
      setForm({ no_hp: '', password: '', name: '' });
    } catch (err) {
      setError(err.message || 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden relative animate-in fade-in zoom-in duration-300">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 font-bold">✕</button>
        
        <div className="p-8">
          <h2 className="text-3xl font-black text-slate-800 mb-2 uppercase tracking-tighter">
            {isRegister ? 'Buat Akun BAM' : 'Login Lab System'}
          </h2>
          <p className="text-slate-500 text-sm mb-6">Silakan masuk untuk melanjutkan akses lab.</p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <input 
              type="text" 
              placeholder="Nomor WhatsApp (Contoh: 0812...)" 
              required
              value={form.no_hp}
              className="w-full p-4 border-2 border-slate-100 rounded-2xl focus:border-sky-500 outline-none transition-all"
              onChange={(e) => setForm({...form, no_hp: e.target.value})}
            />

            {isRegister && (
              <input 
                type="text" 
                placeholder="Nama Perusahaan / Nama Lengkap" 
                required
                value={form.name}
                className="w-full p-4 border-2 border-slate-100 rounded-2xl focus:border-sky-500 outline-none transition-all"
                onChange={(e) => setForm({...form, name: e.target.value})}
              />
            )}
            
            <input 
              type="password" 
              placeholder="Password (min. 6 karakter)" 
              required
              value={form.password}
              className="w-full p-4 border-2 border-slate-100 rounded-2xl focus:border-sky-500 outline-none transition-all"
              onChange={(e) => setForm({...form, password: e.target.value})}
            />
            
            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-sky-600 hover:bg-sky-700 text-white py-4 rounded-2xl font-black text-lg shadow-lg shadow-sky-200 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'MEMPROSES...' : (isRegister ? 'DAFTAR SEKARANG' : 'MASUK SEKARANG')}
            </button>
          </form>

          <div className="mt-6 text-center text-slate-500 text-sm">
            {isRegister ? 'Sudah punya akun?' : 'Belum punya akun?'} 
            <button onClick={() => setIsRegister(!isRegister)} className="text-sky-600 font-bold ml-1 hover:underline">
              {isRegister ? 'Login' : 'Buat Akun'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPopup;