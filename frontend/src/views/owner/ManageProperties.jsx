import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api, { BASE_URL } from '../../api/axios';
import PropertyFormModal from '../../components/PropertyFormModal';
import { Plus, Trash2, Edit2, MapPin, Search, Building2, LayoutGrid, AlertCircle, TrendingUp } from 'lucide-react';
import ImageWithSkeleton from '../../components/ImageWithSkeleton';
import '../../styles/views/Dashboards.css';
import '../../styles/views/ManageProperties.css';

export default function ManageProperties() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const location = useLocation();
  const navigate = useNavigate();

  const fetchProperties = async () => {
    try {
      setLoading(true);
      const res = await api.get('/properties/mine');
      setProperties(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  // Handle auto-open for 'List New Asset' via Sidebar
  useEffect(() => {
    if (location.pathname === '/owner/properties/new') {
      openAddModal();
    } else if (isModalOpen && !editingProperty) {
      // If we navigate away from /new but modal is open for 'Add', close it
      setIsModalOpen(false);
    }
  }, [location.pathname]);

  const handleModalClose = () => {
    setIsModalOpen(false);
    // If we were on the /new route, clean up URL after closing
    if (location.pathname === '/owner/properties/new') {
      navigate('/owner/properties', { replace: true });
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Permanently delete this listing? This action cannot be undone.')) {
      try {
        await api.delete(`/properties/${id}`);
        setProperties(properties.filter(p => p._id !== id));
      } catch (err) {
        console.error(err);
      }
    }
  };

  const openAddModal = () => {
    setEditingProperty(null);
    setIsModalOpen(true);
  };

  const openEditModal = (property) => {
    setEditingProperty(property);
    setIsModalOpen(true);
  };

  const filteredProperties = properties.filter(p => 
    p.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex-col gap-6 animate-fade-in">
      {/* PREMIUM HEADER SECTION */}
      <header className="properties-header-premium">
        <div className="header-title-stack">
          <div className="header-badge-row">
             <h1 className="text-2xl font-black tracking-tighter">Manage Portfolio</h1>
             <span className="count-badge">{properties.length} ASSETS</span>
          </div>
          <p className="page-subtitle">Real-time oversight of your listed inventory</p>
        </div>
        
        <div className="header-actions-row">
           <div className="search-wrapper-premium">
              <Search className="absolute" style={{ left: '16px', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: 'var(--text-low)' }} />
              <input 
                type="text" 
                placeholder="Find asset..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input-premium"
              />
           </div>
           <button 
             onClick={openAddModal}
             className="btn btn-primary"
           >
             <Plus size={18} />
             <span>List New Asset</span>
           </button>
        </div>
      </header>

      {loading ? (
        <div className="property-list-stack animate-pulse">
           {[1, 2, 3].map(i => (
              <div key={i} className="property-list-card" style={{ height: '142px' }}>
                <div className="card-image-wrapper bg-slate-50" />
                <div className="card-details-stack">
                   <div className="h-4 bg-slate-50 w-48 rounded" />
                   <div className="h-3 bg-slate-50 w-24 rounded" />
                </div>
              </div>
           ))}
        </div>
      ) : filteredProperties.length === 0 ? (
        <div className="empty-state-premium">
           <div className="empty-icon-box">
              <Building2 size={40} />
           </div>
           <div className="flex-col gap-2 items-center">
             <h3 className="text-xl font-bold">Portfolio Empty</h3>
             <p className="text-sm font-medium text-muted">You haven't listed any properties for rent yet.</p>
           </div>
           <button 
             onClick={openAddModal} 
             className="btn btn-primary !px-12"
           >
             Start Your Portfolio
           </button>
        </div>
      ) : (
        <div className="property-list-stack animate-slide-up">
           {filteredProperties.map((property) => (
             <div 
               key={property._id} 
               className="property-list-card"
             >
                <div className="card-image-wrapper">
                  <div className="card-image-overlay">
                      <span className={`status-pill ${property.isActive ? 'success' : 'info'} text-[9px] font-bold tracking-wider`}>
                          {property.isActive ? 'ACTV' : 'DLST'}
                      </span>
                  </div>
                  {property.images && property.images.length > 0 ? (
                     <ImageWithSkeleton 
                       src={property.images[0].startsWith('http') ? property.images[0] : `${BASE_URL}${property.images[0]}`} 
                       className="h-full w-full object-cover" 
                       alt={property.title} 
                     />
                  ) : (
                     <div className="h-full flex-center text-low"><Building2 size={32} /></div>
                  )}
                </div>
                
                <div className="card-details-stack">
                    <div className="card-meta-row">
                        <span className="status-pill info text-[8px] font-black uppercase tracking-[0.15em]">{property.bhkType}</span>
                        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-low">
                          <MapPin size={10} /> {property.city || 'GLOBAL NODE'}
                        </div>
                    </div>
                    
                    <h3 
                      className="property-title-premium truncate cursor-pointer hover:text-primary transition-colors"
                      onClick={() => window.open(`/property/${property._id}`, '_blank')}
                    >
                      {property.title}
                    </h3>
                    
                    <div className="property-info-grid mt-2">
                       <div className="info-item-premium">
                          <span className="info-label-premium">Rate</span>
                          <span className="info-value-premium">{property.price ? '₹' + property.price.toLocaleString() : 'N/A'}</span>
                          <span className="text-[9px] font-bold text-low mt-1">/MO</span>
                       </div>
                       <div className="info-item-premium">
                          <span className="info-label-premium">Yield</span>
                          <span className="flex items-center gap-1 text-[11px] font-bold text-success animate-fade-in">
                            <TrendingUp size={12} /> High
                          </span>
                       </div>
                    </div>
                 </div>

                <div className="card-actions-panel">
                   <button 
                     onClick={() => openEditModal(property)}
                     className="action-btn-dashboard edit"
                     title="Edit Assets"
                   >
                     <Edit2 size={16} />
                   </button>
                   <button 
                     onClick={() => handleDelete(property._id)}
                     className="action-btn-dashboard delete"
                     title="Liquidate Listing"
                   >
                     <Trash2 size={16} />
                   </button>
                </div>
             </div>
           ))}
        </div>
      )}

      {isModalOpen && (
        <PropertyFormModal 
          isOpen={isModalOpen} 
          onClose={handleModalClose} 
          refresh={fetchProperties}
          existingProperty={editingProperty} 
        />
      )}
    </div>
  );
}
