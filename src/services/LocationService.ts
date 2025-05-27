import { UserCoordinates, Location } from '@/types';

const ZAMBIA_BOUNDS = {
  latitude: { min: -18, max: -8 },
  longitude: { min: 22, max: 34 }
};

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

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
  }

  private osmAmenityToLocationType(amenity: string): Location['type'] {
    switch (amenity) {
      case 'hotel':
        return 'hotel';
      case 'guest_house':
      case 'hostel':
        return 'lodge';
      case 'restaurant':
        return 'restaurant';
      case 'fast_food':
        return 'fast_food';
      default:
        return 'restaurant'; // fallback
    }
  }

  async fetchNearbyPlacesFromOSM(
    coordinates: UserCoordinates,
    placeType: string,
    radius: number = 1000
  ): Promise<Location[]> {
    const overpassUrl = 'https://overpass-api.de/api/interpreter';
    
    // Build a query that includes all relevant amenity types
    const amenityTypes = placeType === 'lodge' 
      ? ['hotel', 'guest_house', 'hostel']
      : [placeType];

    const amenityQueries = amenityTypes
      .map(type => `node(around:${radius},${coordinates.latitude},${coordinates.longitude})["amenity"="${type}"];`)
      .join('\n');
    
    const query = `
      [out:json];
      (
        ${amenityQueries}
      );
      out body;
    `;

    try {
      const response = await fetch(overpassUrl, {
        method: 'POST',
        body: query,
      });

      if (!response.ok) {
        throw new Error(`Overpass API request failed: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Map Overpass API results to your Location type
      const locations: Location[] = data.elements.map((element: any) => ({
        id: element.id,
        name: element.tags.name || `Unnamed ${placeType}`,
        type: this.osmAmenityToLocationType(element.tags.amenity),
        description: element.tags.description || 'No description available.',
        address: element.tags['addr:full'] || element.tags['addr:street'] || 'Address not available.',
        image: element.tags.image || element.tags.photo || '/placeholder.svg',
        rating: parseFloat(element.tags.stars) || Math.random() * 3 + 2, // Random rating between 2-5 if none available
        coordinates: { latitude: element.lat, longitude: element.lon },
        distance: this.calculateDistance(coordinates.latitude, coordinates.longitude, element.lat, element.lon),
        isFavorite: false,
      }));

      return locations;
    } catch (error) {
      console.error('Error fetching nearby places from OSM:', error);
      return [];
    }
  }
}
