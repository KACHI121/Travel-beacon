
import React from 'react';
import Sidebar from '../components/Sidebar';
import { useLocations } from '../contexts/LocationContext';
import BookingCard from '../components/BookingCard';
import { CalendarX2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Link } from 'react-router-dom';

const Bookings = () => {
  const { bookings } = useLocations();

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 ml-20 md:ml-64">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-6">Your Bookings</h1>
          
          <div className="space-y-6">
            {bookings.length > 0 ? (
              bookings.map(booking => (
                <BookingCard key={booking.id} booking={booking} />
              ))
            ) : (
              <div className="bg-white rounded-lg p-12 text-center">
                <div className="flex justify-center mb-4">
                  <CalendarX2 className="h-16 w-16 text-gray-300" />
                </div>
                <h3 className="text-xl font-medium mb-2">No Bookings Found</h3>
                <p className="text-gray-500 mb-6">
                  You don't have any active bookings at the moment.
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
    </div>
  );
};

export default Bookings;
