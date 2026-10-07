import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { getApiErrorMessage } from '../services/api.js';

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'student' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const onSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const user = await register(form);
      navigate(user.role === 'company' ? '/company/dashboard' : '/student/dashboard');
    } catch (err) {
      setError(getApiErrorMessage(err, err.message || 'We could not create your account.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <div className="card">
        <h2 className="text-2xl font-bold">Create an account</h2>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Full name</label>
            <input autoComplete="name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Email</label>
            <input autoComplete="email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Password</label>
            <input autoComplete="new-password" type="password" minLength="8" required aria-describedby="password-requirements" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
            <p id="password-requirements" className="mt-1 text-xs text-slate-500">Use at least 8 characters.</p>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Role</label>
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2">
              <option value="student">Student</option>
              <option value="company">Company</option>
            </select>
          </div>
          {error && <div role="alert" className="rounded bg-red-50 p-2 text-sm text-red-600">{error}</div>}
          <button disabled={submitting} type="submit" className="primary-btn w-full disabled:opacity-60">{submitting ? 'Creating account…' : 'Create account'}</button>
        </form>
        <p className="mt-4 text-sm text-slate-600">Already have an account? <Link to="/login" className="text-blue-600">Login</Link></p>
      </div>
    </div>
  );
}
