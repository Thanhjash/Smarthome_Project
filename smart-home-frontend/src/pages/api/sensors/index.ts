// src/pages/api/sensors/index.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '@/lib/mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { temperature, humidity } = req.body;

    if (temperature == null || humidity == null) {
      return res.status(400).json({ error: 'Missing temperature or humidity data' });
    }

    try {
      const client = await clientPromise;
      const db = client.db();
      const result = await db.collection('sensor_data').insertOne({
        temperature,
        humidity,
        timestamp: new Date(),
      });

      res.status(200).json({ message: 'Sensor data saved successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to save sensor data' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
