// lib/firebase.ts
// Firebase app initialization and Firestore helpers for the spreadsheet app.

import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import {
    getFirestore,
    doc,
    setDoc,
    onSnapshot,
    updateDoc,
    collection,
    query,
    orderBy,
    serverTimestamp,
    Firestore,
    DocumentReference,
    deleteDoc,
} from "firebase/firestore";
import { SheetData, SheetFormatting } from "@/types/spreadsheet";

// ---------------------------------------------------------------------------
// Firebase config – values come from .env.local (never commit secrets)
// ---------------------------------------------------------------------------
const required = (key: string): string => {
    const val = process.env[key];
    if (!val) {
        throw new Error(
            `Missing required environment variable: ${key}. ` +
            `Copy .env.example to .env.local and fill in your Firebase project values.`
        );
    }
    return val;
};

const firebaseConfig = {
    apiKey: required("NEXT_PUBLIC_FIREBASE_API_KEY"),
    authDomain: required("NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN"),
    projectId: required("NEXT_PUBLIC_FIREBASE_PROJECT_ID"),
    storageBucket: required("NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET"),
    messagingSenderId: required("NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID"),
    appId: required("NEXT_PUBLIC_FIREBASE_APP_ID"),
};

// Prevent re-initialization on Next.js hot reloads
const app: FirebaseApp =
    getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db: Firestore = getFirestore(app);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Returns a Firestore document ref for a given sheet. */
export function getSheetRef(sheetId: string): DocumentReference {
    return doc(db, "sheets", sheetId);
}

/**
 * Writes the entire cell map for a sheet to Firestore.
 * Uses setDoc with merge:true so we don't wipe other fields.
 */
export async function saveSheetData(
    sheetId: string,
    cells: SheetData
): Promise<void> {
    const ref = getSheetRef(sheetId);
    await setDoc(ref, { cells }, { merge: true });
}

/**
 * Updates a single cell value in Firestore.
 * Uses a dot-notation path so only that cell field is written.
 * This is much more efficient than re-writing the whole document.
 */
export async function saveCellValue(
    sheetId: string,
    cellId: string,
    value: string
): Promise<void> {
    const ref = getSheetRef(sheetId);
    // Dot notation: cells.A1 = "10"
    await updateDoc(ref, { [`cells.${cellId}`]: value }).catch(async () => {
        // Document doesn't exist yet — create it first
        await setDoc(ref, { cells: { [cellId]: value } }, { merge: true });
    });
}

/**
 * Saves the style/formatting for a single cell.
 * Stored separately as `formats.A1` so the expression evaluator never sees style data.
 */
export async function saveCellFormat(
    sheetId: string,
    cellId: string,
    style: Partial<SheetFormatting[string]>
): Promise<void> {
    const ref = getSheetRef(sheetId);
    await updateDoc(ref, { [`formats.${cellId}`]: style }).catch(async () => {
        await setDoc(ref, { formats: { [cellId]: style } }, { merge: true });
    });
}

/**
 * Subscribes to real-time updates for a sheet document.
 * Calls the callback whenever a remote change is detected.
 *
 * @param sheetId The sheet document ID
 * @param onChange Callback with the latest cell map and formatting map
 * @returns Unsubscribe function
 */
export function subscribeToSheet(
    sheetId: string,
    onChange: (cells: SheetData, formats: SheetFormatting) => void
): () => void {
    const ref = getSheetRef(sheetId);
    const unsubscribe = onSnapshot(ref, (snapshot) => {
        if (snapshot.exists()) {
            const data = snapshot.data();
            const cells = (data?.cells && typeof data.cells === "object") ? data.cells as SheetData : {};
            const formats = (data?.formats && typeof data.formats === "object") ? data.formats as SheetFormatting : {};
            onChange(cells, formats);
        }
    });
    return unsubscribe;
}

export async function createNewSpreadsheet(userId: string): Promise<string> {
    const newId = crypto.randomUUID();
    const ref = getSheetRef(newId);
    await setDoc(ref, {
        name: "Untitled Spreadsheet",
        ownerId: userId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        cells: {}
    });
    return newId;
}

export function subscribeToUserSheets(
    onChange: (sheets: Array<{ id: string;[key: string]: unknown }>) => void
): () => void {
    const sheetsRef = collection(db, "sheets");
    // For now we'll fetch all. In a production app, we'd add where("ownerId", "==", userId) 
    // but that requires a composite index if combining with orderBy.
    const q = query(sheetsRef, orderBy("updatedAt", "desc"));

    return onSnapshot(q, (snapshot) => {
        const sheets = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        onChange(sheets);
    });
}

// ---------------------------------------------------------------------------
// Presence
// ---------------------------------------------------------------------------

export interface PresenceUser {
    uid: string;
    name: string;
    color: string;
    sheetId?: string; // Optional since it's implied by the URL/collection
    lastActive: { toDate: () => Date } | null; // Firestore Timestamp
}

export async function joinPresence(sheetId: string, user: { uid: string, name: string, color: string }): Promise<void> {
    const presenceRef = doc(db, "sheets", sheetId, "presence", user.uid);
    await setDoc(presenceRef, {
        uid: user.uid,
        name: user.name,
        color: user.color,
        sheetId: sheetId,
        lastActive: serverTimestamp()
    });
}

export async function leavePresence(sheetId: string, userId: string): Promise<void> {
    const presenceRef = doc(db, "sheets", sheetId, "presence", userId);
    await deleteDoc(presenceRef);
}

export function subscribeToPresence(
    sheetId: string,
    onChange: (users: PresenceUser[]) => void
): () => void {
    const presenceColRef = collection(db, "sheets", sheetId, "presence");
    return onSnapshot(presenceColRef, (snapshot) => {
        const users: PresenceUser[] = [];
        snapshot.forEach((d) => {
            users.push(d.data() as PresenceUser);
        });
        onChange(users);
    });
}
