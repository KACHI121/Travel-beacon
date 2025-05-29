import React, { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import ImageCarousel from '../components/ImageCarousel';
import RatingCard from '../components/RatingCard';
import ReviewCard from '../components/ReviewCard';
import { Button } from "@/components/ui/button";
import { useLocations } from '../contexts/LocationContext';
import LocationCard from '../components/LocationCard';
import { getCurrentPosition, getNearestLocations } from '../utils/geolocation';
import { UserCoordinates, Location, MockReview } from '../types';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Map, Calendar, Star } from 'lucide-react';

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

      <footer className="bg-white border-t py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-gray-600 text-sm text-center md:text-left">
            &copy; {new Date().getFullYear()} iguide. All rights reserved.
          </div>
          <div className="flex flex-wrap gap-4 items-center justify-center">
            <Link to="/about" className="text-gray-600 hover:text-primary text-sm">About Us</Link>
            <a href="mailto:support@iguide.com" className="text-gray-600 hover:text-primary text-sm">Contact</a>
            <a href="/privacy" className="text-gray-600 hover:text-primary text-sm">Privacy Policy</a>
            <a href="/terms" className="text-gray-600 hover:text-primary text-sm">Terms of Service</a>
            <a href="https://github.com/KACHI121/Travel-beacon.git" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-primary flex items-center text-sm">
              <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.387.6.113.82-.262.82-.582 0-.288-.012-1.243-.018-2.252-3.338.726-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.09-.745.083-.729.083-.729 1.205.085 1.84 1.237 1.84 1.237 1.07 1.834 2.807 1.304 3.492.997.108-.775.418-1.305.762-1.606-2.665-.304-5.466-1.332-5.466-5.93 0-1.31.468-2.38 1.236-3.22-.124-.303-.535-1.523.117-3.176 0 0 1.008-.322 3.3 1.23a11.5 11.5 0 013.003-.404c1.02.005 2.047.138 3.003.404 2.29-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.873.12 3.176.77.84 1.235 1.91 1.235 3.22 0 4.61-2.803 5.624-5.475 5.92.43.37.823 1.102.823 2.222 0 1.606-.015 2.898-.015 3.293 0 .322.218.698.825.58C20.565 21.796 24 17.297 24 12c0-6.63-5.37-12-12-12z"/></svg>
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
