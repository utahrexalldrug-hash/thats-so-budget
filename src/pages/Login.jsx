import { useState } from 'react'
import { login, signup } from '../lib/firebase'
import { Wallet, Mail, Lock, Eye, EyeOff } from 'lucide-react'
import { motion } from 'framer-motion'

export default function Login() {
  const [isSignup, setIsSignup] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (isSignup) {
        await signup(email, password)
      } else {
        await login(email, password)
      }
    } catch (err) {
      const code = err.code || ''
      if (code === 'auth/user-not-found' || code === 'auth/invalid-credential') {
        setError('No account found with that email/password')
      } else if (code === 'auth/wrong-password') {
        setError('Incorrect password')
      } else if (code === 'auth/email-already-in-use') {
        setError('An account already exists with that email')
      } else if (code === 'auth/weak-password') {
        setError('Password must be at least 6 characters')
      } else if (code === 'auth/invalid-email') {
        setError('Please enter a valid email address')
      } else {
        setError(err.message)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f7b6c] to-[#0a5c51] flex items-center justify-center px-6">
      <motion.div
        className="w-full max-w-sm"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Wallet size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">That's So Budget</h1>
          <p className="text-white/60 text-sm mt-2">Your household budget, simplified</p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-3xl p-6 shadow-2xl">
          <h2 className="text-lg font-bold text-center mb-5">
            {isSignup ? 'Create Account' : 'Welcome Back'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-tertiary" />
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-surface-2 border border-border-light focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all text-sm"
                autoFocus
                required
              />
            </div>

            <div className="relative">
              <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-tertiary" />
              <input
                type={showPw ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full pl-11 pr-12 py-3.5 rounded-xl bg-surface-2 border border-border-light focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all text-sm"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-tertiary"
              >
                {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {error && (
              <motion.p
                className="text-sm text-danger text-center bg-red-50 rounded-xl py-2 px-3"
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {error}
              </motion.p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-accent text-white font-semibold rounded-xl active:bg-accent-dark transition-colors disabled:opacity-50 text-sm"
            >
              {loading ? 'Loading...' : isSignup ? 'Create Account' : 'Sign In'}
            </button>
          </form>

          <div className="mt-5 text-center">
            <button
              onClick={() => { setIsSignup(!isSignup); setError('') }}
              className="text-sm text-accent font-medium"
            >
              {isSignup ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </button>
          </div>
        </div>

        <p className="text-white/30 text-xs text-center mt-6">
          Both you and your partner sign up with your own email.
          <br />You'll share the same budget data automatically.
        </p>
      </motion.div>
    </div>
  )
}
