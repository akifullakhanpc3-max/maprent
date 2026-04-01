const PropertyPopup = ({ property }) => (
  <div className="max-w-sm p-4">
    <img 
      src={property.images?.[0] || 'https://via.placeholder.com/300x200'} 
      alt={property.title}
      className="w-full h-32 object-cover rounded-lg mb-3"
    />
    <h3 className="font-bold text-lg mb-2">{property.title}</h3>
    <div className="text-2xl font-bold text-primary-600 mb-3">
      ₹{property.rent.toLocaleString()}/month
    </div>
    <p className="text-sm text-gray-600 mb-4 line-clamp-3">{property.description}</p>
    
    <div className="space-y-2 mb-4">
      <div className="flex items-center gap-2 text-sm">
        <span className="font-semibold">BHK:</span>
        <span>{property.bhkType}</span>
      </div>
      {property.amenities && (
        <div>
          <span className="font-semibold text-sm">Amenities:</span>
          <div className="flex flex-wrap gap-1 mt-1">
            {property.amenities.map((amenity, i) => (
              <span key={i} className="glass px-2 py-1 rounded-full text-xs">
                {amenity}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
    
    <div className="space-y-2">
      <a 
        href={`tel:${property.phone}`}
        className="glass w-full block text-center py-3 rounded-xl font-semibold hover:bg-green-500 hover:text-white transition-all"
      >
        📞 Call Owner
      </a>
      {property.whatsapp && (
        <a 
          href={`https://wa.me/${property.whatsapp}`}
          className="glass w-full block text-center py-3 rounded-xl font-semibold hover:bg-green-500 hover:text-white transition-all"
        >
          💬 WhatsApp
        </a>
      )}
      <button 
        onClick={() => window.navigateToProperty(property)}
        className="glass bg-blue-500 hover:bg-blue-600 text-white w-full block text-center py-3 rounded-xl font-semibold transition-all"
      >
        🗺️ Navigate
      </button>
    </div>
  </div>
)

export default PropertyPopup

