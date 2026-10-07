import { useEffect, useState } from 'react';
import api from '../services/api.js';

export default function AssessmentPage() {
  const [assessments, setAssessments] = useState([]);
  const [results, setResults] = useState([]);
  const [answersByAssessment, setAnswersByAssessment] = useState({});
  const [busyId, setBusyId] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const loadAssessments = async () => {
    const [assessmentResponse, resultResponse] = await Promise.all([
      api.get('/assessments'),
      api.get('/assessments/results')
    ]);
    setAssessments(assessmentResponse.data);
    setResults(resultResponse.data);
  };

  useEffect(() => {
    loadAssessments().catch((requestError) => setError(requestError.response?.data?.message || 'Could not load assessments.'));
  }, []);

  const setAnswer = (assessmentId, questionIndex, optionIndex) => {
    setAnswersByAssessment((current) => ({
      ...current,
      [assessmentId]: { ...current[assessmentId], [questionIndex]: optionIndex }
    }));
  };

  const submitAssessment = async (assessment) => {
    const answersMap = answersByAssessment[assessment.id] || {};
    const answers = assessment.questions.map((question) => answersMap[question.index]);
    if (answers.some((answer) => !Number.isInteger(answer))) {
      setError('Answer every question before submitting.');
      return;
    }

    setBusyId(assessment.id);
    setError('');
    setMessage('');
    try {
      const { data } = await api.post(`/assessments/${assessment.id}/submit`, { answers });
      setResults((current) => [data.result, ...current]);
      setMessage(data.message);
      setAssessments((current) => current.filter((item) => item.id !== assessment.id));
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not submit your answers.');
    } finally {
      setBusyId('');
    }
  };

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <section className="mb-7">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Skills assessment</p>
        <h1 className="mt-2 text-3xl font-bold">Practice and track progress</h1>
        <p className="mt-2 text-slate-600">Complete assessments to understand your current strengths and areas to review.</p>
      </section>

      {message && <p role="status" className="mb-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">{message}</p>}
      {error && <p role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <div className="space-y-6">
        {assessments.map((assessment) => (
          <article key={assessment.id} className="card">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-xl font-semibold">{assessment.title}</h2>
                {assessment.description && <p className="mt-1 text-sm text-slate-500">{assessment.description}</p>}
              </div>
              <div className="flex gap-2 text-xs text-slate-600">
                <span className="rounded-full bg-slate-100 px-3 py-1.5">{assessment.duration} min</span>
                <span className="rounded-full bg-slate-100 px-3 py-1.5">{assessment.questions.length} questions</span>
              </div>
            </div>

            <div className="mt-4 space-y-5">
              {assessment.questions.map((question) => (
                <fieldset key={question.index} className="rounded-xl border border-slate-200 p-4">
                  <legend className="px-1 text-sm font-semibold text-slate-800">{question.index + 1}. {question.prompt}</legend>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    {question.options.map((option, optionIndex) => (
                      <label key={option} className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-100 px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50">
                        <input
                          type="radio"
                          name={`${assessment.id}-question-${question.index}`}
                          checked={answersByAssessment[assessment.id]?.[question.index] === optionIndex}
                          onChange={() => setAnswer(assessment.id, question.index, optionIndex)}
                        />
                        {option}
                      </label>
                    ))}
                  </div>
                </fieldset>
              ))}
            </div>
            <div className="mt-5 flex justify-end">
              <button type="button" disabled={busyId === assessment.id} onClick={() => submitAssessment(assessment)} className="primary-btn disabled:opacity-60">{busyId === assessment.id ? 'Submitting…' : 'Submit assessment'}</button>
            </div>
          </article>
        ))}
        {assessments.length === 0 && !error && <div className="card py-10 text-center text-slate-600">No assessments are currently available.</div>}
      </div>

      <section className="card mt-7">
        <h2 className="text-lg font-semibold">Previous results</h2>
        {results.length ? (
          <ul className="mt-3 divide-y divide-slate-100">
            {results.map((result) => (
              <li key={result.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div>
                  <p className="font-medium text-slate-800">{result.assessmentTitle || 'Assessment'}</p>
                  <p className="text-xs text-slate-500">{result.submittedAt ? new Date(result.submittedAt).toLocaleDateString() : 'Completed'}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-sm font-semibold ${result.passed ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{result.score}% · {result.passed ? 'Passed' : 'Keep practicing'}</span>
              </li>
            ))}
          </ul>
        ) : <p className="mt-3 text-sm text-slate-500">Your completed assessments will appear here.</p>}
      </section>
    </main>
  );
}
