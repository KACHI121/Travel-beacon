import React from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RatingCardProps {
  rating: number;
  totalReviews: number;
}

const RatingCard: React.FC<RatingCardProps> = ({ rating, totalReviews }) => {
  // Generate an array of 5 stars
  const stars = Array.from({ length: 5 }).map((_, index) => {
    // For whole stars
    if (index < Math.floor(rating)) {
      return <Star key={index} className="h-5 w-5 fill-yellow-400 text-yellow-400" />;
    }
    // For partial stars (if rating has decimal part)
    else if (index === Math.floor(rating) && rating % 1 > 0) {
      return (
        <div key={index} className="relative">
          <Star className="h-5 w-5 text-yellow-400" />
          <div className="absolute top-0 left-0 overflow-hidden" style={{ width: `${(rating % 1) * 100}%` }}>
            <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
          </div>
        </div>
      );
    }
    // For empty stars
    else {
      return <Star key={index} className="h-5 w-5 text-yellow-400" />;
    }
  });

  return (
    <div className="bg-white rounded-lg p-4 shadow-md">
      <div className="flex flex-col">
        <h3 className="text-lg font-semibold mb-2">Overall Rating</h3>
        <div className="flex items-center">
          <div className="flex mr-2">{stars}</div>
          <span className="text-lg font-bold">
            {Number.isInteger(rating) ? rating : rating.toFixed(1)}
          </span>
        </div>
        <div className="mt-2 text-sm text-gray-500">
          Based on {totalReviews} reviews
        </div>
        
        {/* Rating Distribution */}
        <div className="mt-4 space-y-2">
          {[5, 4, 3, 2, 1].map((num) => (
            <div key={num} className="flex items-center">
              <span className="w-3 text-xs text-gray-600">{num}</span>
              <div className="flex items-center ml-2">
                <Star className={cn(
                  "h-3 w-3",
                  num <= Math.round(rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                )} />
              </div>
              <div className="ml-2 w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-yellow-400 h-2 rounded-full" 
                  style={{ 
                    width: `${num === 5 ? 70 : num === 4 ? 20 : num === 3 ? 7 : num === 2 ? 2 : 1}%` 
                  }}
                />
              </div>
              <span className="ml-2 text-xs text-gray-500">
                {num === 5 ? '70%' : num === 4 ? '20%' : num === 3 ? '7%' : num === 2 ? '2%' : '1%'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RatingCard;
