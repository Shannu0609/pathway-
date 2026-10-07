import { dbFindOne, dbInsert, dbUpdate } from '../config/database.js';
import { generateLearningRoadmap } from './aiService.js';

export const saveGeneratedRoadmap = async (studentId, role, missingSkills = []) => {
  const existing = await dbFindOne('roadmaps', { studentId });
  const timestamp = new Date().toISOString();
  const roadmap = {
    ...generateLearningRoadmap(role, missingSkills),
    studentId,
    generatedAt: timestamp,
    updatedAt: timestamp
  };

  if (!existing) {
    return dbInsert('roadmaps', { ...roadmap, id: `r-${Date.now()}`, createdAt: timestamp });
  }

  const result = await dbUpdate('roadmaps', { _id: existing._id }, { $set: roadmap });
  return result.updatedDoc;
};
