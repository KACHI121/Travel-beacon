import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Location, Booking } from '../types';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { toast } from '@/components/ui/use-toast';
import { LocationService } from '@/services/LocationService';
import { FavoritesService } from '@/services/FavoritesService';
import { OfflineHelper } from '@/utils/offline';
import debounce from 'lodash/debounce';

interface LocationContextType {
  locations: Location[];
  favorites: Location[];
  bookings: Booking[];
  toggleFavorite: (locationId: number) => Promise<void>;
  addBooking: (booking: Omit<Booking, 'id'>) => void;
  cancelBooking: (bookingId: number) => void;
  isLoading: boolean;
  isFavoriteLoading: boolean;
  isOutsideZambia: boolean;
  isOffline: boolean;
  isRefreshing: boolean;
}

const LocationContext = createContext<LocationContextType | null>(null);

export const useLocations = () => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocations must be used within a LocationProvider');
  }
  return context;
};

const fetchLocationsFromDatabase = async () => {
  const { data, error } = await supabase.from('locations').select('*');
  if (error) {
    console.error('Error fetching locations:', error);
    return [];
  }
  return data;
};

export const LocationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [locations, setLocations] = useState<Location[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [favorites, setFavorites] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFavoriteLoading, setIsFavoriteLoading] = useState(false);
  const [isOutsideZambia, setIsOutsideZambia] = useState(false);
  const [isOffline, setIsOffline] = useState(!OfflineHelper.isOnline());
  const [isRefreshing, setIsRefreshing] = useState(false);

  const locationService = useMemo(() => LocationService.getInstance(), []);
  const favoritesService = useMemo(() => FavoritesService.getInstance(), []);

  // Offline mode handlers
  const handleOffline = useCallback(() => {
    setIsOffline(true);
    const cachedLocations = OfflineHelper.getCachedLocations();
    if (cachedLocations) {
      setLocations(cachedLocations);
    }

    const cachedFavorites = OfflineHelper.getCachedFavorites();
    if (cachedFavorites) {
      setFavorites(cachedFavorites);
    }

    toast({
      title: "You're Offline",
      description: "Using cached data. Some features may be limited.",
      variant: "default"
    });
  }, []);

  const handleOnline = useCallback(async () => {
    setIsOffline(false);
    setIsRefreshing(true);
    toast({
      title: "Back Online",
      description: "Syncing your data...",
      variant: "default"
    });

    try {
      const fetchedLocations = await fetchLocationsFromDatabase();
      const coordinates = await locationService.getCurrentPosition();
      const locationsWithDistance = locationService.addDistanceToLocations(
        fetchedLocations,
        coordinates
      );
      setLocations(locationsWithDistance);

      if (user) {
        const favoriteIds = await favoritesService.getFavorites(user.id);
        setFavorites(locationsWithDistance.filter(loc => favoriteIds.includes(loc.id)));
      }
    } catch (error) {
      console.error('Error syncing data:', error);
      toast({
        title: "Sync Error",
        description: "Failed to sync data. Please try again later.",
        variant: "destructive"
      });
    } finally {
      setIsRefreshing(false);
    }
  }, [locationService, favoritesService, user]);

  // Set up offline mode listeners
  useEffect(() => {
    const cleanup = OfflineHelper.initOfflineListeners(handleOffline, handleOnline);
    return cleanup;
  }, [handleOffline, handleOnline]);

  // Cache data when it changes
  useEffect(() => {
    if (locations.length > 0) {
      OfflineHelper.cacheLocations(locations);
    }
  }, [locations]);

  useEffect(() => {
    if (favorites.length > 0) {
      OfflineHelper.cacheFavorites(favorites);
    }
  }, [favorites]);

  // Debounced function for updating user location
  const updateUserLocation = useCallback(
    debounce(async () => {
      try {
        const coordinates = await locationService.getCurrentPosition();
        const updatedLocations = locationService.addDistanceToLocations(
          locations,
          coordinates
        );
        setLocations(updatedLocations);
        setIsOutsideZambia(!locationService.isWithinZambia(coordinates));
      } catch (error) {
        console.error('Error updating location:', error);
        toast({
          title: "Location Error",
          description: "Failed to update your location. Using last known position.",
          variant: "destructive"
        });
      }
    }, 1000),
    [locations]
  );

  // Initialize data and set up subscriptions
  useEffect(() => {
    const initializeData = async () => {
      try {
        setIsLoading(true);
        // Load cached locations immediately if available
        const cachedLocations = OfflineHelper.getCachedLocations();
        if (cachedLocations) {
          setLocations(cachedLocations);
        }

        // Then fetch fresh data
        const [fetchedLocations, coordinates] = await Promise.all([
          fetchLocationsFromDatabase(),
          locationService.getCurrentPosition()
        ]);
        
        const locationsWithDistance = locationService.addDistanceToLocations(
          fetchedLocations,
          coordinates
        );
        
        setLocations(locationsWithDistance);
        setIsOutsideZambia(!locationService.isWithinZambia(coordinates));

        // Watch for location changes
        if (navigator.geolocation) {
          navigator.geolocation.watchPosition(
            () => updateUserLocation(),
            (error) => console.warn('Location watch error:', error),
            { enableHighAccuracy: true }
          );
        }
      } catch (error) {
        console.error('Error initializing data:', error);
        toast({
          title: "Error",
          description: "Failed to load locations. Please try again later.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    initializeData();

    // Cleanup function
    return () => {
      updateUserLocation.cancel();
    };
  }, [locationService, updateUserLocation]);

  // Set up favorites subscription when user changes
  useEffect(() => {
    const setupFavorites = async () => {
      if (!user) {
        setFavorites([]);
        return;
      }

      try {
        // Get initial favorites
        const favoriteIds = await favoritesService.getFavorites(user.id);
        setFavorites(locations.filter(loc => favoriteIds.includes(loc.id)));

        // Subscribe to favorite changes
        await favoritesService.subscribeToFavorites(user.id, (locationId, isFavorite) => {
          setLocations(prevLocations =>
            prevLocations.map(location =>
              location.id === locationId
                ? { ...location, isFavorite }
                : location
            )
          );
        });
      } catch (error) {
        console.error('Error setting up favorites:', error);
      }
    };

    setupFavorites();

    // Cleanup subscription
    return () => {
      favoritesService.unsubscribe();
    };
  }, [user, favoritesService, locations]);

  const toggleFavorite = async (locationId: number) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to save favorites",
        variant: "default"
      });
      return;
    }

    setIsFavoriteLoading(true);
    try {
      const newIsFavorite = await favoritesService.toggleFavorite(user.id, locationId);
      
      setLocations(prevLocations =>
        prevLocations.map(location =>
          location.id === locationId
            ? { ...location, isFavorite: newIsFavorite }
            : location
        )
      );

      toast({
        title: newIsFavorite ? "Added to Favorites" : "Removed from Favorites",
        description: `Location has been ${newIsFavorite ? 'added to' : 'removed from'} your favorites.`,
        variant: "default"
      });
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast({
        title: "Error",
        description: "Failed to update favorite. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsFavoriteLoading(false);
    }
  };

  const addBooking = (booking: Omit<Booking, 'id'>) => {
    const newBooking = {
      ...booking,
      id: bookings.length > 0 ? Math.max(...bookings.map(b => b.id)) + 1 : 1
    };
    setBookings([...bookings, newBooking]);
  };

  const cancelBooking = (bookingId: number) => {
    setBookings(prev => prev.filter(booking => booking.id !== bookingId));
  };

  const value = {
    locations,
    favorites,
    bookings,
    toggleFavorite,
    addBooking,
    cancelBooking,
    isLoading,
    isFavoriteLoading,
    isOutsideZambia,
    isOffline,
    isRefreshing
  };

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
};
