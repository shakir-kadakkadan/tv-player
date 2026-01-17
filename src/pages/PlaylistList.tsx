import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Playlist } from '../types';
import { getFavorites } from '../utils/favorites';

const PlaylistList = () => {
  const navigate = useNavigate();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [hasFavorites, setHasFavorites] = useState(false);

  // Check for favorites on mount
  useEffect(() => {
    setHasFavorites(getFavorites().length > 0);
  }, []);

  // Base playlists
  const basePlaylists: Playlist[] = [
    {
      id: 'malayalam',
      name: 'Malayalam Channels',
      url: 'https://iptv-org.github.io/iptv/languages/mal.m3u',
      thumbnail: '🇮🇳',
    },
    {
      id: 'all',
      name: 'All IPTV Channels',
      url: 'https://iptv-org.github.io/iptv/index.m3u',
      thumbnail: '📺',
    },
    {
      id: 'sports',
      name: 'Sports Channels',
      url: 'https://iptv-org.github.io/iptv/categories/sports.m3u',
      thumbnail: '⚽',
    },
    {
      id: 'movies',
      name: 'Movies Channels',
      url: 'https://iptv-org.github.io/iptv/categories/movies.m3u',
      thumbnail: '🎬',
    },
    {
      id: 'tamil',
      name: 'Tamil Channels',
      url: 'https://iptv-org.github.io/iptv/languages/tam.m3u',
      thumbnail: '🇮🇳',
    },
    {
      id: 'hindi',
      name: 'Hindi Channels',
      url: 'https://iptv-org.github.io/iptv/languages/hin.m3u',
      thumbnail: '🇮🇳',
    },
    {
      id: 'kids',
      name: 'Kids Channels',
      url: 'https://iptv-org.github.io/iptv/categories/kids.m3u',
      thumbnail: '👶',
    },
    {
      id: 'english',
      name: 'English Channels',
      url: 'https://iptv-org.github.io/iptv/languages/eng.m3u',
      thumbnail: '🌍',
    },
    {
      id: 'india',
      name: 'India Channels',
      url: 'https://iptv-org.github.io/iptv/countries/in.m3u',
      thumbnail: '🇮🇳',
    },
  ];

  // Add favorites at the beginning if they exist
  const playlists: Playlist[] = hasFavorites
    ? [{ id: 'favorites', name: 'My Favorites', url: '', thumbnail: '⭐' }, ...basePlaylists]
    : basePlaylists;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isPlaylistItem = target.classList.contains('playlist-item');

      switch (e.key) {
        case 'Enter':
          if (isPlaylistItem) {
            e.preventDefault();
            const index = parseInt(target.getAttribute('data-index') || '0');
            navigate(`/playlist/${playlists[index].id}`);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate, playlists]);

  // Auto-focus first item on load
  useEffect(() => {
    if (playlists.length > 0 && itemRefs.current[0]) {
      const timer = setTimeout(() => {
        itemRefs.current[0]?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [playlists]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 p-16">
      <div className="max-w-7xl mx-auto px-8">
        <h1 className="text-8xl font-bold text-center mb-16 text-blue-400">
          TV Player
        </h1>
        <p className="text-center text-gray-300 mb-16 text-4xl">
          Select a Playlist
        </p>

        <div className="grid grid-cols-1 gap-10 max-w-5xl mx-auto px-6">
          {playlists.map((playlist, index) => (
            <div
              key={playlist.id}
              ref={(el) => { itemRefs.current[index] = el; }}
              tabIndex={0}
              data-index={index}
              className={`
                playlist-item p-12 rounded-2xl cursor-pointer transition-all border-4 outline-none
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
                navigate(`/playlist/${playlist.id}`);
              }}
            >
              <div className="flex items-center gap-12">
                <div className="text-9xl flex-shrink-0">{playlist.thumbnail}</div>
                <div className="flex-1">
                  <h2 className="text-5xl font-bold">{playlist.name}</h2>
                  <p className="text-gray-200 mt-5 text-2xl">
                    Click or press Enter to open
                  </p>
                </div>
                <div className="text-7xl text-gray-300 flex-shrink-0 ml-4">▶</div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-20 text-center text-gray-400 text-3xl px-8">
          <p>Click or press Enter to select • Use arrows to navigate</p>
        </div>
      </div>
    </div>
  );
};

export default PlaylistList;
