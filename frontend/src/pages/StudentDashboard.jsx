import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';

const metricCards = [
  { key: 'atsScore', label: 'Resume ATS score', suffix: '%' },
  { key: 'placementReadiness', label: 'Placement readiness', suffix: '%' },
  { key: 'profileCompletion', label: 'Profile complete', suffix: '%' },
  { key: 'jobMatches', label: 'Open job matches', suffix: '' }
];

export default function StudentDashboard() {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/students/dashboard')
      .then(({ data }) => setDashboard(data))
      .catch((requestError) => setError(requestError.response?.data?.message || 'Could not load your dashboard.'));
  }, []);

  if (error) {
    return <main className="mx-auto max-w-7xl px-4 py-10"><div role="alert" className="card border-red-200 text-red-700">{error}</div></main>;
  }

  const student = dashboard?.student;
  const stats = dashboard?.stats || {};

  return (
    <main className="mx-auto max-w-7xl space-y-8 px-4 py-8">
      <section className="flex flex-col gap-5 rounded-3xl bg-gradient-to-r from-slate-950 via-blue-950 to-blue-800 p-7 text-white md:flex-row md:items-end md:justify-between md:p-9">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-200">Student workspace</p>
          <h1 className="mt-3 text-3xl font-bold md:text-4xl">Welcome back, {student?.name || user?.name}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-blue-100">Your next opportunity starts with knowing where you stand. Review your profile, build your skills, and find roles that fit.</p>
        </div>
        <Link to="/student/jobs" className="rounded-xl bg-white px-5 py-3 text-center text-sm font-semibold text-blue-800 shadow-sm">Explore matched jobs</Link>
      </section>

      <section aria-label="Placement metrics" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metricCards.map((metric) => (
          <article key={metric.key} className="card border-slate-200/80">
            <p className="text-sm text-slate-500">{metric.label}</p>
            <p className="mt-3 text-3xl font-bold tracking-tight">
              {dashboard ? `${stats[metric.key] ?? 0}${metric.suffix}` : <span className="text-slate-300">—</span>}
            </p>
            <p className="mt-2 text-xs text-slate-400">Updated from your account data</p>
          </article>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <article className="card">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Career direction</p>
              <h2 className="mt-1 text-xl font-semibold">Recommended roles</h2>
            </div>
            <Link to="/student/jobs" className="text-sm font-medium text-blue-700 hover:text-blue-900">View opportunities</Link>
          </div>
          <div className="mt-5 space-y-3">
            {!dashboard && <p className="text-sm text-slate-400">Loading recommendations…</p>}
            {dashboard?.recommendedRoles?.length > 0 ? dashboard.recommendedRoles.map((role) => (
              <div key={role} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                <span className="font-medium text-slate-800">{role}</span>
                <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700">Profile fit</span>
              </div>
            )) : dashboard && <p className="text-sm text-slate-500">Upload your resume to get role recommendations.</p>}
          </div>
        </article>

        <article className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Skill development</p>
              <h2 className="mt-1 text-xl font-semibold">Skills to strengthen</h2>
            </div>
            <Link to="/roadmap" className="text-sm font-medium text-blue-700 hover:text-blue-900">Open roadmap</Link>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {!dashboard && <span className="text-sm text-slate-400">Loading your skills…</span>}
            {dashboard?.skillGaps?.length > 0 ? dashboard.skillGaps.map((skill) => (
              <span key={skill} className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-sm font-medium text-amber-800">{skill}</span>
            )) : dashboard && <p className="text-sm text-slate-500">Add a resume analysis to see your skill gaps.</p>}
          </div>
          <Link to="/student/resume-analysis" className="secondary-btn mt-6 w-full">Review resume analysis</Link>
        </article>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <article className="card">
          <div className="flex items-center justify-between gap-3">
            <div><p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Application journey</p><h2 className="mt-1 text-xl font-semibold">Recent applications</h2></div>
            <span className="text-sm text-slate-500">{stats.applications || 0} total</span>
          </div>
          <ul className="mt-4 divide-y divide-slate-100">
            {dashboard?.applications?.slice(0, 4).map((application) => (
              <li key={application.id} className="flex items-center justify-between gap-3 py-3">
                <div><p className="text-sm font-medium text-slate-800">{application.jobTitle}</p><p className="mt-1 text-xs text-slate-500">{application.companyName}</p></div>
                <span className="shrink-0 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">{application.status}</span>
              </li>
            ))}
            {dashboard && !dashboard.applications?.length && <li className="py-4 text-sm text-slate-500">When you apply to a role, its progress will appear here.</li>}
          </ul>
        </article>

        <article className="card">
          <div><p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Next steps</p><h2 className="mt-1 text-xl font-semibold">Interviews and placement</h2></div>
          <div className="mt-4 space-y-3">
            {dashboard?.interviews?.map((interview) => (
              <div key={interview.id} className="rounded-xl border border-blue-100 bg-blue-50/60 p-3">
                <p className="font-medium text-slate-800">{interview.type} interview · {interview.jobTitle}</p>
                <p className="mt-1 text-sm text-slate-600">{interview.date} at {interview.time}</p>
                {interview.meetingLink && <a className="mt-2 inline-block text-sm font-medium text-blue-700 underline" href={interview.meetingLink} target="_blank" rel="noreferrer">Open meeting link</a>}
              </div>
            ))}
            {dashboard && !dashboard.interviews?.length && <p className="text-sm text-slate-500">Scheduled interviews will appear here.</p>}
            {dashboard?.placements?.map((placement) => (
              <div key={placement.id} className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                <p className="font-semibold text-emerald-800">Placement recorded · {placement.title}</p>
                <p className="mt-1 text-sm text-emerald-700">{placement.status}</p>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="card">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Your account</p>
            <h2 className="mt-1 text-xl font-semibold">Recent activity</h2>
          </div>
          <Link to="/student/profile" className="text-sm font-medium text-blue-700 hover:text-blue-900">Complete profile</Link>
        </div>
        <ul className="mt-4 divide-y divide-slate-100">
          {!dashboard && <li className="py-4 text-sm text-slate-400">Loading activity…</li>}
          {dashboard?.notifications?.length > 0 ? dashboard.notifications.slice(0, 4).map((notification) => (
            <li key={notification.id} className="flex items-start gap-3 py-4">
              <span aria-hidden="true" className="mt-1 h-2.5 w-2.5 rounded-full bg-blue-500" />
              <div>
                <p className="text-sm font-medium text-slate-800">{notification.title}</p>
                <p className="mt-1 text-sm text-slate-500">{notification.message}</p>
              </div>
            </li>
          )) : dashboard && <li className="py-4 text-sm text-slate-500">No recent activity. New application updates will appear here.</li>}
        </ul>
      </section>
    </main>
  );
}
