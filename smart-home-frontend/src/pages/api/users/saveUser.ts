import type { NextApiRequest, NextApiResponse } from 'next';
import { MongoClient } from 'mongodb';
import bcrypt from 'bcrypt';
import admin from 'firebase-admin';

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error('Missing FIREBASE_PRIVATE_KEY in environment variables');
  }

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKey: privateKey.replace(/\\n/g, '\n'),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    }),
  });
}

const uri = process.env.MONGODB_URI!;
let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (!uri) {
  throw new Error('Please add your Mongo URI to .env.local');
}

client = new MongoClient(uri);
clientPromise = client.connect();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { email, username, password, role } = req.body;

    if (!email || !username || !password || !role) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
      // Create user in Firebase Authentication
      const userRecord = await admin.auth().createUser({
        email,
        password,
        displayName: username,
      });

      const client = await clientPromise;
      const database = client.db('Cluster0'); // Replace with your database name
      const users = database.collection('users');

      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = {
        uid: userRecord.uid,
        email,
        username,
        password: hashedPassword,
        role,
        status: role === 'admin' ? 'approved' : 'pending'
      };
      await users.insertOne(newUser);

      res.status(200).json({ message: 'User saved successfully' });
    } catch (error: any) {
      console.error('Failed to save user:', error);
      res.status(500).json({ error: 'Failed to save user' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
