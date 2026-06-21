import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import firebaseConfig from "../../firebase-applet-config.json";

let db: any = null;
let isLiveFirebase = false;

if (firebaseConfig && firebaseConfig.apiKey && firebaseConfig.apiKey.trim() !== "") {
  try {
    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    db = getFirestore(app);
    isLiveFirebase = true;
    console.log("[Firebase] Sync engine successfully initialized.");
  } catch (err) {
    console.log("[Firebase] Initialization skipped, running in local database mode:", err);
  }
} else {
  console.log("[Firebase] Operating in clean offline-safe fallback state.");
}

// Structured error handler matching Phase 3 from SKILL.md
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: null,
      email: null,
      emailVerified: null,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export { db, isLiveFirebase, doc, setDoc, getDoc, serverTimestamp };
