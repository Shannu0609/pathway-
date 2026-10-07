import { dbFindOne, dbFind, dbUpdate } from '../config/database.js';
import { saveGeneratedRoadmap } from '../services/roadmapService.js';
import { calculateJobMatch } from '../services/aiService.js';

export const getStudentDashboard = async (req, res) => {
  const student = await dbFindOne('students', { userId: req.user.id });
  if (!student) {
    return res.status(404).json({ message: 'Student profile not found.' });
  }

  const [notifications, applications, analyses, jobs, interviews, placements] = await Promise.all([
    dbFind('notifications', { userId: req.user.id }),
    dbFind('applications', { studentId: req.user.id }),
    dbFind('resumeAnalyses', { studentId: req.user.id }),
    dbFind('jobs', { status: 'active' }),
    dbFind('interviews', { studentId: req.user.id }),
    dbFind('placements', { studentId: req.user.id })
  ]);
  const resumeAnalysis = analyses.sort((left, right) => (right.createdAt || '').localeCompare(left.createdAt || ''))[0];
  const matchingStudent = {
    ...student,
    skills: [...new Set([...(student.skills || []), ...(resumeAnalysis?.extractedSkills || [])])]
  };
  const allJobs = await dbFind('jobs', {});
  const jobsById = new Map(allJobs.map((job) => [job.id, job]));
  const companies = await dbFind('companies', {});
  const companiesByUserId = new Map(companies.map((company) => [company.userId, company.name]));
  const applicationDetails = applications.map((application) => {
    const job = jobsById.get(application.jobId);
    return {
      ...application,
      jobTitle: job?.title || 'Position',
      companyName: companiesByUserId.get(job?.companyId) || 'Hiring company'
    };
  });

  res.json({
    student,
    stats: {
      atsScore: resumeAnalysis?.atsScore || 0,
      placementReadiness: resumeAnalysis?.placementReadiness || 0,
      profileCompletion: student.profileCompletion || 0,
      jobMatches: jobs.filter((job) => calculateJobMatch(matchingStudent, job).overall > 0).length,
      applications: applications.length
    },
    recommendedRoles: resumeAnalysis?.recommendedRoles || [],
    skillGaps: resumeAnalysis?.missingSkills || [],
    notifications,
    applications: applicationDetails,
    interviews: interviews.map((interview) => ({
      ...interview,
      jobTitle: jobsById.get(interview.jobId)?.title || 'Interview'
    })).sort((left, right) => `${left.date} ${left.time}`.localeCompare(`${right.date} ${right.time}`)),
    placements
  });
};

export const getStudentProfile = async (req, res) => {
  const student = await dbFindOne('students', { userId: req.user.id });
  if (!student) {
    return res.status(404).json({ message: 'Student profile not found.' });
  }
  res.json(student);
};

export const updateStudentProfile = async (req, res) => {
  const student = await dbFindOne('students', { userId: req.user.id });
  if (!student) {
    return res.status(404).json({ message: 'Student not found.' });
  }

  const editableFields = ['name', 'phone', 'college', 'degree', 'branch', 'graduationYear', 'cgpa', 'location', 'skills', 'projects', 'internships', 'certifications', 'github', 'linkedin'];
  const updates = Object.fromEntries(
    editableFields
      .filter((field) => Object.hasOwn(req.body || {}, field))
      .map((field) => [field, req.body[field]])
  );
  const updated = { ...student, ...updates };

  const completionFields = ['name', 'college', 'degree', 'branch', 'graduationYear', 'cgpa', 'location', 'skills', 'projects'];
  updated.profileCompletion = Math.round(
    (completionFields.filter((field) => {
      const value = updated[field];
      return Array.isArray(value) ? value.length > 0 : value !== undefined && value !== null && value !== '';
    }).length / completionFields.length) * 100
  );
  const result = await dbUpdate('students', { _id: student._id }, {
    $set: { ...updates, profileCompletion: updated.profileCompletion }
  });
  res.json({ message: 'Profile updated successfully.', student: result.updatedDoc });
};

export const getStudentRoadmap = async (req, res) => {
  let roadmap = await dbFindOne('roadmaps', { studentId: req.user.id });
  if (!roadmap) {
    const analyses = await dbFind('resumeAnalyses', { studentId: req.user.id });
    const latestAnalysis = analyses.sort((left, right) =>
      (right.createdAt || '').localeCompare(left.createdAt || '')
    )[0];
    roadmap = await saveGeneratedRoadmap(
      req.user.id,
      latestAnalysis?.recommendedRoles?.[0] || 'Frontend Developer',
      latestAnalysis?.missingSkills || []
    );
  }
  res.json(roadmap);
};

export const updateRoadmapProgress = async (req, res) => {
  const roadmap = await dbFindOne('roadmaps', { studentId: req.user.id });
  const { weekIndex, completed } = req.body || {};

  if (!Number.isInteger(weekIndex) || typeof completed !== 'boolean') {
    return res.status(400).json({ message: 'A valid week index and completion state are required.' });
  }
  if (roadmap && roadmap.weeks?.[weekIndex]) {
    roadmap.weeks[weekIndex].completed = completed;
    await dbUpdate('roadmaps', { _id: roadmap._id }, { $set: { weeks: roadmap.weeks } });
    roadmap.progress = Math.round((roadmap.weeks.filter((week) => week.completed).length / roadmap.weeks.length) * 100);
    await dbUpdate('roadmaps', { _id: roadmap._id }, { $set: { progress: roadmap.progress } });
  } else if (!roadmap) {
    return res.status(404).json({ message: 'Learning roadmap not found.' });
  } else {
    return res.status(404).json({ message: 'Roadmap week not found.' });
  }

  res.json({ message: 'Roadmap updated successfully.', roadmap });
};
