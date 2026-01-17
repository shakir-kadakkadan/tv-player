import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import PlaylistList from './pages/PlaylistList';
import Channels from './pages/Channels';
import VideoPlayer from './pages/VideoPlayer';

function isInAppBrowser(): { isInApp: boolean; platform: string } {
  const ua = navigator.userAgent || navigator.vendor || '';

  // Instagram in-app browser
  if (ua.includes('Instagram')) {
    return { isInApp: true, platform: 'Instagram' };
  }

  // Facebook in-app browser
  if (ua.includes('FBAN') || ua.includes('FBAV') || ua.includes('FB_IAB')) {
    return { isInApp: true, platform: 'Facebook' };
  }

  // LinkedIn in-app browser
  if (ua.includes('LinkedInApp')) {
    return { isInApp: true, platform: 'LinkedIn' };
  }

  // Twitter/X in-app browser
  if (ua.includes('Twitter')) {
    return { isInApp: true, platform: 'Twitter' };
  }

  return { isInApp: false, platform: '' };
}

function WebviewWarning({ platform, onDismiss }: { platform: string; onDismiss: () => void }) {
  const currentUrl = window.location.href;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(currentUrl).then(() => {
      alert('Link copied! Paste it in your browser.');
    }).catch(() => {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = currentUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('Link copied! Paste it in your browser.');
    });
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-gray-900 rounded-2xl p-8 text-center shadow-2xl border border-gray-700">
        <div className="text-6xl mb-4">🌐</div>
        <h1 className="text-2xl font-bold text-white mb-4">
          Open in Browser
        </h1>
        <p className="text-gray-300 mb-6">
          You're viewing this in {platform}'s in-app browser, which has limited features.
          For the best experience, please open this link in <strong>Chrome</strong>, <strong>Safari</strong>, or <strong>Firefox</strong>.
        </p>

        <div className="space-y-4">
          <div className="bg-gray-800 rounded-lg p-4">
            <p className="text-sm text-gray-400 mb-3">How to open in browser:</p>
            <ol className="text-left text-sm text-gray-300 space-y-2">
              <li>1. Tap the <strong>⋮</strong> or <strong>...</strong> menu</li>
              <li>2. Select "<strong>Open in Browser</strong>" or "<strong>Open in Safari/Chrome</strong>"</li>
            </ol>
          </div>

          <div className="text-gray-400 text-sm">— or —</div>

          <button
            onClick={copyToClipboard}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Copy Link
          </button>
          <p className="text-xs text-gray-500">
            Then paste it in your preferred browser
          </p>

          <button
            onClick={onDismiss}
            className="w-full text-gray-400 hover:text-white text-sm py-2 transition-colors"
          >
            Continue anyway
          </button>
        </div>
      </div>
    </div>
  );
}

function App() {
  const [webviewInfo, setWebviewInfo] = useState<{ isInApp: boolean; platform: string }>({ isInApp: false, platform: '' });
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setWebviewInfo(isInAppBrowser());
  }, []);

  if (webviewInfo.isInApp && !dismissed) {
    return <WebviewWarning platform={webviewInfo.platform} onDismiss={() => setDismissed(true)} />;
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-black text-white">
        <Routes>
          <Route path="/" element={<PlaylistList />} />
          <Route path="/playlist/:playlistId" element={<Channels />} />
          <Route path="/player/:playlistId/:channelId" element={<VideoPlayer />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
