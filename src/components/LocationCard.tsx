import React, { useState } from 'react'; // Added useState import
import { Location } from '../types';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Heart, MapPin, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLocations } from '@/contexts/LocationContext';
import { Link } from 'react-router-dom';
import { Button } from './ui/button';
import { Spinner } from './ui/spinner';

interface LocationCardProps {
  location: Location;
  variant?: 'small' | 'medium' | 'large';
}

const LocationCard: React.FC<LocationCardProps> = ({ location, variant = 'medium' }) => {
  const { toggleFavorite, isFavoriteLoading } = useLocations();
  const [imageLoading, setImageLoading] = useState(true);
  
  return (
    <Card className={cn(
      "group overflow-hidden transition-all duration-300 hover:shadow-lg",
      variant === 'small' && "max-w-sm",
      variant === 'medium' && "max-w-md",
      variant === 'large' && "max-w-lg"
    )}>
      <div className="relative">
        <img 
          src={location.image} 
          alt={location.name}
          className={cn(
            "w-full object-cover transition-transform duration-300 group-hover:scale-105",
            variant === 'small' && "h-36",
            variant === 'medium' && "h-44",
            variant === 'large' && "h-52"
          )}
        />
        <button 
          onClick={() => toggleFavorite(location.id)}
          disabled={isFavoriteLoading} // Changed from isLoading to isFavoriteLoading
          className={cn(
            "absolute top-2 right-2 bg-white bg-opacity-80 p-1.5 rounded-full shadow-md transition-all",
            isFavoriteLoading && "opacity-50 cursor-not-allowed" // Changed from isLoading to isFavoriteLoading
          )}
        >
          {isFavoriteLoading ? ( // Changed from isLoading to isFavoriteLoading
            <Spinner className="w-5 h-5" />
          ) : (
            <Heart 
              className={cn(
                "w-5 h-5",
                location.isFavorite ? "fill-red-500 text-red-500" : "text-gray-600"
              )} 
            />
          )}
        </button>
        <div className="absolute bottom-2 right-2 bg-white bg-opacity-80 py-1 px-2 rounded-full flex items-center gap-1 shadow-md">
          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
          <span className="text-sm font-medium">{location.rating}</span>
        </div>
      </div>
      <CardContent className="p-4">
        <h3 className="text-lg font-semibold mb-2">{location.name}</h3>
        <p className="text-gray-500 mb-4 line-clamp-2">{location.description}</p>
        {location.distance && (
          <p className="text-sm text-gray-600 mb-3">
            {location.distance < 1
              ? `${Math.round(location.distance * 1000)}m away`
              : `${location.distance.toFixed(1)}km away`}
          </p>
        )}
        <Button asChild className="w-full">
          <Link to={`/location/${location.id}`}>View Details</Link>
        </Button>
      </CardContent>
    </Card>
  );
};

export default LocationCard;