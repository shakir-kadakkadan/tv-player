import { useState, useEffect } from 'react';

interface VLCDialogProps {
    isOpen: boolean;
    onClose: () => void;
    url: string;
    type: 'channel' | 'playlist';
}

export const VLCDialog = ({ isOpen, onClose, url, type }: VLCDialogProps) => {
    const [copied, setCopied] = useState(false);
    const [showVideo, setShowVideo] = useState(false);

    // Handle browser back button when video is open
    useEffect(() => {
        if (showVideo) {
            const handlePopState = (e: PopStateEvent) => {
                e.preventDefault();
                setShowVideo(false);
                window.history.pushState(null, '', window.location.href);
            };

            window.history.pushState(null, '', window.location.href);
            window.addEventListener('popstate', handlePopState);

            return () => {
                window.removeEventListener('popstate', handlePopState);
            };
        }
    }, [showVideo]);

    if (!isOpen) return null;

    const handleCopy = () => {
        navigator.clipboard.writeText(url).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    return (
        <>
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75" onClick={onClose}>
                <div className="bg-gray-800 rounded-xl p-6 max-w-2xl w-full mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
                    <h2 className="text-2xl font-bold text-white mb-4">
                        ✅ {type === 'channel' ? 'Stream' : 'Playlist'} URL Copied!
                    </h2>

                    <div className="bg-gray-900 p-4 rounded-lg mb-4">
                        <p className="text-yellow-400 mb-3">
                            ⚠️ Note: Some channels may not play in web browsers due to compatibility issues.
                            If playback fails, try VLC or other popular media players.
                        </p>

                        <div className="text-white space-y-2 mb-4">
                            <p className="font-semibold">To watch in VLC:</p>
                            <ol className="list-decimal list-inside space-y-1 text-sm text-gray-300">
                                <li>Open VLC Media Player</li>
                                <li>Go to Media → Open Network Stream</li>
                                <li>Paste the URL (Ctrl+V / Cmd+V)</li>
                                <li>Click Play</li>
                            </ol>
                        </div>

                        <div className="bg-gray-800 p-3 rounded border border-gray-700">
                            <p className="text-xs text-gray-400 mb-1">URL:</p>
                            <p className="text-sm text-blue-400 break-all font-mono">{url}</p>
                        </div>
                    </div>

                    <div className="flex gap-3 justify-end">
                        <button
                            onClick={() => setShowVideo(true)}
                            className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors"
                        >
                            🎥 How-To Video
                        </button>
                        <button
                            onClick={handleCopy}
                            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
                        >
                            {copied ? '✓ Copied!' : '📋 Copy URL'}
                        </button>
                        <button
                            onClick={onClose}
                            className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>


            {/* Video Modal */}
            {showVideo && (
                <div
                    className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-95 p-4"
                    onClick={() => setShowVideo(false)}
                >
                    <div className="relative w-full h-full max-w-md flex flex-col items-center justify-center" onClick={(e) => e.stopPropagation()}>
                        <button
                            onClick={() => setShowVideo(false)}
                            className="mb-4 px-6 py-3 bg-white text-black rounded-lg font-semibold hover:bg-gray-200 transition-colors"
                        >
                            ✕ Close Video
                        </button>
                        <video
                            src="/vlc-howto.mp4"
                            controls
                            autoPlay
                            className="w-full max-h-[80vh] rounded-lg shadow-2xl"
                            style={{ objectFit: 'contain' }}
                        />
                    </div>
                </div>
            )}
        </>
    );
};
