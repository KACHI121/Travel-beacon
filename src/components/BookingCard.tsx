
import React from 'react';
import { Booking } from '../types';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Users } from 'lucide-react';
import { format } from 'date-fns';
import { useLocations } from '@/contexts/LocationContext';

interface BookingCardProps {
  booking: Booking;
}

const BookingCard: React.FC<BookingCardProps> = ({ booking }) => {
  const { cancelBooking } = useLocations();

  return (
    <Card className="overflow-hidden">
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-1">
          <img 
            src={booking.locationImage} 
            alt={booking.locationName}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="col-span-2 p-4">
          <div className="flex justify-between items-start">
            <h3 className="font-semibold text-lg">{booking.locationName}</h3>
            <span className="text-xs uppercase px-2 py-0.5 bg-gray-100 rounded-full">
              {booking.locationType}
            </span>
          </div>
          
          <div className="space-y-2 mt-3">
            <div className="flex items-center text-gray-600">
              <Calendar className="w-4 h-4 mr-2" />
              <span className="text-sm">
                {format(booking.startDate, 'MMM dd, yyyy')} - {format(booking.endDate, 'MMM dd, yyyy')}
              </span>
            </div>
            
            <div className="flex items-center text-gray-600">
              <Clock className="w-4 h-4 mr-2" />
              <span className="text-sm">{booking.duration} days</span>
            </div>
            
            <div className="flex items-center text-gray-600">
              <Users className="w-4 h-4 mr-2" />
              <span className="text-sm">{booking.guests} guests</span>
            </div>
          </div>
          
          <CardFooter className="px-0 pt-4">
            <Button 
              variant="outline" 
              size="sm" 
              className="text-red-500 border-red-500 hover:bg-red-50"
              onClick={() => cancelBooking(booking.id)}
            >
              Cancel Booking
            </Button>
          </CardFooter>
        </div>
      </div>
    </Card>
  );
};

export default BookingCard;
