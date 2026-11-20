import { db, auth } from "../lib/firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  Unsubscribe,
  DocumentData,
  QueryConstraint,
} from "firebase/firestore";

/**
 * Recursively removes undefined properties from an object before writing to Firestore.
 * Firestore setDoc/updateDoc throws an error when any field is undefined.
 * Logs removed key names in dev mode without exposing sensitive credential values.
 */
export function sanitizeFirestoreData<T extends Record<string, any>>(data: T): Record<string, any> {
  const removedKeys: string[] = [];

  function clean(obj: any, path = ""): any {
    if (obj === null || obj === undefined) {
      return undefined;
    }
    if (Array.isArray(obj)) {
      return obj
        .map((item, idx) => clean(item, path ? `${path}[${idx}]` : `[${idx}]`))
        .filter((val) => val !== undefined);
    }
    if (typeof obj === "object" && !(obj instanceof Date)) {
      const cleaned: Record<string, any> = {};
      for (const key of Object.keys(obj)) {
        const currentPath = path ? `${path}.${key}` : key;
        const val = obj[key];
        if (val === undefined) {
          removedKeys.push(currentPath);
        } else {
          const cleanedVal = clean(val, currentPath);
          if (cleanedVal !== undefined) {
            cleaned[key] = cleanedVal;
          }
        }
      }
      return cleaned;
    }
    return obj;
  }

  const result = clean(data) || {};
  if (removedKeys.length > 0) {
    console.log("[Firestore Sanitizer] Stripped undefined fields:", removedKeys);
  }
  return result;
}

export class FirebaseService {
  public static async getDocument<T>(col: string, id: string): Promise<T | null> {
    try {
      const snap = await getDoc(doc(db, col, id));
      return snap.exists() ? (snap.data() as T) : null;
    } catch (err) {
      console.error(`FirebaseService Error [getDocument ${col}/${id}]:`, err);
      return null;
    }
  }

  public static async setDocument<T extends DocumentData>(col: string, id: string, data: T): Promise<void> {
    try {
      const sanitized = sanitizeFirestoreData(data);
      await setDoc(doc(db, col, id), sanitized, { merge: true });
    } catch (err) {
      console.error(`FirebaseService Error [setDocument ${col}/${id}]:`, err);
      throw err;
    }
  }

  public static async updateDocument(col: string, id: string, data: Partial<DocumentData>): Promise<void> {
    try {
      const sanitized = sanitizeFirestoreData({
        ...data,
        updatedAt: new Date().toISOString(),
      });
      await updateDoc(doc(db, col, id), sanitized);
    } catch (err) {
      console.error(`FirebaseService Error [updateDocument ${col}/${id}]:`, err);
      throw err;
    }
  }

  public static async updateDoc(col: string, id: string, data: Partial<DocumentData>): Promise<void> {
    return this.updateDocument(col, id, data);
  }

  public static async getCollection<T>(col: string): Promise<T[]> {
    return this.queryCollection<T>(col);
  }

  public static async queryCollection<T>(col: string, ...constraints: QueryConstraint[]): Promise<T[]> {
    try {
      const q = query(collection(db, col), ...constraints);
      const snap = await getDocs(q);
      return snap.docs.map((d) => d.data() as T);
    } catch (err) {
      console.error(`FirebaseService Error [queryCollection ${col}]:`, err);
      return [];
    }
  }

  public static subscribeQuery<T>(
    col: string,
    constraints: QueryConstraint[],
    onUpdate: (data: T[]) => void,
    onError?: (err: Error) => void
  ): Unsubscribe {
    const q = query(collection(db, col), ...constraints);
    return onSnapshot(
      q,
      (snap) => {
        const items = snap.docs.map((d) => d.data() as T);
        onUpdate(items);
      },
      (err) => {
        console.error(`[FirebaseService] Subscription Error on "${col}":`, err);
        if (onError) onError(err);
      }
    );
  }

  public static subscribeDoc<T>(
    col: string,
    id: string,
    onUpdate: (data: T | null) => void,
    onError?: (err: Error) => void
  ): Unsubscribe {
    return onSnapshot(
      doc(db, col, id),
      (snap) => {
        onUpdate(snap.exists() ? (snap.data() as T) : null);
      },
      (err) => {
        console.error(`[FirebaseService] Doc Subscription Error [${col}/${id}]:`, err);
        if (onError) onError(err);
      }
    );
  }
}
