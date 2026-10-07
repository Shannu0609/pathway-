import { useEffect, useState } from 'react';
import api from '../services/api.js';

export default function RoadmapPage() {
  const [roadmap, setRoadmap] = useState(null);
  const [busyIndex, setBusyIndex] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/students/roadmap')
      .then(({ data }) => setRoadmap(data))
      .catch((requestError) => setError(requestError.response?.data?.message || 'Could not load your learning roadmap.'));
  }, []);

  const toggleWeek = async (weekIndex) => {
    if (!roadmap) return;
    const completed = !roadmap.weeks[weekIndex].completed;
    setBusyIndex(weekIndex);
    setError('');
    try {
      const { data } = await api.put('/students/roadmap/progress', { weekIndex, completed });
      setRoadmap(data.roadmap);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not update this roadmap item.');
    } finally {
      setBusyIndex(null);
    }
  };

  const completion = roadmap?.weeks?.length
    ? Math.round((roadmap.weeks.filter((week) => week.completed).length / roadmap.weeks.length) * 100)
    : roadmap?.progress || 0;

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <section className="card mb-6 bg-gradient-to-r from-blue-950 to-blue-800 text-white">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-200">Personalized learning plan</p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">{roadmap?.role || 'Career'} roadmap</h1>
            <p className="mt-2 text-sm text-blue-100">Mark milestones as you complete them; your progress is saved to your account.</p>
          </div>
          <div className="text-3xl font-bold">{roadmap ? `${completion}%` : '—'}</div>
        </div>
        <div className="metric-bar mt-5 bg-white/20"><span className="metric-fill" style={{ width: `${completion}%` }} /></div>
      </section>

      {error && <p role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <section aria-label="Roadmap milestones" className="space-y-4">
        {!roadmap && !error && <div className="card text-center text-sm text-slate-500">Loading your roadmap…</div>}
        {roadmap?.weeks?.map((item, index) => (
          <article key={`${item.week}-${item.title}`} className="card flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex items-start gap-4">
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${item.completed ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-50 text-blue-700'}`}>{item.completed ? '✓' : String(item.week).padStart(2, '0')}</span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Week {item.week}</p>
                <h2 className="mt-1 font-semibold text-slate-900">{item.title}</h2>
                {item.objective && <p className="mt-1 text-sm text-slate-500">{item.objective}</p>}
                {item.topics?.length > 0 && <p className="mt-2 text-xs text-slate-500">{item.topics.join(' · ')}</p>}
              </div>
            </div>
            <button
              type="button"
              onClick={() => toggleWeek(index)}
              disabled={busyIndex === index}
              className={item.completed ? 'secondary-btn shrink-0' : 'primary-btn shrink-0'}
            >
              {busyIndex === index ? 'Saving…' : item.completed ? 'Mark incomplete' : 'Mark complete'}
            </button>
          </article>
        ))}
        {roadmap && roadmap.weeks?.length === 0 && <div className="card text-center text-sm text-slate-500">No milestones have been added to this roadmap yet.</div>}
      </section>
    </main>
  );
}
