
import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, MapPin } from 'lucide-react';
import { Button } from "@/components/ui/button";

interface Location {
  id: number;
  name: string;
  location: string;
  image: string;
  price: string;
  rating: number;
}

const locations: Location[] = [
  {
    id: 1,
    name: "Royal Livingstone Hotel",
    location: "Livingstone, Zambia",
    image: "https://images.unsplash.com/photo-1590073242678-70ee3fc28f8e?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb",
    price: "$450/night",
    rating: 4.9
  },
  {
    id: 2,
    name: "Thorntree River Lodge",
    location: "Mosi-oa-Tunya National Park",
    image: "https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb",
    price: "$380/night",
    rating: 4.8
  },
  {
    id: 3,
    name: "Tongabezi Lodge",
    location: "Victoria Falls, Zambia",
    image: "https://images.unsplash.com/photo-1493246507139-91e8fad9978e?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb",
    price: "$420/night",
    rating: 4.9
  },
  {
    id: 4,
    name: "Kafunta River Lodge",
    location: "South Luangwa National Park",
    image: "https://images.unsplash.com/photo-1470290378698-263fa7ca60ab?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb",
    price: "$350/night",
    rating: 4.7
  }
];

const ImageCarousel: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  
  const goToNext = () => {
    setIsLoading(true);
    setCurrentIndex((prevIndex) => (prevIndex + 1) % locations.length);
  };
  
  const goToPrevious = () => {
    setIsLoading(true);
    setCurrentIndex((prevIndex) => (prevIndex - 1 + locations.length) % locations.length);
  };
  
  useEffect(() => {
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

  const currentLocation = locations[currentIndex];

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
      
      {/* Location Info Card */}
      <div className="absolute bottom-6 left-6 right-6 bg-white/90 backdrop-blur-sm p-4 rounded-lg shadow-lg">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl font-bold">{currentLocation.name}</h2>
            <div className="flex items-center text-gray-600 mt-1">
              <MapPin className="h-4 w-4 mr-1" />
              <span className="text-sm">{currentLocation.location}</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-semibold text-primary">{currentLocation.price}</div>
            <Button className="mt-2" size="sm">Book Now</Button>
          </div>
        </div>
      </div>
      
      {/* Indicators */}
      <div className="absolute bottom-24 left-0 right-0">
        <div className="flex justify-center gap-2">
          {locations.map((_, index) => (
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
