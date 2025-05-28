import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Location, Booking } from '@/types';
import { LocationService } from '@/services/LocationService';
import { FavoritesService } from '@/services/FavoritesService';
import { OfflineHelper } from '@/utils/offline';
import debounce from 'lodash/debounce';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from './AuthContext';
import { saveBookingToDB, fetchBookingsFromDB } from '@/services/LocationService';

interface LocationContextType {
  locations: Location[];
  favorites: Location[];
  bookings: Booking[];
  toggleFavorite: (locationId: string) => Promise<void>;
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

export const LocationProvider = ({ children }: { children: React.ReactNode }) => {
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
      const coordinates = await locationService.getCurrentPosition();
      const restaurants = await locationService.fetchNearbyPlacesFromOSM(coordinates, 'restaurant');
      const hotels = await locationService.fetchNearbyPlacesFromOSM(coordinates, 'hotel');
      const fastFood = await locationService.fetchNearbyPlacesFromOSM(coordinates, 'fast_food');

      const fetchedLocations = [...restaurants, ...hotels, ...fastFood];
      setLocations(fetchedLocations);

      if (user) {
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

  useEffect(() => {
    const cleanup = OfflineHelper.initOfflineListeners(handleOffline, handleOnline);
    return cleanup;
  }, [handleOffline, handleOnline]);

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

  const updateUserLocation = useCallback(
    debounce(async () => {
      try {
        const coordinates = await locationService.getCurrentPosition();
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
  );

  useEffect(() => {
    const initializeData = async () => {
      try {
        setIsLoading(true);
        const coordinates = await locationService.getCurrentPosition();
        const restaurants = await locationService.fetchNearbyPlacesFromOSM(coordinates, 'restaurant');
        const hotels = await locationService.fetchNearbyPlacesFromOSM(coordinates, 'hotel');
        const fastFood = await locationService.fetchNearbyPlacesFromOSM(coordinates, 'fast_food');

        const fetchedLocations = [...restaurants, ...hotels, ...fastFood];
        setLocations(fetchedLocations);
        setIsOutsideZambia(!locationService.isWithinZambia(coordinates));

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
    return () => {
      updateUserLocation.cancel();
    };
  }, [locationService, updateUserLocation]);

  useEffect(() => {
    const setupFavorites = async () => {
      if (!user) {
        setFavorites([]);
        return;
      }

      try {
        const favoriteIds = await favoritesService.getFavorites(user.id);
        const favoritedLocations = locations.filter(loc => 
          favoriteIds.includes(loc.id)
        );
        setFavorites(favoritedLocations);

        const cleanup = await favoritesService.subscribeToFavorites(
          user.id,
          async (locationId: string, isFavorite: boolean) => {
            setLocations(prevLocations =>
              prevLocations.map(location =>
                location.id === locationId
                  ? { ...location, isFavorite }
                  : location
              )
            );

            if (isFavorite) {
              const location = locations.find(loc => loc.id === locationId);
              if (location) {
                setFavorites(prev => [...prev, location]);
              }
            } else {
              setFavorites(prev => prev.filter(loc => loc.id !== locationId));
            }
          }
        );

        return cleanup;
      } catch (error) {
        console.error('Error setting up favorites:', error);
        toast({
          title: "Error",
          description: "Failed to load favorites. Please try again later.",
          variant: "destructive"
        });
      }
    };

    setupFavorites();
    return () => {
      favoritesService.unsubscribe();
    };
  }, [user, favoritesService, locations]);

  useEffect(() => {
    const loadBookings = async () => {
      if (user) {
        try {
          const bookingsFromDB = await fetchBookingsFromDB(user.id);
          setBookings(bookingsFromDB);
        } catch (e) {
          setBookings([]);
        }
      } else {
        setBookings([]);
      }
    };
    loadBookings();
  }, [user]);

  const toggleFavorite = async (locationId: string) => {
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

      const location = locations.find(loc => loc.id === locationId);
      if (location) {
        if (newIsFavorite) {
          setFavorites(prev => [...prev, { ...location, isFavorite: true }]);
        } else {
          setFavorites(prev => prev.filter(loc => loc.id !== locationId));
        }
      }

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

  const addBooking = async (booking: Omit<Booking, 'id'>) => {
    const newBooking = {
      ...booking,
      id: bookings.length > 0 ? Math.max(...bookings.map(b => b.id)) + 1 : 1,
      user_id: user.id
    };
    setBookings([...bookings, newBooking]);
    try {
      await saveBookingToDB(newBooking);
    } catch {}
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