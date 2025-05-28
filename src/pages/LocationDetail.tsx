import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { useLocations } from '../contexts/LocationContext';
import { useAuth } from '../contexts/AuthContext';
import { Calendar } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, addDays } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ReviewCard from '@/components/ReviewCard';
import ReviewList from '@/components/ReviewList';
import { useReviews } from '@/hooks/useReviews';
import RatingCard from '@/components/RatingCard';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { LocationService } from '@/services/LocationService';
import { UserCoordinates } from '@/types';

type PaymentMethod = "credit_card" | "paypal" | "bank_transfer";

const mockImages = [
  "https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=1000",
  "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?q=80&w=1000",
  "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?q=80&w=1000",
  "https://images.unsplash.com/photo-1562790351-d273a961e0e9?q=80&w=1000",
  "https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?q=80&w=1000"
];

const LocationDetail = () => {
  const { locationId } = useParams<{ locationId: string }>();
  const { locations, addBooking } = useLocations();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [guests, setGuests] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("credit_card");
  const [activeTab, setActiveTab] = useState("details");
  const [userLocation, setUserLocation] = useState<UserCoordinates | null>(null);
  const [route, setRoute] = useState<[number, number][] | null>(null);

  // Ensure location details are displayed correctly
  const location = locations.find(loc => loc.id === locationId);

  // Import and use the `useReviews` hook to fix undefined variables
  const { reviews, isLoading: reviewsLoading, addReview, toggleLike } = useReviews(Number(locationId));

  useEffect(() => {
    if (!location) {
      navigate('/explore');
    }
  }, [location, navigate]);

  // Fetch user location
  useEffect(() => {
    const fetchUserLocation = async () => {
      const locationService = LocationService.getInstance();
      try {
        const coords = await locationService.getCurrentPosition();
        setUserLocation(coords);
      } catch (error) {
        console.error('Error fetching user location:', error);
      }
    };

    fetchUserLocation();
  }, []);

  // Fetch route when user location and destination are available
  useEffect(() => {
    if (userLocation && location?.coordinates) {
      const fetchRoute = async () => {
        try {
          // Using OpenStreetMap's OSRM demo server for routing
          const response = await fetch(
            `https://router.project-osrm.org/route/v1/driving/${userLocation.longitude},${userLocation.latitude};${location.coordinates.longitude},${location.coordinates.latitude}?overview=full&geometries=geojson`
          );
          const data = await response.json();

          if (data.routes && data.routes.length > 0) {
            const geojsonRoute = data.routes[0].geometry;
            // OSRM returns [longitude, latitude], Leaflet expects [latitude, longitude]
            const routeCoordinates = geojsonRoute.coordinates.map((coord: [number, number]) => [coord[1], coord[0]]);
            setRoute(routeCoordinates);
          }
        } catch (error) {
          console.error('Error fetching route:', error);
        }
      };

      fetchRoute();
    }
  }, [userLocation, location?.coordinates]);

  if (!location) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-gray-500">Location not found. Please try again.</p>
      </div>
    );
  }

  const calculateDuration = () => {
    if (startDate && endDate) {
      const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    }
    return 0;
  };

  const isBookingFormValid = startDate && endDate && guests > 0 && isAuthenticated;

  const handleBooking = () => {
    if (isBookingFormValid) {
      const duration = calculateDuration();
      
      addBooking({
        locationId: location.id,
        locationName: location.name,
        locationType: location.type,
        locationImage: location.image,
        startDate: startDate!,
        endDate: endDate!,
        duration,
        guests
      });
      
      toast({
        title: "Booking Confirmed!",
        description: `You've successfully booked ${location.name} for ${duration} days.`,
      });
      
      navigate('/bookings');
    }
  };

  const calculateAverageRating = () => {
    if (reviews.length === 0) return location.rating;
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    return sum / reviews.length;
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      <div className="flex-1 ml-20 md:ml-64">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-start justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold">{location.name}</h1>
              <div className="flex items-center text-gray-600 mt-2">
                <span className="px-2 py-1 bg-gray-200 rounded text-sm font-medium mr-2">
                  {location.type === 'lodge' ? 'Lodge' : 'Restaurant'}
                </span>
                <span className="flex items-center">
                  <svg className="w-4 h-4 text-yellow-500 fill-current" viewBox="0 0 24 24">
                    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                  </svg>
                  <span className="ml-1">{calculateAverageRating().toFixed(1)}</span>
                </span>
                {location.distance && (
                  <span className="ml-2">{location.distance} km away</span>
                )}
              </div>
            </div>

            <Button
              variant="outline"
              onClick={() => navigate(-1)}
              className="mt-4 md:mt-0"
            >
              Back to Explore
            </Button>
          </div>
          
          {/* Image Carousel */}
          <div className="mb-8">
            <Carousel className="w-full">
              <CarouselContent>
                {[location.image, ...mockImages].map((image, index) => (
                  <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3">
                    <div className="p-1">
                      <Card>
                        <CardContent className="flex aspect-video items-center justify-center p-0">
                          <img 
                            src={image} 
                            alt={`${location.name} view ${index + 1}`} 
                            className="h-full w-full object-cover rounded-md"
                          />
                        </CardContent>
                      </Card>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="ml-8" />
              <CarouselNext className="mr-8" />
            </Carousel>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              <Tabs defaultValue="details" value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-6">
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="reviews">Reviews</TabsTrigger>
                </TabsList>
                
                <TabsContent value="details" className="mt-0">
                  <div className="bg-white p-6 rounded-lg shadow-md mb-8">
                    <h2 className="text-xl font-bold mb-4">About this location</h2>
                    <p className="text-gray-700 mb-4">
                      {location.description}
                    </p>
                    <div className="border-t pt-4">
                      <h3 className="font-semibold mb-2">Address</h3>
                      <p className="text-gray-600">{location.address}</p>
                    </div>
                  </div>
                  
                  {/* Map */}
                  {location.coordinates && (
                    <div className="bg-white p-6 rounded-lg shadow-md mb-8">
                      <h2 className="text-xl font-bold mb-4">Location Map</h2>
                      <div style={{ height: '400px', width: '100%' }}>
                        <MapContainer center={[location.coordinates.latitude, location.coordinates.longitude]} zoom={13} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
                          <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                          />
                          <Marker position={[location.coordinates.latitude, location.coordinates.longitude]}>
                            <Popup>
                              {location.name}
                            </Popup>
                          </Marker>
                          {userLocation && (
                            <Marker position={[userLocation.latitude, userLocation.longitude]}>
                              <Popup>Your Location</Popup>
                            </Marker>
                          )}
                           {route && (
                            <Polyline positions={route} color="blue" />
                          )}
                        </MapContainer>
                      </div>
                    </div>
                  )}

                  {/* Preview of Reviews */}
                  <div className="bg-white p-6 rounded-lg shadow-md mb-8">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-xl font-bold">Reviews</h2>
                      <Button 
                        variant="link" 
                        onClick={() => setActiveTab("reviews")}
                        className="text-primary"
                      >
                        View All
                      </Button>
                    </div>
                    
                    <ReviewCard 
                      reviews={reviews.slice(0, 3)} 
                      onLike={toggleLike}
                      isLoading={reviewsLoading}
                      onViewAll={() => setActiveTab("reviews")}
                    />
                  </div>
                </TabsContent>
                
                <TabsContent value="reviews" className="mt-0">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="md:col-span-1">
                      <RatingCard 
                        rating={calculateAverageRating()} 
                        totalReviews={reviews.length} 
                      />
                    </div>
                    <div className="md:col-span-2">
                      <ReviewList 
                        reviews={reviews}
                        onAddReview={addReview}
                        onLike={toggleLike}
                        isLoading={reviewsLoading}
                      />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
            
            {/* Booking Form */}
            <div className="lg:col-span-1">
              <div className="bg-white p-6 rounded-lg shadow-md sticky top-20">
                <h2 className="text-xl font-bold mb-4">Book this {location.type}</h2>
                
                {!isAuthenticated ? (
                  <div className="text-center py-6">
                    <p className="text-gray-600 mb-4">You need to be logged in to book this location</p>
                    <Button onClick={() => navigate('/auth', { state: { from: `/location/${location.id}` } })}>
                      Sign In to Book
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Date Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Check-in - Check-out
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "justify-start text-left font-normal",
                                !startDate && "text-muted-foreground"
                              )}
                            >
                              <Calendar className="mr-2 h-4 w-4" />
                              {startDate ? format(startDate, "PPP") : <span>Check-in</span>}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <CalendarComponent
                              mode="single"
                              selected={startDate}
                              onSelect={setStartDate}
                              disabled={(date) => date < new Date()}
                              initialFocus
                              className={cn("p-3 pointer-events-auto")}
                            />
                          </PopoverContent>
                        </Popover>
                        
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "justify-start text-left font-normal",
                                !endDate && "text-muted-foreground"
                              )}
                              disabled={!startDate}
                            >
                              <Calendar className="mr-2 h-4 w-4" />
                              {endDate ? format(endDate, "PPP") : <span>Check-out</span>}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <CalendarComponent
                              mode="single"
                              selected={endDate}
                              onSelect={setEndDate}
                              disabled={(date) => !startDate || date <= startDate || date < new Date()}
                              initialFocus
                              className={cn("p-3 pointer-events-auto")}
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                    
                    {/* Guests */}
                    <div>
                      <label htmlFor="guests" className="block text-sm font-medium text-gray-700 mb-1">
                        Number of guests
                      </label>
                      <Input
                        type="number"
                        id="guests"
                        min={1}
                        max={10}
                        value={guests}
                        onChange={(e) => setGuests(Math.max(1, parseInt(e.target.value) || 1))}
                      />
                    </div>
                    
                    {/* Payment Method */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Payment Method
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        <Button
                          type="button"
                          variant={paymentMethod === "credit_card" ? "default" : "outline"}
                          className="text-sm h-10"
                          onClick={() => setPaymentMethod("credit_card")}
                        >
                          Credit Card
                        </Button>
                        <Button
                          type="button"
                          variant={paymentMethod === "paypal" ? "default" : "outline"}
                          className="text-sm h-10"
                          onClick={() => setPaymentMethod("paypal")}
                        >
                          PayPal
                        </Button>
                        <Button
                          type="button"
                          variant={paymentMethod === "bank_transfer" ? "default" : "outline"}
                          className="text-sm h-10"
                          onClick={() => setPaymentMethod("bank_transfer")}
                        >
                          Bank Transfer
                        </Button>
                      </div>
                    </div>
                    
                    {/* Booking Summary */}
                    {startDate && endDate && (
                      <div className="border-t border-dashed pt-4 mt-4">
                        <h3 className="font-medium mb-2">Booking Summary</h3>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span>Duration:</span>
                            <span className="font-medium">{calculateDuration()} days</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Guests:</span>
                            <span className="font-medium">{guests}</span>
                          </div>
                          <div className="flex justify-between font-bold text-base mt-2">
                            <span>Total:</span>
                            <span>Kw{calculateDuration() * (location.type === 'lodge' ? 99 : 45)}</span>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <Button 
                      onClick={handleBooking} 
                      className="w-full mt-4"
                      disabled={!isBookingFormValid}
                    >
                      Book Now
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocationDetail;
