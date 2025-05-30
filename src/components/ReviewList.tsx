import React, { useState } from 'react';
import { Review } from '@/types';
import ReviewForm from './ReviewForm';
import { Button } from '@/components/ui/button';
import { Star, ThumbsUp, ChevronDown, ChevronUp } from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

interface ReviewListProps {
  reviews: Review[];
  onAddReview: (rating: number, comment: string) => void;
  onLike: (reviewId: string) => void;
  isLoading?: boolean;
}

const ReviewList: React.FC<ReviewListProps> = ({ 
  reviews, 
  onAddReview, 
  onLike, 
  isLoading = false 
}) => {
  const [showAll, setShowAll] = useState(false);
  const { user } = useAuth();
  
  // Function to safely format date
  const formatDate = (dateString: string) => {
    try {
      // Ensure the date string is valid before parsing
      if (!dateString) return 'Unknown date';
      
      // Parse the ISO string to a Date object
      const date = parseISO(dateString);
      
      // Check if the date is valid
      if (isNaN(date.getTime())) {
        return 'Invalid date';
      }
      
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (error) {
      console.error("Error formatting date:", dateString, error);
      return 'Unknown date';
    }
  };
  
  // Find the current user's review if it exists
  const userReview = user ? reviews.find(review => review.user_id === user.user_id) : undefined;
  
  // Sort reviews to show user's review first, then by newest
  const sortedReviews = [...reviews].sort((a, b) => {
    // Always show user's own review first    if (user && a.user_id === user.user_id) return -1;
    if (user && b.user_id === user.user_id) return 1;
    
    // Otherwise sort by newest
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
  
  // Get limited review list when not showing all
  const displayedReviews = showAll ? sortedReviews : sortedReviews.slice(0, 3);
  
  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-[180px] bg-gray-100 rounded-lg"></div>
        {[1, 2, 3].map(i => (
          <div key={i} className="border-b pb-4">
            <div className="flex items-start">
              <div className="w-12 h-12 bg-gray-200 rounded-full mr-3"></div>
              <div className="flex-1">
                <div className="h-5 bg-gray-200 rounded w-1/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/5 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold mb-4">
          {userReview ? 'Edit Your Review' : 'Write a Review'}
        </h2>
        <ReviewForm 
          onSubmit={onAddReview}
          initialRating={userReview?.rating}
          initialComment={userReview?.comment}
        />
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Reviews ({reviews.length})</h2>
          {reviews.length > 3 && (
            <Button 
              variant="ghost" 
              onClick={() => setShowAll(!showAll)}
              className="text-primary flex items-center"
            >
              {showAll ? (
                <>Show Less <ChevronUp className="ml-1 h-4 w-4" /></>
              ) : (
                <>Show All <ChevronDown className="ml-1 h-4 w-4" /></>
              )}
            </Button>
          )}
        </div>
        
        {reviews.length === 0 ? (
          <p className="text-center text-gray-500 py-10">
            No reviews yet. Be the first to leave a review!
          </p>
        ) : (
          <div className="space-y-6">
            {displayedReviews.map(review => (
              <div 
                key={review.id} 
                className={cn(
                  "border-b border-gray-100 pb-6 last:border-b-0 last:pb-0",
                  user && review.user_id === user.user_id && "bg-gray-50 -mx-6 px-6 py-4 border border-gray-100 rounded-lg"
                )}
              >
                <div className="flex items-start">
                  <img 
                    src={review.user_avatar} 
                    alt={review.user_name || "User"}
                    className="w-12 h-12 rounded-full object-cover mr-4"
                  />
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-medium text-lg">
                          {review.user_name || "Anonymous"}
                          {user && review.user_id === user.user_id && (
                            <span className="ml-2 text-xs bg-blue-100 text-blue-800 py-0.5 px-2 rounded-full">
                              You
                            </span>
                          )}
                        </h4>
                        <div className="flex items-center mt-1">
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i} 
                              className={`h-4 w-4 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} 
                            />
                          ))}
                          <span className="text-xs text-gray-500 ml-2">
                            {formatDate(review.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <p className="mt-3 text-gray-700">{review.comment}</p>
                    
                    <div className="mt-3">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="flex items-center text-sm text-gray-500 hover:text-primary h-auto py-1 px-2"
                        onClick={() => onLike(review.id)}
                      >
                        <ThumbsUp className={`h-4 w-4 mr-1.5 ${review.isLiked ? 'fill-primary text-primary' : ''}`} />
                        Helpful ({review.likes})
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReviewList;
