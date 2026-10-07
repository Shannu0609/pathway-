import { dbFind, dbFindOne, dbInsert } from '../config/database.js';
import { calculateJobMatch } from '../services/aiService.js';

export const getJobs = async (req, res) => {
  const [jobs, companies] = await Promise.all([
    dbFind('jobs', { status: 'active' }),
    dbFind('companies', {})
  ]);
  const companiesByUserId = new Map(companies.map((company) => [company.userId, company.name]));
  res.json(jobs.map((job) => ({ ...job, companyName: companiesByUserId.get(job.companyId) || 'Hiring company' })));
};

export const getJobById = async (req, res) => {
  const job = await dbFindOne('jobs', { id: req.params.id });
  if (!job) {
    return res.status(404).json({ message: 'Job not found.' });
  }
  res.json(job);
};

export const applyToJob = async (req, res) => {
  const job = await dbFindOne('jobs', { id: req.params.id });
  if (!job) {
    return res.status(404).json({ message: 'Job not found.' });
  }
  if (job.status !== 'active') {
    return res.status(400).json({ message: 'This position is no longer accepting applications.' });
  }

  const existing = await dbFindOne('applications', { studentId: req.user.id, jobId: req.params.id });
  if (existing) {
    return res.status(400).json({ message: 'You have already applied to this job.' });
  }

  const application = {
    id: `app-${Date.now()}`,
    studentId: req.user.id,
    jobId: req.params.id,
    status: 'Applied',
    appliedAt: new Date().toISOString()
  };

  const created = await dbInsert('applications', application);
  res.status(201).json({ message: 'Application submitted successfully.', application: created });
};

export const getJobMatches = async (req, res) => {
  const student = await dbFindOne('students', { userId: req.user.id });
  if (!student) {
    return res.status(404).json({ message: 'Student profile not found.' });
  }
  const [jobs, companies, analyses] = await Promise.all([
    dbFind('jobs', { status: 'active' }),
    dbFind('companies', {}),
    dbFind('resumeAnalyses', { studentId: req.user.id })
  ]);
  const latestAnalysis = analyses.sort((left, right) =>
    (right.createdAt || '').localeCompare(left.createdAt || '')
  )[0];
  const matchingStudent = {
    ...student,
    skills: [...new Set([...(student.skills || []), ...(latestAnalysis?.extractedSkills || [])])]
  };
  const companiesByUserId = new Map(companies.map((company) => [company.userId, company.name]));
  const matches = jobs.map((job) => ({
    ...job,
    companyName: companiesByUserId.get(job.companyId) || 'Hiring company',
    matchScore: calculateJobMatch(matchingStudent, job).overall
  })).sort((left, right) => right.matchScore - left.matchScore);
  res.json(matches);
};
