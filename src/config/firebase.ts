import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';

dotenv.config();

// Import service account key conditionally in the init block below.
// This prevents compiling the JSON into the production build if we use dynamic require.

import * as path from 'path';
import * as fs from 'fs';

// Initialize Firebase Admin
if (!admin.apps.length) {
  try {
    
    // Check for Service Account in environment variables (Vercel Production)
    if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
      console.log('Initializing Firebase Admin with Service Account from ENV');
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
    } 
    // Otherwise fallback to local file if it exists (Local Development)
    else {
      const keyPath = path.resolve(__dirname, '../../restaurant-proto-c1826-firebase-adminsdk-fbsvc-d77d392fa8.json');
      
      if (fs.existsSync(keyPath)) {
          const serviceAccount = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
          admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
          });
          console.log('Firebase Admin Initialized with Service Account (Local File)');
      } else {
          console.warn('Firebase Admin: No credentials found (ENV or File). Initializing with ADC.');
          admin.initializeApp(); 
      }
    }

  } catch (error) {
    console.error('Firebase Admin Initialization Error:', error);
  }
}

export const db = admin.firestore();
export const auth = admin.auth();
