import { useEffect, useState } from 'react';
import {
  Shield, ShieldCheck, ShieldAlert, UserPlus, Trash2, ChevronDown,
  Check, X, Users, Crown, Briefcase, Wrench, Mail, KeyRound, User
} from 'lucide-react';
import { useAdminStore } from '../../store/useAdminStore';
import ConfirmationModal from '../../components/ConfirmationModal';
import '../../styles/views/Dashboards.css';

const ALL_PERMISSIONS = [
  'VIEW_ANALYTICS', 'MANAGE_USERS', 'APPROVE_PROPERTY',
  'REJECT_PROPERTY', 'DELETE_PROPERTY', 'FEATURE_PROPERTY',
  'CREATE_PROPERTY', 'MANAGE_BOOKINGS'
];

const PERMISSION_LABELS = {
  VIEW_ANALYTICS:   { label: 'View Analytics',    color: 'info' },
  MANAGE_USERS:     { label: 'Manage Users',       color: 'warning' },
  APPROVE_PROPERTY: { label: 'Approve Property',   color: 'success' },
  REJECT_PROPERTY:  { label: 'Reject Property',    color: 'error' },
  DELETE_PROPERTY:  { label: 'Delete Property',    color: 'error' },
  FEATURE_PROPERTY: { label: 'Feature Property',   color: 'info' },
  CREATE_PROPERTY:  { label: 'Create Property',    color: 'info' },
  MANAGE_BOOKINGS:  { label: 'Manage Bookings',    color: 'info' },
};

const ROLE_ICONS = { master_admin: Crown, admin: ShieldCheck, employee: Briefcase, worker: Wrench };
const ROLE_DEFAULTS_FE = {
  admin:    ['VIEW_ANALYTICS','APPROVE_PROPERTY','REJECT_PROPERTY','DELETE_PROPERTY','FEATURE_PROPERTY','CREATE_PROPERTY','MANAGE_BOOKINGS'],
  employee: ['VIEW_ANALYTICS','APPROVE_PROPERTY','REJECT_PROPERTY','MANAGE_BOOKINGS'],
  worker:   ['VIEW_ANALYTICS'],
};

function RoleBadge({ role }) {
  const Icon = ROLE_ICONS[role] || Shield;
  const styles = {
    master_admin: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    admin:        'bg-slate-100 text-slate-700 border-slate-200',
    employee:     'bg-amber-50 text-amber-700 border-amber-200',
    worker:       'bg-emerald-50 text-emerald-700 border-emerald-200',
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-black uppercase tracking-wider ${styles[role] || styles.worker}`}>
      <Icon size={11} /> {role.replace('_', ' ')}
    </span>
  );
}

function PermissionChip({ perm, active, onToggle, disabled }) {
  const meta = PERMISSION_LABELS[perm] || { label: perm, color: 'info' };
  return (
    <button
      onClick={() => !disabled && onToggle(perm)}
      disabled={disabled}
      title={disabled ? 'Only master admin can change permissions' : undefined}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all select-none
        ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:scale-105'}
        ${active
          ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-200'
          : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-indigo-300'
        }`}
    >
      {active ? <Check size={10} /> : <X size={10} />}
      {meta.label}
    </button>
  );
}

export default function AdminStaff() {
  const { staff, fetchStaff, createStaff, updateStaffPermissions, updateStaffRole, deleteStaff, loading, setProcessing } = useAdminStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState({ isOpen: false, id: null, name: '' });
  const [expandedId, setExpandedId] = useState(null);
  const [savingId, setSavingId] = useState(null);

  // Local permission state for expanded row editing
  const [localPerms, setLocalPerms] = useState({});

  // Create form state
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'employee', permissions: ROLE_DEFAULTS_FE.employee });
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => { fetchStaff(); }, [fetchStaff]);

  const handleExpand = (member) => {
    if (expandedId === member._id) {
      setExpandedId(null);
    } else {
      setExpandedId(member._id);
      setLocalPerms(prev => ({ ...prev, [member._id]: member.permissions || ROLE_DEFAULTS_FE[member.role] || [] }));
    }
  };

  const handlePermToggle = (staffId, perm) => {
    setLocalPerms(prev => {
      const current = prev[staffId] || [];
      return {
        ...prev,
        [staffId]: current.includes(perm) ? current.filter(p => p !== perm) : [...current, perm]
      };
    });
  };

  const handleSavePermissions = async (staffId) => {
    setSavingId(staffId);
    try {
      await updateStaffPermissions(staffId, localPerms[staffId]);
      setProcessing({ loading: false, success: true, message: 'Permissions updated.' });
    } catch (err) {
      setProcessing({ loading: false, error: err.response?.data?.msg || 'Failed to update permissions.' });
    } finally {
      setSavingId(null);
    }
  };

  const handleRoleChange = async (staffId, newRole) => {
    try {
      const updated = await updateStaffRole(staffId, newRole);
      setLocalPerms(prev => ({ ...prev, [staffId]: updated.permissions || ROLE_DEFAULTS_FE[newRole] || [] }));
    } catch (err) {
      setProcessing({ loading: false, error: err.response?.data?.msg || 'Failed to update role.' });
    }
  };

  const handleDelete = async () => {
    setConfirmDelete({ isOpen: false, id: null, name: '' });
    setProcessing({ loading: true, message: 'Removing staff account...' });
    try {
      await deleteStaff(confirmDelete.id);
      setProcessing({ loading: false, success: true, message: 'Staff account removed.' });
    } catch (err) {
      setProcessing({ loading: false, error: err.response?.data?.msg || 'Failed to delete.' });
    }
  };

  const handleFormRoleChange = (role) => {
    setForm(prev => ({ ...prev, role, permissions: ROLE_DEFAULTS_FE[role] || [] }));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!form.name || !form.email || !form.password) return setFormError('All fields are required.');
    if (form.password.length < 6) return setFormError('Password must be at least 6 characters.');
    setFormLoading(true);
    try {
      await createStaff(form);
      setShowCreateModal(false);
      setForm({ name: '', email: '', password: '', role: 'employee', permissions: ROLE_DEFAULTS_FE.employee });
      setProcessing({ loading: false, success: true, message: 'Staff account created.' });
    } catch (err) {
      setFormError(err.response?.data?.msg || 'Failed to create account.');
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="flex-col gap-8 animate-fade-in">
      {/* MASTER HEADER */}
      <header className="console-card flex flex-col md:flex-row justify-between items-center gap-6 !p-6 md:!p-8 !bg-slate-900 border-none relative overflow-hidden">
        <div className="absolute inset-0 opacity-5 pointer-events-none flex items-center justify-end pr-12">
          <Users size={120} className="text-white" />
        </div>
        <div className="relative z-10 flex-col gap-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex-center shadow-lg shadow-indigo-500/20">
              <ShieldCheck size={20} className="text-white" />
            </div>
            <h1 className="text-2xl font-black tracking-tighter text-white">Staff Management</h1>
          </div>
          <p className="text-slate-400 text-sm font-medium pl-13">Control roles and permissions for all admin-tier accounts.</p>
        </div>
        <div className="relative z-10">
          <button onClick={() => setShowCreateModal(true)} className="btn btn-primary gap-2">
            <UserPlus size={16} /> Invite Staff
          </button>
        </div>
      </header>

      {/* STAFF TABLE */}
      <div className="console-card !p-0 overflow-hidden">
        {loading && staff.length === 0 ? (
          <div className="flex-col gap-3 p-6 animate-pulse">
            {[1,2,3].map(i => <div key={i} className="h-16 bg-slate-50 rounded-xl" />)}
          </div>
        ) : staff.length === 0 ? (
          <div className="flex-center flex-col gap-4 py-20">
            <ShieldAlert size={40} className="text-slate-200" />
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No staff accounts yet</p>
            <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">Create First Staff Account</button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {staff.map((member, idx) => {
              const isExpanded = expandedId === member._id;
              const currentPerms = localPerms[member._id] || member.permissions || ROLE_DEFAULTS_FE[member.role] || [];
              const RoleIcon = ROLE_ICONS[member.role] || Shield;
              return (
                <div key={member._id} className="animate-slide-up" style={{ animationDelay: `${idx * 50}ms` }}>
                  {/* ROW */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 px-6 py-4 hover:bg-slate-50/50 transition-colors">
                    {/* Avatar */}
                    <div className="w-10 h-10 bg-indigo-50 rounded-xl flex-center text-indigo-600 font-bold text-sm border border-indigo-100 flex-shrink-0">
                      {member.name?.charAt(0) || <User size={16} />}
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-900 truncate">{member.name}</p>
                      <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1 truncate">
                        <Mail size={10} /> {member.email}
                      </p>
                    </div>
                    {/* Role badge + selector */}
                    <div className="flex items-center gap-2">
                      {member.role === 'master_admin' ? (
                        <RoleBadge role="master_admin" />
                      ) : (
                        <select
                          value={member.role}
                          onChange={(e) => handleRoleChange(member._id, e.target.value)}
                          className="input-base !h-8 !text-[10px] !font-bold !px-2 !py-1 !w-auto cursor-pointer"
                        >
                          <option value="admin">Admin</option>
                          <option value="employee">Employee</option>
                          <option value="worker">Worker</option>
                        </select>
                      )}
                    </div>
                    {/* Perm count */}
                    <div className="text-[10px] font-bold text-slate-400 whitespace-nowrap">
                      {(member.permissions?.length || ROLE_DEFAULTS_FE[member.role]?.length || 0)} permissions
                    </div>
                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {member.role !== 'master_admin' && (
                        <button
                          onClick={() => handleExpand(member)}
                          className={`btn btn-secondary !h-8 !px-3 !text-[10px] gap-1.5 ${isExpanded ? 'bg-indigo-50 !text-indigo-600 border-indigo-200' : ''}`}
                        >
                          <ShieldCheck size={13} />
                          {isExpanded ? 'Close' : 'Permissions'}
                          <ChevronDown size={12} className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                        </button>
                      )}
                      {member.role !== 'master_admin' && (
                        <button
                          onClick={() => setConfirmDelete({ isOpen: true, id: member._id, name: member.name })}
                          className="btn btn-ghost !p-2 !h-8 !text-rose-500 hover:!bg-rose-50"
                          title="Remove Staff"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* EXPANDED PERMISSIONS PANEL */}
                  {isExpanded && (
                    <div className="px-6 pb-6 pt-2 bg-slate-50/80 border-t border-slate-100 animate-fade-in">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">
                        Assigned Permissions — toggle to grant or revoke access
                      </p>
                      <div className="flex flex-wrap gap-2 mb-5">
                        {ALL_PERMISSIONS.map(perm => (
                          <PermissionChip
                            key={perm}
                            perm={perm}
                            active={currentPerms.includes(perm)}
                            onToggle={(p) => handlePermToggle(member._id, p)}
                            disabled={false}
                          />
                        ))}
                      </div>
                      <button
                        onClick={() => handleSavePermissions(member._id)}
                        disabled={savingId === member._id}
                        className="btn btn-primary !h-9 !px-8 !text-[11px] gap-2"
                      >
                        {savingId === member._id
                          ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          : <Check size={14} />
                        }
                        Save Permissions
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* CREATE STAFF MODAL */}
      {showCreateModal && (
        <>
          <div className="glass-backdrop" onClick={() => setShowCreateModal(false)} />
          <div className="modal-overlay-container">
            <div className="modal-content-standard z-[2001]" style={{ maxWidth: '520px' }}>
              <div className="modal-header">
                <div className="modal-title-stack">
                  <h2 className="modal-title">Create Staff Account</h2>
                  <p className="modal-subtitle-pill">Assign role and initial permissions</p>
                </div>
                <button onClick={() => setShowCreateModal(false)} className="btn btn-ghost !p-2"><X size={18} /></button>
              </div>
              <div className="modal-body">
                <form onSubmit={handleCreate} className="modal-form-stack">
                  {formError && (
                    <div className="modal-status-box error animate-fade-in text-sm">{formError}</div>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex-col gap-2">
                      <label className="label-base flex items-center gap-1.5"><User size={13} /> Full Name</label>
                      <input className="input-base" placeholder="Jane Smith" value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} required />
                    </div>
                    <div className="flex-col gap-2">
                      <label className="label-base flex items-center gap-1.5"><Mail size={13} /> Email Address</label>
                      <input type="email" className="input-base" placeholder="jane@occupra.com" value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} required />
                    </div>
                    <div className="flex-col gap-2">
                      <label className="label-base flex items-center gap-1.5"><KeyRound size={13} /> Password</label>
                      <input type="password" className="input-base" placeholder="Min. 6 characters" value={form.password} onChange={e => setForm(f => ({...f, password: e.target.value}))} required />
                    </div>
                    <div className="flex-col gap-2">
                      <label className="label-base flex items-center gap-1.5"><Shield size={13} /> Role</label>
                      <select className="input-base cursor-pointer" value={form.role} onChange={e => handleFormRoleChange(e.target.value)}>
                        <option value="admin">Admin</option>
                        <option value="employee">Employee</option>
                        <option value="worker">Worker</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex-col gap-3 p-4 bg-slate-50 border border-slate-100 rounded-xl">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Initial Permissions</p>
                    <div className="flex flex-wrap gap-2">
                      {ALL_PERMISSIONS.map(perm => (
                        <PermissionChip
                          key={perm}
                          perm={perm}
                          active={form.permissions.includes(perm)}
                          onToggle={(p) => setForm(f => ({
                            ...f,
                            permissions: f.permissions.includes(p) ? f.permissions.filter(x => x !== p) : [...f.permissions, p]
                          }))}
                          disabled={false}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="modal-footer !flex-row !justify-end pt-4 border-t border-slate-100">
                    <button type="button" onClick={() => setShowCreateModal(false)} className="btn btn-ghost px-6">Cancel</button>
                    <button type="submit" disabled={formLoading} className="btn btn-primary px-10 gap-2">
                      {formLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <UserPlus size={16} />}
                      Create Account
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </>
      )}

      <ConfirmationModal
        isOpen={confirmDelete.isOpen}
        onClose={() => setConfirmDelete({ isOpen: false, id: null, name: '' })}
        onConfirm={handleDelete}
        title="Remove Staff Account?"
        message={`This will permanently delete ${confirmDelete.name}'s admin access. They will no longer be able to log in.`}
        confirmText="Remove Account"
        type="danger"
      />
    </div>
  );
}
