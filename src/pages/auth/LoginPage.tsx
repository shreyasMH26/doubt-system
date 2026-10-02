import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MessageSquare, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
import { signIn, resetPassword } from '../../services/userService';
import { useAuthStore } from '../../stores/authStore';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

export function LoginPage() {
  const navigate = useNavigate();
  const { refreshProfile } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signIn(email, password);
      await refreshProfile();
      navigate('/dashboard');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed';
      setError(msg.includes('Invalid login') ? 'Invalid email or password.' : msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-zinc-50 dark:bg-zinc-950">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 justify-center mb-8">
          <div className="h-9 w-9 bg-indigo-600 rounded-xl flex items-center justify-center">
            <MessageSquare size={18} className="text-white" />
          </div>
          <span className="font-bold text-xl text-zinc-900 dark:text-zinc-100">DoubtHub</span>
        </Link>

        <div className="card p-6">
          <h1 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-1">Welcome back</h1>
          <p className="text-sm text-zinc-400 mb-6">Sign in to your account</p>

          {error && (
            <div className="flex items-center gap-2 text-red-500 text-xs bg-red-50 dark:bg-red-900/20 p-3 rounded-lg mb-4">
              <AlertCircle size={14} /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                className="input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  className="input pr-9"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400"
                  tabIndex={-1}
                >
                  {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end">
              <Link to="/forgot-password" className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center"
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-xs text-zinc-400 mt-5">
            Don't have an account?{' '}
            <Link to="/signup" className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await resetPassword(email);
      setSent(true);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-zinc-50 dark:bg-zinc-950">
      <div className="w-full max-w-sm">
        <Link to="/login" className="flex items-center gap-2 justify-center mb-8">
          <div className="h-9 w-9 bg-indigo-600 rounded-xl flex items-center justify-center">
            <MessageSquare size={18} className="text-white" />
          </div>
          <span className="font-bold text-xl text-zinc-900 dark:text-zinc-100">DoubtHub</span>
        </Link>

        <div className="card p-6">
          {sent ? (
            <div className="text-center">
              <CheckCircle size={40} className="text-green-500 mx-auto mb-3" />
              <h2 className="font-bold text-zinc-900 dark:text-zinc-100 mb-2">Check your email</h2>
              <p className="text-sm text-zinc-400">We sent a password reset link to <strong>{email}</strong></p>
              <Link to="/login" className="btn-primary mt-4 text-sm">Back to Login</Link>
            </div>
          ) : (
            <>
              <h1 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-1">Reset password</h1>
              <p className="text-sm text-zinc-400 mb-6">Enter your email to receive a reset link</p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="label">Email</label>
                  <input type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com" />
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full justify-center">
                  {loading ? 'Sending…' : 'Send Reset Link'}
                </button>
              </form>
              <p className="text-center text-xs text-zinc-400 mt-4">
                <Link to="/login" className="text-indigo-600 hover:underline">Back to login</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
