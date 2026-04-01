import { Link } from 'react-router-dom'
import useAuthStore from '@/stores/useAuthStore'
import { MapPin, User, LogOut } from 'lucide-react'

export default function Navbar() {
  const { user, logout } = useAuthStore()

  return (
    <nav className="glass sticky top-0 z-50 px-6 py-4 shadow-lg">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-xl font-bold glass p-3 rounded-xl">
          <MapPin className="w-6 h-6" />
          MapRent
        </Link>
        
        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-2 glass px-4 py-2 rounded-xl">
              <User className="w-5 h-5" />
              <span>{user.name}</span>
              <button onClick={logout} className="ml-2 p-1 hover:bg-white/20 rounded">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link to="/login" className="glass px-6 py-2 rounded-xl font-medium hover:backdrop-blur-sm transition-all">
              Login / Register
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}

