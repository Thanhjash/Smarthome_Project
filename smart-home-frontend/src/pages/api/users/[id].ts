import type { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';  // Thêm import này

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (req.method === 'DELETE') {
    try {
      const client = await clientPromise;
      const db = client.db();
      const result = await db.collection('users').deleteOne({ _id: new ObjectId(id as string) });

      if (result.deletedCount === 1) {
        res.status(200).json({ message: 'User deleted successfully' });
      } else {
        res.status(404).json({ message: 'User not found' });
      }
    } catch (error) {
      res.status(500).json({ message: 'Internal Server Error', error });
    }
  } else {
    res.status(405).json({ message: 'Method Not Allowed' });
  }
}
