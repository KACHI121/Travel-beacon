
import React, { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import ImageCarousel from '../components/ImageCarousel';
import RatingCard from '../components/RatingCard';
import ReviewCard from '../components/ReviewCard';
import { Search, Calendar, Users, ChevronDown, Map, Star } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useLocations } from '../contexts/LocationContext';
import LocationCard from '../components/LocationCard';
import { getCurrentPosition, getNearestLocations } from '../utils/geolocation';
import { UserCoordinates, Location, MockReview } from '../types';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const mockReviews: MockReview[] = [
  {
    id: 1,
    name: 'Emily Johnson',
    avatar: 'https://randomuser.me/api/portraits/women/12.jpg',
    date: '2 days ago',
    rating: 5,
    comment: 'Absolutely amazing place! The views were breathtaking and the service was top-notch. Will definitely come back!',
    likes: 24,
    isLiked: true
  },
  {
    id: 2,
    name: 'Michael Rodriguez',
    avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
    date: '1 week ago',
    rating: 4,
    comment: 'Great location and friendly staff. The room was spacious and clean. Only downside was the Wi-Fi connection.',
    likes: 8
  },
  {
    id: 3,
    name: 'Sarah Kim',
    avatar: 'https://randomuser.me/api/portraits/women/45.jpg',
    date: '2 weeks ago',
    rating: 5,
    comment: 'This place exceeded all my expectations! The food was delicious and the activities were well organized.',
    likes: 15
  }
];

const Index = () => {
  const { locations } = useLocations();
  const { user } = useAuth();
  const [userCoordinates, setUserCoordinates] = useState<UserCoordinates | null>(null);
  const [nearestLocations, setNearestLocations] = useState<Location[]>([]);
  const lodges = locations.filter(location => location.type === 'lodge').slice(0, 3);
  const restaurants = locations.filter(location => location.type === 'restaurant').slice(0, 3);

  useEffect(() => {
    const fetchUserLocation = async () => {
      try {
        const coordinates = await getCurrentPosition();
        setUserCoordinates(coordinates);

        // Get nearest locations
        if (coordinates && locations.length > 0) {
          const nearest = getNearestLocations(locations, coordinates, undefined, 3);
          setNearestLocations(nearest);
        }
      } catch (error) {
        console.error('Error getting user location:', error);
      }
    };

    fetchUserLocation();
  }, [locations]);
  
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 ml-20 md:ml-64">
        <div className="max-w-7xl mx-auto px-4 py-8">
          
          {/* Welcome Section */}
          <div className="bg-gradient-to-r from-primary/90 to-primary/60 rounded-xl p-8 mb-8 text-white shadow-lg">
            <div className="max-w-2xl">
              <h1 className="text-4xl font-bold mb-4">
                Welcome {user ? `back, ${user.name}` : 'to WanderMate'}!
              </h1>
              <p className="text-lg opacity-90 mb-6">
                Your personal travel companion to discover amazing lodges and restaurants. 
                Find the perfect getaway, book with ease, and create unforgettable memories.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button variant="secondary" size="lg">
                  Explore Destinations
                </Button>
                <Button variant="outline" className="bg-white/10 text-white border-white/30 hover:bg-white/20">
                  How It Works
                </Button>
              </div>
            </div>
          </div>
          
          {/* Search Section */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6">Discover Your Next Adventure</h2>
            
            <div className="bg-white p-4 rounded-xl shadow-md flex flex-col md:flex-row gap-4">
              <div className="flex-1 flex items-center border rounded-lg px-3 py-2">
                <Search className="h-5 w-5 text-gray-400 mr-2" />
                <input 
                  type="text" 
                  placeholder="Where do you want to go?" 
                  className="w-full focus:outline-none"
                />
              </div>
              
              <div className="flex items-center border rounded-lg px-3 py-2">
                <Calendar className="h-5 w-5 text-gray-400 mr-2" />
                <div className="flex items-center">
                  <span className="text-sm text-gray-500">Check in - Check out</span>
                  <ChevronDown className="h-4 w-4 text-gray-400 ml-2" />
                </div>
              </div>
              
              <div className="flex items-center border rounded-lg px-3 py-2">
                <Users className="h-5 w-5 text-gray-400 mr-2" />
                <div className="flex items-center">
                  <span className="text-sm text-gray-500">2 adults, 0 children</span>
                  <ChevronDown className="h-4 w-4 text-gray-400 ml-2" />
                </div>
              </div>
              
              <Button className="md:w-auto">Search</Button>
            </div>
          </div>
          
          {/* Nearest to You Section */}
          {nearestLocations.length > 0 && (
            <div className="mb-10">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Nearest to You</h2>
                <Link to="/explore" className="text-primary hover:underline">View all</Link>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {nearestLocations.map(location => (
                  <LocationCard key={location.id} location={location} />
                ))}
              </div>
            </div>
          )}
          
          {/* Popular Lodges Section */}
          <div className="mb-10">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Popular Lodges</h2>
              <Link to="/explore" className="text-primary hover:underline">View all</Link>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {lodges.map(lodge => (
                <LocationCard key={lodge.id} location={lodge} />
              ))}
            </div>
          </div>
          
          {/* Popular Restaurants Section */}
          <div className="mb-10">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Top Restaurants</h2>
              <Link to="/explore" className="text-primary hover:underline">View all</Link>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {restaurants.map(restaurant => (
                <LocationCard key={restaurant.id} location={restaurant} />
              ))}
            </div>
          </div>
          
          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Main Carousel - Takes up 2 columns */}
            <div className="lg:col-span-2 flex justify-center fade-in">
              <ImageCarousel />
            </div>
            
            {/* Reviews Section - Left */}
            <div className="fade-in">
              <RatingCard rating={4.8} totalReviews={203} />
            </div>
            
            {/* Reviews List - Right */}
            <div className="lg:col-span-2 fade-in">
              <ReviewCard reviews={mockReviews} />
            </div>
          </div>
          
          {/* App Features */}
          <div className="mt-16 mb-10">
            <h2 className="text-2xl font-bold text-center mb-10">What WanderMate Offers</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white p-6 rounded-lg shadow text-center">
                <div className="bg-blue-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Map className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-bold text-lg mb-2">Discover Best Places</h3>
                <p className="text-gray-600">
                  Find unique lodges and restaurants around the world with detailed information and reviews.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow text-center">
                <div className="bg-blue-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-bold text-lg mb-2">Easy Booking</h3>
                <p className="text-gray-600">
                  Book your stay with a few clicks, choose your dates, and receive instant confirmation.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow text-center">
                <div className="bg-blue-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Star className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-bold text-lg mb-2">Save Favorites</h3>
                <p className="text-gray-600">
                  Keep track of places you love and build your personalized travel wishlist.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
