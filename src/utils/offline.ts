import { Location } from '@/types';

const CACHE_KEY_LOCATIONS = 'travel-beacon:locations';
const CACHE_KEY_FAVORITES = 'travel-beacon:favorites';
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

interface CachedData<T> {
  data: T;
  timestamp: number;
}

/**
 * Helper functions for handling offline functionality and data caching
 */
export const OfflineHelper = {
  /**
   * Check if the application is online
   */
  isOnline(): boolean {
    return navigator.onLine;
  },

  /**
   * Save locations to local storage
   */
  cacheLocations(locations: Location[]): void {
    const data: CachedData<Location[]> = {
      data: locations,
      timestamp: Date.now()
    };
    localStorage.setItem(CACHE_KEY_LOCATIONS, JSON.stringify(data));
  },

  /**
   * Save favorite locations to local storage
   */
  cacheFavorites(favorites: Location[]): void {
    const data: CachedData<Location[]> = {
      data: favorites,
      timestamp: Date.now()
    };
    localStorage.setItem(CACHE_KEY_FAVORITES, JSON.stringify(data));
  },

  /**
   * Get cached locations if they exist and haven't expired
   */
  getCachedLocations(): Location[] | null {
    const cached = localStorage.getItem(CACHE_KEY_LOCATIONS);
    if (!cached) return null;

    try {
      const data: CachedData<Location[]> = JSON.parse(cached);
      if (Date.now() - data.timestamp > CACHE_EXPIRY) {
        localStorage.removeItem(CACHE_KEY_LOCATIONS);
        return null;
      }
      return data.data;
    } catch (error) {
      console.error('Error parsing cached locations:', error);
      localStorage.removeItem(CACHE_KEY_LOCATIONS);
      return null;
    }
  },

  /**
   * Get cached favorites if they exist and haven't expired
   */
  getCachedFavorites(): Location[] | null {
    const cached = localStorage.getItem(CACHE_KEY_FAVORITES);
    if (!cached) return null;

    try {
      const data: CachedData<Location[]> = JSON.parse(cached);
      if (Date.now() - data.timestamp > CACHE_EXPIRY) {
        localStorage.removeItem(CACHE_KEY_FAVORITES);
        return null;
      }
      return data.data;
    } catch (error) {
      console.error('Error parsing cached favorites:', error);
      localStorage.removeItem(CACHE_KEY_FAVORITES);
      return null;
    }
  },

  /**
   * Clear all cached data
   */
  clearCache(): void {
    localStorage.removeItem(CACHE_KEY_LOCATIONS);
    localStorage.removeItem(CACHE_KEY_FAVORITES);
  },

  /**
   * Initialize offline mode listeners
   * @param onOffline - Callback when going offline
   * @param onOnline - Callback when coming back online
   */
  initOfflineListeners(onOffline: () => void, onOnline: () => void): () => void {
    window.addEventListener('offline', onOffline);
    window.addEventListener('online', onOnline);

    return () => {
      window.removeEventListener('offline', onOffline);
      window.removeEventListener('online', onOnline);
    };
  }
};
