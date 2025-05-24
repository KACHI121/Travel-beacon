import React from 'react';
import { Star, ThumbsUp } from 'lucide-react';
import { Review, MockReview } from '@/types';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow, parseISO } from 'date-fns';

interface ReviewCardProps {
  reviews: Review[] | MockReview[];
  onLike?: (reviewId: string) => void;
  isLoading?: boolean;
  onViewAll?: () => void;
}

const ReviewCard: React.FC<ReviewCardProps> = ({ 
  reviews, 
  onLike, 
  isLoading = false,
  onViewAll
}) => {
  const { isAuthenticated } = useAuth();
  
  // Function to safely format date
  const formatDate = (dateString: string) => {
    try {
      // For mock reviews that might already have formatted dates
      if (!dateString.includes('T') && !dateString.includes(':')) {
        return dateString;
      }
      
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
  
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg p-4 shadow-md animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border-b border-gray-100 pb-4">
              <div className="flex items-start">
                <div className="w-10 h-10 bg-gray-200 rounded-full mr-3"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/5 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  if (reviews.length === 0) {
    return (
      <div className="bg-white rounded-lg p-4 shadow-md">
        <h3 className="text-lg font-semibold mb-4">Reviews</h3>
        <p className="text-gray-500 text-center py-6">
          No reviews yet. Be the first to leave a review!
        </p>
      </div>
    );
  }
  
  // Helper function to determine if we're dealing with mock reviews or database reviews
  const isMockReview = (review: Review | MockReview): review is MockReview => {
    return 'name' in review && 'avatar' in review && 'date' in review;
  };
  
  return (
    <div className="bg-white rounded-lg p-4 shadow-md">
      <h3 className="text-lg font-semibold mb-4">Recent Reviews</h3>
      
      <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
        {reviews.map((review) => (
          <div key={isMockReview(review) ? `mock-${review.id}` : review.id} className="border-b border-gray-100 pb-4 last:border-b-0">
            <div className="flex items-start">
              <img 
                src={isMockReview(review) ? review.avatar : review.user_avatar} 
                alt={isMockReview(review) ? review.name : review.user_name || "User"}
                className="w-10 h-10 rounded-full object-cover mr-3"
              />
              <div className="flex-1">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium">{isMockReview(review) ? review.name : review.user_name || "Anonymous"}</h4>
                  <span className="text-xs text-gray-500">
                    {isMockReview(review) ? review.date : formatDate(review.created_at)}
                  </span>
                </div>
                
                <div className="flex items-center mt-1">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      className={`h-4 w-4 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} 
                    />
                  ))}
                </div>
                
                <p className="mt-2 text-sm text-gray-700">{review.comment}</p>
                
                <div className="mt-2 flex items-center">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="flex items-center text-xs text-gray-500 hover:text-primary h-auto py-1 px-2"
                    onClick={() => onLike && onLike(isMockReview(review) ? String(review.id) : review.id)}
                    disabled={!isAuthenticated}
                  >
                    <ThumbsUp className={`h-3 w-3 mr-1 ${review.isLiked ? 'fill-primary text-primary' : ''}`} />
                    Helpful ({review.likes})
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {reviews.length > 3 && onViewAll && (
        <Button 
          variant="link" 
          className="mt-4 text-primary text-sm font-medium hover:underline"
          onClick={onViewAll}
        >
          View all reviews
        </Button>
      )}
    </div>
  );
};

export default ReviewCard;
