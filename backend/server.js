import dotenv from 'dotenv';
dotenv.config();

import app from './src/app.js';
import { initializeDatabase } from './src/config/database.js';

const port = process.env.PORT || 5000;

(async () => {
  await initializeDatabase();
  app.listen(port, () => {
    console.log(`Placement API running on http://localhost:${port}`);
  });
})().catch((error) => {
  console.error('Could not start the API:', error);
  process.exitCode = 1;
});
