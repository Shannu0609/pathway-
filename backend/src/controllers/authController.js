import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { dbFindOne, dbCreateAccount } from '../config/database.js';

const signToken = (user) => jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });

export const registerUser = async (req, res) => {
  const { name, email, password, role = 'student' } = req.body || {};

  if (typeof name !== 'string' || typeof email !== 'string' || typeof password !== 'string' || !name.trim() || !email.trim() || !password) {
    return res.status(400).json({ message: 'Name, email and password are required.' });
  }
  if (!['student', 'company'].includes(role)) {
    return res.status(400).json({ message: 'Choose a valid account type.' });
  }
  const normalizedEmail = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    return res.status(400).json({ message: 'Enter a valid email address.' });
  }
  if (password.length < 8) {
    return res.status(400).json({ message: 'Password must be at least 8 characters long.' });
  }

  const existing = await dbFindOne('users', { email: normalizedEmail });
  if (existing) {
    return res.status(409).json({ message: 'Email already registered. Sign in or use another email address.' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const accountId = `u-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const newUser = {
    id: accountId,
    name: name.trim(),
    email: normalizedEmail,
    password: hashedPassword,
    role,
    createdAt: new Date().toISOString()
  };

  let relatedCollection;
  let relatedRecord;
  if (role === 'student') {
    relatedCollection = 'students';
    relatedRecord = {
      id: `s-${accountId}`,
      userId: accountId,
      name: newUser.name,
      email: normalizedEmail,
      skills: ['HTML', 'CSS', 'JavaScript'],
      profileCompletion: 35,
      placementStatus: 'Profile Setup',
      createdAt: newUser.createdAt
    };
  } else {
    relatedCollection = 'companies';
    relatedRecord = {
      id: `c-${accountId}`,
      userId: accountId,
      name: newUser.name,
      email: normalizedEmail,
      status: 'pending',
      location: '',
      createdAt: newUser.createdAt
    };
  }

  const storedUser = await dbCreateAccount(newUser, relatedCollection, relatedRecord);
  console.info('[auth] Account registered', { role, userId: storedUser.id });
  res.status(201).json({
    user: { id: storedUser.id, name: storedUser.name, email: storedUser.email, role: storedUser.role },
    token: signToken(storedUser)
  });
};

export const loginUser = async (req, res) => {
  const { email, password } = req.body || {};

  if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  const user = await dbFindOne('users', { email: email.trim().toLowerCase() });
  if (!user) {
    console.warn('[auth] Login rejected: account not found');
    return res.status(401).json({ message: 'Invalid credentials.' });
  }

  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword) {
    console.warn('[auth] Login rejected: password mismatch', { userId: user.id });
    return res.status(401).json({ message: 'Invalid credentials.' });
  }

  console.info('[auth] Login successful', { role: user.role, userId: user.id });
  res.json({
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
    token: signToken(user)
  });
};
