import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Location, Booking } from '@/types';
import { LocationService, saveBookingToDB, fetchBookingsFromDB } from '@/services/LocationService';
import { FavoritesService } from '@/services/FavoritesService';
import { OfflineHelper } from '@/utils/offline';
import debounce from 'lodash/debounce';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from './AuthContext';
import { supabase } from '@/integrations/supabase/client';

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
    });    try {
      const coordinates = await locationService.getCurrentPosition();
      
      // Fetch all location types in parallel
      const [restaurants, hotels, lodges, fastFood] = await Promise.all([
        locationService.fetchNearbyPlacesFromOSM(coordinates, 'restaurant'),
        locationService.fetchNearbyPlacesFromOSM(coordinates, 'hotel'),
        locationService.fetchNearbyPlacesFromOSM(coordinates, 'lodge'),
        locationService.fetchNearbyPlacesFromOSM(coordinates, 'fast_food')
      ]);

      const fetchedLocations = [...restaurants, ...hotels, ...lodges, ...fastFood].filter(
        location => location && location.name && location.coordinates
      );

      if (fetchedLocations.length === 0) {
        toast({
          title: "No Locations Found",
          description: "Trying to fetch locations from backup sources...",
          variant: "default"
        });
        
        // Retry with increased radius
        const [moreHotels, moreLodges] = await Promise.all([
          locationService.fetchNearbyPlacesFromOSM(coordinates, 'hotel', 150000),
          locationService.fetchNearbyPlacesFromOSM(coordinates, 'lodge', 150000)
        ]);
        
        fetchedLocations.push(...moreHotels, ...moreLodges);
      }

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
  const addBooking = async (booking: Omit<Booking, 'id' | 'user_id'>) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to book a place",
        variant: "default"
      });
      return;
    }

    try {
      const newBooking = {
        ...booking,
        user_id: user.id,
        id: Date.now() // temporary ID before inserting
      };

      // Save to database first
      const savedBooking = await saveBookingToDB(newBooking);
      
      // Only update local state if database save was successful
      setBookings(prev => [...prev, savedBooking]);

      toast({
        title: "Booking Confirmed",
        description: "Your booking has been successfully saved.",
        variant: "default"
      });
    } catch (error) {
      console.error('Error saving booking:', error);
      toast({
        title: "Booking Failed",
        description: "Failed to save booking. Please try again.",
        variant: "destructive"
      });
    }
  };
  const cancelBooking = async (bookingId: number) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to cancel a booking",
        variant: "default"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('bookings')
        .delete()
        .match({ id: bookingId, user_id: user.id });

      if (error) throw error;

      setBookings(prev => prev.filter(booking => booking.id !== bookingId));

      toast({
        title: "Booking Cancelled",
        description: "Your booking has been cancelled successfully.",
        variant: "default"
      });
    } catch (error) {
      console.error('Error cancelling booking:', error);
      toast({
        title: "Error",
        description: "Failed to cancel booking. Please try again.",
        variant: "destructive"
      });
    }
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