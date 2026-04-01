import { useEffect, useState } from 'react';
import { ShieldAlert, Trash2, CheckCircle2, XCircle, User, Mail, Shield, Unlock, Lock } from 'lucide-react';
import { useAdminStore } from '../../store/useAdminStore';
import ConfirmationModal from '../../components/ConfirmationModal';
import '../../styles/views/Dashboards.css';

export default function AdminUsers() {
  const { users, fetchUsers, toggleBlockUser, deleteUser, loading, error, setProcessing } = useAdminStore();
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, id: null, type: null, name: '' });

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleAction = async (id, actionType) => {
    setConfirmModal({ isOpen: false, id: null, type: null, name: '' });
    setProcessing({ loading: true, message: actionType === 'delete' ? 'Deleting user...' : 'Updating access...' });
    
    try {
      if (actionType === 'delete') {
        await deleteUser(id);
        setProcessing({ loading: false, success: true, message: 'User removed.' });
      } else {
        await toggleBlockUser(id);
        setProcessing({ loading: false, success: true, message: 'User status updated.' });
      }
    } catch (err) {
      setProcessing({ loading: false, error: err.response?.data?.msg || 'Operation failed.' });
    }
  };

  if (loading) return (
     <div className="flex-col gap-6 animate-pulse">
        <div className="h-20 bg-slate-100 rounded-xl" />
        <div className="h-64 bg-slate-50 rounded-xl" />
     </div>
  );

  if (error) return (
     <div className="console-card flex-center flex-col gap-6 !bg-rose-50 border-rose-100">
        <div className="w-16 h-16 rounded-xl bg-white shadow-sm flex-center text-rose-500 border border-rose-100"><ShieldAlert size={32} /></div>
        <div className="flex-col gap-2 items-center">
          <h3 className="text-xl font-bold text-rose-900">Access Error</h3>
          <p className="status-pill error">{error}</p>
        </div>
     </div>
  );

  return (
    <div className="flex-col gap-8 animate-fade-in">
      {/* Header Panel */}
      <div className="console-card flex flex-col md:flex-row flex-between items-center bg-slate-900 border-none !p-6 md:!p-8 gap-4">
        <div className="flex-col gap-1 text-center md:text-left">
          <h1 className="text-xl md:text-2xl font-bold text-white">Users</h1>
          <p className="text-slate-400 text-sm font-medium">Manage and moderate {users.length} platform accounts.</p>
        </div>
        <div className="px-5 py-2 bg-white/10 rounded-lg text-white font-bold text-[10px] md:text-xs uppercase tracking-wider">
          Total Nodes: {users.length}
        </div>
      </div>
      
      {/* Users Table */}
      <div className="console-card !p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Profile</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Role</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u, idx) => (
                <tr key={u._id} className="hover:bg-slate-50/50 transition-colors animate-slide-up" style={{ animationDelay: `${idx * 50}ms` }}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-indigo-50 rounded-lg flex-center text-indigo-600 border border-indigo-100 font-bold text-sm">
                        {u.name?.charAt(0) || <User size={16} />}
                      </div>
                      <div className="flex-col gap-0.5">
                        <p className="text-sm font-bold text-slate-900">{u.name}</p>
                        <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1"><Mail size={10} /> {u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 capitalize">
                      <Shield size={12} className="text-indigo-500" />
                      {u.role}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {u.isBlocked ? (
                      <span className="status-pill error text-[9px]">Blocked</span>
                    ) : (
                      <span className="status-pill success text-[9px]">Active</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                       <button
                        onClick={() => setConfirmModal({ isOpen: true, id: u._id, type: 'block', name: u.name, isBlocked: u.isBlocked })}
                        className={`btn btn-ghost !p-2 !h-auto ${u.isBlocked ? '!text-emerald-600 hover:!bg-emerald-50' : '!text-amber-600 hover:!bg-amber-50'}`}
                        title={u.isBlocked ? 'Unlock User' : 'Block User'}
                      >
                        {u.isBlocked ? <Unlock size={14} /> : <Lock size={14} />}
                      </button>
                      <button
                        onClick={() => setConfirmModal({ isOpen: true, id: u._id, type: 'delete', name: u.name })}
                        className="btn btn-ghost !p-2 !h-auto !text-rose-500 hover:!bg-rose-50"
                        title="Delete User"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan="4" className="px-6 py-16 text-center">
                    <ShieldAlert size={40} className="text-slate-200 mx-auto mb-3" />
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No users found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmationModal 
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, id: null, type: null, name: '' })}
        onConfirm={() => handleAction(confirmModal.id, confirmModal.type)}
        title={confirmModal.type === 'delete' ? 'Delete Account?' : (confirmModal.isBlocked ? 'Restore Access?' : 'Suspend Account?')}
        message={confirmModal.type === 'delete' 
          ? `Are you sure you want to permanently delete ${confirmModal.name}? This action cannot be undone.`
          : `Update access for ${confirmModal.name}? They will be ${confirmModal.isBlocked ? 'allowed' : 'restricted'} from logging in.`}
        confirmText={confirmModal.type === 'delete' ? "Confirm Delete" : "Update Status"}
        type={confirmModal.type === 'delete' ? 'danger' : 'primary'}
      />
    </div>
  );
}
