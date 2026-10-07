import { useEffect, useState } from 'react';
import api from '../services/api.js';

export default function ResumeAnalysisPage() {
  const [analysis, setAnalysis] = useState(null);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    api.get('/resume/analysis')
      .then(({ data }) => setAnalysis(data))
      .catch((requestError) => {
        if (requestError.response?.status !== 404) {
          setError(requestError.response?.data?.message || 'Could not load your resume analysis.');
        }
      });
  }, []);

  const uploadResume = async (event) => {
    event.preventDefault();
    if (!file) {
      setError('Choose a PDF or DOCX file first.');
      return;
    }

    setUploading(true);
    setError('');
    setMessage('');
    const formData = new FormData();
    formData.append('resume', file);
    try {
      const { data } = await api.post('/resume/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setAnalysis(data.analysis);
      setMessage(data.message);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not analyze this resume.');
    } finally {
      setUploading(false);
    }
  };

  const score = analysis?.atsScore ?? 0;

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <section className="mb-7">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Resume intelligence</p>
        <h1 className="mt-2 text-3xl font-bold">Resume review</h1>
        <p className="mt-2 max-w-3xl text-slate-600">Upload a PDF or DOCX resume to extract skills and get role-fit guidance. Your file is processed for analysis and is not retained by the API.</p>
      </section>

      <form onSubmit={uploadResume} className="card mb-6 flex flex-col gap-4 md:flex-row md:items-end">
        <label className="flex-1 text-sm font-medium text-slate-700">
          Resume file
          <input
            type="file"
            accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={(event) => setFile(event.target.files?.[0] || null)}
            className="mt-1.5 block w-full rounded-lg border border-slate-300 bg-white p-2.5 text-sm file:mr-4 file:rounded-md file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:font-medium file:text-blue-700"
          />
        </label>
        <button type="submit" disabled={uploading} className="primary-btn shrink-0 disabled:opacity-60">{uploading ? 'Analyzing resume…' : 'Upload and analyze'}</button>
      </form>

      {message && <p role="status" className="mb-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">{message}</p>}
      {error && <p role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      {!analysis && !error && <div className="card py-12 text-center text-slate-500">Upload a resume to see your personalized analysis.</div>}
      {analysis && (
        <>
          <section className="grid gap-6 lg:grid-cols-[0.7fr_1.3fr]">
            <article className="card flex flex-col items-center justify-center">
              <div className="progress-ring" style={{ background: `conic-gradient(#2563eb ${score}%, #e2e8f0 0)` }}>
                <span>{score}</span>
              </div>
              <h2 className="mt-5 text-xl font-semibold">ATS alignment estimate</h2>
              <p className="mt-1 text-sm text-slate-500">{analysis.placementReadiness}% placement-readiness estimate</p>
            </article>

            <article className="card">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Extracted profile signals</p>
                  <h2 className="mt-1 text-xl font-semibold">Skills identified</h2>
                </div>
                <span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">{analysis.skills?.length || 0} skills</span>
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                {(analysis.extractedSkills || analysis.skills || []).map((skill) => <span key={skill} className="rounded-full bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700">{skill}</span>)}
                {!analysis.skills?.length && !analysis.extractedSkills?.length && <p className="text-sm text-slate-500">No supported skills were identified in the resume text.</p>}
              </div>
              <div className="mt-6 border-t border-slate-100 pt-5">
                <h3 className="text-sm font-semibold text-slate-800">Skills to consider adding</h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(analysis.missingSkills || []).map((skill) => <span key={skill} className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-sm text-amber-800">{skill}</span>)}
                </div>
              </div>
            </article>
          </section>

          <section className="mt-6 grid gap-6 md:grid-cols-2">
            <article className="card">
              <h2 className="text-lg font-semibold">What is working</h2>
              <ul className="mt-4 space-y-3">
                {(analysis.strengths || []).map((item) => <li key={item} className="flex gap-2 text-sm text-slate-700"><span className="text-emerald-600">+</span>{item}</li>)}
              </ul>
            </article>
            <article className="card">
              <h2 className="text-lg font-semibold">Suggested improvements</h2>
              <ul className="mt-4 space-y-3">
                {(analysis.suggestions || analysis.weaknesses || []).map((item) => <li key={item} className="flex gap-2 text-sm text-slate-700"><span className="text-amber-600">→</span>{item}</li>)}
              </ul>
            </article>
          </section>

          <section className="card mt-6">
            <h2 className="text-lg font-semibold">Role alignment</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {(analysis.recommendedRoles || []).map((role) => <span key={role} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700">{role}</span>)}
            </div>
          </section>
          <p className="mt-5 text-xs leading-5 text-slate-500">{analysis.disclaimer || 'These automated scores and suggestions are estimates for career guidance, not guarantees of hiring outcomes.'} Scanned image-only resumes are not currently supported.</p>
        </>
      )}
    </main>
  );
}
