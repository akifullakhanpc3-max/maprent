import { useState } from 'react'
import usePropertyStore from '@/stores/usePropertyStore'

import { Filter, Search } from 'lucide-react'

const PropertyFilters = () => {
  const { filters, setFilters, fetchProperties } = usePropertyStore()
  const [localFilters, setLocalFilters] = useState(filters)

  const applyFilters = () => {
    setFilters(localFilters)
    fetchProperties()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 p-3 glass rounded-xl">
        <Filter className="w-5 h-5" />
        <input 
          placeholder="Search properties..."
          className="flex-1 bg-transparent outline-none text-sm placeholder-gray-500"
        />
        <Search className="w-5 h-5" />
      </div>
      
      <div className="space-y-3">
        <div>
          <label className="text-xs font-medium uppercase tracking-wide text-gray-500 mb-2 block">
            Rent Range
          </label>
          <div className="space-y-2">
            <input 
              type="number" 
              placeholder="Min"
              value={localFilters.minRent}
              onChange={(e) => setLocalFilters({...localFilters, minRent: e.target.value})}
              className="glass w-full px-3 py-2 rounded-lg text-sm"
            />
            <input 
              type="number" 
              placeholder="Max"
              value={localFilters.maxRent}
              onChange={(e) => setLocalFilters({...localFilters, maxRent: e.target.value})}
              className="glass w-full px-3 py-2 rounded-lg text-sm"
            />
          </div>
        </div>
        
        <div>
          <label className="text-xs font-medium uppercase tracking-wide text-gray-500 mb-2 block">
            BHK Type
          </label>
          <select 
            value={localFilters.bhkType}
            onChange={(e) => setLocalFilters({...localFilters, bhkType: e.target.value})}
            className="glass w-full px-3 py-2 rounded-lg text-sm"
          >
            <option value="">All</option>
            <option value="1BHK">1BHK</option>
            <option value="2BHK">2BHK</option>
            <option value="3BHK">3BHK</option>
            <option value="Studio">Studio</option>
          </select>
        </div>
        
        <button 
          onClick={applyFilters}
          className="w-full glass py-3 px-4 rounded-xl font-semibold hover:bg-primary-500 hover:text-white transition-all"
        >
          Apply Filters
        </button>
      </div>
    </div>
  )
}

export default PropertyFilters

