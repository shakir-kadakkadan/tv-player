import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Channel } from '../types';
import { parseM3U } from '../utils/m3uParser';
import { getFavorites, toggleFavorite } from '../utils/favorites';

const Channels = () => {
  const navigate = useNavigate();
  const { playlistId } = useParams();
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [httpsOnly, setHttpsOnly] = useState(false);
  const [allChannels, setAllChannels] = useState<Channel[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());

  // Restore selected index from sessionStorage
  const getStoredIndex = () => {
    const stored = sessionStorage.getItem(`channels-scroll-${playlistId}`);
    if (stored) {
      const data = JSON.parse(stored);
      return data.selectedIndex || 0;
    }
    return 0;
  };
  const [selectedIndex, setSelectedIndex] = useState(getStoredIndex);

  // Playlist URLs
  const playlistUrls: Record<string, string> = {
    'malayalam': 'https://iptv-org.github.io/iptv/languages/mal.m3u',
    'all': 'https://iptv-org.github.io/iptv/index.m3u',
    'sports': 'https://iptv-org.github.io/iptv/categories/sports.m3u',
    'movies': 'https://iptv-org.github.io/iptv/categories/movies.m3u',
    'tamil': 'https://iptv-org.github.io/iptv/languages/tam.m3u',
    'hindi': 'https://iptv-org.github.io/iptv/languages/hin.m3u',
    'kids': 'https://iptv-org.github.io/iptv/categories/kids.m3u',
    'english': 'https://iptv-org.github.io/iptv/languages/eng.m3u',
    'india': 'https://iptv-org.github.io/iptv/countries/in.m3u',
  };

  // Load favorites into state
  useEffect(() => {
    const favs = getFavorites();
    setFavoriteIds(new Set(favs.map(ch => ch.id)));
  }, []);

  useEffect(() => {
    const loadChannels = async () => {
      setLoading(true);
      setError(null);

      // Handle favorites playlist
      if (playlistId === 'favorites') {
        const favs = getFavorites();
        if (favs.length === 0) {
          setError('No favorites yet');
        } else {
          setAllChannels(favs);
          setChannels(favs);
          localStorage.setItem('channels', JSON.stringify(favs));
        }
        setLoading(false);
        return;
      }

      const url = playlistUrls[playlistId || '1'];
      if (!url) {
        setError('Playlist not found');
        setLoading(false);
        return;
      }

      try {
        const parsedChannels = await parseM3U(url);

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

  // Save scroll state before navigating away
  useEffect(() => {
    const saveScrollState = () => {
      sessionStorage.setItem(`channels-scroll-${playlistId}`, JSON.stringify({
        selectedIndex,
        scrollTop: window.scrollY
      }));
    };

    window.addEventListener('beforeunload', saveScrollState);
    return () => {
      saveScrollState();
      window.removeEventListener('beforeunload', saveScrollState);
    };
  }, [selectedIndex, playlistId]);

  // Restore scroll position and focus on stored item
  useEffect(() => {
    if (channels.length > 0) {
      const stored = sessionStorage.getItem(`channels-scroll-${playlistId}`);
      const storedIndex = stored ? JSON.parse(stored).selectedIndex || 0 : 0;
      const storedScroll = stored ? JSON.parse(stored).scrollTop || 0 : 0;

      const timer = setTimeout(() => {
        // Restore scroll position
        window.scrollTo(0, storedScroll);
        // Focus on the stored item
        const targetIndex = Math.min(storedIndex, channels.length - 1);
        itemRefs.current[targetIndex]?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [channels, playlistId]);

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
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const isNowFavorite = toggleFavorite(channel);
                    setFavoriteIds(prev => {
                      const newSet = new Set(prev);
                      if (isNowFavorite) {
                        newSet.add(channel.id);
                      } else {
                        newSet.delete(channel.id);
                        // If on favorites page, remove from list
                        if (playlistId === 'favorites') {
                          setChannels(ch => ch.filter(c => c.id !== channel.id));
                          setAllChannels(ch => ch.filter(c => c.id !== channel.id));
                        }
                      }
                      return newSet;
                    });
                  }}
                  className={`text-6xl flex-shrink-0 transition-all duration-300 transform hover:scale-125 active:scale-95 ${
                    favoriteIds.has(channel.id)
                      ? 'text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]'
                      : 'text-gray-500 hover:text-yellow-300'
                  }`}
                  aria-label={favoriteIds.has(channel.id) ? 'Remove from favorites' : 'Add to favorites'}
                >
                  {favoriteIds.has(channel.id) ? '★' : '☆'}
                </button>
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
