// src/pages/api/users/approveUser.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'PATCH') {
    const { id } = req.body;

    console.log('Received request to approve user with ID:', id);

    if (!id) {
      console.error('Missing user ID');
      return res.status(400).json({ error: 'Missing user ID' });
    }

    try {
      const client = await clientPromise;
      const db = client.db();
      const result = await db.collection('users').updateOne(
        { _id: new ObjectId(id) },
        { $set: { status: 'approved' } }
      );

      if (result.modifiedCount === 1) {
        res.status(200).json({ message: 'User approved successfully' });
      } else {
        res.status(404).json({ error: 'User not found' });
      }
    } catch (error) {
      console.error('Error approving user:', error);
      res.status(500).json({ error: 'Failed to approve user' });
    }
  } else {
    res.setHeader('Allow', ['PATCH']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
