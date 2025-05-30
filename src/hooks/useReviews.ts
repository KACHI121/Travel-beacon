import { useState } from 'react';
import { Review } from '@/types';
import { useFetchReviews } from './useFetchReviews';
import { useAddReview } from './useAddReview';
import { useLikeReview } from './useLikeReview';

export const useReviews = (locationId: number) => {
  // Use our custom hooks
  const { reviews: fetchedReviews, isLoading, refreshReviews } = useFetchReviews(locationId);
  const { addReview, isSubmitting } = useAddReview(locationId, refreshReviews);
  const { toggleLike } = useLikeReview(refreshReviews);

  return {
    reviews: fetchedReviews,
    isLoading,
    addReview,
    toggleLike,
    refreshReviews,
    isSubmitting
  };
};
