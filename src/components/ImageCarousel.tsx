
import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, MapPin, Star } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Link } from 'react-router-dom';
import { useLocations } from '@/contexts/LocationContext';
import { Location } from '@/types';

interface ImageCarouselProps {
  maxItems?: number;
}

const ImageCarousel: React.FC<ImageCarouselProps> = ({ maxItems = 5 }) => {
  const { locations } = useLocations();
  const featuredLocations = locations.filter(loc => loc.image).slice(0, maxItems);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  
  const goToNext = () => {
    if (featuredLocations.length === 0) return;
    setIsLoading(true);
    setCurrentIndex((prevIndex) => (prevIndex + 1) % featuredLocations.length);
  };
  
  const goToPrevious = () => {
    if (featuredLocations.length === 0) return;
    setIsLoading(true);
    setCurrentIndex((prevIndex) => (prevIndex - 1 + featuredLocations.length) % featuredLocations.length);
  };
  
  useEffect(() => {
    if (featuredLocations.length === 0) return;
    const timer = setTimeout(() => {
      goToNext();
    }, 5000);
    return () => clearTimeout(timer);
  }, [currentIndex]);
  
  useEffect(() => {
    if (isLoading) {
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  if (featuredLocations.length === 0) {
    return null;
  }

  const currentLocation = featuredLocations[currentIndex];

  return (
    <div className="relative rounded-2xl overflow-hidden h-[500px] w-full max-w-4xl shadow-lg">
      {/* Main Image with Overlay */}
      <div className="relative h-full">
        <img
          src={currentLocation.image}
          alt={currentLocation.name}
          className={`w-full h-full object-cover transition-opacity duration-300 ${isLoading ? 'opacity-70' : 'opacity-100'}`}
          onLoad={() => setIsLoading(false)}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
      </div>
      
      {/* Navigation Arrows */}
      <Button 
        variant="outline" 
        size="icon"
        className="absolute top-1/2 left-4 -translate-y-1/2 bg-white/80 hover:bg-white"
        onClick={goToPrevious}
      >
        <ChevronLeft className="h-5 w-5" />
      </Button>
      
      <Button 
        variant="outline" 
        size="icon"
        className="absolute top-1/2 right-4 -translate-y-1/2 bg-white/80 hover:bg-white"
        onClick={goToNext}
      >
        <ChevronRight className="h-5 w-5" />
      </Button>
      
      {/* Location Info Card */}      <div className="absolute bottom-6 left-6 right-6 bg-white/90 backdrop-blur-sm p-4 rounded-lg shadow-lg">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl font-bold">{currentLocation.name}</h2>
            <div className="flex items-center text-gray-600 mt-1">
              <MapPin className="h-4 w-4 mr-1" />
              <span className="text-sm">{currentLocation.address}</span>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${i < currentLocation.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                />
              ))}
            </div>
            <Link to={`/location/${currentLocation.id}`}>
              <Button className="mt-2" size="sm">View Details</Button>
            </Link>
          </div>
        </div>
      </div>
        {/* Indicators */}
      <div className="absolute bottom-24 left-0 right-0">
        <div className="flex justify-center gap-2">
          {featuredLocations.map((_, index) => (
            <button
              key={index}
              className={`h-2 rounded-full transition-all ${
                index === currentIndex ? 'w-8 bg-primary' : 'w-2 bg-white/50'
              }`}
              onClick={() => setCurrentIndex(index)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ImageCarousel;
