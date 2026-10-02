import { Link } from 'react-router-dom';
import { ArrowRight, MessageSquare, CheckCircle, Users, TrendingUp, Zap, Shield } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getPlatformStats } from '../services/notificationService';
import { motion } from 'framer-motion';
import { useAuthStore } from '../stores/authStore';
import { isConfigured } from '../lib/supabase';

export function LandingPage() {
  const { profile } = useAuthStore();

  const { data: stats } = useQuery({
    queryKey: ['platform-stats'],
    queryFn: getPlatformStats,
    enabled: isConfigured,
  });

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 flex flex-col">
      {/* Nav */}
      <nav className="max-w-7xl mx-auto w-full px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <MessageSquare size={16} className="text-white" />
          </div>
          <span className="font-bold text-zinc-900 dark:text-zinc-100">DoubtHub</span>
        </div>
        <div className="flex items-center gap-3">
          {profile ? (
            <Link to="/dashboard" className="btn-primary text-sm">Dashboard</Link>
          ) : (
            <>
              <Link to="/login" className="btn-ghost text-sm">Log In</Link>
              <Link to="/signup" className="btn-primary text-sm">Sign Up Free</Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-3xl"
        >
          <div className="inline-flex items-center gap-2 badge badge-indigo px-3 py-1 mb-6 text-xs">
            <Zap size={11} />
            Student-powered doubt solving
          </div>

          <h1 className="text-4xl sm:text-6xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight mb-5 leading-tight">
            Ask anything.{' '}
            <span className="text-indigo-600">Find answers.</span>
            <br />Help someone out.
          </h1>

          <p className="text-lg text-zinc-500 dark:text-zinc-400 max-w-xl mx-auto mb-8 leading-relaxed">
            DoubtHub is a community where students help each other solve academic doubts, share knowledge, and learn together.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to={profile ? '/ask' : '/signup'} className="btn-primary px-6 py-3 text-sm gap-2">
              Ask a Doubt
              <ArrowRight size={16} />
            </Link>
            <Link to="/explore" className="btn-secondary px-6 py-3 text-sm">
              Explore Doubts
            </Link>
          </div>
        </motion.div>

        {/* Stats */}
        {stats && (stats.users > 0 || stats.doubts > 0) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-2xl w-full"
          >
            {[
              { label: 'Students', value: stats.users, icon: Users },
              { label: 'Doubts Posted', value: stats.doubts, icon: MessageSquare },
              { label: 'Answers Given', value: stats.answers, icon: CheckCircle },
              { label: 'Solved', value: stats.solved, icon: TrendingUp },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="card p-4 text-center">
                <Icon size={18} className="text-indigo-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{value.toLocaleString()}</div>
                <div className="text-xs text-zinc-400 mt-0.5">{label}</div>
              </div>
            ))}
          </motion.div>
        )}

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-20 grid sm:grid-cols-3 gap-6 max-w-3xl w-full text-left"
        >
          {[
            {
              icon: MessageSquare,
              title: 'Ask & Answer',
              desc: 'Post doubts with images and PDFs. Get answers from your peers.',
            },
            {
              icon: Zap,
              title: 'AI Assistance',
              desc: 'Get instant explanations and step-by-step guidance from AI.',
            },
            {
              icon: Shield,
              title: 'Safe Community',
              desc: 'Moderated platform with reports, trusted answers, and reputation.',
            },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="card p-5">
              <div className="h-9 w-9 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center mb-3">
                <Icon size={18} className="text-indigo-600 dark:text-indigo-400" />
              </div>
              <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 mb-1">{title}</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">{desc}</p>
            </div>
          ))}
        </motion.div>
      </main>

      {/* Setup banner when not configured */}
      {!isConfigured && (
        <div className="fixed bottom-4 left-4 right-4 max-w-sm mx-auto bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 rounded-xl p-4 text-xs text-amber-700 dark:text-amber-300">
          <strong>⚙️ Setup Required:</strong> Add your Supabase credentials to <code>.env</code> to activate the backend. See <code>.env.example</code> for details.
        </div>
      )}

      <footer className="text-center py-8 text-xs text-zinc-400">
        DoubtHub · Ask. Answer. Learn.
      </footer>
    </div>
  );
}
