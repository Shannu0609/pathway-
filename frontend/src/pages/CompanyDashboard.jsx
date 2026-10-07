import { useEffect, useState } from 'react';
import api from '../services/api.js';

const emptyJob = { title: '', description: '', location: '', salary: '', employmentType: 'Full Time', requiredSkills: '' };
const emptyInterview = { date: '', time: '', type: 'Technical', meetingLink: '' };

export default function CompanyDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [jobForm, setJobForm] = useState(emptyJob);
  const [interviewFor, setInterviewFor] = useState(null);
  const [interviewForm, setInterviewForm] = useState(emptyInterview);
  const [showJobForm, setShowJobForm] = useState(false);
  const [posting, setPosting] = useState(false);
  const [scheduling, setScheduling] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busyApplication, setBusyApplication] = useState('');

  const loadDashboard = async () => {
    const { data } = await api.get('/companies/dashboard');
    setDashboard(data);
  };

  useEffect(() => {
    loadDashboard().catch((requestError) => setError(requestError.response?.data?.message || 'Could not load your hiring dashboard.'));
  }, []);

  const postJob = async (event) => {
    event.preventDefault();
    setPosting(true);
    setError('');
    setNotice('');
    try {
      const payload = {
        ...jobForm,
        requiredSkills: jobForm.requiredSkills.split(',').map((skill) => skill.trim()).filter(Boolean)
      };
      const { data } = await api.post('/companies/jobs', payload);
      setNotice(data.message);
      setJobForm(emptyJob);
      setShowJobForm(false);
      await loadDashboard();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not post this job.');
    } finally {
      setPosting(false);
    }
  };

  const updateApplication = async (applicationId, status) => {
    setBusyApplication(applicationId);
    setError('');
    setNotice('');
    try {
      await api.put(`/companies/applications/${applicationId}/status`, { status });
      setNotice(`Application status updated to ${status}.`);
      await loadDashboard();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not update this application.');
    } finally {
      setBusyApplication('');
    }
  };

  const scheduleInterview = async (event) => {
    event.preventDefault();
    if (!interviewFor) return;
    setScheduling(true);
    setError('');
    setNotice('');
    try {
      const { data } = await api.post('/companies/interviews', {
        ...interviewForm,
        studentId: interviewFor.studentId,
        jobId: interviewFor.jobId
      });
      setNotice(data.message);
      setInterviewFor(null);
      setInterviewForm(emptyInterview);
      await loadDashboard();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not schedule this interview.');
    } finally {
      setScheduling(false);
    }
  };

  const stats = dashboard?.stats || {};

  return (
    <main className="mx-auto max-w-7xl space-y-6 px-4 py-8">
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Employer workspace</p>
          <h1 className="mt-2 text-3xl font-bold">Hiring dashboard</h1>
          <p className="mt-2 text-slate-600">Manage open roles and review candidates in one place.</p>
        </div>
        <button type="button" onClick={() => setShowJobForm((value) => !value)} className="primary-btn">{showJobForm ? 'Close form' : 'Post a role'}</button>
      </section>

      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {notice && <p role="status" className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</p>}

      {showJobForm && (
        <form onSubmit={postJob} className="card grid gap-4 md:grid-cols-2">
          <h2 className="text-xl font-semibold md:col-span-2">Create a job listing</h2>
          <label className="text-sm font-medium text-slate-700">Job title
            <input required value={jobForm.title} onChange={(event) => setJobForm({ ...jobForm, title: event.target.value })} className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal" />
          </label>
          <label className="text-sm font-medium text-slate-700">Location
            <input required value={jobForm.location} onChange={(event) => setJobForm({ ...jobForm, location: event.target.value })} className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal" />
          </label>
          <label className="text-sm font-medium text-slate-700">Salary range
            <input value={jobForm.salary} onChange={(event) => setJobForm({ ...jobForm, salary: event.target.value })} className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal" placeholder="e.g. ₹12-18 LPA" />
          </label>
          <label className="text-sm font-medium text-slate-700">Employment type
            <select value={jobForm.employmentType} onChange={(event) => setJobForm({ ...jobForm, employmentType: event.target.value })} className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 font-normal">
              <option>Full Time</option><option>Internship</option><option>Contract</option>
            </select>
          </label>
          <label className="text-sm font-medium text-slate-700 md:col-span-2">Role overview
            <textarea required rows="3" value={jobForm.description} onChange={(event) => setJobForm({ ...jobForm, description: event.target.value })} className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal" />
          </label>
          <label className="text-sm font-medium text-slate-700 md:col-span-2">Required skills <span className="font-normal text-slate-500">(comma separated)</span>
            <input value={jobForm.requiredSkills} onChange={(event) => setJobForm({ ...jobForm, requiredSkills: event.target.value })} className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal" placeholder="JavaScript, React, REST API" />
          </label>
          <div className="md:col-span-2 md:text-right">
            <button disabled={posting} className="primary-btn disabled:opacity-60">{posting ? 'Posting…' : 'Publish job'}</button>
          </div>
        </form>
      )}

      <section aria-label="Hiring metrics" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ['Active roles', stats.activeJobs],
          ['Applications', stats.applications],
          ['Shortlisted', stats.shortlisted],
          ['Interviews', stats.interviews]
        ].map(([label, value]) => (
          <article key={label} className="card">
            <p className="text-sm text-slate-500">{label}</p>
            <p className="mt-3 text-3xl font-bold">{dashboard ? value : '—'}</p>
          </article>
        ))}
      </section>

      <section className="card">
        <div className="flex items-end justify-between gap-3">
          <div><p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Talent discovery</p><h2 className="mt-1 text-xl font-semibold">Candidate matches</h2></div>
          <span className="text-xs text-slate-500">Based on candidate profile skills</span>
        </div>
        <div className="mt-4 divide-y divide-slate-100">
          {dashboard?.topMatches?.map((match) => (
            <div key={`${match.student.id}-${match.job}`} className="flex flex-wrap items-center justify-between gap-3 py-4">
              <div><p className="font-semibold text-slate-800">{match.student.name}</p><p className="mt-1 text-sm text-slate-500">{match.job} · {match.student.college || 'Education not listed'}</p></div>
              <div className="text-right"><p className="font-semibold text-emerald-700">{match.match}% skills match</p><p className="mt-1 text-xs text-slate-500">{match.student.skills.join(' · ')}</p></div>
            </div>
          ))}
          {dashboard && !dashboard.topMatches?.length && <p className="py-5 text-sm text-slate-500">Candidate matches will appear as student profiles are completed.</p>}
          {!dashboard && <p className="py-5 text-sm text-slate-500">Loading candidate data…</p>}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <article className="card">
          <h2 className="text-xl font-semibold">Your job listings</h2>
          <div className="mt-4 space-y-3">
            {dashboard?.jobs?.map((job) => (
              <div key={job.id} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex justify-between gap-3"><p className="font-semibold">{job.title}</p><span className="text-xs text-slate-500">{job.status}</span></div>
                <p className="mt-1 text-sm text-slate-500">{job.location} · {job.employmentType || 'Full Time'}</p>
              </div>
            ))}
            {dashboard?.jobs?.length === 0 && <p className="text-sm text-slate-500">No listings yet. Post your first role to get started.</p>}
          </div>
        </article>

        <article className="card">
          <h2 className="text-xl font-semibold">Recent applications</h2>
          <div className="mt-4 space-y-3">
            {dashboard?.applications?.map((application) => (
              <div key={application.id} className="rounded-xl border border-slate-100 p-4">
                <div className="flex flex-wrap justify-between gap-2">
                  <div><p className="font-semibold">{application.student?.name || 'Candidate'}</p><p className="mt-1 text-sm text-slate-500">{application.jobTitle}</p></div>
                  <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">{application.status}</span>
                </div>
                <p className="mt-2 text-xs text-slate-500">{application.student?.skills?.join(' · ') || 'No skills listed'}</p>
                <label className="mt-3 block text-xs font-medium text-slate-600">Application status
                  <select disabled={busyApplication === application.id} value={application.status} onChange={(event) => updateApplication(application.id, event.target.value)} className="ml-2 rounded-md border border-slate-300 bg-white px-2 py-1 text-xs">
                    {['Applied', 'Reviewing', 'Shortlisted', 'Rejected', 'Hired'].map((status) => <option key={status}>{status}</option>)}
                  </select>
                </label>
                {['Shortlisted', 'Hired'].includes(application.status) && (
                  <button
                    type="button"
                    onClick={() => {
                      setInterviewFor({ studentId: application.studentId, jobId: application.jobId });
                      setInterviewForm(emptyInterview);
                    }}
                    className="mt-3 text-sm font-medium text-blue-700 hover:text-blue-900"
                  >
                    Schedule interview
                  </button>
                )}
              </div>
            ))}
            {dashboard?.applications?.length === 0 && <p className="text-sm text-slate-500">There are no applications for your roles yet.</p>}
          </div>
        </article>
      </section>

      {interviewFor && (
        <form onSubmit={scheduleInterview} className="card grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <h2 className="text-xl font-semibold">Schedule candidate interview</h2>
            <p className="mt-1 text-sm text-slate-500">The candidate will receive an in-app notification.</p>
          </div>
          <label className="text-sm font-medium text-slate-700">Date
            <input required type="date" min={new Date().toISOString().slice(0, 10)} value={interviewForm.date} onChange={(event) => setInterviewForm({ ...interviewForm, date: event.target.value })} className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal" />
          </label>
          <label className="text-sm font-medium text-slate-700">Time
            <input required type="time" value={interviewForm.time} onChange={(event) => setInterviewForm({ ...interviewForm, time: event.target.value })} className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal" />
          </label>
          <label className="text-sm font-medium text-slate-700">Interview type
            <select value={interviewForm.type} onChange={(event) => setInterviewForm({ ...interviewForm, type: event.target.value })} className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 font-normal">
              <option>Technical</option><option>HR</option><option>Managerial</option><option>Screening</option>
            </select>
          </label>
          <label className="text-sm font-medium text-slate-700">Meeting link <span className="font-normal text-slate-500">(optional)</span>
            <input type="url" value={interviewForm.meetingLink} onChange={(event) => setInterviewForm({ ...interviewForm, meetingLink: event.target.value })} className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal" placeholder="https://" />
          </label>
          <div className="flex justify-end gap-2 md:col-span-2">
            <button type="button" onClick={() => setInterviewFor(null)} className="secondary-btn">Cancel</button>
            <button disabled={scheduling} className="primary-btn disabled:opacity-60">{scheduling ? 'Scheduling…' : 'Confirm interview'}</button>
          </div>
        </form>
      )}
    </main>
  );
}
