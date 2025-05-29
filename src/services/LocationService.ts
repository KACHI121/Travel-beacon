import { UserCoordinates, Location } from '@/types';
import axios from 'axios';
import { supabase } from '@/integrations/supabase/client';

const ZAMBIA_BOUNDS = {
  latitude: { min: -18, max: -8 },
  longitude: { min: 22, max: 34 }
};

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

interface OverpassResponse {
  elements: Array<{
    id: number;
    lat: number;
    lon: number;
    tags: {
      name?: string;
      amenity?: string;
      'addr:street'?: string;
      'addr:city'?: string;
      'addr:district'?: string;
      description?: string;
      rating?: string;
      image?: string;
      [key: string]: string | undefined;
    };
  }>;
}

export class LocationService {
  private static instance: LocationService;
  private cachedPosition: { coordinates: UserCoordinates; timestamp: number } | null = null;
  private cachedLocations: { data: Location[]; timestamp: number } | null = null;

  private constructor() {}

  static getInstance(): LocationService {
    if (!this.instance) {
      this.instance = new LocationService();
    }
    return this.instance;
  }
  isWithinZambia(coordinates: UserCoordinates): boolean {
    return (
      coordinates.latitude >= ZAMBIA_BOUNDS.latitude.min &&
      coordinates.latitude <= ZAMBIA_BOUNDS.latitude.max &&
      coordinates.longitude >= ZAMBIA_BOUNDS.longitude.min &&
      coordinates.longitude <= ZAMBIA_BOUNDS.longitude.max
    );
  }

  private getLusakaFallback(): UserCoordinates {
    return {
      latitude: -15.3875,
      longitude: 28.3228
    };
  }

  private isCacheValid(): boolean {
    return (
      this.cachedPosition !== null &&
      Date.now() - this.cachedPosition.timestamp < CACHE_DURATION
    );
  }

  async getCurrentPosition(): Promise<UserCoordinates> {
    if (this.isCacheValid() && this.cachedPosition) {
      return this.cachedPosition.coordinates;
    }

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          timeout: 10000,
          maximumAge: CACHE_DURATION
        });
      });

      const coordinates: UserCoordinates = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      };

      // If user is outside Zambia, return Lusaka coordinates
      if (!this.isWithinZambia(coordinates)) {
        return this.getLusakaFallback();
      }

      this.cachedPosition = {
        coordinates,
        timestamp: Date.now()
      };

      return coordinates;
    } catch (error) {
      console.warn('Geolocation error:', error);
      return this.getLusakaFallback();
    }
  }

  // Calculate distance between two points using Haversine formula
  calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(value: number): number {
    return (value * Math.PI) / 180;
  }

  addDistanceToLocations(
    locations: Location[],
    userCoordinates: UserCoordinates
  ): Location[] {
    return locations.map(location => {
      if (location.coordinates) {
        const distance = this.calculateDistance(
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

  sortLocationsByProximity(
    locations: Location[],
    userCoordinates: UserCoordinates
  ): Location[] {
    return [...locations].sort((a, b) => {
      if (!a.coordinates || !b.coordinates) return 0;
      
      const distanceA = this.calculateDistance(
        userCoordinates.latitude,
        userCoordinates.longitude,
        a.coordinates.latitude,
        a.coordinates.longitude
      );
      
      const distanceB = this.calculateDistance(
        userCoordinates.latitude,
        userCoordinates.longitude,
        b.coordinates.latitude,
        b.coordinates.longitude
      );
      
      return distanceA - distanceB;
    });
  }

  getNearestLocations(
    locations: Location[],
    userCoordinates: UserCoordinates,
    type?: 'lodge' | 'restaurant',
    limit = 3
  ): Location[] {
    let filteredLocations = locations;
    
    if (type) {
      filteredLocations = filteredLocations.filter(location => location.type === type);
    }
    
    const locationsWithDistance = this.addDistanceToLocations(filteredLocations, userCoordinates);
    return this.sortLocationsByProximity(locationsWithDistance, userCoordinates).slice(0, limit);
  }  async fetchNearbyPlacesFromOSM(
    coordinates: UserCoordinates,
    placeType: string,
    radius: number = placeType === 'hotel' || placeType === 'lodge' ? 100000 : 5000 // 100km for hotels/lodges, 5km for others
  ): Promise<Location[]> {
    try {
      const overpassUrl = 'https://overpass-api.de/api/interpreter';
      let amenityQuery = '';
      
      if (placeType === 'hotel' || placeType === 'lodge') {
        amenityQuery = `
          // Hotels and resorts
          node["tourism"="hotel"](area:3602093234)(around:${radius},${coordinates.latitude},${coordinates.longitude});
          way["tourism"="hotel"](area:3602093234)(around:${radius},${coordinates.latitude},${coordinates.longitude});
          node["tourism"="resort"](area:3602093234)(around:${radius},${coordinates.latitude},${coordinates.longitude});
          way["tourism"="resort"](area:3602093234)(around:${radius},${coordinates.latitude},${coordinates.longitude});
          
          // Lodges and guest houses
          node["tourism"="guest_house"](area:3602093234)(around:${radius},${coordinates.latitude},${coordinates.longitude});
          way["tourism"="guest_house"](area:3602093234)(around:${radius},${coordinates.latitude},${coordinates.longitude});
          node["tourism"="hostel"](area:3602093234)(around:${radius},${coordinates.latitude},${coordinates.longitude});
          way["tourism"="hostel"](area:3602093234)(around:${radius},${coordinates.latitude},${coordinates.longitude});
          
          // Additional accommodation types
          node["building"="hotel"](area:3602093234)(around:${radius},${coordinates.latitude},${coordinates.longitude});
          way["building"="hotel"](area:3602093234)(around:${radius},${coordinates.latitude},${coordinates.longitude});
        `;
      } else if (placeType === 'restaurant') {
        amenityQuery = `
          // Restaurants
          node["amenity"="restaurant"](area:3602093234)(around:${radius},${coordinates.latitude},${coordinates.longitude});
          way["amenity"="restaurant"](area:3602093234)(around:${radius},${coordinates.latitude},${coordinates.longitude});
          
          // Cafes and dining places
          node["amenity"="cafe"](area:3602093234)(around:${radius},${coordinates.latitude},${coordinates.longitude});
          way["amenity"="cafe"](area:3602093234)(around:${radius},${coordinates.latitude},${coordinates.longitude});
          
          // Fast food
          node["amenity"="fast_food"](area:3602093234)(around:${radius},${coordinates.latitude},${coordinates.longitude});
          way["amenity"="fast_food"](area:3602093234)(around:${radius},${coordinates.latitude},${coordinates.longitude});
        `;
      } else {
        amenityQuery = `
          node["amenity"="${placeType}"](area:3602093234)(around:${radius},${coordinates.latitude},${coordinates.longitude});
          way["amenity"="${placeType}"](area:3602093234)(around:${radius},${coordinates.latitude},${coordinates.longitude});
        `;
      }

      const query = `
        [out:json][timeout:25];
        (
          ${amenityQuery}
        );
        out body;
        >;
        out skel qt;
      `;

      const response = await this.fetchWithRetry(overpassUrl, query);
      
      if (!response.data || !response.data.elements) {
        throw new Error('Invalid response from Overpass API');
      }

      const locations: Location[] = response.data.elements
        .filter(element => element.tags && element.tags.name) // Only include places with names
        .map(element => ({
          id: element.id.toString(),
          name: element.tags.name!,
          type: this.osmAmenityToLocationType(placeType),
          description: element.tags.description || `A ${placeType} in ${element.tags['addr:city'] || 'Zambia'}`,
          address: this.formatOSMAddress(element.tags),
          coordinates: {
            latitude: element.lat,
            longitude: element.lon
          },
          rating: parseFloat(element.tags.rating || '') || Math.random() * 2 + 3, // Random rating between 3-5
          image: element.tags.image || '/placeholder.svg',
          distance: this.calculateDistance(
            coordinates.latitude,
            coordinates.longitude,
            element.lat,
            element.lon
          ),
          isFavorite: false
        }));

      // Filter locations within Zambia
      return locations.filter(location => this.isWithinZambia(location.coordinates));
    } catch (error) {
      console.error('Error fetching from OpenStreetMap:', error);
      return [];
    }
  }

  private formatOSMAddress(tags: Record<string, string | undefined>): string {
    const parts = [];
    if (tags['addr:street']) parts.push(tags['addr:street']);
    if (tags['addr:city']) parts.push(tags['addr:city']);
    if (tags['addr:district']) parts.push(tags['addr:district']);
    return parts.length > 0 ? parts.join(', ') : 'Address not available';
  }

  private osmAmenityToLocationType(amenity: string): Location['type'] {
    // Tourism types
    if (['hotel', 'motel', 'resort'].includes(amenity)) {
      return 'hotel';
    }
    if (['guest_house', 'hostel'].includes(amenity)) {
      return 'lodge';
    }
    // Dining types
    if (amenity === 'restaurant') {
      return 'restaurant';
    }
    if (amenity === 'fast_food') {
      return 'fast_food';
    }
    // Default fallback
    return 'restaurant';
  }

  private async fetchWithRetry(url: string, body: string, retries = 3): Promise<any> {
    for (let i = 0; i < retries; i++) {
      try {
        const response = await axios.post(url, body, {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          timeout: 15000
        });
        return response;
      } catch (error) {
        if (i === retries - 1) throw error;
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
      }
    }
  }

  private generateDescription(tags: Record<string, string | undefined>): string {
    const type = tags.tourism || tags.amenity || 'place';
    const style = tags.cuisine || tags.style || '';
    const desc = tags.description || '';
    
    return desc || `A ${style} ${type} in ${tags['addr:city'] || 'Zambia'}. ${
      tags.website ? `Visit us at ${tags.website}` : ''
    }`.trim();
  }

  private generateRating(tags: Record<string, string | undefined>): number {
    const rating = parseFloat(tags.rating || '');
    if (!isNaN(rating) && rating >= 0 && rating <= 5) {
      return rating;
    }
    return 3.5 + Math.random() * 1.3;
  }

  private getLocationImage(tags: Record<string, string | undefined>): string {
    return tags.image || 
           tags.photo || 
           tags['image:url'] || 
           '/placeholder.svg';
  }

  private extractAmenities(tags: Record<string, string | undefined>): string[] {
    const amenities = [];
    if (tags.wifi === 'yes') amenities.push('WiFi');
    if (tags.parking === 'yes') amenities.push('Parking');
    if (tags['air_conditioning'] === 'yes') amenities.push('AC');
    if (tags.wheelchair === 'yes') amenities.push('Wheelchair Accessible');
    return amenities;
  }

  private isValidLocation(location: Location): boolean {
    return (
      location.name.length > 0 &&
      location.coordinates.latitude !== 0 &&
      location.coordinates.longitude !== 0 &&
      !location.name.toLowerCase().includes('test') &&
      !location.name.toLowerCase().includes('dummy')
    );
  }
}

export async function saveBookingToDB(booking: any) {
  const { error } = await supabase.from('bookings').insert([booking]);
  if (error) throw error;
}

export async function fetchBookingsFromDB(userId: string) {
  const { data, error } = await supabase.from('bookings').select('*').eq('user_id', userId);
  if (error) throw error;
  return data;
}
