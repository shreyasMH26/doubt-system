import { useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { updateProfile, updatePassword } from '../services/userService';
import { BRANCHES, SEMESTERS } from '../lib/utils';
import { User, Lock, Save, Loader2, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

export function SettingsPage() {
  const { profile, refreshProfile } = useAuthStore();

  const [form, setForm] = useState({
    full_name: profile?.full_name || '',
    username: profile?.username || '',
    bio: profile?.bio || '',
    branch: profile?.branch || '',
    semester: profile?.semester?.toString() || '',
    avatar_url: profile?.avatar_url || '',
  });

  const [passwordForm, setPasswordForm] = useState({
    newPassword: '',
    confirmPassword: '',
  });

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSavingProfile(true);

    try {
      await updateProfile(profile.id, {
        full_name: form.full_name.trim(),
        bio: form.bio.trim() || null,
        branch: form.branch || null,
        semester: form.semester ? Number(form.semester) : null,
        avatar_url: form.avatar_url.trim() || null,
      });
      await refreshProfile();
      toast.success('Profile updated successfully');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setSavingPassword(true);
    try {
      await updatePassword(passwordForm.newPassword);
      setPasswordForm({ newPassword: '', confirmPassword: '' });
      toast.success('Password updated successfully');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Password update failed');
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Account Settings</h1>
        <p className="text-sm text-zinc-400 mt-0.5">Manage your student profile and security credentials</p>
      </div>

      {/* Edit Profile */}
      <div className="card p-6">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-4 flex items-center gap-2">
          <User size={16} className="text-indigo-500" />
          Public Profile
        </h2>

        <form onSubmit={handleProfileSubmit} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Full Name</label>
              <input
                className="input"
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="label">Username</label>
              <input
                className="input opacity-60 cursor-not-allowed"
                value={form.username}
                disabled
                title="Username cannot be changed directly"
              />
            </div>
          </div>

          <div>
            <label className="label">Bio / Academic Interest</label>
            <textarea
              className="textarea"
              rows={3}
              placeholder="e.g. 3rd year CS enthusiast specializing in Computer Networks and Algorithms."
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              maxLength={300}
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Branch</label>
              <select
                className="input"
                value={form.branch}
                onChange={(e) => setForm({ ...form, branch: e.target.value })}
              >
                <option value="">Select Branch</option>
                {BRANCHES.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Semester</label>
              <select
                className="input"
                value={form.semester}
                onChange={(e) => setForm({ ...form, semester: e.target.value })}
              >
                <option value="">Select Semester</option>
                {SEMESTERS.map((s) => (
                  <option key={s} value={s}>Semester {s}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="label">Avatar Image URL (Optional)</label>
            <input
              type="url"
              className="input"
              placeholder="https://example.com/avatar.jpg"
              value={form.avatar_url}
              onChange={(e) => setForm({ ...form, avatar_url: e.target.value })}
            />
          </div>

          <button
            type="submit"
            disabled={savingProfile}
            className="btn-primary text-xs"
          >
            {savingProfile ? (
              <><Loader2 size={13} className="animate-spin" /> Saving…</>
            ) : (
              <><Save size={13} /> Save Profile</>
            )}
          </button>
        </form>
      </div>

      {/* Change Password */}
      <div className="card p-6">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-4 flex items-center gap-2">
          <Lock size={16} className="text-indigo-500" />
          Change Password
        </h2>

        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">New Password</label>
              <input
                type="password"
                className="input"
                placeholder="Min. 8 characters"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="label">Confirm New Password</label>
              <input
                type="password"
                className="input"
                placeholder="Re-enter password"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={savingPassword}
            className="btn-secondary text-xs"
          >
            {savingPassword ? (
              <><Loader2 size={13} className="animate-spin" /> Updating…</>
            ) : (
              <><CheckCircle2 size={13} /> Update Password</>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
