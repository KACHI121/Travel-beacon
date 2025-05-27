import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Location, Booking } from '../types';
import { LocationService } from '@/services/LocationService';
import { FavoritesService } from '@/services/FavoritesService';
import { OfflineHelper } from '@/utils/offline';
import debounce from 'lodash/debounce';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from './AuthContext';

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
    // Offline caching might need adjustment as data structure changes
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
      // Fetch fresh data from Overpass API
      const coordinates = await locationService.getCurrentPosition();
      const restaurants = await locationService.fetchNearbyPlacesFromOSM(coordinates, 'restaurant');
      const hotels = await locationService.fetchNearbyPlacesFromOSM(coordinates, 'hotel');
      const fastFood = await locationService.fetchNearbyPlacesFromOSM(coordinates, 'fast_food');

      const fetchedLocations = [...restaurants, ...hotels, ...fastFood];
      
      // Add distance is already handled in fetchNearbyPlacesFromOSM
      setLocations(fetchedLocations);

      if (user) {
        // Note: Favorites logic might need adjustment as it was tied to Supabase IDs.
        // OSM IDs are numbers, but might not directly correspond to Supabase IDs.
        // A new strategy for handling favorites with OSM data is needed.
        const favoriteIds = await favoritesService.getFavorites(user.id);
        setFavorites(fetchedLocations.filter(loc => favoriteIds.includes(loc.id)));
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
      // Offline caching might need adjustment as data structure changes
      OfflineHelper.cacheLocations(locations);
    }
  }, [locations]);

  useEffect(() => {
    if (favorites.length > 0) {
      // Offline caching might need adjustment as data structure changes
      OfflineHelper.cacheFavorites(favorites);
    }
  }, [favorites]);

  // Debounced function for updating user location
  const updateUserLocation = useCallback(
    debounce(async () => {
      try {
        const coordinates = await locationService.getCurrentPosition();
        
        // Fetch nearby places again when location updates
        const restaurants = await locationService.fetchNearbyPlacesFromOSM(coordinates, 'restaurant');
        const hotels = await locationService.fetchNearbyPlacesFromOSM(coordinates, 'hotel');
        const fastFood = await locationService.fetchNearbyPlacesFromOSM(coordinates, 'fast_food');

        const updatedLocations = [...restaurants, ...hotels, ...fastFood];

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
    [locationService]
  ); // Depend on locationService

  // Initialize data and set up subscriptions
  useEffect(() => {
    const initializeData = async () => {
      try {
        setIsLoading(true);
        // No longer loading cached locations from Supabase structure
        // const cachedLocations = OfflineHelper.getCachedLocations();
        // if (cachedLocations) {
        //   setLocations(cachedLocations);
        // }

        // Fetch initial data from Overpass API based on current position
        const coordinates = await locationService.getCurrentPosition();
        
        const restaurants = await locationService.fetchNearbyPlacesFromOSM(coordinates, 'restaurant');
        const hotels = await locationService.fetchNearbyPlacesFromOSM(coordinates, 'hotel');
        const fastFood = await locationService.fetchNearbyPlacesFromOSM(coordinates, 'fast_food');

        const fetchedLocations = [...restaurants, ...hotels, ...fastFood];
        
        // Distance is calculated within fetchNearbyPlacesFromOSM
        setLocations(fetchedLocations);
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
  }, [locationService, updateUserLocation]); // Depend on locationService and updateUserLocation

  // Set up favorites subscription when user changes
  useEffect(() => {
    const setupFavorites = async () => {
      if (!user) {
        setFavorites([]);
        return;
      }

      try {
        // Get initial favorites
        // Note: This still fetches Supabase favorite IDs. Matching these to OSM IDs
        // in the `locations` array might not work directly. A new strategy is needed.
        const favoriteIds = await favoritesService.getFavorites(user.id);
        setFavorites(locations.filter(loc => favoriteIds.includes(loc.id)));

        // Subscribe to favorite changes
        // This subscription is still based on Supabase changes and might not be relevant
        // for locations fetched from OSM. This part might need significant changes
        // depending on how favorites are handled with external API data.
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
      // This still uses the FavoritesService which is likely tied to Supabase.
      // Toggling favorites for locations from OSM requires a new approach.
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
    // Booking logic is still based on the current Location and Booking types.
    // If booking needs to work with OSM data, this might need adjustment.
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
