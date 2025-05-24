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
}
