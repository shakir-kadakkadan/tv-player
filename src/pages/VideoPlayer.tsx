import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Channel } from '../types';
import { trackIPData, trackChannelView } from '../utils/firebase';

const VideoPlayer = () => {
  const navigate = useNavigate();
  const { playlistId, channelId } = useParams();
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [volume, setVolume] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef<number | undefined>(undefined);
  const [channelInfo, setChannelInfo] = useState<{ name: string; url: string } | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [isMixedContent, setIsMixedContent] = useState(false);

  // Get channel info from localStorage
  useEffect(() => {
    const storedChannels = localStorage.getItem('channels');
    if (storedChannels) {
      try {
        const channels: Channel[] = JSON.parse(storedChannels);
        const channel = channels.find((ch) => ch.id === channelId);
        if (channel) {
          setChannelInfo({ name: channel.name, url: channel.url });

          // Check for mixed content (HTTP video on HTTPS page)
          const isHttps = window.location.protocol === 'https:';
          const isHttpUrl = channel.url.toLowerCase().startsWith('http://');
          if (isHttps && isHttpUrl) {
            // Redirect to the HTTP stream URL directly
            window.location.href = channel.url;
          } else {
            setIsMixedContent(false);
            setVideoError(null);
          }

          // Track page view with channel name
          trackIPData('video_player_page_load', { channelName: channel.name });

          // Track channel view for Most Watched feature
          trackChannelView({
            id: channel.id,
            name: channel.name,
            url: channel.url,
            logo: channel.logo,
            group: channel.group
          });
        } else {
          setChannelInfo({ name: 'Channel not found', url: '' });
          // Track page view without channel name
          trackIPData('video_player_page_load');
        }
      } catch (error) {
        console.error('Error parsing channels from localStorage:', error);
        setChannelInfo({ name: 'Error loading channel', url: '' });
        // Track page view without channel name
        trackIPData('video_player_page_load');
      }
    } else {
      setChannelInfo({ name: 'No channels loaded', url: '' });
      // Track page view without channel name
      trackIPData('video_player_page_load');
    }
  }, [channelId]);

  const hideControlsAfterDelay = () => {
    if (controlsTimeoutRef.current !== undefined) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = window.setTimeout(() => {
      setShowControls(false);
    }, 3000);
  };

  const showControlsTemporarily = () => {
    setShowControls(true);
    hideControlsAfterDelay();
  };

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume;
    }
  }, [volume]);

  useEffect(() => {
    hideControlsAfterDelay();

    // Auto-enter fullscreen on mount for TV compatibility
    const enterFullscreen = async () => {
      if (containerRef.current && !document.fullscreenElement) {
        try {
          await containerRef.current.requestFullscreen();
        } catch (err) {
          console.log('Fullscreen not supported or denied:', err);
        }
      }
    };

    // Small delay to ensure DOM is ready
    const timer = setTimeout(enterFullscreen, 100);

    return () => {
      clearTimeout(timer);
      if (controlsTimeoutRef.current !== undefined) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
    showControlsTemporarily();
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      showControlsTemporarily();

      switch (e.key) {
        case ' ':
        case 'MediaPlayPause':
          e.preventDefault();
          togglePlayPause();
          break;
        case 'ArrowUp':
          e.preventDefault();
          setVolume((prev) => Math.min(1, prev + 0.1));
          break;
        case 'ArrowDown':
          e.preventDefault();
          setVolume((prev) => Math.max(0, prev - 0.1));
          break;
        case 'ArrowLeft':
          e.preventDefault();
          if (videoRef.current) {
            videoRef.current.currentTime -= 10;
          }
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (videoRef.current) {
            videoRef.current.currentTime += 10;
          }
          break;
        case 'Backspace':
        case 'Escape':
          e.preventDefault();
          navigate(`/playlist/${playlistId}`);
          break;
        case 'f':
        case 'F':
          e.preventDefault();
          if (containerRef.current) {
            if (document.fullscreenElement) {
              document.exitFullscreen();
            } else {
              containerRef.current.requestFullscreen();
            }
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, navigate, playlistId]);

  const handleVideoError = () => {
    if (!videoError) {
      setVideoError('Failed to load video. The stream may be unavailable or blocked.');
    }
  };

  return (
    <div ref={containerRef} className="relative w-full h-screen bg-black flex items-center justify-center">
      {videoError || !channelInfo?.url ? (
        <div className="text-center max-w-2xl px-8">
          <p className="text-3xl mb-4">
            {channelInfo ? channelInfo.name : 'Loading...'}
          </p>

          {videoError && (
            <>
              <div className="bg-red-900/30 border border-red-500 rounded-lg p-6 mb-6">
                <p className="text-xl text-red-300 mb-4">{videoError}</p>

                {isMixedContent && (
                  <div className="text-left text-gray-300">
                    <p className="font-semibold mb-2">Why is this happening?</p>
                    <p className="mb-4 text-sm">
                      This site is served over HTTPS (secure), but this channel streams over HTTP (insecure).
                      Browsers block mixed HTTP/HTTPS content for security.
                    </p>

                    <p className="font-semibold mb-2">How to fix:</p>
                    <ul className="list-disc list-inside text-sm space-y-1 mb-4">
                      <li>Access this site via HTTP instead: <code className="bg-gray-800 px-1 rounded">http://</code> (less secure)</li>
                      <li>Allow insecure content in your browser settings for this site</li>
                      <li>Try a different channel (some use HTTPS)</li>
                    </ul>

                    <p className="text-xs text-gray-500">
                      Note: Many free IPTV channels use HTTP. This is a browser security limitation.
                    </p>
                  </div>
                )}

                {!isMixedContent && (
                  <p className="text-sm text-gray-400">
                    The stream may be offline, geo-blocked, or require authentication.
                  </p>
                )}
              </div>

              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => navigate(`/playlist/${playlistId}`)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg text-xl"
                >
                  ← Back to Channels
                </button>
                <button
                  onClick={() => navigate('/')}
                  className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg text-xl"
                >
                  🏠 Home
                </button>
              </div>
            </>
          )}

          {!videoError && !channelInfo?.url && (
            <p className="text-gray-400">
              {channelInfo && !channelInfo.url ? 'No video URL available for this channel' : 'Please wait...'}
            </p>
          )}
        </div>
      ) : (
        <video
          ref={videoRef}
          src={channelInfo.url}
          className="w-full h-full object-contain"
          autoPlay
          playsInline
          onMouseMove={showControlsTemporarily}
          onClick={togglePlayPause}
          onError={handleVideoError}
        />
      )}

      {/* Controls Overlay - only show when video is playing */}
      {!videoError && channelInfo?.url && (
        <>
          <div
            className={`absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/50 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'
              }`}
          >
            {/* Top Bar */}
            <div className="absolute top-0 left-0 right-0 p-8">
              <div className="flex justify-between items-center">
                <button
                  onClick={() => navigate(`/playlist/${playlistId}`)}
                  className="text-white hover:text-blue-400 text-2xl flex items-center gap-2"
                >
                  ← Back
                </button>
                <button
                  onClick={() => navigate('/')}
                  className="text-gray-300 hover:text-white text-2xl flex items-center gap-2"
                >
                  🏠 Home
                </button>
              </div>
            </div>

            {/* Center Play/Pause */}
            <div className="absolute inset-0 flex items-center justify-center">
              <button
                onClick={togglePlayPause}
                className="text-white text-8xl opacity-80 hover:opacity-100 transition-opacity"
              >
                {isPlaying ? '⏸' : '▶'}
              </button>
            </div>

            {/* Bottom Bar */}
            <div className="absolute bottom-0 left-0 right-0 p-8">
              <div className="max-w-6xl mx-auto">
                <h2 className="text-4xl font-bold mb-4">{channelInfo?.name || 'Loading...'}</h2>
                <div className="flex items-center gap-4 text-xl text-gray-300">
                  <span>Volume: {Math.round(volume * 100)}%</span>
                  <span>•</span>
                  <span>{isPlaying ? 'Playing' : 'Paused'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Help text */}
          {showControls && (
            <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 text-center text-gray-400 text-lg">
              <p>Space: Play/Pause • ↑↓: Volume • ←→: Seek • F: Fullscreen • Backspace: Back</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default VideoPlayer;
