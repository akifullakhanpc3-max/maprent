import { Loader2 } from 'lucide-react'

const PropertyList = ({ properties, isLoading }) => (
  <div className="p-4 space-y-4 max-h-[calc(100vh-300px)] overflow-auto">
    {isLoading ? (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin mr-2 text-primary-500" />
        Loading properties...
      </div>
    ) : properties.length === 0 ? (
      <div className="text-center p-8 text-gray-500">
        No properties found. Try adjusting filters or zoom map.
      </div>
    ) : (
      properties.map((property) => (
        <div key={property._id} className="glass p-4 rounded-2xl hover:shadow-2xl transition-all cursor-pointer group">
          <div className="relative overflow-hidden rounded-xl mb-3">
            <img 
              src={property.images?.[0] || 'https://via.placeholder.com/300x200?text=No+Image'} 
              alt={property.title}
              className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute top-2 right-2 glass px-3 py-1 rounded-full text-xs font-medium">
              {property.bhkType}
            </div>
          </div>
          <h3 className="font-bold text-lg mb-1">{property.title}</h3>
          <p className="text-2xl font-bold text-primary-600 mb-2">
            ₹{property.rent.toLocaleString()}/mo
          </p>
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{property.description}</p>
          <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
            <span>{property.owner?.name || 'Owner'}</span>
            <span>{Math.round(property.views)} views</span>
          </div>
          <div className="flex gap-2">
            <button className="flex-1 glass py-2 px-4 rounded-xl font-medium hover:bg-primary-500 hover:text-white transition-all">
              Get Directions
            </button>
            <button className="glass py-2 px-4 rounded-xl font-medium hover:bg-green-500 hover:text-white transition-all">
              Book Now
            </button>
          </div>
        </div>
      ))
    )}
  </div>
)

export default PropertyList

