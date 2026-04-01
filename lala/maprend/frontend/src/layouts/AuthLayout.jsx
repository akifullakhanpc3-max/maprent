import { useState } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import useAuthStore from '@/stores/useAuthStore'
import { Mail, Lock, User } from 'lucide-react'

export default function AuthLayout() {
  const [searchParams] = useSearchParams()
  const isRegister = searchParams.get('mode') === 'register'
  const navigate = useNavigate()
  const { login, register, isLoading } = useAuthStore()
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    passwordHash: ''
  })
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (isRegister) {
        await register(formData)
      } else {
        await login({ email: formData.email, passwordHash: formData.passwordHash })
      }
      navigate('/')
    } catch (err) {
      setError(err.error || 'Error occurred')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="glass max-w-md w-full p-8 rounded-3xl shadow-2xl">
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 glass rounded-3xl flex items-center justify-center">
            <Mail className="w-10 h-10 text-primary-500" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-indigo-600 bg-clip-text text-transparent mb-2">
            {isRegister ? 'Join MapRent' : 'Welcome Back'}
          </h1>
          <p className="text-gray-600">Enter details to {isRegister ? 'register' : 'login'}</p>
        </div>

        {error && (
          <div className="glass text-red-600 text-sm p-3 rounded-xl mb-6 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {isRegister && (
            <div>
              <label className="block text-sm font-medium mb-2">Full Name</label>
              <div className="glass relative p-3 rounded-xl">
                <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full pl-10 bg-transparent outline-none"
                  required
                />
              </div>
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <div className="glass relative p-3 rounded-xl">
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                placeholder="your@email.com"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full pl-10 bg-transparent outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Password</label>
            <div className="glass relative p-3 rounded-xl">
              <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                placeholder="••••••••"
                value={formData.passwordHash}
                onChange={(e) => setFormData({...formData, passwordHash: e.target.value})}
                className="w-full pl-10 bg-transparent outline-none"
                required
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full glass py-4 px-6 rounded-2xl font-semibold text-lg bg-gradient-to-r from-primary-500 to-indigo-500 hover:from-primary-600 hover:to-indigo-600 text-white shadow-xl hover:shadow-2xl transition-all duration-300 disabled:opacity-50"
          >
            {isLoading ? 'Loading...' : (isRegister ? 'Create Account' : 'Sign In')}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-200 text-center">
          <p className="text-sm text-gray-600">
            {isRegister ? 'Already have account? ' : 'No account? '}
            <Link 
              to={`/?mode=${isRegister ? 'login' : 'register'}`}
              className="font-semibold text-primary-600 hover:text-primary-700"
            >
              {isRegister ? 'Sign in' : 'Create one'}
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

