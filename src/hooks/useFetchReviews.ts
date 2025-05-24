import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Review } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';
import { Database } from '@/integrations/supabase/types';

export const useFetchReviews = (locationId: number) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchReviews = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch all reviews for this location
      const { data, error: fetchError } = await supabase
        .from('reviews')
        .select('*')
        .eq('location_id', locationId)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      // Transform the data to match our Review type
      let reviewsData = data.map(item => ({
        ...item, // Spread the database row fields
        likes: item.likes || 0,
        isLiked: false, // Default value, will be updated below if needed
        user_name: 'Anonymous User',
        user_avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${item.user_id}`
      } as Review));

      // If user is logged in, check which reviews they've liked
      if (user) {
        try {
          const { data: likedReviews, error: likedReviewsError } = await supabase
            .from('review_likes')
            .select('review_id')
            .eq('user_id', user.id);

          if (likedReviewsError) throw likedReviewsError;

          const likedReviewIds = likedReviews.map(item => String(item.review_id));

          reviewsData = reviewsData.map(review => ({
            ...review,
            isLiked: likedReviewIds.includes(review.id)
          }));
        } catch (err) {
          console.error('Error checking liked reviews:', err);
          // Continue without setting isLiked
        }
      }

      setReviews(reviewsData);
    } catch (err) {
      console.error('Error fetching reviews:', err);
      setError('Failed to load reviews');
      toast({
        title: "Error loading reviews",
        description: "There was a problem loading reviews. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch reviews on component mount and when locationId or user changes
  useEffect(() => {
    fetchReviews();
  }, [locationId, user]);

  return {
    reviews,
    isLoading,
    error,
    refreshReviews: fetchReviews
  };
};
