import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { getApiErrorMessage } from '../services/api.js';

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const onSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const user = await login(form);
      if (user.role === 'student') navigate('/student/dashboard');
      if (user.role === 'company') navigate('/company/dashboard');
      if (user.role === 'admin') navigate('/admin/dashboard');
    } catch (err) {
      setError(getApiErrorMessage(err, err.message || 'Login failed.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <div className="card">
        <h2 className="text-2xl font-bold">Welcome back</h2>
        <p className="mt-2 text-sm text-slate-600">Sign in to continue to your placement workspace.</p>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Email</label>
            <input autoComplete="email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Password</label>
            <input autoComplete="current-password" type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
          </div>
          {error && <div role="alert" className="rounded bg-red-50 p-2 text-sm text-red-600">{error}</div>}
          <button disabled={submitting} type="submit" className="primary-btn w-full disabled:opacity-60">{submitting ? 'Signing in…' : 'Sign in'}</button>
        </form>
        <p className="mt-4 text-sm text-slate-600">New here? <Link to="/register" className="text-blue-600">Create account</Link></p>
      </div>
    </div>
  );
}
