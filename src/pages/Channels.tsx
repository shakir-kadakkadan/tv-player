import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Channel } from '../types';
import { parseM3U } from '../utils/m3uParser';
import { getFavorites, toggleFavorite } from '../utils/favorites';
import { trackIPData } from '../utils/firebase';

const Channels = () => {
  const navigate = useNavigate();
  const { playlistId } = useParams();
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [allChannels, setAllChannels] = useState<Channel[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [showHeader, setShowHeader] = useState(true);
  const lastScrollY = useRef(0);

  // Check navigation direction and restore state only when coming back
  const getInitialState = () => {
    const navigationDirection = sessionStorage.getItem(`navigation-direction-${playlistId}`);
    const isComingBack = navigationDirection !== 'forward';

    if (isComingBack) {
      const stored = sessionStorage.getItem(`channels-state-${playlistId}`);
      if (stored) {
        try {
          const data = JSON.parse(stored);
          return {
            selectedIndex: data.selectedIndex || 0,
            searchQuery: data.searchQuery || '',
            httpsOnly: data.httpsOnly || false,
            scrollTop: data.scrollTop || 0
          };
        } catch {
          // If parsing fails, return defaults
        }
      }
    } else {
      // Clear state when navigating forward
      sessionStorage.removeItem(`channels-state-${playlistId}`);
    }

    // Clear the navigation direction marker after reading
    sessionStorage.removeItem(`navigation-direction-${playlistId}`);

    return {
      selectedIndex: 0,
      searchQuery: '',
      httpsOnly: false,
      scrollTop: 0
    };
  };

  const initialState = getInitialState();
  const [selectedIndex, setSelectedIndex] = useState(initialState.selectedIndex);
  const [searchQuery, setSearchQuery] = useState(initialState.searchQuery);
  const [httpsOnly, setHttpsOnly] = useState(initialState.httpsOnly);
  const storedScrollTop = useRef(initialState.scrollTop);

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
    // Track page view
    trackIPData('channels_page_load');
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

      // Handle most-watched playlist
      if (playlistId === 'most-watched') {
        try {
          const { database } = await import('../utils/firebase');
          const { ref, get } = await import('firebase/database');

          const channelViewsRef = ref(database, '/channel_views');
          const snapshot = await get(channelViewsRef);
          const viewsData = snapshot.val();

          if (!viewsData) {
            setError('No views tracked yet');
            setLoading(false);
            return;
          }

          // Convert to array and sort by view count
          const channelsWithViews: Channel[] = Object.values(viewsData)
            .sort((a: any, b: any) => (b.viewCount || 0) - (a.viewCount || 0))
            .map((item: any) => ({
              id: item.id,
              name: item.name,
              url: item.url,
              logo: item.logo || '📺',
              group: item.group || 'Most Watched',
            }));

          setAllChannels(channelsWithViews);
          setChannels(channelsWithViews);
          localStorage.setItem('channels', JSON.stringify(channelsWithViews));
          setLoading(false);
          return;
        } catch (err) {
          setError('Failed to load most watched channels');
          console.error('Error loading most watched:', err);
          setLoading(false);
          return;
        }
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
            // Mark this as forward navigation
            sessionStorage.setItem(`navigation-direction-${playlistId}`, 'forward');
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

  // Save all state before navigating away
  useEffect(() => {
    const saveState = () => {
      sessionStorage.setItem(`channels-state-${playlistId}`, JSON.stringify({
        selectedIndex,
        scrollTop: containerRef.current?.scrollTop || 0,
        searchQuery,
        httpsOnly
      }));
    };

    window.addEventListener('beforeunload', saveState);
    return () => {
      saveState();
      window.removeEventListener('beforeunload', saveState);
    };
  }, [selectedIndex, playlistId, searchQuery, httpsOnly]);

  // Restore scroll position and focus on stored item (only on initial load)
  useEffect(() => {
    if (channels.length > 0 && initialState.scrollTop > 0) {
      const timer = setTimeout(() => {
        // Restore scroll position on container
        if (containerRef.current) {
          containerRef.current.scrollTop = storedScrollTop.current;
        }
        // Focus on the stored item
        const targetIndex = Math.min(initialState.selectedIndex, channels.length - 1);
        itemRefs.current[targetIndex]?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [channels.length]);

  // Handle scroll to show/hide header
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const currentScrollY = container.scrollTop;

      // Show header when scrolling up, hide when scrolling down
      if (currentScrollY < lastScrollY.current) {
        setShowHeader(true);
      } else if (currentScrollY > lastScrollY.current && currentScrollY > 50) {
        setShowHeader(false);
      }

      lastScrollY.current = currentScrollY;
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div ref={containerRef} className="desktop-layout min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 p-2 md:p-8 overflow-y-auto">
      <div className="max-w-7xl mx-auto px-1 md:px-4">
        {/* Sticky Header Section */}
        <div
          className={`sticky top-0 z-10 bg-gradient-to-br from-gray-900 via-black to-gray-900 pb-6 transition-transform duration-300 ${showHeader ? 'translate-y-0' : '-translate-y-full'
            }`}
        >
          <div className="mb-8 flex justify-between items-center">
            <button
              onClick={() => navigate('/')}
              className="text-blue-400 hover:text-blue-300 text-xl flex items-center gap-2 px-4 py-3"
            >
              ← Back to Playlists
            </button>
            <button
              onClick={() => navigate('/')}
              className="text-gray-400 hover:text-white text-xl flex items-center gap-2 px-4 py-3"
            >
              🏠 Home
            </button>
          </div>

          <h1 className="text-4xl font-bold text-center mb-6 text-blue-400">
            Select Channel
          </h1>

          {/* Search and Filter Row */}
          {!loading && !error && allChannels.length > 0 && (
            <div className="max-w-4xl mx-auto mb-6 flex flex-col sm:flex-row gap-3 items-center">
              <div className="relative flex-1 w-full">
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search channels..."
                  className="w-full px-4 py-2 text-lg bg-gray-800 border-2 border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-2xl"
                  >
                    ×
                  </button>
                )}
              </div>
              {window.location.protocol === 'https:' && (
                <button
                  onClick={() => setHttpsOnly(!httpsOnly)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${httpsOnly
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
            <p className="text-center text-gray-400 mb-4 text-sm">
              {channels.length} of {allChannels.length} channel{allChannels.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>

        {loading && (
          <div className="text-center text-2xl text-gray-400 py-10">
            Loading channels...
          </div>
        )}

        {error && (
          <div className="text-center text-2xl text-red-400 py-10">
            {error}
          </div>
        )}

        {!loading && !error && channels.length === 0 && (
          <div className="text-center text-2xl text-gray-400 py-10">
            No channels found
          </div>
        )}

        {!loading && !error && channels.length > 0 && (
          <div className="grid grid-cols-1 gap-3 max-w-5xl mx-auto px-1 md:px-4">
            {channels.map((channel, index) => (
              <div
                key={channel.id}
                ref={(el) => { itemRefs.current[index] = el; }}
                tabIndex={0}
                data-index={index}
                className={`
                channel-item p-4 rounded-xl cursor-pointer transition-all border-2 outline-none
                ${!searchQuery && selectedIndex === index
                    ? 'bg-blue-600 scale-[1.01] shadow-lg shadow-blue-500/50 border-blue-400'
                    : 'bg-gray-800 hover:bg-gray-700 border-transparent'
                  }
              `}
                onFocus={() => !searchQuery && setSelectedIndex(index)}
                onMouseEnter={() => !searchQuery && setSelectedIndex(index)}
                onClick={() => {
                  setSelectedIndex(index);
                  // Mark this as forward navigation
                  sessionStorage.setItem(`navigation-direction-${playlistId}`, 'forward');
                  navigate(`/player/${playlistId}/${channel.id}`);
                }}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 flex items-center justify-center flex-shrink-0">
                    {channel.logo && channel.logo.startsWith('http') ? (
                      <img src={channel.logo} alt={channel.name} className="w-12 h-12 object-contain" />
                    ) : (
                      <div className="text-3xl">{channel.logo || '📺'}</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-xl font-bold truncate">{channel.name}</h2>
                    {channel.group && (
                      <p className="text-gray-300 mt-1 text-sm">{channel.group}</p>
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
                    className={`text-2xl flex-shrink-0 transition-all duration-300 transform hover:scale-125 active:scale-95 ${favoriteIds.has(channel.id)
                      ? 'text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]'
                      : 'text-gray-500 hover:text-yellow-300'
                      }`}
                    aria-label={favoriteIds.has(channel.id) ? 'Remove from favorites' : 'Add to favorites'}
                  >
                    {favoriteIds.has(channel.id) ? '★' : '☆'}
                  </button>
                  <div className="text-2xl text-gray-300 flex-shrink-0 ml-1">▶</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && !error && channels.length > 0 && (
          <div className="mt-8 text-center text-gray-400 text-sm px-4">
            <p>Click or press Enter to play • Use arrows to navigate • Backspace to go back</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Channels;
