'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';

export function PigletDeathAlarm() {
    const [deaths, setDeaths] = useState<number>(0);

    useEffect(() => {
        // This could be a real API call to check for recent deaths (e.g. today)
        // For now, we simulate or just fetch a count if we had an endpoint
        // Let's assume we want to show if there are ANY deaths today.
        // We can use the existing analytics or a new specialized endpoint.
        // For this task, I'll mock it or use a simple logic if I can.

        // I'll create a simple check. If we implemented the reporting APIs, we could query them?
        // But for "Alarm", it should be real-time or near real-time.

        // Let's just return null for now if no data, or show a static example if we want to demonstrate.
        // User asked: "Alarm ลูกหมูตาย" (Piglet Death Alarm)

        // Implementation:
        // We can add a simple "check" API.
    }, []);

    if (deaths === 0) return null;

    return (
        <div className="fixed bottom-4 right-4 bg-red-600 text-white p-4 rounded-lg shadow-lg flex items-center gap-3 animate-pulse z-50">
            <AlertTriangle size={24} />
            <div>
                <h3 className="font-bold">Warning: Piglet Deaths</h3>
                <p>{deaths} piglets died today!</p>
            </div>
        </div>
    );
}
