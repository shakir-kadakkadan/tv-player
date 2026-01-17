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
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

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

  // Filter channels when httpsOnly or searchQuery changes
  useEffect(() => {
    if (allChannels.length > 0) {
      let filtered = allChannels;

      if (httpsOnly) {
        filtered = filtered.filter(channel =>
          channel.url.toLowerCase().startsWith('https://')
        );
      }

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        // First: channels that start with query
        const startsWith = filtered.filter(channel =>
          channel.name.toLowerCase().startsWith(query)
        );
        // Second: channels that contain query (but don't start with it)
        const contains = filtered.filter(channel =>
          !channel.name.toLowerCase().startsWith(query) &&
          (channel.name.toLowerCase().includes(query) ||
           (channel.group && channel.group.toLowerCase().includes(query)))
        );
        // Combine: startsWith first, then contains
        filtered = [...startsWith, ...contains];
      }

      setChannels(filtered);
      setSelectedIndex(0);
    }
  }, [httpsOnly, allChannels, searchQuery]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isChannelItem = target.classList.contains('channel-item');
      const isSearchInput = target.tagName === 'INPUT';

      // Don't handle backspace/escape when in search input
      if (isSearchInput && (e.key === 'Backspace' || e.key === 'Escape')) {
        if (e.key === 'Escape') {
          setSearchQuery('');
          searchInputRef.current?.blur();
        }
        return;
      }

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

  // Restore scroll position and focus on stored item (only on initial load, not during search)
  useEffect(() => {
    if (channels.length > 0 && !searchQuery) {
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
  }, [channels.length, playlistId, searchQuery]);

  return (
    <div className="desktop-layout min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 p-16">
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

        <h1 className="text-7xl font-bold text-center mb-8 text-blue-400">
          Select Channel
        </h1>

        {/* Search and Filter Row */}
        {!loading && !error && allChannels.length > 0 && (
          <div className="max-w-4xl mx-auto mb-10 flex flex-col sm:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full">
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search channels..."
                className="w-full px-6 py-4 text-2xl bg-gray-800 border-2 border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-3xl"
                >
                  ×
                </button>
              )}
            </div>
            {window.location.protocol === 'https:' && (
              <button
                onClick={() => setHttpsOnly(!httpsOnly)}
                className={`px-6 py-4 rounded-xl text-xl font-semibold transition-all whitespace-nowrap ${
                  httpsOnly
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                }`}
              >
                {httpsOnly ? '✓ ' : ''}HTTPS Only
              </button>
            )}
          </div>
        )}

        {/* Results count */}
        {!loading && !error && allChannels.length > 0 && (searchQuery || httpsOnly) && (
          <p className="text-center text-gray-400 mb-8 text-xl">
            {channels.length} of {allChannels.length} channel{allChannels.length !== 1 ? 's' : ''}
          </p>
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
          <div className="grid grid-cols-1 gap-6 max-w-5xl mx-auto px-6">
          {channels.map((channel, index) => (
            <div
              key={channel.id}
              ref={(el) => { itemRefs.current[index] = el; }}
              tabIndex={0}
              data-index={index}
              className={`
                channel-item p-8 rounded-2xl cursor-pointer transition-all border-4 outline-none
                ${
                  !searchQuery && selectedIndex === index
                    ? 'bg-blue-600 scale-[1.02] shadow-xl shadow-blue-500/50 border-blue-400'
                    : 'bg-gray-800 hover:bg-gray-700 border-transparent'
                }
              `}
              onFocus={() => !searchQuery && setSelectedIndex(index)}
              onMouseEnter={() => !searchQuery && setSelectedIndex(index)}
              onClick={() => {
                setSelectedIndex(index);
                navigate(`/player/${playlistId}/${channel.id}`);
              }}
            >
              <div className="flex items-center gap-8">
                <div className="w-24 h-24 flex items-center justify-center flex-shrink-0">
                  {channel.logo && channel.logo.startsWith('http') ? (
                    <img src={channel.logo} alt={channel.name} className="w-24 h-24 object-contain" />
                  ) : (
                    <div className="text-6xl">{channel.logo || '📺'}</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-4xl font-bold truncate">{channel.name}</h2>
                  {channel.group && (
                    <p className="text-gray-300 mt-2 text-2xl">{channel.group}</p>
                  )}
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
                  className={`text-5xl flex-shrink-0 transition-all duration-300 transform hover:scale-125 active:scale-95 ${
                    favoriteIds.has(channel.id)
                      ? 'text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]'
                      : 'text-gray-500 hover:text-yellow-300'
                  }`}
                  aria-label={favoriteIds.has(channel.id) ? 'Remove from favorites' : 'Add to favorites'}
                >
                  {favoriteIds.has(channel.id) ? '★' : '☆'}
                </button>
                <div className="text-5xl text-gray-300 flex-shrink-0 ml-2">▶</div>
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
