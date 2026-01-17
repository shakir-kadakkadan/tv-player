import { Channel } from '../types';

const FAVORITES_KEY = 'tv-player-favorites';

export const getFavorites = (): Channel[] => {
  const stored = localStorage.getItem(FAVORITES_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return [];
    }
  }
  return [];
};

export const isFavorite = (channelId: string): boolean => {
  const favorites = getFavorites();
  return favorites.some(ch => ch.id === channelId);
};

export const addFavorite = (channel: Channel): void => {
  const favorites = getFavorites();
  if (!favorites.some(ch => ch.id === channel.id)) {
    favorites.push(channel);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  }
};

export const removeFavorite = (channelId: string): void => {
  const favorites = getFavorites();
  const filtered = favorites.filter(ch => ch.id !== channelId);
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(filtered));
};

export const toggleFavorite = (channel: Channel): boolean => {
  if (isFavorite(channel.id)) {
    removeFavorite(channel.id);
    return false;
  } else {
    addFavorite(channel);
    return true;
  }
};
