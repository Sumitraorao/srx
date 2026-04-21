import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

// Using initializeFirestore with refined settings to handle restricted environments/proxies
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
}, (firebaseConfig as any).firestoreDatabaseId);

export const auth = getAuth(app);
auth.useDeviceLanguage(); // Set to device language for better UX

// Connectivity check as per guidelines
async function testConnection() {
  try {
    // Attempting a server-only fetch to verify real-time backend state
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn("Firestore is operating in offline mode. This is expected if your network blocks persistent connections.");
    }
  }
}
testConnection();

export default app;
