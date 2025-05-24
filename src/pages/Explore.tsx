import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { useLocations } from '../contexts/LocationContext';
import LocationCard from '../components/LocationCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Search, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { getCurrentPosition, addDistanceToLocations, fetchNearbyLocations } from '../utils/geolocation';
import { UserCoordinates } from '../types';
import { Spinner } from '@/components/ui/spinner';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

const LocationCardSkeleton = () => (
  <Card className="overflow-hidden rounded-xl shadow-md">
    <Skeleton className="aspect-video w-full" />
    <CardHeader>
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-4 w-1/2 mt-2" />
    </CardHeader>
    <CardContent className="flex gap-2">
      <Skeleton className="h-4 w-16" />
      <Skeleton className="h-4 w-16" />
    </CardContent>
  </Card>
);

const Explore = () => {
  const { locations, isLoading: locationsLoading, isOutsideZambia } = useLocations();
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({ lodge: true, restaurant: true });
  const [locationsWithDistance, setLocationsWithDistance] = useState(locations);
  const [nearbyLocations, setNearbyLocations] = useState([]);
  const [userCoordinates, setUserCoordinates] = useState<UserCoordinates | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchUserLocation = async () => {
      try {
        setIsLoading(true);
        const coordinates = await getCurrentPosition();
        setUserCoordinates(coordinates);
        const updatedLocations = addDistanceToLocations(locations, coordinates);
        setLocationsWithDistance(updatedLocations);
      } catch (error) {
        console.error('Error getting user location:', error);
        setLocationsWithDistance(locations);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserLocation();
  }, [locations]);

  const mockLocations = [
    {
      id: 1,
      name: "Tropical Paradise Resort",
      type: "lodge",
      image: "https://images.unsplash.com/photo-1500673922987-e212871fec22",
      rating: 4.8,
      price: "1200 ZMW",
      address: "Bali, Indonesia",
      description: "A beautiful tropical resort with stunning views and luxurious amenities.",
    },
    {
      id: 2,
      name: "Alpine Luxury Lodge",
      type: "lodge",
      image: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa",
      rating: 4.5,
      price: "1500 ZMW",
      address: "Swiss Alps, Switzerland",
      description: "A cozy lodge nestled in the Swiss Alps, perfect for a winter getaway.",
    },
    {
      id: 3,
      name: "Urban Gourmet Restaurant",
      type: "restaurant",
      image: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4",
      rating: 4.7,
      price: "300 ZMW",
      address: "New York, USA",
      description: "A fine dining experience with a modern twist on classic dishes.",
    },
  ];

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const coords = await getCurrentPosition();
        const osmLocations = await fetchNearbyLocations(coords.latitude, coords.longitude, 'restaurant');
        setNearbyLocations(osmLocations.length > 0 ? osmLocations : mockLocations);
      } catch (error) {
        console.error('Error fetching nearby locations:', error);
        setNearbyLocations(mockLocations);
      }
    };

    fetchLocations();
  }, []);

  const filteredNearbyLocations = nearbyLocations.filter(location => {
    return location.latitude >= -18 && location.latitude <= -8 &&
           location.longitude >= 22 && location.longitude <= 34;
  });

  const filteredLocations = locationsWithDistance.filter(location => {
    const matchesSearch = location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          location.address.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = (filters.lodge && location.type === 'lodge') || 
                        (filters.restaurant && location.type === 'restaurant');
    return matchesSearch && matchesType;
  });

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      <div className="flex-1 ml-20 md:ml-64">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-6">Explore</h1>

          {userCoordinates && (
            <div className="flex items-center text-sm text-gray-500 mb-4">
              <MapPin className="h-4 w-4 mr-1 text-primary" />
              <span>
                Using your current location: 
                <span className="font-medium ml-1">
                  {userCoordinates.latitude.toFixed(3)}, {userCoordinates.longitude.toFixed(3)}
                </span>
              </span>
            </div>
          )}

          <div className="flex">
            <div className="flex-1">
              <div className="bg-white p-6 rounded-xl shadow-md mb-6">
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <Input
                      placeholder="Search locations by name or address..."
                      className="pl-10"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <Button onClick={() => setSearchTerm(searchTerm)}>
                    Search
                  </Button>
                </div>

                <div className="flex flex-wrap gap-4 items-center">
                  <span className="font-medium">Filter by:</span>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="lodge" 
                      checked={filters.lodge}
                      onCheckedChange={(checked) =>
                        setFilters(prev => ({ ...prev, lodge: !!checked }))
                      }
                    />
                    <label htmlFor="lodge" className="text-sm font-medium">
                      Lodges
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="restaurant" 
                      checked={filters.restaurant}
                      onCheckedChange={(checked) =>
                        setFilters(prev => ({ ...prev, restaurant: !!checked }))
                      }
                    />
                    <label htmlFor="restaurant" className="text-sm font-medium">
                      Restaurants
                    </label>
                  </div>
                </div>
              </div>

              <Tabs defaultValue="all" className="w-full">
                <TabsList className="w-full max-w-md mx-auto mb-6">
                  <TabsTrigger value="all" className="flex-1">All</TabsTrigger>
                  <TabsTrigger value="nearby" className="flex-1">Nearby</TabsTrigger>
                  <TabsTrigger value="top-rated" className="flex-1">Top Rated</TabsTrigger>
                </TabsList>

                <TabsContent value="all">
                  {locationsLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {[...Array(6)].map((_, i) => (
                        <LocationCardSkeleton key={i} />
                      ))}
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredLocations.map(location => (
                          <LocationCard key={location.id} location={location} />
                        ))}
                      </div>
                      {filteredLocations.length === 0 && (
                        <div className="text-center py-12 text-gray-500">
                          No locations found matching your criteria.
                        </div>
                      )}
                    </>
                  )}
                </TabsContent>

                <TabsContent value="nearby">
                  {isLoading ? (
                    <div className="text-center py-12 text-gray-500">
                      Finding locations near you...
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredNearbyLocations
                        .sort((a, b) => (a.distance || 999) - (b.distance || 999))
                        .map(location => (
                          <LocationCard key={location.id} location={location} />
                        ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="top-rated">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredLocations
                      .sort((a, b) => b.rating - a.rating)
                      .map(location => (
                        <LocationCard key={location.id} location={location} />
                      ))}
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            <div className="w-1/4 ml-6">{/* Optional Right Sidebar */}</div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-md mt-6">
            <h2 className="text-xl font-bold mb-4">Nearby Locations</h2>
            <ul>
              {nearbyLocations.map((location, index) => (
                <li key={index} className="text-gray-700">
                  {location.name}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Explore;
