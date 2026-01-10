import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Channel } from '../types';
import { parseM3U } from '../utils/m3uParser';
import { isMalayalamChannel } from '../utils/malayalamChannels';

const Channels = () => {
  const navigate = useNavigate();
  const { playlistId } = useParams();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [httpsOnly, setHttpsOnly] = useState(false);
  const [allChannels, setAllChannels] = useState<Channel[]>([]);

  // Playlist URLs
  const playlistUrls: Record<string, string> = {
    'malayalam': 'https://iptv-org.github.io/iptv/index.m3u',
    'all': 'https://iptv-org.github.io/iptv/index.m3u',
  };

  useEffect(() => {
    const loadChannels = async () => {
      setLoading(true);
      setError(null);

      const url = playlistUrls[playlistId || '1'];
      if (!url) {
        setError('Playlist not found');
        setLoading(false);
        return;
      }

      try {
        let parsedChannels = await parseM3U(url);

        // Filter Malayalam channels if the playlist is Malayalam
        if (playlistId === 'malayalam') {
          parsedChannels = parsedChannels.filter(channel =>
            isMalayalamChannel(channel.name)
          );
        }

        if (parsedChannels.length === 0) {
          setError('No channels found in playlist');
        } else {
          setAllChannels(parsedChannels);
          setChannels(parsedChannels);
          // Store channels in localStorage for VideoPlayer
          localStorage.setItem('channels', JSON.stringify(parsedChannels));
        }
      } catch (err) {
        setError('Failed to load playlist');
        console.error('Error loading playlist:', err);
      } finally {
        setLoading(false);
      }
    };

    loadChannels();
  }, [playlistId]);

  // Filter channels when httpsOnly changes
  useEffect(() => {
    if (allChannels.length > 0) {
      if (httpsOnly) {
        const filtered = allChannels.filter(channel =>
          channel.url.toLowerCase().startsWith('https://')
        );
        setChannels(filtered);
      } else {
        setChannels(allChannels);
      }
    }
  }, [httpsOnly, allChannels]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle if the active element is not an interactive element
      const target = e.target as HTMLElement;
      const isChannelItem = target.classList.contains('channel-item');

      switch (e.key) {
        case 'Enter':
          if (isChannelItem) {
            e.preventDefault();
            const index = parseInt(target.getAttribute('data-index') || '0');
            navigate(`/player/${playlistId}/${channels[index].id}`);
          }
          break;
        case 'Backspace':
        case 'Escape':
          e.preventDefault();
          navigate('/');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate, channels, playlistId]);

  // Auto-focus first item on load
  useEffect(() => {
    if (channels.length > 0 && itemRefs.current[0]) {
      const timer = setTimeout(() => {
        itemRefs.current[0]?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [channels]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 p-16">
      <div className="max-w-7xl mx-auto px-8">
        <div className="mb-16 flex justify-between items-center">
          <button
            onClick={() => navigate('/')}
            className="text-blue-400 hover:text-blue-300 text-3xl flex items-center gap-4 px-8 py-6"
          >
            ← Back to Playlists
          </button>
          <button
            onClick={() => navigate('/')}
            className="text-gray-400 hover:text-white text-3xl flex items-center gap-3 px-8 py-6"
          >
            🏠 Home
          </button>
        </div>

        <h1 className="text-7xl font-bold text-center mb-16 text-blue-400">
          Select Channel
        </h1>

        {/* HTTPS Only Filter */}
        {!loading && !error && allChannels.length > 0 && window.location.protocol === 'https:' && (
          <div className="flex justify-center mb-16">
            <button
              onClick={() => setHttpsOnly(!httpsOnly)}
              className={`px-10 py-5 rounded-2xl text-2xl font-semibold transition-all ${
                httpsOnly
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
              }`}
            >
              {httpsOnly ? '✓ ' : ''}HTTPS Only
              {httpsOnly && (
                <span className="ml-3 text-xl">
                  ({channels.length} of {allChannels.length})
                </span>
              )}
            </button>
          </div>
        )}

        {loading && (
          <div className="text-center text-5xl text-gray-400 py-20">
            Loading channels...
          </div>
        )}

        {error && (
          <div className="text-center text-5xl text-red-400 py-20">
            {error}
          </div>
        )}

        {!loading && !error && channels.length === 0 && (
          <div className="text-center text-5xl text-gray-400 py-20">
            No channels found
          </div>
        )}

        {!loading && !error && channels.length > 0 && (
          <div className="grid grid-cols-1 gap-10 max-w-5xl mx-auto px-6">
          {channels.map((channel, index) => (
            <div
              key={channel.id}
              ref={(el) => { itemRefs.current[index] = el; }}
              tabIndex={0}
              data-index={index}
              className={`
                channel-item p-12 rounded-2xl cursor-pointer transition-all border-4 outline-none
                ${
                  selectedIndex === index
                    ? 'bg-blue-600 scale-105 shadow-2xl shadow-blue-500/50 border-blue-400'
                    : 'bg-gray-800 hover:bg-gray-700 border-transparent focus:bg-blue-600 focus:scale-105 focus:shadow-2xl focus:shadow-blue-500/50 focus:border-blue-400'
                }
              `}
              onFocus={() => setSelectedIndex(index)}
              onMouseEnter={() => setSelectedIndex(index)}
              onClick={() => {
                setSelectedIndex(index);
                navigate(`/player/${playlistId}/${channel.id}`);
              }}
            >
              <div className="flex items-center gap-12">
                <div className="w-32 h-32 flex items-center justify-center flex-shrink-0">
                  {channel.logo && channel.logo.startsWith('http') ? (
                    <img src={channel.logo} alt={channel.name} className="w-32 h-32 object-contain" />
                  ) : (
                    <div className="text-8xl">{channel.logo || '📺'}</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-5xl font-bold truncate">{channel.name}</h2>
                  {channel.group && (
                    <p className="text-gray-300 mt-4 text-3xl">{channel.group}</p>
                  )}
                  <p className="text-gray-200 mt-5 text-2xl">
                    Press Enter to play
                  </p>
                </div>
                <div className="text-7xl text-gray-300 flex-shrink-0 ml-4">▶</div>
              </div>
            </div>
          ))}
        </div>
        )}

        {!loading && !error && channels.length > 0 && (
          <div className="mt-20 text-center text-gray-400 text-3xl px-8">
            <p>Click or press Enter to play • Use arrows to navigate • Backspace to go back</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Channels;
