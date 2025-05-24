import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';

export const useAddReview = (locationId: number, onSuccess: () => void) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();

  const addReview = async (rating: number, comment: string) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "You must be logged in to leave a review",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Check if user already reviewed this location
      const { data: existingReview } = await supabase
        .from('reviews')
        .select('id')
        .eq('user_id', user.id)
        .eq('location_id', locationId);

      if (existingReview && existingReview.length > 0) {
        // Update existing review
        await supabase
          .from('reviews')
          .update({ rating, comment, updated_at: new Date() })
          .eq('id', existingReview[0].id);

        toast({
          title: "Review updated",
          description: "Your review has been updated successfully",
        });
      } else {
        // Create new review
        await supabase
          .from('reviews')
          .insert([{ user_id: user.id, location_id: locationId, rating, comment }]);

        toast({
          title: "Review submitted",
          description: "Your review has been submitted successfully",
        });
      }

      // Refresh reviews
      onSuccess();
    } catch (err) {
      console.error('Error adding review:', err);
      toast({
        title: "Error",
        description: "Failed to submit your review. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    addReview,
    isSubmitting
  };
};
