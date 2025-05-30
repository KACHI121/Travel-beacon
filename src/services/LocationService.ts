import { UserCoordinates, Location, Booking, BookingFormData, BookingDBPayload } from '@/types';
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

  private constructor() {}

  static getInstance(): LocationService {
    if (!this.instance) {
      this.instance = new LocationService();
    }
    return this.instance;
  }

  private isCacheValid(): boolean {
    return (
      this.cachedPosition !== null &&
      Date.now() - this.cachedPosition.timestamp < CACHE_DURATION
    );
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

  private toRad(value: number): number {
    return (value * Math.PI) / 180;
  }

  // Calculate distance between two points using Haversine formula
  private calculateDistance(
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

  private getInitialRadius(placeType: string): number {
    switch (placeType) {
      case 'hotel':
      case 'lodge':
        return 150000; // 150km for accommodations
      case 'restaurant':
      case 'fast_food':
        return 10000;  // 10km for food places
      default:
        return 20000;  // 20km for other amenities
    }
  }

  private getMaxRadius(placeType: string): number {
    switch (placeType) {
      case 'hotel':
      case 'lodge':
        return 300000; // 300km for accommodations
      case 'restaurant':
      case 'fast_food':
        return 50000;  // 50km for food places
      default:
        return 100000; // 100km for other amenities
    }
  }

  private formatOSMAddress(tags: Record<string, string | undefined>): string {
    const parts = [];
    if (tags['addr:street']) parts.push(tags['addr:street']);
    if (tags['addr:city']) parts.push(tags['addr:city']);
    if (tags['addr:district']) parts.push(tags['addr:district']);
    return parts.length > 0 ? parts.join(', ') : 'Address not available';
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

  private isValidLocation(location: Location): boolean {
    return (
      location.name.length > 0 &&
      location.coordinates.latitude !== 0 &&
      location.coordinates.longitude !== 0 &&
      !location.name.toLowerCase().includes('test') &&
      !location.name.toLowerCase().includes('dummy')
    );
  }

  private addDistanceToLocations(
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

  async fetchNearbyPlacesFromOSM(
    coordinates: UserCoordinates,
    placeType: Location['type'],
    radius: number = this.getInitialRadius(placeType)
  ): Promise<Location[]> {
    try {
      let locations = await this.fetchPlacesWithRadius(coordinates, placeType, radius);
      
      if (locations.length === 0) {
        console.log(`No locations found within ${radius}m, increasing search radius...`);
        const increasedRadius = radius * 2;
        locations = await this.fetchPlacesWithRadius(coordinates, placeType, increasedRadius);
        
        if (locations.length === 0) {
          console.log(`No locations found within ${increasedRadius}m, trying maximum radius...`);
          const maxRadius = this.getMaxRadius(placeType);
          locations = await this.fetchPlacesWithRadius(coordinates, placeType, maxRadius);
          
          if (locations.length === 0) {
            console.log(`No locations found within maximum radius of ${maxRadius}m`);
          }
        }
      }

      const locationsWithDistance = this.addDistanceToLocations(locations, coordinates);
      return this.sortLocationsByProximity(locationsWithDistance, coordinates);
    } catch (error) {
      console.error('Error fetching from OpenStreetMap:', error);
      return [];
    }
  }

  private async fetchPlacesWithRadius(
    coordinates: UserCoordinates,
    placeType: string,
    radius: number
  ): Promise<Location[]> {
    try {
      const overpassUrl = 'https://overpass-api.de/api/interpreter';
      let amenityQuery = '';
      
      if (placeType === 'hotel' || placeType === 'lodge') {
        amenityQuery = `
          node["tourism"="hotel"](around:${radius},${coordinates.latitude},${coordinates.longitude});
          way["tourism"="hotel"](around:${radius},${coordinates.latitude},${coordinates.longitude});
          node["tourism"="resort"](around:${radius},${coordinates.latitude},${coordinates.longitude});
          way["tourism"="resort"](around:${radius},${coordinates.latitude},${coordinates.longitude});
          node["tourism"="guest_house"](around:${radius},${coordinates.latitude},${coordinates.longitude});
          way["tourism"="guest_house"](around:${radius},${coordinates.latitude},${coordinates.longitude});
        `;
      } else if (placeType === 'restaurant') {
        amenityQuery = `
          node["amenity"="restaurant"](around:${radius},${coordinates.latitude},${coordinates.longitude});
          way["amenity"="restaurant"](around:${radius},${coordinates.latitude},${coordinates.longitude});
        `;
      } else if (placeType === 'fast_food') {
        amenityQuery = `
          node["amenity"="fast_food"](around:${radius},${coordinates.latitude},${coordinates.longitude});
          way["amenity"="fast_food"](around:${radius},${coordinates.latitude},${coordinates.longitude});
        `;
      } else {
        amenityQuery = `
          node["amenity"="${placeType}"](around:${radius},${coordinates.latitude},${coordinates.longitude});
          way["amenity"="${placeType}"](around:${radius},${coordinates.latitude},${coordinates.longitude});
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
        return [];
      }

      const locations: Location[] = response.data.elements
        .filter(element => element.tags && element.tags.name)
        .map(element => ({          id: element.id.toString(),
          name: element.tags.name!,
          type: this.osmAmenityToLocationType(placeType),
          description: this.generateDescription(element.tags),
          address: this.formatOSMAddress(element.tags),
          coordinates: {
            latitude: element.lat,
            longitude: element.lon
          },
          image: element.tags.image || '/placeholder.svg',
          rating: parseFloat(element.tags.rating || '0') || 3.5 + Math.random() * 1.3,
          isFavorite: false,
          capacity: parseInt(element.tags.rooms || element.tags.capacity || '10'),
          amenities: element.tags.amenities ? element.tags.amenities.split(';') : undefined,
          price_range: element.tags.price_range
        }));

      return locations.filter(location => 
        this.isWithinZambia(location.coordinates) && 
        this.isValidLocation(location)
      );

    } catch (error) {
      console.error('Error fetching places with radius:', error);
      return [];
    }
  }

  async saveBookingToDB(formData: BookingFormData, userId: string): Promise<Booking> {
    try {      const dbData: BookingDBPayload = {
        user_id: userId,
        location_id: formData.location_id,
        start_date: new Date(formData.startDate.setHours(0, 0, 0, 0)).toISOString(),
        end_date: new Date(formData.endDate.setHours(23, 59, 59, 999)).toISOString(),
        duration: formData.duration,
        guests: formData.guests,
        payment_method: formData.payment_method || 'credit_card',
        status: 'pending',
        payment_status: 'unpaid',
        total_amount: formData.total_amount || 0
      };

      const { data, error } = await supabase
        .from('bookings')
        .insert(dbData)
        .select(`
          *,
          locations (
            name,
            type,
            image
          )
        `)
        .single();

      if (error) throw error;
      if (!data) throw new Error('No data returned after insert');      return {
        id: data.id,
        user_id: data.user_id,
        location_id: data.location_id,
        created_at: data.created_at,
        updated_at: data.updated_at,
        locationName: data.locations.name,
        locationType: data.locations.type,
        locationImage: data.locations.image,
        startDate: new Date(data.start_date),
        endDate: new Date(data.end_date),
        duration: data.duration,
        guests: data.guests,
        payment_method: data.payment_method,
        status: data.status,
        payment_status: data.payment_status,
        total_amount: data.total_amount
      };
    } catch (error) {
      console.error('Error saving booking:', error);
      throw error;
    }
  }

  async fetchBookingsFromDB(userId: string): Promise<Booking[]> {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          locations (
            name,
            type,
            image
          )
        `)
        .eq('user_id', userId);

      if (error) throw error;
      if (!data) return [];      return data.map(record => ({
        id: record.id,
        user_id: record.user_id,
        location_id: record.location_id,
        created_at: record.created_at,
        updated_at: record.updated_at,
        locationName: record.locations.name,
        locationType: record.locations.type,
        locationImage: record.locations.image,
        startDate: new Date(record.start_date),
        endDate: new Date(record.end_date),
        duration: record.duration,
        guests: record.guests,
        payment_method: record.payment_method,
        status: record.status,
        payment_status: record.payment_status,
        total_amount: record.total_amount
      }));
    } catch (error) {
      console.error('Error fetching bookings:', error);
      throw error;
    }
  }
}


