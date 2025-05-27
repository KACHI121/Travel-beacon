import { supabase } from '@/integrations/supabase/client';
import { Location } from '@/types';
import { RealtimeChannel } from '@supabase/supabase-js';

type FavoriteCallback = (locationId: string, isFavorite: boolean) => void;

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
   */  async subscribeToFavorites(
    userId: string,
    onFavoriteChange: (locationId: string, isFavorite: boolean) => void
  ): Promise<void> {
    // Clean up existing subscription if any
    await this.unsubscribe();

    this.subscription = supabase
      .channel('favorites_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'favorites',
        filter: `user_id=eq.${userId}`
      }, (payload: any) => {
        const locationId = (payload.new?.location_id || payload.old?.location_id).toString();
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
  async getFavorites(userId: string): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('favorites')
        .select('location_id')
        .eq('user_id', userId);

      if (error) throw error;

      return data.map(favorite => favorite.location_id.toString());
    } catch (error) {
      console.error('Error fetching favorites:', error);
      return [];
    }
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
   */  async toggleFavorite(userId: string, locationId: string): Promise<boolean> {
    try {
      const { data: existingFavorite, error: selectError } = await supabase
        .from('favorites')
        .select()
        .eq('user_id', userId)
        .eq('location_id', locationId)
        .single();

      if (selectError && selectError.code !== 'PGRST116') { // PGRST116 is "not found" error
        throw selectError;
      }      if (existingFavorite) {
        const { error: deleteError } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', userId)
          .eq('location_id', locationId);

        if (deleteError) throw deleteError;
        return false;
      } else {
        const { error: insertError } = await supabase
          .from('favorites')
          .insert([{ 
            user_id: userId, 
            location_id: locationId 
          }]);

        if (insertError) throw insertError;
        return true;
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      throw error;
    }
  }
}
