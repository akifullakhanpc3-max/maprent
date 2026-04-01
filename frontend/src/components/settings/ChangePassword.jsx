import { useState } from 'react';
import api from '../../api/axios';
import LoadingSpinner from '../common/LoadingSpinner';
import { ShieldCheck, Lock, AlertCircle, CheckCircle2, ShieldAlert } from 'lucide-react';
import '../../styles/views/Dashboards.css';

export default function ChangePassword() {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: null, message: '' });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setStatus({ type: null, message: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.newPassword !== formData.confirmPassword) {
      return setStatus({ type: 'error', message: 'New passwords do not match' });
    }
    if (formData.newPassword.length < 6) {
      return setStatus({ type: 'error', message: 'Password must be at least 6 characters' });
    }

    setLoading(true);
    try {
      await api.put('/auth/change-password', {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword
      });
      setStatus({ type: 'success', message: 'Credentials updated successfully' });
      setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setStatus({ 
        type: 'error', 
        message: err.response?.data?.msg || 'Failed to update credentials' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="console-card max-w-xl animate-fade-in !p-0 overflow-hidden">
      <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex items-center gap-5">
        <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex-center text-white shadow-xl shadow-indigo-100">
          <ShieldAlert size={28} />
        </div>
        <div className="flex-col gap-1">
          <h2 className="text-xl font-bold text-slate-900">Account Security</h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Manage your authentication credentials</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-8 flex-col gap-8">
        {status.type && (
          <div className={`status-pill ${status.type === 'success' ? 'success' : 'error'} !p-4 !rounded-xl !border animate-slide-up flex items-center gap-3`}>
            {status.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span className="text-xs font-bold leading-none">{status.message}</span>
          </div>
        )}

        <div className="flex-col gap-5">
          <div className="flex-col gap-2">
            <label className="label-base !m-0 !text-[10px] !text-slate-400">Current Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="password"
                name="currentPassword"
                required
                className="input-base !pl-12"
                placeholder="Authorize current identity"
                value={formData.currentPassword}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="flex-col gap-2">
              <label className="label-base !m-0 !text-[10px] !text-slate-400">New Password</label>
              <input
                type="password"
                name="newPassword"
                required
                className="input-base"
                placeholder="Min. 6 chars"
                value={formData.newPassword}
                onChange={handleChange}
              />
            </div>
            <div className="flex-col gap-2">
              <label className="label-base !m-0 !text-[10px] !text-slate-400">Confirm Identity</label>
              <input
                type="password"
                name="confirmPassword"
                required
                className="input-base"
                placeholder="Repeat new pasword"
                value={formData.confirmPassword}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary !w-full !py-4 shadow-xl shadow-indigo-100"
        >
          {loading ? 'Updating Credentials...' : 'Update Password'}
        </button>
      </form>
    </div>
  );
}
