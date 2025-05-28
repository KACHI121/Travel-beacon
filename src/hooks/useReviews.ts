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

  // Define mock reviews with Zambian names
  const mockReviews: Review[] = [
    {
      id: 'mock-1',
      location_id: locationId,
      user_id: 'mock-user-1',
      user_name: 'Chanda Mwansa',
      rating: 5,
      comment: 'This is a fantastic place! Highly recommended.',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      likes: 10,
    },
    {
      id: 'mock-2',
      location_id: locationId,
      user_id: 'mock-user-2',
      user_name: 'Mutale Phiri',
      rating: 4,
      comment: 'Had a great time here. The service was excellent.',
      created_at: new Date(Date.now() - 86400000).toISOString(),
      updated_at: new Date(Date.now() - 86400000).toISOString(),
      likes: 5,
    },
    {
      id: 'mock-3',
      location_id: locationId,
      user_id: 'mock-user-3',
      user_name: 'Luyando Zulu',
      rating: 5,
      comment: 'A must-visit location. Beautiful and well-maintained.',
      created_at: new Date(Date.now() - 172800000).toISOString(),
      updated_at: new Date(Date.now() - 172800000).toISOString(),
      likes: 12,
    },
  ];

  return {
    reviews: fetchedReviews && fetchedReviews.length > 0 ? fetchedReviews : mockReviews,
    isLoading,
    addReview,
    toggleLike,
    refreshReviews,
    isSubmitting
  };
};
