import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Review } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';
import { Database } from '@/integrations/supabase/types';

export const useFetchReviews = (locationId?: number) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchReviews = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Fetch all reviews for this location, or all reviews if locationId is undefined
      let query = supabase
        .from('reviews')
        .select('*')
        .order('created_at', { ascending: false });
      if (typeof locationId === 'number') {
        query = query.eq('location_id', locationId);
      }
      const { data, error: fetchError } = await query;
      if (fetchError) throw fetchError;
      let reviewsData = (data || []).map(item => ({
        ...item,
        likes: item.likes || 0,
        isLiked: false,
        user_name: 'Anonymous User',
        user_avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${item.user_id}`
      } as Review));
      if (user) {
        try {
          const { data: likedReviews, error: likedReviewsError } = await supabase
            .from('review_likes')
            .select('review_id')
            .eq('user_id', user.id);
          if (likedReviewsError) throw likedReviewsError;
          const likedIds = (likedReviews || []).map(item => String(item.review_id));
          reviewsData = reviewsData.map(review => ({
            ...review,
            isLiked: likedIds.includes(String(review.id))
          }));
        } catch (err) {
          console.error('Error checking liked reviews:', err);
        }
      }
      setReviews(reviewsData);
    } catch (err) {
      console.error('Error fetching reviews:', err);
      setError('Failed to load reviews');
      toast({
        title: 'Error loading reviews',
        description: 'There was a problem loading reviews. Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locationId, user]);

  return {
    reviews,
    isLoading,
    error,
    refreshReviews: fetchReviews
  };
};
