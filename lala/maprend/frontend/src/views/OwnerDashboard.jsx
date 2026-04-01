import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '@/components/Navbar'
import useAuthStore from '@/stores/useAuthStore'
import axios from 'axios'
import { Plus, Edit3, Trash2, MapPin, Upload, Loader2, Eye, Calendar, CheckCircle, XCircle, Phone } from 'lucide-react'

const OwnerDashboard = () => {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const [properties, setProperties] = useState([])
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingProperties, setLoadingProperties] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingProperty, setEditingProperty] = useState(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    rent: '',
    bhkType: '1BHK',
    amenities: '',
    phone: '',
    whatsapp: '',
    lat: '',
    lng: '',
    images: null
  })

  // Fetch owner properties and bookings
  useEffect(() => {
    if (user?.role === 'owner') {
      fetchOwnerData()
    } else {
      navigate('/')
    }
  }, [user])

  const fetchOwnerData = async () => {
    try {
      setLoading(true)
      const [propertiesRes, bookingsRes] = await Promise.all([
        axios.get('/api/properties'),
        axios.get('/api/bookings')
      ])
      setProperties(propertiesRes.data.filter(p => p.ownerId._id === user.id))
      setBookings(bookingsRes.data.filter(b => b.ownerId._id === user.id))
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddEditProperty = async (e) => {
    e.preventDefault()
    if (!formData.lat || !formData.lng) {
      alert('Please provide latitude and longitude')
      return
    }

    try {
      setLoadingProperties(true)
      const data = new FormData()
      Object.keys(formData).forEach(key => {
        if (key === 'images' && formData[key]) {
          Array.from(formData[key]).forEach(file => data.append(key, file))
        } else if (formData[key]) {
          data.append(key, formData[key])
        }
      })

      const endpoint = editingProperty ? `/api/properties/${editingProperty._id}` : '/api/properties'
      const method = editingProperty ? 'put' : 'post'

      await axios[method](endpoint, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      setShowForm(false)
      setEditingProperty(null)
      setFormData({ title: '', description: '', rent: '', bhkType: '1BHK', amenities: '', phone: '', whatsapp: '', lat: '', lng: '', images: null })
      fetchOwnerData()
    } catch (error) {
      console.error('Error saving property:', error)
      alert(error.response?.data?.error || 'Error saving property')
    } finally {
      setLoadingProperties(false)
    }
  }

  const handleDeleteProperty = async (id) => {
    if (!confirm('Delete this property?')) return
    try {
      await axios.delete(`/api/properties/${id}`)
      fetchOwnerData()
    } catch (error) {
      alert('Error deleting property')
    }
  }

  const updateBookingStatus = async (bookingId, status) => {
    try {
      await axios.put(`/api/bookings/${bookingId}/status`, { status })
      fetchOwnerData()
    } catch (error) {
      alert('Error updating booking')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="glass p-8 rounded-2xl text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-primary-500" />
          <p className="text-xl font-semibold text-gray-700">Loading Dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Navbar />
      <div className="max-w-7xl mx-auto p-6 md:p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-800 via-gray-700 to-gray-600 bg-clip-text text-transparent">
              Owner Dashboard
            </h1>
            <p className="text-gray-600 mt-2">Manage your properties & bookings</p>
          </div>
          <div className="flex gap-4">
            <button 
              onClick={() => setShowForm(true)} 
              className="glass bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white px-8 py-3 rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add Property
            </button>
            <button 
              onClick={logout}
              className="glass bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white px-6 py-3 rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Properties Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Properties */}
          <div className="glass bg-white/70 backdrop-blur-xl rounded-3xl p-8 shadow-xl border border-white/50">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3 text-gray-800">
              <MapPin className="w-7 h-7" />
              Your Properties ({properties.length})
            </h2>
            {properties.length === 0 ? (
              <div className="text-center py-16">
                <MapPin className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <p className="text-xl text-gray-500 mb-4">No properties listed yet</p>
                <button 
                  onClick={() => setShowForm(true)}
                  className="glass bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-8 py-3 rounded-2xl font-semibold hover:shadow-xl transition-all"
                >
                  Add Your First Property
                </button>
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {properties.map((property) => (
                  <div key={property._id} className="glass p-6 rounded-2xl border border-gray-200 hover:shadow-xl transition-all hover:-translate-y-1">
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="font-bold text-xl text-gray-800 flex-1 pr-4">{property.title}</h3>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => {
                            setEditingProperty(property)
                            setFormData({
                              title: property.title,
                              description: property.description,
                              rent: property.rent,
                              bhkType: property.bhkType,
                              amenities: property.amenities.join(', '),
                              phone: property.phone,
                              whatsapp: property.whatsapp,
                              lat: property.location.coordinates[1],
                              lng: property.location.coordinates[0]
                            })
                            setShowForm(true)
                          }}
                          className="p-2 hover:bg-blue-100 rounded-xl hover:text-blue-600 transition-all"
                          title="Edit"
                        >
                          <Edit3 className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => handleDeleteProperty(property._id)}
                          className="p-2 hover:bg-red-100 rounded-xl hover:text-red-600 transition-all"
                          title="Delete"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-700">Rent:</span>
                        <span className="font-bold text-emerald-600">₹{property.rent.toLocaleString()}/mo</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-700">Status:</span>
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                          APPROVED
                        </span>
                      </div>
                    </div>
                    {property.images[0] && (
                      <img src={`http://localhost:5000${property.images[0]}`} alt={property.title} className="w-full h-32 object-cover rounded-xl mb-4" />
                    )}
                    <div className="flex gap-2">
                      <a href={`tel:${property.phone}`} className="flex-1 glass p-3 text-center rounded-xl hover:bg-green-500 hover:text-white transition-all flex items-center justify-center gap-2">
                        <Phone className="w-4 h-4" />
                        Call
                      </a>
                      <button className="flex-1 glass p-3 text-center rounded-xl hover:bg-blue-500 hover:text-white transition-all flex items-center justify-center gap-2">
                        <Eye className="w-4 h-4" />
                        View
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Bookings */}
          <div className="glass bg-white/70 backdrop-blur-xl rounded-3xl p-8 shadow-xl border border-white/50">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3 text-gray-800">
              <Calendar className="w-7 h-7" />
              Pending Bookings ({bookings.filter(b => b.status === 'pending').length})
            </h2>
            {bookings.length === 0 ? (
              <div className="text-center py-16">
                <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <p className="text-xl text-gray-500 mb-4">No bookings yet</p>
                <p className="text-gray-400">List some properties to get bookings</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {bookings.slice(0, 5).map((booking) => (
                  <div key={booking._id} className="glass p-5 rounded-2xl border border-gray-200 hover:shadow-xl transition-all">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-bold text-lg">{booking.propertyId.title}</h4>
                        <p className="text-sm text-gray-600">{booking.userId.name}</p>
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-800">
                        PENDING
                      </span>
                    </div>
                    <div className="flex gap-2 pt-3 border-t">
                      <button 
                        onClick={() => updateBookingStatus(booking._id, 'confirmed')}
                        className="flex-1 glass p-3 text-center rounded-xl font-semibold bg-emerald-500 hover:bg-emerald-600 text-white transition-all flex items-center justify-center gap-2"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Accept
                      </button>
                      <button 
                        onClick={() => updateBookingStatus(booking._id, 'cancelled')}
                        className="flex-1 glass p-3 text-center rounded-xl font-semibold bg-red-500 hover:bg-red-600 text-white transition-all flex items-center justify-center gap-2"
                      >
                        <XCircle className="w-4 h-4" />
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Add/Edit Property Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="glass bg-white max-w-2xl w-full max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl">
              <div className="sticky top-0 bg-white/90 backdrop-blur p-6 border-b rounded-t-3xl">
                <h2 className="text-2xl font-bold flex items-center gap-3">
                  {editingProperty ? 'Edit Property' : 'Add New Property'}
                  <button 
                    onClick={() => {
                      setShowForm(false)
                      setEditingProperty(null)
                      setFormData({
                        title: '', description: '', rent: '', bhkType: '1BHK',
                        amenities: '', phone: '', whatsapp: '', lat: '', lng: '', images: null
                      })
                    }}
                    className="ml-auto p-2 hover:bg-gray-200 rounded-xl transition-all"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </h2>
              </div>

              <form onSubmit={handleAddEditProperty} className="p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-gray-700">Title *</label>
                    <input
                      type="text"
                      placeholder="Beautiful 2BHK Apartment"
                      className="w-full p-4 glass border border-gray-200 rounded-2xl focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-gray-700">Rent (₹/month) *</label>
                    <input
                      type="number"
                      placeholder="25000"
                      className="w-full p-4 glass border border-gray-200 rounded-2xl focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
                      value={formData.rent}
                      onChange={(e) => setFormData({...formData, rent: e.target.value})}
                      min="0"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700">BHK Type *</label>
                  <select
                    className="w-full p-4 glass border border-gray-200 rounded-2xl focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
                    value={formData.bhkType}
                    onChange={(e) => setFormData({...formData, bhkType: e.target.value})}
                    required
                  >
                    <option value="1BHK">1BHK</option>
                    <option value="2BHK">2BHK</option>
                    <option value="3BHK">3BHK</option>
                    <option value="4BHK">4BHK</option>
                    <option value="Studio">Studio</option>
                    <option value="PG">PG</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700">Description *</label>
                  <textarea
                    rows="4"
                    placeholder="Describe your property..."
                    className="w-full p-4 glass border border-gray-200 rounded-2xl focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all resize-vertical"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-gray-700">Phone *</label>
                    <input
                      type="tel"
                      placeholder="9876543210"
                      className="w-full p-4 glass border border-gray-200 rounded-2xl focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-gray-700">WhatsApp</label>
                    <input
                      type="tel"
                      placeholder="9876543210"
                      className="w-full p-4 glass border border-gray-200 rounded-2xl focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
                      value={formData.whatsapp}
                      onChange={(e) => setFormData({...formData, whatsapp: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-gray-700">Latitude *</label>
                    <input
                      type="number"
                      step="any"
                      placeholder="28.6139"
                      className="w-full p-4 glass border border-gray-200 rounded-2xl focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
                      value={formData.lat}
                      onChange={(e) => setFormData({...formData, lat: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-gray-700">Longitude *</label>
                    <input
                      type="number"
                      step="any"
                      placeholder="77.2090"
                      className="w-full p-4 glass border border-gray-200 rounded-2xl focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
                      value={formData.lng}
                      onChange={(e) => setFormData({...formData, lng: e.target.value})}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700">Amenities (comma separated)</label>
                  <input
                    type="text"
                    placeholder="AC, Parking, Lift, Gym, Security"
                    className="w-full p-4 glass border border-gray-200 rounded-2xl focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
                    value={formData.amenities}
                    onChange={(e) => setFormData({...formData, amenities: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700">Images</label>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    className="w-full p-4 glass border border-gray-200 rounded-2xl file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 transition-all"
                    onChange={(e) => setFormData({...formData, images: e.target.files})}
                  />
                  <p className="text-xs text-gray-500 mt-1">Upload up to 10 images (JPG, PNG)</p>
                </div>

                <button 
                  type="submit"
                  disabled={loadingProperties}
                  className="w-full py-5 px-8 rounded-2xl font-bold text-lg bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-xl hover:shadow-2xl transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-3"
                >
                  {loadingProperties ? (
                    <>
                      <Loader2 className="w-6 h-6 animate-spin" />
                      {editingProperty ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    editingProperty ? 'Update Property' : 'Create Property'
                  )}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default OwnerDashboard

