import { dbFind, dbInsert, dbFindOne, dbUpdate } from '../config/database.js';
import { calculateJobMatch } from '../services/aiService.js';
import { randomUUID } from 'node:crypto';

const notifyStudent = (userId, title, message) => dbInsert('notifications', {
  id: `n-${randomUUID()}`,
  userId,
  title,
  message,
  read: false,
  createdAt: new Date().toISOString()
});

export const getCompanyDashboard = async (req, res) => {
  const jobs = await dbFind('jobs', { companyId: req.user.id });
  const jobIds = jobs.map((job) => job.id);
  const applications = jobIds.length ? await dbFind('applications', { jobId: { $in: jobIds } }) : [];
  const interviews = jobIds.length ? await dbFind('interviews', { jobId: { $in: jobIds } }) : [];
  const [students, analyses] = await Promise.all([
    dbFind('students', {}),
    dbFind('resumeAnalyses', {})
  ]);
  const latestAnalysisByStudent = new Map();
  for (const analysis of analyses.sort((left, right) =>
    (left.createdAt || '').localeCompare(right.createdAt || '')
  )) {
    latestAnalysisByStudent.set(analysis.studentId, analysis);
  }
  const studentsByUserId = new Map(students.map((student) => [student.userId, student]));
  const jobsById = new Map(jobs.map((job) => [job.id, job]));
  const applicationDetails = applications.map((application) => ({
    ...application,
    student: studentsByUserId.get(application.studentId)
      ? {
          id: application.studentId,
          name: studentsByUserId.get(application.studentId).name,
          college: studentsByUserId.get(application.studentId).college,
          skills: studentsByUserId.get(application.studentId).skills || []
        }
      : null,
    jobTitle: jobsById.get(application.jobId)?.title || 'Position'
  }));
  const matches = jobs.flatMap((job) => students.map((student) => {
    const analysis = latestAnalysisByStudent.get(student.userId);
    const matchingStudent = {
      ...student,
      skills: [...new Set([...(student.skills || []), ...(analysis?.extractedSkills || [])])]
    };
    return {
      student: { id: student.userId, name: student.name, college: student.college, skills: matchingStudent.skills },
      job: job.title,
      match: calculateJobMatch(matchingStudent, job).overall
    };
  })).sort((left, right) => right.match - left.match).slice(0, 5);

  res.json({
    stats: {
      activeJobs: jobs.filter((job) => job.status === 'active').length,
      applications: applications.length,
      shortlisted: applications.filter((app) => app.status === 'Shortlisted').length,
      interviews: interviews.length
    },
    topMatches: matches,
    jobs,
    applications: applicationDetails
  });
};

export const createJob = async (req, res) => {
  const company = await dbFindOne('companies', { userId: req.user.id });
  if (!company || company.status !== 'approved') {
    return res.status(403).json({ message: 'Your company account must be approved before posting jobs.' });
  }

  const { title, description, location, salary, employmentType, requiredSkills = [] } = req.body || {};
  if (!title || !description || !location || !Array.isArray(requiredSkills)) {
    return res.status(400).json({ message: 'Title, description, location, and a skills list are required.' });
  }

  const job = {
    id: `job-${Date.now()}`,
    companyId: req.user.id,
    title: title.trim(),
    description: description.trim(),
    location: location.trim(),
    salary,
    employmentType: employmentType || 'Full Time',
    requiredSkills,
    status: 'active',
    createdAt: new Date().toISOString()
  };
  const created = await dbInsert('jobs', job);
  res.status(201).json({ message: 'Job posted successfully.', job: created });
};

export const updateApplicationStatus = async (req, res) => {
  const application = await dbFindOne('applications', { id: req.params.id });
  if (!application) {
    return res.status(404).json({ message: 'Application not found.' });
  }
  const job = await dbFindOne('jobs', { id: application.jobId, companyId: req.user.id });
  if (!job) {
    return res.status(404).json({ message: 'Application not found for this company.' });
  }

  const validStatuses = ['Applied', 'Reviewing', 'Shortlisted', 'Rejected', 'Hired'];
  const status = req.body.status;
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: 'Choose a valid application status.' });
  }

  const result = await dbUpdate('applications', { _id: application._id }, { $set: { status } });
  if (application.status !== status) {
    await notifyStudent(
      application.studentId,
      'Application status updated',
      `Your application for ${job.title} has been updated to ${status}.`
    );
  }
  if (status === 'Hired') {
    const existingPlacement = await dbFindOne('placements', { studentId: application.studentId, jobId: job.id });
    if (!existingPlacement) {
      await dbInsert('placements', {
        id: `p-${Date.now()}`,
        studentId: application.studentId,
        companyId: req.user.id,
        jobId: job.id,
        title: job.title,
        status: 'Placed',
        placedAt: new Date().toISOString()
      });
    }
  }
  res.json({ message: 'Application status updated.', application: result.updatedDoc });
};

export const scheduleInterview = async (req, res) => {
  const { studentId, jobId, date, time, type = 'Technical' } = req.body || {};
  const job = await dbFindOne('jobs', { id: jobId, companyId: req.user.id });
  if (!job || !studentId || !date || !time) {
    return res.status(400).json({ message: 'A valid job, student, date, and time are required.' });
  }
  const application = await dbFindOne('applications', { studentId, jobId });
  if (!application || !['Shortlisted', 'Hired'].includes(application.status)) {
    return res.status(400).json({ message: 'Shortlist the candidate before scheduling an interview.' });
  }
  if (Number.isNaN(Date.parse(date))) {
    return res.status(400).json({ message: 'Provide a valid interview date.' });
  }

  const interview = {
    id: `i-${Date.now()}`,
    studentId,
    companyId: req.user.id,
    jobId,
    type,
    date,
    time,
    meetingLink: typeof req.body.meetingLink === 'string' ? req.body.meetingLink : '',
    createdAt: new Date().toISOString()
  };
  const created = await dbInsert('interviews', interview);
  await notifyStudent(
    studentId,
    `${type} interview scheduled`,
    `Your interview for ${job.title} is scheduled for ${date} at ${time}.`
  );
  res.status(201).json({ message: 'Interview scheduled.', interview: created });
};

export const shortlistApplication = async (req, res) => {
  const application = await dbFindOne('applications', { id: req.params.id });
  if (!application) {
    return res.status(404).json({ message: 'Application not found.' });
  }
  const job = await dbFindOne('jobs', { id: application.jobId, companyId: req.user.id });
  if (!job) {
    return res.status(404).json({ message: 'Application not found for this company.' });
  }
  const result = await dbUpdate('applications', { _id: application._id }, { $set: { status: 'Shortlisted' } });
  if (application.status !== 'Shortlisted') {
    await notifyStudent(
      application.studentId,
      'Application shortlisted',
      `Your application for ${job.title} has been shortlisted.`
    );
  }
  res.json({ message: 'Candidate shortlisted and notification sent.', application: result.updatedDoc });
};
