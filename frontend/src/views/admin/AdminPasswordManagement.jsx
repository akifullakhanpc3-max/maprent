import { useState } from 'react';
import api from '../../api/axios';
import { ShieldAlert, Search, KeyRound, AlertCircle, CheckCircle2, User as UserIcon } from 'lucide-react';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function AdminPasswordManagement() {
  const [identifier, setIdentifier] = useState('');
  const [user, setUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: null, message: '' });

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: null, message: '' });
    setUser(null);

    try {
      // Find user by email or phone
      const res = await api.get(`/admin/users/search?identifier=${identifier}`);
      if (res.data) {
        setUser(res.data);
      } else {
        setStatus({ type: 'error', message: 'User not found' });
      }
    } catch (err) {
      setStatus({ type: 'error', message: err.response?.data?.msg || 'Search failed' });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 8) {
      return setStatus({ type: 'error', message: 'Password must be at least 8 characters' });
    }

    setLoading(true);
    try {
      await api.put('/auth/admin/reset-user-password', {
        userId: user._id,
        newPassword: newPassword
      });
      setStatus({ type: 'success', message: `Password for ${user.name} updated successfully.` });
      setNewPassword('');
    } catch (err) {
      setStatus({ type: 'error', message: err.response?.data?.msg || 'Reset failed' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-page-container p-8 animate-fade-in">
      <div className="flex-col gap-8 max-w-4xl mx-auto">
        
        <div className="flex-between">
          <div className="flex-col gap-2">
            <h1 className="text-3xl font-black tracking-tighter text-slate-900">Security Console</h1>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Administrative Password Management</p>
          </div>
          <div className="w-16 h-16 bg-rose-500 rounded-2xl flex-center text-white shadow-2xl shadow-rose-200">
            <ShieldAlert size={32} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* SEARCH SECTION */}
          <div className="console-card flex-col gap-6">
            <div className="flex-col gap-1">
              <h3 className="text-lg font-bold text-slate-800">Identify User</h3>
              <p className="text-xs text-slate-500">Search by Email or Phone Number</p>
            </div>

            <form onSubmit={handleSearch} className="flex-col gap-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  className="input-base !pl-12"
                  placeholder="user@example.com or 1234567890"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  required
                />
              </div>
              <button 
                type="submit" 
                disabled={loading}
                className="btn btn-secondary w-full"
              >
                {loading ? 'Searching...' : 'Lookup Account'}
              </button>
            </form>

            {status.type === 'error' && !user && (
              <div className="status-pill error flex items-center gap-2">
                <AlertCircle size={14} />
                <span className="text-[10px] font-bold uppercase tracking-widest">{status.message}</span>
              </div>
            )}
          </div>

          {/* RESET SECTION */}
          <div className="console-card flex-col gap-6">
            {user ? (
              <>
                <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="w-12 h-12 bg-white rounded-xl flex-center border border-slate-200 text-slate-600">
                    {user.avatar ? <img src={user.avatar} className="w-full h-full object-cover rounded-xl" /> : <UserIcon size={24} />}
                  </div>
                  <div className="flex-col">
                    <p className="text-sm font-bold text-slate-900">{user.name}</p>
                    <p className="text-[10px] text-slate-500 font-medium">{user.email || user.phone}</p>
                  </div>
                  <div className="ml-auto badge !bg-indigo-600 !text-white text-[9px]">
                    {user.role}
                  </div>
                </div>

                <form onSubmit={handleReset} className="flex-col gap-4">
                  <div className="flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">New Secure Password</label>
                    <div className="relative">
                      <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="password"
                        className="input-base !pl-12"
                        placeholder="Minimum 8 characters"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <button 
                    type="submit" 
                    disabled={loading}
                    className="btn btn-primary w-full"
                  >
                    {loading ? 'Updating...' : 'Reset Password Now'}
                  </button>
                </form>

                {status.type === 'success' && (
                   <div className="status-pill success flex items-center gap-2">
                    <CheckCircle2 size={14} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">{status.message}</span>
                  </div>
                )}
              </>
            ) : (
              <div className="flex-center flex-col gap-4 py-12 text-center">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex-center text-slate-200">
                  <KeyRound size={32} />
                </div>
                <div className="flex-col gap-1">
                  <p className="text-sm font-bold text-slate-400">Ready for Reset</p>
                  <p className="text-[10px] text-slate-400 max-w-[200px]">Search for a user on the left to begin the password recovery process.</p>
                </div>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
