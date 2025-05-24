
import React, { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useAuth } from '@/contexts/AuthContext';

interface ReviewFormProps {
  onSubmit: (rating: number, comment: string) => void;
  initialRating?: number;
  initialComment?: string;
}

const ReviewForm: React.FC<ReviewFormProps> = ({ 
  onSubmit, 
  initialRating = 0,
  initialComment = '' 
}) => {
  const [rating, setRating] = useState(initialRating);
  const [comment, setComment] = useState(initialComment);
  const [hoveredRating, setHoveredRating] = useState(0);
  const { isAuthenticated } = useAuth();

  // Update local state if props change
  useEffect(() => {
    setRating(initialRating);
    setComment(initialComment);
  }, [initialRating, initialComment]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating > 0) {
      onSubmit(rating, comment);
      // Only clear form if it's a new review (not editing)
      if (!initialRating && !initialComment) {
        setRating(0);
        setComment('');
      }
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="text-center py-4 bg-gray-50 rounded-lg border border-dashed border-gray-300">
        <p className="text-gray-600 mb-2">Please sign in to leave a review</p>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => window.location.href = '/auth'}
        >
          Sign In
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex flex-col items-center sm:flex-row sm:items-start gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Your Rating
          </label>
          <div className="flex items-center">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                className="p-1 focus:outline-none"
              >
                <Star 
                  className={cn(
                    "h-6 w-6 cursor-pointer transition-all", 
                    (hoveredRating ? star <= hoveredRating : star <= rating)
                      ? "fill-yellow-400 text-yellow-400" 
                      : "text-gray-300"
                  )}
                />
              </button>
            ))}
          </div>
        </div>
        
        <div className="flex-1 w-full">
          <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-1">
            Your Review
          </label>
          <Textarea
            id="comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your experience with this place..."
            className="min-h-[100px]"
          />
        </div>
      </div>
      
      <div className="flex justify-end">
        <Button 
          type="submit" 
          disabled={rating === 0}
        >
          {initialRating > 0 ? 'Update Review' : 'Submit Review'}
        </Button>
      </div>
    </form>
  );
};

export default ReviewForm;
