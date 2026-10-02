import { Routes, Route, Navigate } from 'react-router-dom';
import { PublicLayout, AppLayout, AdminLayout } from './components/layout/Layouts';

// Public pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage, ForgotPasswordPage } from './pages/auth/LoginPage';
import { SignupPage } from './pages/auth/SignupPage';

// Authenticated Student pages
import { DashboardPage } from './pages/DashboardPage';
import { ExplorePage } from './pages/ExplorePage';
import { AskDoubtPage } from './pages/AskDoubtPage';
import { DoubtPage } from './pages/DoubtPage';
import { SavedPage } from './pages/SavedPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { ProfilePage } from './pages/ProfilePage';
import { SettingsPage } from './pages/SettingsPage';

// Admin pages
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';

export function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      </Route>

      {/* Authenticated routes (Students & Admins) */}
      <Route element={<AppLayout />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/explore" element={<ExplorePage />} />
        <Route path="/ask" element={<AskDoubtPage />} />
        <Route path="/doubt/:id" element={<DoubtPage />} />
        <Route path="/saved" element={<SavedPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/profile/:id" element={<ProfilePage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>

      {/* Admin routes (Strict role check) */}
      <Route element={<AdminLayout />}>
        <Route path="/admin" element={<AdminDashboardPage />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
