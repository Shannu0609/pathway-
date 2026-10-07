import { Navigate, Route, Routes, Link } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import LandingPage from './pages/LandingPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import StudentDashboard from './pages/StudentDashboard.jsx';
import StudentProfile from './pages/StudentProfile.jsx';
import ResumeAnalysisPage from './pages/ResumeAnalysisPage.jsx';
import JobsPage from './pages/JobsPage.jsx';
import CompanyDashboard from './pages/CompanyDashboard.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import AssessmentPage from './pages/AssessmentPage.jsx';
import RoadmapPage from './pages/RoadmapPage.jsx';

const ProtectedRoute = ({ children, allowedRole }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRole && user.role !== allowedRole) return <Navigate to="/" replace />;
  return children;
};

const NotFound = () => (
  <main className="mx-auto max-w-3xl px-4 py-24 text-center">
    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-700">Page not found</p>
    <h1 className="mt-3 text-3xl font-bold">We could not find that page.</h1>
    <Link to="/" className="primary-btn mt-6">Return home</Link>
  </main>
);

export default function App() {
  const { user, logout } = useAuth();
  const navigation = {
    student: [
      ['/student/dashboard', 'Overview'],
      ['/student/profile', 'Profile'],
      ['/student/jobs', 'Jobs'],
      ['/student/resume-analysis', 'Resume'],
      ['/roadmap', 'Roadmap'],
      ['/assessments', 'Assessments']
    ],
    company: [['/company/dashboard', 'Hiring']],
    admin: [['/admin/dashboard', 'Administration']]
  };

  return (
    <div className="min-h-screen text-slate-900">
      <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/95 shadow-sm backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-6 gap-y-3 px-4 py-3">
          <Link to={user?.role === 'student' ? '/student/dashboard' : '/'} className="flex items-center gap-2.5 text-base font-bold text-slate-900 sm:text-lg">
            <span aria-hidden="true" className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-700 text-sm text-white">P</span>
            <span>Pathway<span className="text-blue-700">+</span></span>
          </Link>
          {user && (
            <nav aria-label="Main navigation" className="order-3 flex w-full gap-1 overflow-x-auto pb-1 md:order-none md:w-auto md:pb-0">
              {(navigation[user.role] || []).map(([to, label]) => (
                <Link key={to} to={to} className="whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-blue-50 hover:text-blue-800">{label}</Link>
              ))}
            </nav>
          )}
          <div className="flex items-center gap-2 sm:gap-3">
            {!user ? (
              <>
                <Link to="/login" className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Sign in</Link>
                <Link to="/register" className="primary-btn">Get started</Link>
              </>
            ) : (
              <>
                <span className="hidden max-w-36 truncate text-sm text-slate-600 sm:block">{user.name}</span>
                <button className="secondary-btn" onClick={logout}>Sign out</button>
              </>
            )}
          </div>
        </div>
      </header>

      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/student/dashboard" element={<ProtectedRoute allowedRole="student"><StudentDashboard /></ProtectedRoute>} />
        <Route path="/student/profile" element={<ProtectedRoute allowedRole="student"><StudentProfile /></ProtectedRoute>} />
        <Route path="/student/jobs" element={<ProtectedRoute allowedRole="student"><JobsPage /></ProtectedRoute>} />
        <Route path="/student/resume-analysis" element={<ProtectedRoute allowedRole="student"><ResumeAnalysisPage /></ProtectedRoute>} />
        <Route path="/company/dashboard" element={<ProtectedRoute allowedRole="company"><CompanyDashboard /></ProtectedRoute>} />
        <Route path="/admin/dashboard" element={<ProtectedRoute allowedRole="admin"><AdminDashboard /></ProtectedRoute>} />
        <Route path="/assessments" element={<ProtectedRoute><AssessmentPage /></ProtectedRoute>} />
        <Route path="/roadmap" element={<ProtectedRoute allowedRole="student"><RoadmapPage /></ProtectedRoute>} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <footer className="mt-12 border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <span>Pathway+ · Placement intelligence for students and hiring teams</span>
          <span>Automated recommendations are guidance, not hiring decisions.</span>
        </div>
      </footer>
    </div>
  );
}
