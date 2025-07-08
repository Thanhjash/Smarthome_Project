import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const secret = crypto.randomBytes(64).toString('hex');
console.log('Generated JWT Secret:', secret);

const envPath = path.resolve(__dirname, '.env');
const envConfig = fs.readFileSync(envPath, 'utf-8');

const newEnvConfig = envConfig.replace(/JWT_SECRET=.*/g, `JWT_SECRET=${secret}`);

fs.writeFileSync(envPath, newEnvConfig);
