// src/pages/api/users/softDeleteUser.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'PATCH') {
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'Missing user ID' });
    }

    try {
      const client = await clientPromise;
      const db = client.db();
      const result = await db.collection('users').updateOne(
        { _id: new ObjectId(id) },
        { $set: { deleted: true, deletedAt: new Date() } }
      );

      if (result.modifiedCount === 1) {
        res.status(200).json({ message: 'User soft deleted successfully' });
      } else {
        res.status(404).json({ error: 'User not found' });
      }
    } catch (error) {
      res.status(500).json({ error: 'Failed to soft delete user' });
    }
  } else {
    res.setHeader('Allow', ['PATCH']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
