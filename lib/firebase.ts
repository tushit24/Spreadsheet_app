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
    getDocs,
} from "firebase/firestore";
import { SheetData, SheetFormatting } from "@/types/spreadsheet";

// ---------------------------------------------------------------------------
// Firebase config
// NEXT_PUBLIC_ vars are injected at build time. Hardcoded fallbacks ensure
// the app works on Vercel even if the vars aren't picked up during the build.
// These are public client-side keys — safe to include in source.
// ---------------------------------------------------------------------------
const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "AIzaSyABb6Nz_3QbgsijJeCyQRTNwq6dd0N_lCs",
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "collab-sheets-app.firebaseapp.com",
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "collab-sheets-app",
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "collab-sheets-app.firebasestorage.app",
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "323679239573",
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "1:323679239573:web:52ecec33d9d133df150a9c",
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
export interface EditorInfo {
    uid: string;
    name: string;
    color: string;
}

/**
 * Updates a single cell value in Firestore.
 * Also writes lastEditedBy / lastEditedAt when editor info is supplied.
 */
export async function saveCellValue(
    sheetId: string,
    cellId: string,
    value: string,
    editor?: EditorInfo
): Promise<void> {
    const ref = getSheetRef(sheetId);
    const extra = editor
        ? { lastEditedBy: { uid: editor.uid, name: editor.name, color: editor.color }, lastEditedAt: serverTimestamp() }
        : {};
    await updateDoc(ref, { [`cells.${cellId}`]: value, ...extra }).catch(async () => {
        await setDoc(ref, { cells: { [cellId]: value }, ...extra }, { merge: true });
    });
}

/**
 * Saves the style/formatting for a single cell.
 * Stored separately as `formats.A1` so the expression evaluator never sees style data.
 */
export async function saveCellFormat(
    sheetId: string,
    cellId: string,
    style: Partial<SheetFormatting[string]>,
    editor?: EditorInfo
): Promise<void> {
    const ref = getSheetRef(sheetId);
    const extra = editor
        ? { lastEditedBy: { uid: editor.uid, name: editor.name, color: editor.color }, lastEditedAt: serverTimestamp() }
        : {};
    await updateDoc(ref, { [`formats.${cellId}`]: style, ...extra }).catch(async () => {
        await setDoc(ref, { formats: { [cellId]: style }, ...extra }, { merge: true });
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

export async function createNewSpreadsheet(userId: string, title = "Untitled Spreadsheet"): Promise<string> {
    const newId = crypto.randomUUID();
    const ref = getSheetRef(newId);
    await setDoc(ref, {
        title,
        name: title, // keep legacy `name` field for dashboard backwards-compat
        ownerId: userId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        cells: {},
        formats: {},
    });
    return newId;
}

/** Updates just the title of a sheet document. */
export async function updateSheetTitle(sheetId: string, title: string): Promise<void> {
    const ref = getSheetRef(sheetId);
    await updateDoc(ref, {
        title,
        name: title, // keep dashboard card in sync
        updatedAt: serverTimestamp(),
    });
}

/**
 * Subscribes to real-time title changes for a sheet.
 * Calls onChange whenever the title field changes.
 */
export function subscribeToSheetTitle(
    sheetId: string,
    onChange: (title: string) => void
): () => void {
    const ref = getSheetRef(sheetId);
    return onSnapshot(ref, (snapshot) => {
        if (snapshot.exists()) {
            const data = snapshot.data();
            onChange((data?.title as string) || (data?.name as string) || "Untitled Spreadsheet");
        }
    });
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

export async function updatePresenceHeartbeat(sheetId: string, userId: string): Promise<void> {
    const presenceRef = doc(db, "sheets", sheetId, "presence", userId);
    await setDoc(presenceRef, { lastActive: serverTimestamp() }, { merge: true });
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

// ---------------------------------------------------------------------------
// Administration
// ---------------------------------------------------------------------------

export async function deleteSpreadsheet(sheetId: string): Promise<void> {
    const sheetRef = doc(db, "sheets", sheetId);

    // Attempt to delete presence subcollection first
    try {
        const presenceColRef = collection(db, "sheets", sheetId, "presence");
        const presenceDocs = await getDocs(presenceColRef);
        const deletePromises = presenceDocs.docs.map(d => deleteDoc(d.ref));
        await Promise.all(deletePromises);
    } catch (e) {
        console.warn("Failed to delete presence subcollection", e);
    }

    // Delete the main document
    await deleteDoc(sheetRef);
}
