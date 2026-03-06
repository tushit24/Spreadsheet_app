import { auth, db } from "./firebase";
import { GoogleAuthProvider, signInWithPopup, signOut, signInAnonymously } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { generateUserColor } from "./userColor";
import { UserProfile } from "@/types/user";

const googleProvider = new GoogleAuthProvider();

export async function signInWithGoogle(): Promise<UserProfile> {
    // 1. Sign in with Google Popup
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

    // 2. Check if user profile already exists
    const userDocRef = doc(db, "users", user.uid);
    const userDocSnap = await getDoc(userDocRef);

    let profile: UserProfile;

    if (userDocSnap.exists()) {
        // Existing user
        profile = userDocSnap.data() as UserProfile;
    } else {
        // First-time user: Create profile with random color
        profile = {
            uid: user.uid,
            name: user.displayName || "Anonymous User",
            color: generateUserColor(),
        };

        await setDoc(userDocRef, {
            ...profile,
            createdAt: serverTimestamp(),
        });
    }

    return profile;
}

export async function signOutUser(): Promise<void> {
    await signOut(auth);
}

export function getCurrentUser() {
    return auth.currentUser;
}

export async function signInAsGuest(displayName: string): Promise<UserProfile> {
    const result = await signInAnonymously(auth);
    const user = result.user;

    const userDocRef = doc(db, "users", user.uid);

    const profile = {
        uid: user.uid,
        name: displayName || "Anonymous User",
        color: generateUserColor(),
    };

    // Treat guest login as a fresh profile creation
    await setDoc(userDocRef, {
        ...profile,
        createdAt: serverTimestamp(),
    });

    return profile;
}
