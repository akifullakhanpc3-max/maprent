import { useState } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import useAuthStore from '@/stores/useAuthStore'
import { Mail, Lock, User, MapPin } from 'lucide-react'

import Navbar from '@/components/Navbar'

export default function AuthLayout() {

  const [searchParams] = useSearchParams()
  const isRegister = searchParams.get('mode') === 'register'
  const navigate = useNavigate()
  const { login, register, isLoading } = useAuthStore()
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    passwordHash: '',
    role: 'user'  // default, owner/admin via form?
  })
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      setError('')
      if (isRegister) {
        const data = await register(formData)
        navigate('/')
      } else {
        const data = await login({ email: formData.email, passwordHash: formData.passwordHash })
        navigate('/')
      }
    } catch (err) {
      setError(err.error || 'Something went wrong')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="glass backdrop-blur-xl max-w-md w-full p-8 rounded-3xl shadow-2xl border border-white/50">
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-primary-500 to-indigo-500 rounded-3xl flex items-center justify-center shadow-lg">
            <MapPin className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-3">
            MapRent
          </h1>
          <p className="text-gray-600 text-lg">
            {isRegister ? 'Create your account' : 'Welcome back'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 glass bg-red-50 border border-red-200 text-red-800 rounded-2xl text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {isRegister && (
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">Full Name *</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Enter your name"
                  className="w-full pl-12 pr-4 py-4 glass border border-gray-200 rounded-2xl focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
            </div>
          )}
          
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-700">Email Address *</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                placeholder="your@email.com"
                className="w-full pl-12 pr-4 py-4 glass border border-gray-200 rounded-2xl focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-700">Password *</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="password"
                placeholder="••••••••"
                className="w-full pl-12 pr-4 py-4 glass border border-gray-200 rounded-2xl focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
                value={formData.passwordHash}
                onChange={(e) => setFormData({ ...formData, passwordHash: e.target.value })}
                minLength="6"
                required
              />
            </div>
          </div>

          {isRegister && (
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">Role</label>
              <select
                className="w-full px-4 py-4 glass border border-gray-200 rounded-2xl focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              >
                <option value="user">Renter (User)</option>
                <option value="owner">Property Owner</option>
              </select>
            </div>
          )}

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full py-4 px-6 rounded-2xl font-bold text-lg bg-gradient-to-r from-primary-500 to-indigo-500 hover:from-primary-600 hover:to-indigo-600 text-white shadow-xl hover:shadow-2xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Processing...
              </>
            ) : (
              isRegister ? 'Create Account' : 'Sign In'
            )}
          </button>
        </form>

        <div className="mt-8 pt-8 border-t border-gray-200 text-center space-y-4">
          <p className="text-sm text-gray-600">
            {isRegister ? 'Already have an account?' : "Don't have an account?"}
          </p>
          <Link 
            to={`/?mode=${isRegister ? '' : 'register'}`}
            className="block w-full glass py-3 px-6 rounded-2xl font-semibold text-primary-600 hover:bg-primary-50 hover:text-primary-700 transition-all border border-primary-200"
          >
            {isRegister ? 'Sign In' : 'Create Account'}
          </Link>
        </div>

        <div className="mt-6 p-4 glass bg-blue-50 border border-blue-200 rounded-2xl text-xs text-blue-800">
          <p><strong>Demo accounts:</strong></p>
          <p>user@email.com / password123</p>
          <p>owner@email.com / password123</p>
          <p>admin@email.com / password123</p>
        </div>
      </div>
    </div>
  )
}

