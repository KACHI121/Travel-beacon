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
  amenities?: string[];
  price_range?: string;
  capacity: number;
}

// Database booking type
export interface BookingDBPayload {
  user_id: string;
  location_id: number;
  start_date: string;
  end_date: string;
  duration: number;
  guests: number;
  payment_method?: 'credit_card' | 'paypal' | 'bank_transfer';
  status?: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  payment_status?: 'unpaid' | 'processing' | 'paid' | 'refunded';
  total_amount?: number;
}

export interface Booking {
  id: number;
  user_id: string;
  location_id: number;
  created_at: string;
  updated_at: string;
  locationName: string;
  locationType: Location['type'];
  locationImage: string;
  startDate: Date;
  endDate: Date;
  duration: number;
  guests: number;
  payment_method: 'credit_card' | 'paypal' | 'bank_transfer';
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  payment_status: 'unpaid' | 'processing' | 'paid' | 'refunded';
  total_amount: number;
}

// Type for booking form data
export interface BookingFormData {
  location_id: number;
  startDate: Date;
  endDate: Date;
  duration: number;
  guests: number;
  payment_method?: BookingDBPayload['payment_method'];
  total_amount?: number;
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
