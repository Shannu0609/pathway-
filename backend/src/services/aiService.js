const knownSkills = [
  'JavaScript', 'TypeScript', 'React', 'Node.js', 'Express', 'MongoDB', 'SQL',
  'Python', 'Java', 'C++', 'HTML', 'CSS', 'Git', 'REST API', 'AWS', 'Docker'
];

export const analyzeResume = (resumeText = '') => {
  const skills = knownSkills.filter((skill) => {
    const escapedSkill = skill.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const skillPattern = new RegExp(`(^|[^a-z0-9+#])${escapedSkill}($|[^a-z0-9+#])`, 'i');
    return skillPattern.test(resumeText);
  });
  const hasProjects = /project|built|developed|created/i.test(resumeText);
  const hasExperience = /experience|intern|employment/i.test(resumeText);
  const hasMetrics = /\b\d+%|\b\d+\s?(users|customers|requests|hours|minutes)\b/i.test(resumeText);
  const strengths = [];
  const suggestions = [];

  if (skills.length > 0) strengths.push(`Identified ${skills.length} in-demand technical skills`);
  if (hasProjects) strengths.push('Project experience is mentioned');
  if (hasExperience) strengths.push('Work or internship experience is mentioned');
  if (!hasProjects) suggestions.push('Add a projects section with technologies and outcomes');
  if (!hasExperience) suggestions.push('Include internships, work experience, or relevant volunteering');
  if (!hasMetrics) suggestions.push('Quantify project and work impact with measurable outcomes');
  if (skills.length < 4) suggestions.push('Add a focused skills section with role-relevant technologies');

  const atsScore = Math.min(100, 35 + skills.length * 7 + (hasProjects ? 10 : 0) + (hasExperience ? 8 : 0) + (hasMetrics ? 12 : 0));
  const roleSkills = {
    'Frontend Developer': ['HTML', 'CSS', 'JavaScript', 'React', 'TypeScript'],
    'Full Stack Developer': ['JavaScript', 'React', 'Node.js', 'Express', 'MongoDB', 'SQL'],
    'Data Analyst': ['SQL', 'Python']
  };
  const recommendedRoles = Object.entries(roleSkills)
    .map(([role, required]) => ({ role, match: Math.round((required.filter((skill) => skills.includes(skill)).length / required.length) * 100) }))
    .sort((left, right) => right.match - left.match)
    .slice(0, 3);

  return {
    atsScore,
    placementReadiness: Math.min(100, Math.round(atsScore * 0.7 + (hasProjects ? 15 : 0) + (hasExperience ? 15 : 0))),
    skills,
    missingSkills: ['React', 'SQL', 'REST API'].filter((skill) => !skills.includes(skill)),
    strengths: strengths.length ? strengths : ['Resume text was received; add more detail for actionable feedback'],
    weaknesses: suggestions,
    suggestions,
    recommendedRoles: recommendedRoles.map(({ role }) => role),
    disclaimer: 'Automated estimates only. Review the resume and recommendations before making decisions.'
  };
};

export const calculateJobMatch = (student = {}, job = {}) => ({
  skillMatch: Math.round(
    ((job.requiredSkills || []).filter((skill) =>
      (student.skills || []).some((candidateSkill) => candidateSkill.toLowerCase() === skill.toLowerCase())
    ).length / Math.max((job.requiredSkills || []).length, 1)) * 100
  ),
  experienceMatch: student.internships?.length ? 75 : 40,
  educationMatch: student.degree ? 80 : 50,
  projectMatch: student.projects?.length ? 75 : 40,
  certificationMatch: student.certifications?.length ? 70 : 40,
  overall: (() => {
    const required = job.requiredSkills || [];
    const matched = required.filter((skill) =>
      (student.skills || []).some((candidateSkill) => candidateSkill.toLowerCase() === skill.toLowerCase())
    ).length;
    return Math.round((matched / Math.max(required.length, 1)) * 100);
  })()
});

export const recommendCareerRoles = () => [
  { role: 'Frontend Developer', match: 91 },
  { role: 'Full Stack Developer', match: 84 },
  { role: 'Data Analyst', match: 72 }
];

const roadmapTracks = {
  'Frontend Developer': ['JavaScript', 'React', 'TypeScript', 'REST API'],
  'Full Stack Developer': ['Node.js', 'Express', 'MongoDB', 'REST API'],
  'Data Analyst': ['Python', 'SQL', 'Data visualization', 'Portfolio projects']
};

const roadmapTopics = {
  JavaScript: ['ES modules', 'Asynchronous code', 'Testing'],
  React: ['Components and state', 'Hooks', 'Accessible forms'],
  TypeScript: ['Types and interfaces', 'Generics', 'React integration'],
  'REST API': ['HTTP methods', 'Request validation', 'Authentication'],
  'Node.js': ['Runtime fundamentals', 'Asynchronous I/O', 'Error handling'],
  Express: ['Routing', 'Middleware', 'API validation'],
  MongoDB: ['Document modeling', 'Indexes', 'Aggregation'],
  Python: ['Data structures', 'Pandas', 'Data cleaning'],
  SQL: ['Joins', 'Aggregations', 'Query design'],
  'Data visualization': ['Chart selection', 'Dashboards', 'Communicating findings'],
  'Portfolio projects': ['Project scoping', 'Documentation', 'Presenting results']
};

export const generateLearningRoadmap = (role = 'Frontend Developer', missingSkills = []) => {
  const track = roadmapTracks[role] || roadmapTracks['Frontend Developer'];
  const skillPlan = [...new Set([
    ...missingSkills.filter((skill) => typeof skill === 'string' && track.includes(skill)),
    ...track
  ])].slice(0, 4);

  return {
    role,
    progress: 0,
    weeks: skillPlan.map((skill, index) => ({
      week: index + 1,
      title: `${skill} development`,
      objective: `Build practical ${skill} skills for a ${role} role.`,
      topics: roadmapTopics[skill] || [skill, 'Hands-on practice', 'Portfolio evidence'],
      completed: false
    }))
  };
};
