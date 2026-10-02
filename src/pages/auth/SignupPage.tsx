import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MessageSquare, Eye, EyeOff, AlertCircle, Info } from 'lucide-react';
import { signUp } from '../../services/userService';
import { useAuthStore } from '../../stores/authStore';
import { BRANCHES, SEMESTERS } from '../../lib/utils';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

const ALLOWED_DOMAIN = import.meta.env.VITE_ALLOWED_EMAIL_DOMAIN || '';

export function SignupPage() {
  const navigate = useNavigate();
  const { refreshProfile } = useAuthStore();
  const [form, setForm] = useState({
    full_name: '',
    username: '',
    email: '',
    password: '',
    branch: '',
    semester: '',
  });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailSent, setEmailSent] = useState(false);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const validate = () => {
    if (!form.full_name.trim()) return 'Full name is required.';
    if (!form.username.trim() || form.username.length < 3) return 'Username must be at least 3 characters.';
    if (!/^[a-zA-Z0-9_]+$/.test(form.username)) return 'Username can only contain letters, numbers, and underscores.';
    if (!form.email.includes('@')) return 'Enter a valid email.';
    if (ALLOWED_DOMAIN && !form.email.endsWith(`@${ALLOWED_DOMAIN}`)) {
      return `Only @${ALLOWED_DOMAIN} email addresses are allowed.`;
    }
    if (form.password.length < 8) return 'Password must be at least 8 characters.';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const err = validate();
    if (err) { setError(err); return; }
    setLoading(true);

    try {
      await signUp({
        email: form.email,
        password: form.password,
        full_name: form.full_name,
        username: form.username,
        branch: form.branch || undefined,
        semester: form.semester ? Number(form.semester) : undefined,
      });
      setEmailSent(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Signup failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-zinc-50 dark:bg-zinc-950">
        <div className="w-full max-w-sm card p-8 text-center">
          <div className="text-4xl mb-4">📬</div>
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-2">Check your email</h2>
          <p className="text-sm text-zinc-400 leading-relaxed">
            We sent a verification link to <strong className="text-zinc-700 dark:text-zinc-200">{form.email}</strong>. Click the link to activate your account.
          </p>
          <Link to="/login" className="btn-primary mt-6 text-sm">Go to Login</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-zinc-50 dark:bg-zinc-950">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <Link to="/" className="flex items-center gap-2 justify-center mb-8">
          <div className="h-9 w-9 bg-indigo-600 rounded-xl flex items-center justify-center">
            <MessageSquare size={18} className="text-white" />
          </div>
          <span className="font-bold text-xl text-zinc-900 dark:text-zinc-100">DoubtHub</span>
        </Link>

        <div className="card p-6">
          <h1 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-1">Create account</h1>
          <p className="text-sm text-zinc-400 mb-6">Join the community. Start asking.</p>

          {ALLOWED_DOMAIN && (
            <div className="flex items-center gap-2 text-xs text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 p-2.5 rounded-lg mb-4">
              <Info size={12} />
              Only @{ALLOWED_DOMAIN} emails are accepted.
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 text-red-500 text-xs bg-red-50 dark:bg-red-900/20 p-3 rounded-lg mb-4">
              <AlertCircle size={14} /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Full Name</label>
                <input className="input" placeholder="John Doe" value={form.full_name} onChange={(e) => set('full_name', e.target.value)} required />
              </div>
              <div>
                <label className="label">Username</label>
                <input className="input" placeholder="johndoe" value={form.username} onChange={(e) => set('username', e.target.value.toLowerCase())} required />
              </div>
            </div>

            <div>
              <label className="label">Email</label>
              <input type="email" className="input" placeholder="you@example.com" value={form.email} onChange={(e) => set('email', e.target.value)} required />
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} className="input pr-9" placeholder="Min. 8 characters" value={form.password} onChange={(e) => set('password', e.target.value)} required />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400" tabIndex={-1}>
                  {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Branch <span className="text-zinc-400 font-normal">(optional)</span></label>
                <select className="input" value={form.branch} onChange={(e) => set('branch', e.target.value)}>
                  <option value="">Select</option>
                  {BRANCHES.map((b) => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Semester <span className="text-zinc-400 font-normal">(optional)</span></label>
                <select className="input" value={form.semester} onChange={(e) => set('semester', e.target.value)}>
                  <option value="">Select</option>
                  {SEMESTERS.map((s) => <option key={s} value={s}>Sem {s}</option>)}
                </select>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full justify-center mt-2">
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-xs text-zinc-400 mt-5">
            Already have an account?{' '}
            <Link to="/login" className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
