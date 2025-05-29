import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import { useLocations } from '../contexts/LocationContext';
import LocationCard from '../components/LocationCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
  const { locations, isLoading } = useLocations();
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({ lodge: true, restaurant: true });

  // Filter locations
  const filteredLocations = locations.filter(location => {
    const matchesSearch = location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      location.address.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType =
      (filters.lodge && (location.type === 'lodge' || location.type === 'hotel')) ||
      (filters.restaurant && (location.type === 'restaurant' || location.type === 'fast_food'));
    return matchesSearch && matchesType;
  });

  // Sort locations
  const sortedByDistance = [...filteredLocations].sort((a, b) => (a.distance || 999) - (b.distance || 999));
  const sortedByRating = [...filteredLocations].sort((a, b) => b.rating - a.rating);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 ml-20 md:ml-64 flex flex-col">
        <div className="max-w-7xl mx-auto px-4 py-8 w-full">
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
                  Hotels & Lodges
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

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <LocationCardSkeleton key={n} />
              ))}
            </div>
          ) : filteredLocations.length > 0 ? (
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="w-full max-w-md mx-auto mb-6">
                <TabsTrigger value="all" className="flex-1">All</TabsTrigger>
                <TabsTrigger value="nearby" className="flex-1">Nearby</TabsTrigger>
                <TabsTrigger value="rated" className="flex-1">Top Rated</TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredLocations.map(location => (
                    <LocationCard key={location.id} location={location} />
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="nearby" className="mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {sortedByDistance.map(location => (
                    <LocationCard key={location.id} location={location} />
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="rated" className="mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {sortedByRating.map(location => (
                    <LocationCard key={location.id} location={location} />
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          ) : (
            <div className="text-center py-12">
              <div className="mb-4">
                <Search className="h-12 w-12 mx-auto text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No locations found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm
                  ? "Try adjusting your search terms or filters"
                  : "There are no locations available in this area yet"}
              </p>
              {searchTerm && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm('');
                    setFilters({ lodge: true, restaurant: true });
                  }}
                >
                  Clear Search
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Explore;
