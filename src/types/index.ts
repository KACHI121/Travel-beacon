export interface UserCoordinates {
  latitude: number;
  longitude: number;
}

export interface Location {
  id: string;
  name: string;
  type: 'lodge' | 'hotel' | 'restaurant' | 'fast_food';
  description: string;
  address: string;
  coordinates: UserCoordinates;
  rating: number;
  image: string;
  distance?: number;
  isFavorite: boolean;
}

export interface Booking {
  id: number;
  locationId: string;
  locationName: string;
  locationType: Location['type'];
  locationImage: string;
  startDate: Date;
  endDate: Date;
  duration: number;
  guests: number;
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
