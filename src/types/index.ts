export interface Location {
  id: number;
  name: string;
  type: 'lodge' | 'restaurant';
  image: string;
  rating: number;
  distance?: number; // in km
  address: string;
  description: string;
  isFavorite?: boolean;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export interface Booking {
  id: number;
  locationId: number;
  locationName: string;
  locationType: 'lodge' | 'restaurant';
  locationImage: string;
  startDate: Date;
  endDate: Date;
  duration: number; // in days
  guests: number;
}

export interface UserCoordinates {
  latitude: number;
  longitude: number;
}

// Map the database schema type to the Review type for consistency
import { Database } from '@/integrations/supabase/types';

export type Review = Database['public']['Tables']['reviews']['Row'] & {
  // Additional UI-specific fields
  isLiked?: boolean;
  user_name?: string;
  user_avatar?: string;
};

// Add this interface to handle mock reviews in the Index page
export interface MockReview {
  id: number;
  name: string;
  avatar: string;
  date: string;
  rating: number;
  comment: string;
  likes: number;
  isLiked?: boolean;
}
