import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function initializeJWTSecret() {
  const envPath = path.resolve(__dirname, '.env');
  
  // Load existing .env file
  dotenv.config({ path: envPath });

  // Generate new secret if it doesn't exist
  if (!process.env.JWT_SECRET) {
    const secret = crypto.randomBytes(64).toString('hex');
    
    // Read existing .env content
    let envConfig = fs.readFileSync(envPath, 'utf-8');

    // Add or update JWT_SECRET
    if (envConfig.includes('JWT_SECRET=')) {
      envConfig = envConfig.replace(/JWT_SECRET=.*/g, `JWT_SECRET=${secret}`);
    } else {
      envConfig += `\nJWT_SECRET=${secret}`;
    }

    // Write updated content back to .env
    fs.writeFileSync(envPath, envConfig);

    // Update process.env
    process.env.JWT_SECRET = secret;
  }

  console.log('JWT_SECRET initialized:', !!process.env.JWT_SECRET);
}