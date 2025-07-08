// config/firebase.mjs
//
// Khởi tạo Firebase Admin SDK cho backend.
// Đảm bảo .env chứa FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY
// (PRIVATE_KEY phải để trong dấu " và giữ nguyên ký tự \n).

import admin from 'firebase-admin';
import dotenv from 'dotenv';
dotenv.config();

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId:   process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      // Firebase export private_key có \n => cần replace
      privateKey:  process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
  });
  console.log('[Firebase] Admin SDK initialized');
}

export default admin;
