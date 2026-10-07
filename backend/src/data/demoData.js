export const demoState = {
  users: [],
  students: [
    {
      id: 's-1',
      userId: 'u-student-1',
      name: 'Sample Student',
      email: 'student@example.invalid',
      college: 'Example University',
      degree: 'B.Tech',
      branch: 'Computer Science',
      graduationYear: 2026,
      cgpa: 8.9,
      location: 'Bangalore',
      skills: ['HTML', 'CSS', 'JavaScript', 'React', 'Git'],
      profileCompletion: 85,
      placementStatus: 'Shortlisted'
    }
  ],
  companies: [
    { id: 'c-1', userId: 'u-company-1', name: 'Example Technologies', email: 'hiring@example.invalid', status: 'approved', location: 'Bangalore' }
  ],
  jobs: [
    { id: 'job-1', companyId: 'u-company-1', title: 'Frontend Developer', description: 'Build accessible, responsive interfaces for our customer platform.', location: 'Bangalore', salary: '₹12-18 LPA', employmentType: 'Full Time', requiredSkills: ['HTML', 'CSS', 'JavaScript', 'React', 'Git'], status: 'active' },
    { id: 'job-2', companyId: 'u-company-1', title: 'Full Stack Developer', description: 'Develop end-to-end platform features with our product team.', location: 'Remote', salary: '₹14-20 LPA', employmentType: 'Full Time', requiredSkills: ['JavaScript', 'React', 'Node.js', 'MongoDB'], status: 'active' },
    { id: 'job-3', companyId: 'c-2', title: 'Data Analyst', location: 'Hyderabad', salary: '₹10-15 LPA', employmentType: 'Full Time', requiredSkills: ['SQL', 'Python', 'Tableau'], status: 'active' }
  ],
  applications: [
    { id: 'app-1', studentId: 'u-student-1', jobId: 'job-1', status: 'Shortlisted', appliedAt: '2026-10-01T08:00:00.000Z' }
  ],
  notifications: [
    { id: 'n-1', userId: 'u-student-1', title: 'Frontend Developer match', message: 'Your profile matches Example Technologies with a score of 91%.', read: false },
    { id: 'n-2', userId: 'u-company-1', title: 'New matched candidate', message: 'Sample Student matches the Frontend Developer role with a 91% match.', read: false }
  ],
  assessments: [
    {
      id: 'a-1',
      title: 'JavaScript Fundamentals',
      description: 'Check your understanding of core JavaScript and web development concepts.',
      duration: 20,
      passingScore: 60,
      status: 'active',
      questions: [
        { prompt: 'Which value represents an asynchronous operation that may complete in the future?', options: ['Promise', 'Symbol', 'Map', 'Set'], answerIndex: 0 },
        { prompt: 'Which array method creates a new array by transforming each item?', options: ['filter()', 'map()', 'find()', 'some()'], answerIndex: 1 },
        { prompt: 'Which keyword declares a block-scoped variable that can be reassigned?', options: ['const', 'let', 'static', 'final'], answerIndex: 1 },
        { prompt: 'What does JSON.parse() do?', options: ['Converts an object to JSON text', 'Parses JSON text into a JavaScript value', 'Sends an HTTP request', 'Creates a promise'], answerIndex: 1 },
        { prompt: 'Which HTTP method is conventionally used to retrieve a resource?', options: ['POST', 'PATCH', 'GET', 'DELETE'], answerIndex: 2 }
      ]
    }
  ],
  assessmentResults: [],
  interviews: [
    { id: 'i-1', studentId: 'u-student-1', companyId: 'c-1', jobId: 'job-1', type: 'Technical', date: '2026-10-20', time: '10:00 AM', meetingLink: 'https://meet.google.com/demo' }
  ],
  placements: [
    { id: 'p-1', studentId: 'u-student-1', companyId: 'c-1', title: 'Frontend Developer', status: 'Placed' }
  ],
  roadmaps: [
    {
      id: 'r-1',
      studentId: 'u-student-1',
      role: 'Frontend Developer',
      progress: 42,
      weeks: [
        { week: 1, title: 'JavaScript Fundamentals', completed: true },
        { week: 2, title: 'DOM + Events', completed: true },
        { week: 3, title: 'React Fundamentals', completed: false },
        { week: 4, title: 'REST APIs', completed: false }
      ]
    }
  ],
  resumeAnalyses: [
    {
      id: 'ra-1',
      studentId: 'u-student-1',
      atsScore: 78,
      placementReadiness: 72,
      strengths: ['Good technical skills', 'Multiple projects', 'Internship experience'],
      weaknesses: ['Missing quantified achievements', 'Weak project descriptions'],
      suggestions: ['Add measurable project outcomes', 'Add relevant technical keywords'],
      extractedSkills: ['HTML', 'CSS', 'JavaScript', 'React', 'Git'],
      missingSkills: ['SQL', 'REST API'],
      recommendedRoles: ['Frontend Developer', 'Full Stack Developer']
    }
  ]
};
