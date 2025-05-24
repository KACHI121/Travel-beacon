import React from 'react';
import Sidebar from '../components/Sidebar';
import { useLocations } from '../contexts/LocationContext';
import LocationCard from '../components/LocationCard';
import { Heart } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Link } from 'react-router-dom';
import { Spinner } from '@/components/ui/spinner';

const Favorites = () => {
  const { favorites, isLoading } = useLocations();

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 ml-20 md:ml-64">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-6">Your Favorites</h1>
          
          {isLoading ? (
            <div className="flex justify-center items-center min-h-[400px]">
              <Spinner className="h-8 w-8 text-primary" />
            </div>
          ) : favorites.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {favorites.map(location => (
                <LocationCard key={location.id} location={location} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg p-12 text-center">
              <div className="flex justify-center mb-4">
                <Heart className="h-16 w-16 text-gray-300" />
              </div>
              <h3 className="text-xl font-medium mb-2">No Favorites Yet</h3>
              <p className="text-gray-500 mb-6">
                Start exploring and add places to your favorites!
              </p>
              <Button asChild>
                <Link to="/explore">
                  Explore Destinations
                </Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Favorites;
