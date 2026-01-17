import { initializeApp } from 'firebase/app';
import { getDatabase, ref, push, set } from 'firebase/database';

const firebaseConfig = {
    databaseURL: "https://tv123-f6b2a-default-rtdb.firebaseio.com"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

export const trackIPData = async (action: string, metadata?: { channelName?: string }): Promise<void> => {
    try {
        const response = await fetch('https://pro.ip-api.com/json?key=yjfBZPLkt6Kkl3h&fields=58335');
        const ipData = await response.json();

        const pageID = 'page_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

        const trackingData = {
            ...ipData,
            pageID,
            timestamp: Date.now(),
            userAgent: navigator.userAgent,
            action,
            referrer: document.referrer || 'direct',
            currentURL: window.location.href,
            currentPath: window.location.pathname,
            urlParams: Object.fromEntries(new URLSearchParams(window.location.search)),
            source: new URLSearchParams(window.location.search).get('ref') ||
                new URLSearchParams(window.location.search).get('utm_source') || null,
            campaign: new URLSearchParams(window.location.search).get('utm_campaign') || null,
            medium: new URLSearchParams(window.location.search).get('utm_medium') || null,
            screenWidth: window.screen.width,
            screenHeight: window.screen.height,
            viewportWidth: window.innerWidth,
            viewportHeight: window.innerHeight,
            language: navigator.language,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            ...(metadata?.channelName && { channelName: metadata.channelName }),
        };

        const ipRef = ref(database, '/ip_details');
        const newRef = push(ipRef);
        await set(newRef, trackingData);
        console.log('IP tracking saved:', action);
    } catch (e) {
        console.error('Error tracking IP data:', e);
    }
};

export { database };
