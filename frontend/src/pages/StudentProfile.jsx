import { useEffect, useState } from 'react';
import api from '../services/api.js';

const textFields = [
  ['name', 'Full name', 'text'],
  ['phone', 'Phone number', 'tel'],
  ['college', 'College or university', 'text'],
  ['degree', 'Degree', 'text'],
  ['branch', 'Branch or major', 'text'],
  ['graduationYear', 'Graduation year', 'number'],
  ['cgpa', 'CGPA', 'number'],
  ['location', 'Preferred location', 'text'],
  ['github', 'GitHub profile', 'url'],
  ['linkedin', 'LinkedIn profile', 'url']
];

export default function StudentProfile() {
  const [profile, setProfile] = useState(null);
  const [skills, setSkills] = useState('');
  const [projects, setProjects] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/students/profile')
      .then(({ data }) => {
        setProfile(data);
        setSkills((data.skills || []).join(', '));
        setProjects((data.projects || []).join('\n'));
      })
      .catch((requestError) => setError(requestError.response?.data?.message || 'Could not load your profile.'));
  }, []);

  const updateField = (event) => {
    const { name, value } = event.target;
    setProfile((current) => ({ ...current, [name]: value }));
  };

  const saveProfile = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');
    try {
      const { data } = await api.put('/students/profile', {
        ...profile,
        graduationYear: profile.graduationYear ? Number(profile.graduationYear) : undefined,
        cgpa: profile.cgpa ? Number(profile.cgpa) : undefined,
        skills: skills.split(',').map((item) => item.trim()).filter(Boolean),
        projects: projects.split('\n').map((item) => item.trim()).filter(Boolean)
      });
      setProfile(data.student);
      setMessage(data.message);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not save your changes.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Student workspace</p>
        <h1 className="mt-2 text-3xl font-bold">Your profile</h1>
        <p className="mt-2 text-slate-600">Keep your education, skills, and experience current so opportunities can find you.</p>
      </div>

      <form onSubmit={saveProfile} className="card space-y-6">
        {!profile && !error && <p className="text-sm text-slate-500">Loading profile…</p>}
        {profile && (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              {textFields.map(([name, label, type]) => (
                <label key={name} className="block text-sm font-medium text-slate-700">
                  {label}
                  <input
                    name={name}
                    type={type}
                    min={name === 'graduationYear' ? 2000 : undefined}
                    max={name === 'graduationYear' ? 2100 : undefined}
                    step={name === 'cgpa' ? '0.01' : undefined}
                    value={profile[name] ?? ''}
                    onChange={updateField}
                    className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 font-normal outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </label>
              ))}
            </div>

            <label className="block text-sm font-medium text-slate-700">
              Skills <span className="font-normal text-slate-500">(separate with commas)</span>
              <input value={skills} onChange={(event) => setSkills(event.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal focus:border-blue-500 focus:ring-2 focus:ring-blue-100" placeholder="JavaScript, React, SQL" />
            </label>

            <label className="block text-sm font-medium text-slate-700">
              Projects <span className="font-normal text-slate-500">(one per line)</span>
              <textarea value={projects} onChange={(event) => setProjects(event.target.value)} rows="4" className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal focus:border-blue-500 focus:ring-2 focus:ring-blue-100" placeholder="Project name — short description" />
            </label>

            <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-5">
              <p className="text-sm text-slate-500">Profile completion: <strong className="text-slate-800">{profile.profileCompletion || 0}%</strong></p>
              <button disabled={saving} type="submit" className="primary-btn disabled:opacity-60">{saving ? 'Saving…' : 'Save profile'}</button>
            </div>
          </>
        )}
        {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        {message && <p role="status" className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">{message}</p>}
      </form>
    </main>
  );
}
