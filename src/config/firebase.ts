import admin from 'firebase-admin';
import { config } from './env';

/**
 * Lazily initialize Firebase Admin SDK.
 *
 * Credentials priority:
 * 1) FIREBASE_PROJECT_ID + FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY (recommended for deployments)
 * 2) Application Default Credentials (GOOGLE_APPLICATION_CREDENTIALS / workload identity)
 */
function ensureFirebaseInitialized() {
  if (!admin.apps.length) {
    const projectId = config.firebase.projectId;
    const clientEmail = config.firebase.clientEmail;
    const privateKey = config.firebase.privateKey?.replace(/\\n/g, '\n');

    if (projectId && clientEmail && privateKey) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
    } else {
      // Falls back to GOOGLE_APPLICATION_CREDENTIALS / environment-provided credentials
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
      });
    }
  }
}

export function getFirebaseAuth() {
  ensureFirebaseInitialized();
  return admin.auth();
}

export function getFirebaseMessaging() {
  ensureFirebaseInitialized();
  return admin.messaging();
}

