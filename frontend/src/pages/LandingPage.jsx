import { Link } from 'react-router-dom';

const features = ['Resume Analysis', 'Skill Gap Detection', 'Career Roadmaps', 'Job Matching'];

export default function LandingPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-16">
      <section className="hero-glow grid gap-8 rounded-[30px] bg-gradient-to-br from-blue-700 via-blue-600 to-cyan-500 p-10 text-white md:grid-cols-[1.2fr_0.8fr] md:p-16">
        <div>
          <span className="inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-medium tracking-[0.2em] text-blue-50 uppercase">Career intelligence for the next step</span>
          <h1 className="mt-6 text-4xl font-bold leading-tight md:text-6xl">Build your placement edge with data.</h1>
          <p className="mt-6 max-w-xl text-blue-50/95">Understand your strengths, improve your resume, build the skills employers request, and manage applications from one career workspace.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/login" className="rounded-xl bg-white px-5 py-3 font-medium text-blue-700 shadow-md">Get Started</Link>
            <Link to="/register" className="rounded-xl border border-white/40 bg-white/5 px-5 py-3 font-medium text-white">Create Account</Link>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {[
              ['Career workspace', 'Profile, roadmap, and application tracking'],
              ['Career opportunities', 'Explore skill-aligned roles after signing in']
            ].map(([label, value]) => (
              <div key={label} className="soft-card rounded-2xl p-4">
                <div className="text-lg font-bold">{label}</div>
                <div className="mt-1 text-xs text-blue-50/80">{value}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[28px] bg-white/10 p-6 backdrop-blur-md">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <div className="text-sm text-blue-100">One connected career workflow</div>
              <div className="mt-2 text-2xl font-bold">From preparation to offer</div>
            </div>
            <span aria-hidden="true" className="rounded-full bg-emerald-400/20 px-3 py-1 text-xs font-medium text-emerald-100">●</span>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl bg-white p-4 text-slate-900">
              <p className="text-xs font-semibold uppercase tracking-wider text-blue-700">01 · Prepare</p>
              <p className="mt-2 font-semibold">Profile and resume feedback</p>
              <p className="mt-1 text-sm text-slate-500">Surface experience and skills to improve.</p>
            </div>
            <div className="rounded-2xl bg-slate-900 p-4 text-white">
              <p className="text-xs font-semibold uppercase tracking-wider text-cyan-300">02 · Discover</p>
              <p className="mt-2 font-semibold">Skill-aligned opportunities</p>
              <p className="mt-1 text-sm text-slate-300">Compare your profile with active roles.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-white">
              <p className="text-xs font-semibold uppercase tracking-wider text-cyan-200">03 · Progress</p>
              <p className="mt-2 font-semibold">Applications, assessments, and interviews</p>
              <p className="mt-1 text-sm text-blue-100">Keep each next step visible.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-16 grid gap-6 md:grid-cols-4">
        {features.map((feature) => (
          <div key={feature} className="card text-center transition hover:-translate-y-1 hover:shadow-md">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-lg text-blue-700">✓</div>
            <h3 className="font-semibold">{feature}</h3>
          </div>
        ))}
      </section>
    </main>
  );
}
