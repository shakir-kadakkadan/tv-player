import { initializeApp } from 'firebase/app';
import { getDatabase, ref, push, set, get } from 'firebase/database';

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

interface ChannelData {
    id: string;
    name: string;
    url: string;
    logo?: string;
    group?: string;
}

export const trackChannelView = async (channel: ChannelData): Promise<void> => {
    try {
        // Create a unique key from the channel URL by removing special characters
        const channelKey = channel.url
            .replace(/[^a-zA-Z0-9]/g, '_')
            .substring(0, 200); // Limit length for Firebase key

        const channelRef = ref(database, `/channel_views/${channelKey}`);

        // Get existing data
        const snapshot = await get(channelRef);
        const existingData = snapshot.val();

        if (existingData) {
            // Channel exists, increment view count
            await set(channelRef, {
                ...existingData,
                viewCount: (existingData.viewCount || 0) + 1,
                lastViewedAt: Date.now(),
            });
        } else {
            // New channel, create entry
            await set(channelRef, {
                id: channel.id,
                name: channel.name,
                url: channel.url,
                logo: channel.logo || '',
                group: channel.group || '',
                viewCount: 1,
                firstViewedAt: Date.now(),
                lastViewedAt: Date.now(),
            });
        }

        console.log('Channel view tracked:', channel.name);
    } catch (e) {
        console.error('Error tracking channel view:', e);
    }
};

export { database };
