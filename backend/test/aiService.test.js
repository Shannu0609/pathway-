import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeResume, calculateJobMatch, generateLearningRoadmap } from '../src/services/aiService.js';

test('resume analysis extracts skills and produces recommendations from supplied text', () => {
  const analysis = analyzeResume('Built a React and JavaScript project that improved signups by 20%.');

  assert.deepEqual(analysis.skills, ['JavaScript', 'React']);
  assert.ok(analysis.atsScore > 0 && analysis.atsScore <= 100);
  assert.ok(analysis.suggestions.length > 0);
  assert.ok(analysis.recommendedRoles.includes('Frontend Developer'));
  assert.match(analysis.disclaimer, /estimates only/i);
});

test('job matching score reflects overlap with the requested skills', () => {
  const match = calculateJobMatch(
    { skills: ['React', 'JavaScript'] },
    { requiredSkills: ['React', 'CSS'] }
  );

  assert.equal(match.overall, 50);
  assert.equal(match.skillMatch, 50);
});

test('learning roadmap prioritizes skill gaps for the recommended role', () => {
  const roadmap = generateLearningRoadmap('Data Analyst', ['SQL', 'Python']);

  assert.equal(roadmap.role, 'Data Analyst');
  assert.equal(roadmap.progress, 0);
  assert.deepEqual(roadmap.weeks.slice(0, 2).map((week) => week.title), [
    'SQL development',
    'Python development'
  ]);
  assert.equal(roadmap.weeks.length, 4);
  assert.ok(roadmap.weeks.every((week) => week.completed === false));
});
