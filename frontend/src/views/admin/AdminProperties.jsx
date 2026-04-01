import { useState, useEffect, Fragment } from 'react';
import { Home, Trash2, CheckCircle, XCircle, Star, StarOff, Pencil, RotateCcw, User, Search, MapPin, AlertCircle, Building2, ExternalLink } from 'lucide-react';
import { useAdminStore } from '../../store/useAdminStore';
import { BASE_URL } from '../../api/axios';
import ConfirmationModal from '../../components/ConfirmationModal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import '../../styles/views/Dashboards.css';
import '../../styles/views/AdminProperties.css';

export default function AdminProperties() {
  const { properties, fetchProperties, updatePropertyStatus, toggleFeatureProperty, deleteProperty, editProperty, loading, error, setProcessing } = useAdminStore();
  
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, id: null, status: null, title: '' });
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  const handleEditClick = (property) => {
    setEditingId(property._id);
    setEditData({
      title: property.title,
      rent: property.rent,
      bhkType: property.bhkType,
      description: property.description || '',
      phone: property.phone || '',
    });
  };

  const handleSaveEdit = async (id) => {
    setProcessing({ loading: true, message: 'Updating property...' });
    const success = await editProperty(id, editData);
    if (success) {
      setEditingId(null);
      setProcessing({ loading: false, success: true, message: 'Property updated successfully.' });
    } else {
      setProcessing({ loading: false, error: 'Failed to update property details.' });
    }
  };

  const handleModeration = async (id, status) => {
    setConfirmModal({ isOpen: false, id: null, status: null, title: '' });
    setProcessing({ loading: true, message: `Updating status...` });
    
    try {
      await updatePropertyStatus(id, status);
      setProcessing({ loading: false, success: true, message: `Property status updated.` });
    } catch (err) {
      setProcessing({ loading: false, error: 'Moderation failed.' });
    }
  };

  const handleDelete = async (id) => {
    setConfirmModal({ isOpen: false, id: null, status: null, title: '' });
    setProcessing({ loading: true, message: 'Deleting listing...' });
    
    try {
      await deleteProperty(id);
      setProcessing({ loading: false, success: true, message: 'Listing permanently removed.' });
    } catch (err) {
      setProcessing({ loading: false, error: 'Delete operation failed.' });
    }
  };

  const filteredProperties = properties.filter(p => {
    const term = searchTerm.toLowerCase();
    return (
      p.title.toLowerCase().includes(term) || 
      p.ownerId?.name?.toLowerCase().includes(term) ||
      p.city?.toLowerCase().includes(term) ||
      p.location?.toLowerCase().includes(term) ||
      p.pincode?.toString().includes(term)
    );
  });

  if (loading) return (
    <div className="flex-center min-h-[400px]">
       <LoadingSpinner size="large" />
    </div>
  );

  if (error) return (
    <div className="console-card flex-col items-center text-center gap-6 !bg-rose-50 border-rose-100">
       <div className="w-16 h-16 rounded-2xl bg-white shadow-sm flex-center text-rose-500 border border-rose-100">
          <AlertCircle size={32} />
       </div>
       <div className="flex-col gap-2">
         <h3 className="text-xl font-bold text-rose-900">Access Restricted</h3>
         <p className="status-pill error">{error}</p>
       </div>
    </div>
  );

  return (
    <div className="flex-col gap-8 animate-fade-in">
      {/* PREMIUM MASTER HEADER */}
      <header className="admin-header-premium flex-col lg:flex-row gap-6 p-4 md:p-6">
        <div className="header-title-stack text-center lg:text-left">
          <div className="header-badge-row justify-center lg:justify-start">
             <h1 className="text-2xl font-black tracking-tighter">Property Moderation</h1>
             <span className="count-badge !bg-slate-900">{properties.length} NODES</span>
          </div>
          <p className="page-subtitle">Centralized oversight of the MapRent ecosystem</p>
        </div>
        
        <div className="admin-search-group w-full lg:max-w-md">
           <Search size={16} className="text-low" />
           <input 
             type="text" 
             placeholder="Search by ID, Address, Area, or Owner..." 
             value={searchTerm}
             onChange={(e) => setSearchTerm(e.target.value)}
             className="admin-search-input"
           />
        </div>
      </header>

      <div className="master-table-wrapper animate-slide-up">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="master-table">
            <thead>
              <tr>
                <th className="min-w-[200px] md:w-[40%]">Property Asset / Location</th>
                <th className="hidden md:table-cell">Ownership</th>
                <th className="hidden sm:table-cell">Value</th>
                <th className="hidden md:table-cell">Status</th>
                <th className="text-right">Administration</th>
              </tr>
            </thead>
            <tbody>
              {filteredProperties.map((p) => (
                <Fragment key={p._id}>
                  <tr className={editingId === p._id ? 'bg-slate-50/50' : ''}>
                    <td onClick={() => window.open(`/property/${p._id}`, '_blank')} className="cursor-pointer group">
                      <div className="identity-cell">
                        <div className="identity-thumb group-hover:scale-105 transition-transform">
                          {p.images && p.images[0] ? (
                             <img 
                               src={p.images[0].startsWith('http') ? p.images[0] : `${BASE_URL}${p.images[0]}`} 
                               className="w-full h-full object-cover"
                               alt={p.title}
                             />
                          ) : <div className="h-full flex-center text-low"><Building2 size={24} /></div>}
                        </div>
                        <div className="identity-stack">
                          <span className="identity-title group-hover:text-primary transition-colors">{p.title}</span>
                          <div className="identity-location">
                             <MapPin size={10} />
                             <span className="uppercase">{p.city || 'GENERIC NODE'}</span>
                             <span className="text-muted opacity-50 px-1">•</span>
                             <span className="text-muted font-bold">{p.pincode || 'P-000'}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                             <span className="status-pill info text-[8px] font-black uppercase tracking-widest">{p.bhkType}</span>
                             {p.isFeatured && <span className="status-pill warning text-[8px] font-black uppercase tracking-tight flex items-center gap-1"><Star size={8} className="fill-current" /> MASTER</span>}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="hidden md:table-cell">
                       <div className="owner-stack">
                          <span className="owner-name flex items-center gap-1.5"><User size={12} className="text-accent-blue" /> {p.ownerId?.name || 'Anonymous'}</span>
                          <span className="owner-email uppercase text-[8px] tracking-widest">{p.ownerId?.email}</span>
                       </div>
                    </td>
                    <td className="hidden sm:table-cell">
                       <div className="flex-col gap-0">
                          <span className="text-[15px] font-extrabold text-main">₹{p.rent.toLocaleString()}</span>
                          <span className="text-[8px] font-black text-low uppercase tracking-[0.2em]">Monthly Yield</span>
                       </div>
                    </td>
                    <td className="hidden md:table-cell">
                      {p.status === 'approved' && (
                        <div className="flex items-center gap-2 text-success font-bold text-[11px]">
                          <CheckCircle size={14} /> LIVE
                        </div>
                      )}
                      {p.status === 'pending' && (
                        <div className="flex items-center gap-2 text-warning font-bold text-[11px]">
                          <RotateCcw size={14} className="animate-spin" /> REVIEW
                        </div>
                      )}
                      {p.status === 'rejected' && (
                        <div className="flex items-center gap-2 text-error font-bold text-[11px]">
                          <XCircle size={14} /> BLOCKED
                        </div>
                      )}
                    </td>
                    <td>
                       <div className="moderation-actions">
                          {p.status === 'pending' ? (
                            <div className="flex items-center gap-2 pr-2 border-r border-slate-100">
                               <button 
                                 onClick={(e) => { e.stopPropagation(); setConfirmModal({ isOpen: true, id: p._id, status: 'approved', title: p.title }) }}
                                 className="mod-btn-circle approve" title="Approve Entry"
                               >
                                 <CheckCircle size={18} />
                               </button>
                               <button 
                                 onClick={(e) => { e.stopPropagation(); setConfirmModal({ isOpen: true, id: p._id, status: 'rejected', title: p.title }) }}
                                 className="mod-btn-circle reject" title="Reject Entry"
                               >
                                 <XCircle size={18} />
                               </button>
                            </div>
                          ) : (
                            <button 
                              onClick={(e) => { e.stopPropagation(); setConfirmModal({ isOpen: true, id: p._id, status: 'pending', title: p.title }) }}
                              className="w-10 h-10 flex-center text-low hover:text-accent-blue transition-all"
                              title="Reset to Pending"
                            >
                              <RotateCcw size={16} />
                            </button>
                          )}
                          
                          <div className="flex items-center gap-1">
                             <button
                               onClick={(e) => { e.stopPropagation(); toggleFeatureProperty(p._id) }}
                               className={`mod-btn-circle star ${p.isFeatured ? 'active' : ''}`}
                               title="Toggle Master Status"
                             >
                               {p.isFeatured ? <Star size={16} className="fill-current" /> : <StarOff size={16} />}
                             </button>
                             <button
                               onClick={(e) => { e.stopPropagation(); handleEditClick(p) }}
                               className="mod-btn-circle"
                               title="Edit Node Details"
                             >
                               <Pencil size={16} />
                             </button>
                             <button
                               onClick={(e) => { e.stopPropagation(); setConfirmModal({ isOpen: true, id: p._id, status: 'delete', title: p.title }) }}
                               className="mod-btn-circle reject"
                               title="Permanently Expunge"
                             >
                               <Trash2 size={16} />
                             </button>
                          </div>
                       </div>
                    </td>
                  </tr>

                  {editingId === p._id && (
                    <tr className="bg-slate-50/50">
                      <td colSpan="5">
                         <div className="console-card m-4 !p-8 animate-slide-up border-none shadow-xl">
                            <div className="flex items-center gap-3 mb-8 border-b border-slate-100 pb-4">
                               <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex-center"><Pencil size={14} /></div>
                               <h3 className="text-lg font-black tracking-tighter">Edit Asset Configuration</h3>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                               <div className="flex-col gap-2">
                                  <label className="label-base uppercase !text-[10px] font-black tracking-widest text-low">Display Title</label>
                                  <input type="text" className="input-base" value={editData.title} onChange={(e) => setEditData({...editData, title: e.target.value})} />
                               </div>
                               <div className="flex-col gap-2">
                                  <label className="label-base uppercase !text-[10px] font-black tracking-widest text-low">Target Rent (₹)</label>
                                  <input type="number" className="input-base" value={editData.rent} onChange={(e) => setEditData({...editData, rent: e.target.value})} />
                               </div>
                               <div className="form-group flex-col gap-2">
                                  <label className="label-base uppercase !text-[10px] font-black tracking-widest text-low">Node Type</label>
                                  <select className="input-base" value={editData.bhkType} onChange={(e) => setEditData({...editData, bhkType: e.target.value})}>
                                    <option value="1BHK">1BHK</option>
                                    <option value="2BHK">2BHK</option>
                                    <option value="3BHK">3BHK</option>
                                    <option value="4BHK+">4BHK+</option>
                                  </select>
                               </div>
                            </div>

                            <div className="flex justify-end gap-3 mt-10">
                               <button onClick={() => setEditingId(null)} className="btn btn-ghost !px-10">Discard Changes</button>
                               <button onClick={() => handleSaveEdit(p._id)} className="btn btn-primary !px-10">Update Asset</button>
                            </div>
                         </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmationModal 
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, id: null, status: null, title: '' })}
        onConfirm={() => confirmModal.status === 'delete' ? handleDelete(confirmModal.id) : handleModeration(confirmModal.id, confirmModal.status)}
        title={confirmModal.status === 'delete' ? "Master Asset Removal" : "Audit Confirmation"}
        message={`Confirming ${confirmModal.status} procedure for: ${confirmModal.title}. This will propagate to all discovery systems immediately.`}
        confirmText={confirmModal.status === 'delete' ? "Liquidate" : "Authorize"}
        type={confirmModal.status === 'delete' ? 'danger' : 'primary'}
      />
    </div>
  );
}
