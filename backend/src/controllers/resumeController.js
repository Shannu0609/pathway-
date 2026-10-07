import { dbFind, dbInsert } from '../config/database.js';
import { analyzeResume } from '../services/aiService.js';
import { extractResumeText } from '../services/resumeParser.js';
import { saveGeneratedRoadmap } from '../services/roadmapService.js';

export const uploadResume = async (req, res) => {
  const file = req.file;
  if (!file) {
    return res.status(400).json({ message: 'Resume file is required.' });
  }

  let text;

  try {
    text = await extractResumeText(file);
  } catch (error) {
    console.warn('[resume] Could not parse uploaded file', {
      extension: file.originalname.split('.').pop()?.toLowerCase(),
      errorName: error.name,
      message: error.message
    });
    return res.status(400).json({ message: 'The resume could not be read. Check the file and try again.' });
  }

  if (!text.trim()) {
    return res.status(422).json({ message: 'No readable text was found. Scanned image-only resumes are not supported yet.' });
  }

  const analysis = analyzeResume(text);

  const record = {
    id: `ra-${Date.now()}`,
    studentId: req.user.id,
    createdAt: new Date().toISOString(),
    atsScore: analysis.atsScore,
    placementReadiness: analysis.placementReadiness,
    strengths: analysis.strengths,
    weaknesses: analysis.weaknesses,
    suggestions: analysis.suggestions,
    extractedSkills: analysis.skills,
    missingSkills: analysis.missingSkills,
    recommendedRoles: analysis.recommendedRoles,
    disclaimer: analysis.disclaimer
  };

  await dbInsert('resumeAnalyses', record);
  await saveGeneratedRoadmap(
    req.user.id,
    analysis.recommendedRoles[0] || 'Frontend Developer',
    analysis.missingSkills
  );
  res.status(201).json({ message: 'Resume uploaded and analyzed successfully.', analysis });
};

export const getResumeAnalysis = async (req, res) => {
  const analyses = await dbFind('resumeAnalyses', { studentId: req.user.id });
  const analysis = analyses.sort((left, right) => (right.createdAt || '').localeCompare(left.createdAt || ''))[0];
  if (!analysis) {
    return res.status(404).json({ message: 'No resume analysis found.' });
  }
  res.json(analysis);
};
