import axios from 'axios';
import { UserCoordinates, Location } from '../types';

interface OverpassElement {
  id: number;
  lat: number;
  lon: number;
  tags: {
    name?: string;
    amenity?: string;
    [key: string]: string | undefined;
  };
}

interface OverpassResponse {
  elements: OverpassElement[];
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
  return R * c; // Distance in km
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
        { 
          timeout: 10000,
          enableHighAccuracy: true,
          maximumAge: 300000 // 5 minutes
        }
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

// Filter out locations that are not in Zambia using Overpass API
export async function fetchNearbyLocations(coordinates: UserCoordinates, type: string, radius: number = 50000): Promise<Location[]> {
  const overpassUrl = 'https://overpass-api.de/api/interpreter';
  const query = `
    [out:json][timeout:25];
    (
      node["amenity"="${type}"](area:3602093234)(around:${radius},${coordinates.latitude},${coordinates.longitude});
      way["amenity"="${type}"](area:3602093234)(around:${radius},${coordinates.latitude},${coordinates.longitude});
    );
    out body;
    >;
    out skel qt;
  `;

  try {
    const response = await axios.post<OverpassResponse>(overpassUrl, query, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      timeout: 15000
    });

    if (!response.data || !response.data.elements) {
      return [];
    }

    return response.data.elements
      .filter(element => element.tags && element.tags.name)
      .map(element => ({
        id: element.id.toString(),
        name: element.tags.name!,
        type: type as Location['type'],
        description: element.tags.description || `A ${type} in Zambia`,
        address: formatAddress(element.tags),
        coordinates: {
          latitude: element.lat,
          longitude: element.lon
        },
        rating: parseFloat(element.tags.rating || '0') || 4,
        image: element.tags.image || '/placeholder.svg',
        distance: calculateDistance(
          coordinates.latitude,
          coordinates.longitude,
          element.lat,
          element.lon
        ),
        isFavorite: false
      } satisfies Location))
      .filter(location => 
        location.coordinates.latitude >= -18 && 
        location.coordinates.latitude <= -8 &&
        location.coordinates.longitude >= 22 && 
        location.coordinates.longitude <= 34
      );
  } catch (error) {
    console.error('Error fetching nearby locations:', error);
    return [];
  }
}

function formatAddress(tags: Record<string, string | undefined>): string {
  const parts = [];
  if (tags['addr:street']) parts.push(tags['addr:street']);
  if (tags['addr:city']) parts.push(tags['addr:city']);
  if (tags['addr:district']) parts.push(tags['addr:district']);
  return parts.length > 0 ? parts.join(', ') : 'Zambia';
}

// Sort locations by proximity to user
export function sortLocationsByProximity(
  locations: Location[], 
  userCoordinates: UserCoordinates
): Location[] {
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
export function addDistanceToLocations(
  locations: Location[], 
  userCoordinates: UserCoordinates
): Location[] {
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
