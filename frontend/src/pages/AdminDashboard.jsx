import { useEffect, useState } from 'react';
import api from '../services/api.js';

export default function AdminDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [approvingId, setApprovingId] = useState('');

  const loadData = async () => {
    const [dashboardResponse, usersResponse] = await Promise.all([
      api.get('/admin/dashboard'),
      api.get('/admin/users')
    ]);
    setDashboard(dashboardResponse.data);
    setCompanies(usersResponse.data.companies);
  };

  useEffect(() => {
    loadData().catch((requestError) => setError(requestError.response?.data?.message || 'Could not load platform data.'));
  }, []);

  const approve = async (companyId) => {
    setApprovingId(companyId);
    setError('');
    setNotice('');
    try {
      const { data } = await api.patch(`/admin/companies/${companyId}/approve`);
      setNotice(`${data.company.name} has been approved.`);
      await loadData();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not approve this company.');
    } finally {
      setApprovingId('');
    }
  };

  const totals = dashboard?.totals || {};

  return (
    <main className="mx-auto max-w-7xl space-y-6 px-4 py-8">
      <section>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Platform administration</p>
        <h1 className="mt-2 text-3xl font-bold">Overview and operations</h1>
        <p className="mt-2 text-slate-600">Monitor activity and review employer access requests.</p>
      </section>

      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {notice && <p role="status" className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</p>}

      <section aria-label="Platform metrics" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {[
          ['Student accounts', totals.students],
          ['Employer accounts', totals.companies],
          ['Active opportunities', totals.activeJobs],
          ['Applications', totals.applications],
          ['Recorded placements', totals.placedStudents],
          ['Placement rate', totals.placementRate]
        ].map(([label, value]) => (
          <article key={label} className="card">
            <p className="text-sm text-slate-500">{label}</p>
            <p className="mt-3 text-3xl font-bold">{dashboard ? (value ?? 0) : '—'}</p>
          </article>
        ))}
      </section>

      <section className="card">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div><p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Access management</p><h2 className="mt-1 text-xl font-semibold">Employer approvals</h2></div>
          <span className="text-sm text-slate-500">{companies.filter((company) => company.status === 'pending').length} pending review</span>
        </div>
        <div className="mt-4 divide-y divide-slate-100">
          {companies.map((company) => (
            <div key={company.id} className="flex flex-wrap items-center justify-between gap-4 py-4">
              <div>
                <p className="font-semibold text-slate-800">{company.name}</p>
                <p className="mt-1 text-sm text-slate-500">{company.email} · {company.location || 'Location not provided'}</p>
              </div>
              {company.status === 'approved' ? (
                <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">Approved</span>
              ) : (
                <button disabled={approvingId === company.id} onClick={() => approve(company.id)} className="primary-btn disabled:opacity-60">{approvingId === company.id ? 'Approving…' : 'Approve company'}</button>
              )}
            </div>
          ))}
          {companies.length === 0 && <p className="py-5 text-sm text-slate-500">No employer accounts have registered yet.</p>}
          {!dashboard && !error && <p className="py-5 text-sm text-slate-500">Loading platform data…</p>}
        </div>
      </section>

      <p className="text-xs text-slate-500">Metrics reflect records currently stored in the connected database. This view does not use sample analytics.</p>
    </main>
  );
}
