"use client";

import { useEffect, useState } from "react";
import { subscribeToPresence, PresenceUser } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";

export default function Presence({ sheetId }: { sheetId: string }) {
    const { user } = useAuth();
    const [activeUsers, setActiveUsers] = useState<PresenceUser[]>([]);
    const [now, setNow] = useState(Date.now());

    // Update the 'now' timestamp periodically to clean up stale users
    useEffect(() => {
        const interval = setInterval(() => setNow(Date.now()), 5000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const unsubscribe = subscribeToPresence(sheetId, (users) => {
            setActiveUsers(users);
        });

        return () => unsubscribe();
    }, [sheetId]);

    // Use a 30-second heartbeat threshold
    const others = activeUsers.filter(u => {
        if (u.uid === user?.uid) return false;
        if (!u.lastActive) return true; // optimistic if no timestamp yet
        const lastActiveTime = typeof u.lastActive.toDate === 'function' ? u.lastActive.toDate().getTime() : 0;
        return (now - lastActiveTime) < 30000;
    });

    if (others.length === 0) {
        return (
            <div className="flex items-center text-sm text-gray-500 mr-4">
                <span className="w-2 h-2 rounded-full bg-gray-300 mr-2"></span>
                Only you editing
            </div>
        );
    }

    return (
        <div className="flex items-center gap-4 mr-4">
            <div className="text-sm font-medium text-gray-600">
                Editing with {others.length} other{others.length > 1 ? 's' : ''}
            </div>
            <div className="flex items-center gap-2">
                {others.map(collaborator => (
                    <div
                        key={collaborator.uid}
                        className="flex items-center justify-center w-7 h-7 rounded-full text-white text-xs font-semibold shadow-sm border border-white/20"
                        style={{ backgroundColor: collaborator.color }}
                        title={collaborator.name}
                    >
                        {collaborator.name.charAt(0).toUpperCase()}
                    </div>
                ))}
            </div>
        </div>
    );
}
