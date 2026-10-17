import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  getDocs,
  collection,
  deleteDoc,
  Firestore,
} from "firebase/firestore";
import fs from "fs";
import path from "path";
import type {
  StoredSubscriber,
  StoredCallback,
  StoredConsultation,
  StoredPayment,
  DatabaseSchema,
} from "./db";

let firestoreDb: Firestore | null = null;
let firestoreConfig: any = null;

export function getFirestoreInstance(): Firestore | null {
  if (firestoreDb) return firestoreDb;

  try {
    const configPath = path.join(process.cwd(), "firebase-applet-config.json");
    if (!fs.existsSync(configPath)) {
      console.warn("firebase-applet-config.json not found, Firestore unavailable");
      return null;
    }

    firestoreConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    const app =
      getApps().length === 0
        ? initializeApp(firestoreConfig)
        : getApp();

    firestoreDb = getFirestore(
      app,
      firestoreConfig.firestoreDatabaseId || "(default)"
    );
    console.log(
      "✅ Firestore initialized with DB:",
      firestoreConfig.firestoreDatabaseId
    );
    return firestoreDb;
  } catch (err) {
    console.error("Failed to initialize Firestore instance:", err);
    return null;
  }
}

// Clean helper to remove undefined keys so Firestore doesn't reject
function sanitizeForFirestore<T>(data: T): Record<string, any> {
  const json = JSON.stringify(data, (_, val) => (val === undefined ? null : val));
  return JSON.parse(json);
}

/**
 * Save or update a single devotee subscriber in Firestore collection "subscribers"
 */
export async function syncSubscriberToFirestore(sub: StoredSubscriber): Promise<boolean> {
  const db = getFirestoreInstance();
  if (!db) return false;

  try {
    const cleanMobile = sub.mobile.replace(/\D/g, "");
    if (!cleanMobile) return false;

    const docRef = doc(db, "subscribers", cleanMobile);
    const sanitized = sanitizeForFirestore({
      ...sub,
      updatedAt: new Date().toISOString(),
    });

    await setDoc(docRef, sanitized, { merge: true });
    console.log(`[Firestore] Devotee ${sub.name} (${cleanMobile}) saved to Firestore.`);
    return true;
  } catch (err) {
    console.error(`[Firestore] Error saving devotee ${sub.mobile}:`, err);
    return false;
  }
}

/**
 * Remove a devotee subscriber from Firestore
 */
export async function removeSubscriberFromFirestore(mobile: string): Promise<boolean> {
  const db = getFirestoreInstance();
  if (!db) return false;

  try {
    const cleanMobile = mobile.replace(/\D/g, "");
    const docRef = doc(db, "subscribers", cleanMobile);
    await deleteDoc(docRef);
    console.log(`[Firestore] Devotee (${cleanMobile}) removed from Firestore.`);
    return true;
  } catch (err) {
    console.error(`[Firestore] Error deleting devotee ${mobile}:`, err);
    return false;
  }
}

/**
 * Save callback to Firestore
 */
export async function syncCallbackToFirestore(cb: StoredCallback): Promise<boolean> {
  const db = getFirestoreInstance();
  if (!db) return false;

  try {
    const docRef = doc(db, "callbacks", cb.id);
    await setDoc(docRef, sanitizeForFirestore(cb), { merge: true });
    return true;
  } catch (err) {
    console.error(`[Firestore] Error saving callback ${cb.id}:`, err);
    return false;
  }
}

/**
 * Save consultation to Firestore
 */
export async function syncConsultationToFirestore(cons: StoredConsultation): Promise<boolean> {
  const db = getFirestoreInstance();
  if (!db) return false;

  try {
    const docRef = doc(db, "consultations", cons.id);
    await setDoc(docRef, sanitizeForFirestore(cons), { merge: true });
    return true;
  } catch (err) {
    console.error(`[Firestore] Error saving consultation ${cons.id}:`, err);
    return false;
  }
}

/**
 * Save or update payment transaction in Firestore collection "payments"
 */
export async function syncPaymentToFirestore(payment: StoredPayment): Promise<boolean> {
  const db = getFirestoreInstance();
  if (!db) return false;

  try {
    const docRef = doc(db, "payments", payment.id);
    await setDoc(docRef, sanitizeForFirestore({
      ...payment,
      updatedAt: new Date().toISOString(),
    }), { merge: true });
    console.log(`[Firestore] Payment transaction ${payment.id} (${payment.status}) synced to Firestore.`);
    return true;
  } catch (err) {
    console.error(`[Firestore] Error saving payment ${payment.id}:`, err);
    return false;
  }
}

/**
 * Synchronize all devotees, callbacks, consultations, and payments from local store to Firestore
 */
export async function syncAllToFirestore(localData: DatabaseSchema): Promise<{
  syncedSubscribers: number;
  syncedCallbacks: number;
  syncedConsultations: number;
  syncedPayments: number;
  success: boolean;
}> {
  const db = getFirestoreInstance();
  if (!db) {
    return { syncedSubscribers: 0, syncedCallbacks: 0, syncedConsultations: 0, syncedPayments: 0, success: false };
  }

  let subCount = 0;
  let cbCount = 0;
  let consCount = 0;
  let payCount = 0;

  try {
    // 1. Sync All Subscribers
    const subscribers = Object.values(localData.subscribers || {});
    for (const sub of subscribers) {
      const cleanMobile = sub.mobile.replace(/\D/g, "");
      if (cleanMobile) {
        const docRef = doc(db, "subscribers", cleanMobile);
        await setDoc(docRef, sanitizeForFirestore(sub), { merge: true });
        subCount++;
      }
    }

    // 2. Sync Callbacks
    const callbacks = localData.callbacks || [];
    for (const cb of callbacks) {
      if (cb.id) {
        const docRef = doc(db, "callbacks", cb.id);
        await setDoc(docRef, sanitizeForFirestore(cb), { merge: true });
        cbCount++;
      }
    }

    // 3. Sync Consultations
    const consultations = localData.consultations || [];
    for (const c of consultations) {
      if (c.id) {
        const docRef = doc(db, "consultations", c.id);
        await setDoc(docRef, sanitizeForFirestore(c), { merge: true });
        consCount++;
      }
    }

    // 4. Sync Payments
    const payments = localData.payments || [];
    for (const p of payments) {
      if (p.id) {
        const docRef = doc(db, "payments", p.id);
        await setDoc(docRef, sanitizeForFirestore(p), { merge: true });
        payCount++;
      }
    }

    console.log(
      `[Firestore Sync Completed] Devotees: ${subCount}, Callbacks: ${cbCount}, Consultations: ${consCount}, Payments: ${payCount}`
    );
    return {
      syncedSubscribers: subCount,
      syncedCallbacks: cbCount,
      syncedConsultations: consCount,
      syncedPayments: payCount,
      success: true,
    };
  } catch (err) {
    console.error("[Firestore Sync Error]:", err);
    return {
      syncedSubscribers: subCount,
      syncedCallbacks: cbCount,
      syncedConsultations: consCount,
      syncedPayments: payCount,
      success: false,
    };
  }
}
