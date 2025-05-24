import { supabase } from '@/integrations/supabase/client';
import { Location } from '@/types';
import { RealtimeChannel } from '@supabase/supabase-js';

/**
 * Service class for managing user favorites
 * @class FavoritesService
 */
export class FavoritesService {
  private static instance: FavoritesService;
  private subscription: RealtimeChannel | null = null;

  private constructor() {}

  /**
   * Get the singleton instance of FavoritesService
   */
  static getInstance(): FavoritesService {
    if (!this.instance) {
      this.instance = new FavoritesService();
    }
    return this.instance;
  }

  /**
   * Initialize real-time subscription for favorites changes
   * @param userId - The current user's ID
   * @param onFavoriteChange - Callback function for favorite changes
   */
  async subscribeToFavorites(
    userId: string,
    onFavoriteChange: (locationId: number, isFavorite: boolean) => void
  ): Promise<void> {
    // Clean up existing subscription if any
    await this.unsubscribe();

    this.subscription = supabase
      .channel('favorites_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'favorites',
        filter: `user_id=eq.${userId}`      }, (payload: any) => {
        const locationId = Number(payload.new?.location_id || payload.old?.location_id);
        const isFavorite = payload.eventType === 'INSERT';
        onFavoriteChange(locationId, isFavorite);
      })
      .subscribe();
  }

  /**
   * Clean up real-time subscription
   */
  async unsubscribe(): Promise<void> {
    if (this.subscription) {
      await supabase.removeChannel(this.subscription);
      this.subscription = null;
    }
  }

  /**
   * Get user's favorite locations
   * @param userId - The user's ID
   * @returns Array of favorite location IDs
   */
  async getFavorites(userId: string): Promise<number[]> {
    const { data, error } = await supabase
      .from('favorites')
      .select('location_id')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching favorites:', error);
      return [];
    }

    return data.map(f => f.location_id);
  }

  /**
   * Add a location to user's favorites
   * @param userId - The user's ID
   * @param locationId - The location ID to favorite
   */
  async addFavorite(userId: string, locationId: number): Promise<void> {
    const { error } = await supabase
      .from('favorites')
      .insert({ user_id: userId, location_id: locationId });

    if (error && error.code !== '23505') { // Ignore unique violation errors
      throw new Error('Failed to add favorite: ' + error.message);
    }
  }

  /**
   * Remove a location from user's favorites
   * @param userId - The user's ID
   * @param locationId - The location ID to unfavorite
   */
  async removeFavorite(userId: string, locationId: number): Promise<void> {
    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('user_id', userId)
      .eq('location_id', locationId);

    if (error) {
      throw new Error('Failed to remove favorite: ' + error.message);
    }
  }

  /**
   * Toggle a location's favorite status
   * @param userId - The user's ID
   * @param locationId - The location ID to toggle
   * @returns The new favorite status
   */
  async toggleFavorite(userId: string, locationId: number): Promise<boolean> {
    const favorites = await this.getFavorites(userId);
    const isFavorite = favorites.includes(locationId);

    if (isFavorite) {
      await this.removeFavorite(userId, locationId);
      return false;
    } else {
      await this.addFavorite(userId, locationId);
      return true;
    }
  }
}
