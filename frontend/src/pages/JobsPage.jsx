import { useEffect, useMemo, useState } from 'react';
import api from '../services/api.js';

export default function JobsPage() {
  const [jobs, setJobs] = useState([]);
  const [search, setSearch] = useState('');
  const [location, setLocation] = useState('');
  const [submittingId, setSubmittingId] = useState('');
  const [appliedIds, setAppliedIds] = useState([]);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/jobs/matches')
      .then(({ data }) => setJobs(data))
      .catch((requestError) => setError(requestError.response?.data?.message || 'Could not load current openings.'))
      .finally(() => setLoading(false));
  }, []);

  const visibleJobs = useMemo(() => jobs.filter((job) => {
    const text = `${job.title} ${job.companyName} ${(job.requiredSkills || []).join(' ')}`.toLowerCase();
    return text.includes(search.toLowerCase()) && job.location?.toLowerCase().includes(location.toLowerCase());
  }), [jobs, search, location]);

  const apply = async (job) => {
    setSubmittingId(job.id);
    setNotice('');
    setError('');
    try {
      const { data } = await api.post(`/jobs/${job.id}/apply`);
      setAppliedIds((current) => [...current, job.id]);
      setNotice(data.message);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not submit your application.');
    } finally {
      setSubmittingId('');
    }
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <section className="mb-7">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Career opportunities</p>
        <div className="mt-2 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h1 className="text-3xl font-bold">Find your next role</h1>
            <p className="mt-2 text-slate-600">Active openings ranked against the skills in your profile.</p>
          </div>
          <span className="text-sm text-slate-500">{jobs.length} current {jobs.length === 1 ? 'opening' : 'openings'}</span>
        </div>
      </section>

      <section aria-label="Search jobs" className="card mb-6 grid gap-3 sm:grid-cols-[1fr_0.6fr]">
        <label className="text-sm font-medium text-slate-700">
          Search roles or skills
          <input value={search} onChange={(event) => setSearch(event.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal focus:border-blue-500 focus:ring-2 focus:ring-blue-100" placeholder="e.g. frontend, React, analyst" />
        </label>
        <label className="text-sm font-medium text-slate-700">
          Location
          <input value={location} onChange={(event) => setLocation(event.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal focus:border-blue-500 focus:ring-2 focus:ring-blue-100" placeholder="Any location" />
        </label>
      </section>

      {notice && <p role="status" className="mb-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</p>}
      {error && <p role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {loading && <p className="py-8 text-center text-sm text-slate-500">Loading current openings…</p>}
      {!loading && visibleJobs.length === 0 && <div className="card py-12 text-center text-slate-600">No openings match these filters right now.</div>}

      <section className="grid gap-4">
        {visibleJobs.map((job) => (
          <article key={job.id} className="card transition hover:border-blue-200 hover:shadow-md">
            <div className="flex flex-col justify-between gap-5 md:flex-row md:items-start">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-semibold text-slate-900">{job.title}</h2>
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">{job.matchScore}% skills match</span>
                </div>
                <p className="mt-1 text-sm font-medium text-slate-600">{job.companyName} <span className="px-1 text-slate-300">·</span> {job.location}</p>
                {job.description && <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">{job.description}</p>}
                <div className="mt-4 flex flex-wrap gap-2">
                  {(job.requiredSkills || []).map((skill) => <span key={skill} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-700">{skill}</span>)}
                </div>
                <p className="mt-4 text-xs text-slate-500">{job.employmentType || 'Full Time'}{job.salary ? ` · ${job.salary}` : ''}</p>
              </div>
              <button
                type="button"
                disabled={submittingId === job.id || appliedIds.includes(job.id)}
                onClick={() => apply(job)}
                className="primary-btn shrink-0 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {appliedIds.includes(job.id) ? 'Application sent' : submittingId === job.id ? 'Applying…' : 'Apply now'}
              </button>
            </div>
          </article>
        ))}
      </section>
      <p className="mt-6 text-xs leading-5 text-slate-500">Skills-match scores compare the skills listed in your profile with a job's requested skills. They are guidance only and are not a hiring decision.</p>
    </main>
  );
}
