import { dbFind, dbFindOne, dbUpdate } from '../config/database.js';

export const getAdminDashboard = async (req, res) => {
  const students = await dbFind('students', {});
  const companies = await dbFind('companies', {});
  const jobs = await dbFind('jobs', {});
  const applications = await dbFind('applications', {});
  const placements = await dbFind('placements', {});
  const placementRate = students.length
    ? `${Math.round((new Set(placements.map((placement) => placement.studentId)).size / students.length) * 100)}%`
    : '0%';

  res.json({
    totals: {
      students: students.length,
      companies: companies.length,
      activeJobs: jobs.filter((job) => job.status === 'active').length,
      applications: applications.length,
      placedStudents: placements.length,
      placementRate
    },
    monthlyTrends: []
  });
};

export const getAdminUsers = async (req, res) => {
  const students = await dbFind('students', {});
  const companies = await dbFind('companies', {});
  const users = await dbFind('users', {});
  res.json({
    students,
    companies,
    users: users.map(({ password, ...user }) => user)
  });
};

export const approveCompany = async (req, res) => {
  const company = await dbFindOne('companies', { id: req.params.id });
  if (!company) {
    return res.status(404).json({ message: 'Company not found.' });
  }
  const result = await dbUpdate('companies', { _id: company._id }, { $set: { status: 'approved' } });
  res.json({ message: 'Company approved.', company: result.updatedDoc });
};
