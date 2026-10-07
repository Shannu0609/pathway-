import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import path from 'node:path';
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import { demoState } from '../data/demoData.js';

const schemaOptions = { strict: false, versionKey: false };
const schema = new mongoose.Schema({
  id: { type: String, unique: true, sparse: true, index: true }
}, schemaOptions);
const userSchema = new mongoose.Schema({
  id: { type: String, unique: true, sparse: true, index: true },
  name: { type: String, required: true, trim: true, minlength: 1 },
  email: { type: String, required: true, trim: true, lowercase: true, unique: true, index: true },
  password: { type: String, required: true, minlength: 8 },
  role: { type: String, required: true, enum: ['student', 'company', 'admin'] }
}, schemaOptions);

const models = Object.fromEntries(
  Object.keys(demoState).map((collection) => [
    collection,
    mongoose.models[collection] || mongoose.model(collection, collection === 'users' ? userSchema : schema, collection)
  ])
);

let localDb;
let localWriteQueue = Promise.resolve();

export const initializeDatabase = async () => {
  const uri = process.env.MONGODB_URI;
  const production = process.env.NODE_ENV === 'production';

  if (!process.env.JWT_SECRET && !production) {
    const { randomBytes } = await import('node:crypto');
    process.env.JWT_SECRET = randomBytes(32).toString('hex');
    console.warn('[startup] JWT_SECRET was not set; using an ephemeral local-development secret.');
  }
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is required. Configure a unique signing secret.');
  }
  if (process.env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters long.');
  }

  if (!uri) {
    if (production) {
      throw new Error('MONGODB_URI is required in production.');
    }

    const dbFile = process.env.LOCAL_DATABASE_PATH || path.resolve(process.cwd(), 'data', 'app-data.json');
    localDb = new Low(new JSONFile(dbFile), {});
    await localDb.read();
    localDb.data ||= {};

    for (const [collection, records] of Object.entries(demoState)) {
      if (!Array.isArray(localDb.data[collection])) {
        localDb.data[collection] = records.map((record) => ({ ...record, _id: record.id }));
      }
    }

    const seededAssessments = new Map(demoState.assessments.map((assessment) => [assessment.id, assessment]));
    for (const assessment of localDb.data.assessments) {
      const seed = seededAssessments.get(assessment?.id);
      if (seed && (!Array.isArray(assessment.questions) || assessment.title === 'Aptitude Test')) {
        Object.assign(assessment, { ...seed, _id: assessment._id || seed.id });
      }
    }

    await localDb.write();
    console.info(`[startup] Connected to persistent local database: ${dbFile}`);
  } else {
    await mongoose.connect(uri);

    if (!production || process.env.SEED_DEMO_DATA === 'true') {
      for (const [collection, records] of Object.entries(demoState)) {
        const model = models[collection];
        if (await model.estimatedDocumentCount() === 0 && records.length > 0) {
          await model.insertMany(records);
        }
      }
    }

    const seededAssessments = new Map(demoState.assessments.map((assessment) => [assessment.id, assessment]));
    const existingAssessments = await models.assessments.find({
      id: { $in: [...seededAssessments.keys()] }
    }).exec();
    for (const assessment of existingAssessments) {
      const seed = seededAssessments.get(assessment.id);
      if (seed && (!Array.isArray(assessment.questions) || assessment.title === 'Aptitude Test')) {
        await models.assessments.updateOne(
          { _id: assessment._id },
          {
            $set: {
              id: seed.id,
              title: seed.title,
              description: seed.description,
              duration: seed.duration,
              passingScore: seed.passingScore,
              questions: seed.questions,
              status: seed.status
            }
          }
        ).exec();
      }
    }

    await models.users.init();
    console.info('[startup] Connected to MongoDB.');
  }

  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (adminEmail && adminPassword && !(await dbFindOne('users', { email: adminEmail, role: 'admin' }))) {
    const admin = {
      id: `admin-${Date.now()}`,
      name: process.env.ADMIN_NAME || 'Platform Administrator',
      email: adminEmail,
      password: await bcrypt.hash(adminPassword, 12),
      role: 'admin',
      createdAt: new Date().toISOString()
    };
    await dbInsert('users', admin);
  }
};

const matchesQuery = (record, query = {}) => Object.entries(query).every(([key, value]) => {
  if (value && typeof value === 'object' && '$in' in value) {
    return value.$in.includes(record[key]);
  }
  if (value && typeof value === 'object' && '$ne' in value) {
    return record[key] !== value.$ne;
  }
  return record[key] === value;
});

const runLocalOperation = (operation) => {
  const result = localWriteQueue.then(async () => {
    await localDb.read();
    const value = operation();
    await localDb.write();
    return value;
  });
  localWriteQueue = result.catch(() => {});
  return result;
};

const getModel = (name) => {
  const model = models[name];
  if (!model) {
    throw new Error(`Unknown database collection: ${name}`);
  }
  return model;
};

export const dbFindOne = async (name, query = {}) => {
  if (localDb) {
    await localWriteQueue;
    await localDb.read();
    return localDb.data[name]?.find((record) => matchesQuery(record, query)) || null;
  }
  const record = await getModel(name).findOne(query).lean().exec();
  return record || null;
};

export const dbFind = async (name, query = {}) => {
  if (localDb) {
    await localWriteQueue;
    await localDb.read();
    return (localDb.data[name] || []).filter((record) => matchesQuery(record, query));
  }
  return getModel(name).find(query).lean().exec();
};

export const dbInsert = async (name, document) => {
  if (localDb) {
    return runLocalOperation(() => {
      localDb.data[name] ||= [];
      if (name === 'users' && localDb.data.users.some((user) => user.email === document.email)) {
        const duplicateError = new Error('Email already registered.');
        duplicateError.code = 'DUPLICATE_EMAIL';
        throw duplicateError;
      }
      const record = { ...document, _id: document._id || document.id };
      localDb.data[name].push(record);
      return record;
    });
  }

  const [record] = await getModel(name).create([document]);
  return record.toObject();
};

export const dbUpdate = async (name, query, updates) => {
  if (localDb) {
    return runLocalOperation(() => {
      localDb.data[name] ||= [];
      const index = localDb.data[name].findIndex((record) => matchesQuery(record, query));
      if (index === -1) {
        return { numAffected: 0, updatedDoc: null };
      }
      const updatedDoc = { ...localDb.data[name][index], ...(updates.$set || {}) };
      localDb.data[name][index] = updatedDoc;
      return { numAffected: 1, updatedDoc };
    });
  }

  const updatedDoc = await getModel(name)
    .findOneAndUpdate(query, updates, { new: true, runValidators: true })
    .lean()
    .exec();

  return { numAffected: updatedDoc ? 1 : 0, updatedDoc };
};

export const dbCreateAccount = async (user, relatedCollection, relatedRecord) => {
  if (localDb) {
    return runLocalOperation(() => {
      localDb.data.users ||= [];
      localDb.data[relatedCollection] ||= [];
      if (localDb.data.users.some((record) => record.email === user.email)) {
        const duplicateError = new Error('Email already registered.');
        duplicateError.code = 'DUPLICATE_EMAIL';
        throw duplicateError;
      }

      const createdUser = { ...user, _id: user.id };
      localDb.data.users.push(createdUser);
      localDb.data[relatedCollection].push({ ...relatedRecord, _id: relatedRecord.id });
      return createdUser;
    });
  }

  const session = await mongoose.startSession();
  let createdUser;
  try {
    await session.withTransaction(async () => {
      [createdUser] = await models.users.create([user], { session });
      await getModel(relatedCollection).create([relatedRecord], { session });
    });
  } catch (error) {
    if (error.code === 11000 && error.keyPattern?.email) {
      error.code = 'DUPLICATE_EMAIL';
      error.message = 'Email already registered.';
    }
    throw error;
  } finally {
    await session.endSession();
  }
  return createdUser.toObject();
};
