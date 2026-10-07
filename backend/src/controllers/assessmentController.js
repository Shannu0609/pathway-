import { dbFind, dbFindOne, dbInsert } from '../config/database.js';

const toPublicAssessment = (assessment) => ({
  ...assessment,
  questions: (assessment.questions || []).map(({ prompt, options }, index) => ({ index, prompt, options }))
});

export const createAssessment = async (req, res) => {
  const { title, description, duration, passingScore, questions } = req.body || {};
  if (!title || !Number.isFinite(duration) || !Array.isArray(questions) || questions.length === 0) {
    return res.status(400).json({ message: 'Title, duration, and at least one question are required.' });
  }

  const validQuestions = questions.every((question) =>
    typeof question.prompt === 'string' &&
    Array.isArray(question.options) &&
    question.options.length >= 2 &&
    Number.isInteger(question.answerIndex) &&
    question.answerIndex >= 0 &&
    question.answerIndex < question.options.length
  );
  if (!validQuestions) {
    return res.status(400).json({ message: 'Each question must have options and a valid correct answer.' });
  }

  const assessment = {
    id: `a-${Date.now()}`,
    title: title.trim(),
    description: description || '',
    duration,
    passingScore: Number.isFinite(passingScore) ? passingScore : 60,
    questions,
    status: 'active',
    createdBy: req.user.id,
    createdAt: new Date().toISOString()
  };
  const inserted = await dbInsert('assessments', assessment);
  res.status(201).json({ message: 'Assessment created successfully.', assessment: toPublicAssessment(inserted) });
};

export const getAssessments = async (req, res) => {
  const assessments = await dbFind('assessments', { status: 'active' });
  res.json(assessments.map(toPublicAssessment));
};

export const submitAssessment = async (req, res) => {
  const assessment = await dbFindOne('assessments', { id: req.params.id, status: 'active' });
  if (!assessment) {
    return res.status(404).json({ message: 'Assessment not found.' });
  }

  const existing = await dbFindOne('assessmentResults', {
    assessmentId: assessment.id,
    studentId: req.user.id
  });
  if (existing) {
    return res.status(409).json({ message: 'You have already submitted this assessment.' });
  }

  const answers = req.body?.answers;
  if (!Array.isArray(answers) || answers.length !== assessment.questions.length) {
    return res.status(400).json({ message: 'Provide one answer for each assessment question.' });
  }
  if (!answers.every((answer) => Number.isInteger(answer) && answer >= 0)) {
    return res.status(400).json({ message: 'Assessment answers must be valid option indexes.' });
  }

  const correct = assessment.questions.reduce((total, question, index) =>
    total + (question.answerIndex === answers[index] ? 1 : 0), 0);
  const score = Math.round((correct / assessment.questions.length) * 100);
  const result = await dbInsert('assessmentResults', {
    id: `ar-${Date.now()}`,
    assessmentId: assessment.id,
    assessmentTitle: assessment.title,
    studentId: req.user.id,
    score,
    passed: score >= assessment.passingScore,
    submittedAt: new Date().toISOString()
  });

  res.status(201).json({ message: 'Assessment submitted successfully.', result });
};

export const getAssessmentResults = async (req, res) => {
  const results = await dbFind('assessmentResults', { studentId: req.user.id });
  res.json(results.sort((left, right) => (right.submittedAt || '').localeCompare(left.submittedAt || '')));
};
