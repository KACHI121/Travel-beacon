import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';

export const useLikeReview = (onSuccessCallback: () => void) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { user } = useAuth();

  const toggleLike = async (reviewId: string) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "You must be logged in to like reviews",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    try {
      // Check if user already liked this review
      const { data: existingLike, error: likeError } = await supabase
        .from('review_likes')
        .select('id')
        .eq('user_id', user.user_id)
        .eq('review_id', reviewId);

      if (likeError) throw likeError;

      if (existingLike.length > 0) {
        // Remove like
        const { error: deleteError } = await supabase
          .from('review_likes')
          .delete()
          .eq('id', existingLike[0].id);

        if (deleteError) throw deleteError;
      } else {
        // Add like
        const { error: insertError } = await supabase
          .from('review_likes')
          .insert([{ user_id: user.user_id, review_id: reviewId }]);

        if (insertError) throw insertError;
      }

      // Refresh reviews to update the UI
      onSuccessCallback();
    } catch (err) {
      console.error('Error toggling like:', err);
      toast({
        title: "Error",
        description: "Failed to update like status. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    toggleLike,
    isProcessing
  };
};
