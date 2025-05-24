import axios from 'axios';
import { UserCoordinates, Location } from '../types';

interface GeolocationApiResponse {
  latitude: number;
  longitude: number;
}

interface NearbyLocation {
  name: string;
  coord: {
    lat: number;
    lon: number;
  };
}

interface NearbyLocationsApiResponse {
  list: NearbyLocation[];
}

// Calculate distance between two coordinates using Haversine formula
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in km
  return Math.round(distance * 10) / 10; // Round to 1 decimal place
}

// Get user's current location
export async function getCurrentPosition(): Promise<UserCoordinates> {
  return new Promise((resolve, reject) => {
    if (navigator.geolocation) {
      console.log('Using browser geolocation API.');
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log('Browser geolocation success:', position.coords);
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        async (error) => {
          console.warn('Browser geolocation error:', error);
          console.log('Falling back to default location in Zambia.');
          resolve({
            latitude: -15.3875, // Lusaka, Zambia
            longitude: 28.3228,
          });
        },
        { timeout: 10000 } // 10s timeout
      );
    } else {
      console.log('Browser geolocation not supported. Falling back to default location in Zambia.');
      resolve({
        latitude: -15.3875, // Lusaka, Zambia
        longitude: 28.3228,
      });
    }
  });
}

// Filter out locations that are not in Zambia
export async function fetchNearbyLocations(latitude: number, longitude: number, type: string) {
  const NOMINATIM_API_URL = `https://nominatim.openstreetmap.org/search?format=json&lat=${latitude}&lon=${longitude}&q=${type}&addressdetails=1&limit=10`;
  try {
    const response = await axios.get(NOMINATIM_API_URL);
    return (response.data as any[]).map((place: any) => ({
      name: place.display_name,
      latitude: parseFloat(place.lat),
      longitude: parseFloat(place.lon),
    })).filter(location => {
      // Zambia's approximate latitude and longitude range
      return location.latitude >= -18 && location.latitude <= -8 &&
             location.longitude >= 22 && location.longitude <= 34;
    });
  } catch (error) {
    console.error('Error fetching nearby locations from OpenStreetMap:', error);
    return [];
  }
}

// Sort locations by proximity to user
export function sortLocationsByProximity(locations: Location[], userCoordinates: UserCoordinates): Location[] {
  return [...locations].sort((a, b) => {
    if (!a.coordinates || !b.coordinates) return 0;
    
    const distanceA = calculateDistance(
      userCoordinates.latitude,
      userCoordinates.longitude,
      a.coordinates.latitude,
      a.coordinates.longitude
    );
    
    const distanceB = calculateDistance(
      userCoordinates.latitude,
      userCoordinates.longitude,
      b.coordinates.latitude,
      b.coordinates.longitude
    );
    
    return distanceA - distanceB;
  });
}

// Function to update locations with distance from user
export function addDistanceToLocations(locations: Location[], userCoordinates: UserCoordinates): Location[] {
  return locations.map(location => {
    if (location.coordinates) {
      const distance = calculateDistance(
        userCoordinates.latitude,
        userCoordinates.longitude,
        location.coordinates.latitude,
        location.coordinates.longitude
      );
      return { ...location, distance };
    }
    return location;
  });
}

// Get nearest locations of a specific type
export function getNearestLocations(
  locations: Location[],
  userCoordinates: UserCoordinates,
  type?: 'lodge' | 'restaurant',
  limit = 3
): Location[] {
  let filteredLocations = locations;
  
  if (type) {
    filteredLocations = filteredLocations.filter(location => location.type === type);
  }
  
  const locationsWithDistance = addDistanceToLocations(filteredLocations, userCoordinates);
  return sortLocationsByProximity(locationsWithDistance, userCoordinates).slice(0, limit);
}
