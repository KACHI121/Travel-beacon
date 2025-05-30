import React from 'react';
import { Booking } from '@/types';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Users, CreditCard, AlertCircle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useLocations } from '@/contexts/LocationContext';
import { toast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';

interface BookingCardProps {
  booking: Booking;
}

const BookingCard: React.FC<BookingCardProps> = ({ booking }) => {
  const { cancelBooking } = useLocations();

  const formatDate = (date: Date | string) => {
    try {
      if (typeof date === 'string') {
        const parsedDate = parseISO(date);
        if (isNaN(parsedDate.getTime())) throw new Error('Invalid date string');
        return format(parsedDate, 'MMM dd, yyyy');
      }
      if (!(date instanceof Date) || isNaN(date.getTime())) {
        throw new Error('Invalid date object');
      }
      return format(date, 'MMM dd, yyyy');
    } catch (error) {
      console.error('Error formatting date:', date, error);
      toast({
        title: "Display Error",
        description: "There was a problem displaying the date. Please contact support.",
        variant: "destructive"
      });
      return 'Invalid date';
    }
  };

  const getStatusColor = (status: Booking['status']) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status: Booking['payment_status']) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'processing': return 'bg-yellow-100 text-yellow-800';
      case 'refunded': return 'bg-red-100 text-red-800';
      case 'unpaid': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

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
            <div className="flex flex-col gap-2">
              <Badge className={getStatusColor(booking.status)}>
                {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
              </Badge>
              <Badge className={getPaymentStatusColor(booking.payment_status)}>
                {booking.payment_status.charAt(0).toUpperCase() + booking.payment_status.slice(1)}
              </Badge>
            </div>
          </div>
          
          <div className="space-y-2 mt-3">
            <div className="flex items-center text-gray-600">
              <Calendar className="w-4 h-4 mr-2" />
              <span className="text-sm">
                {formatDate(booking.startDate)} - {formatDate(booking.endDate)}
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

            <div className="flex items-center text-gray-600">
              <CreditCard className="w-4 h-4 mr-2" />
              <span className="text-sm">{booking.payment_method}</span>
            </div>

            <div className="flex items-center text-gray-600">
              <AlertCircle className="w-4 h-4 mr-2" />
              <span className="text-sm">Total: ${booking.total_amount.toFixed(2)}</span>
            </div>
          </div>
          
          <CardFooter className="px-0 pt-4">
            {booking.status === 'pending' && (
              <Button 
                variant="outline" 
                size="sm" 
                className="text-red-500 border-red-500 hover:bg-red-50"
                onClick={() => cancelBooking(booking.id)}
              >
                Cancel Booking
              </Button>
            )}
          </CardFooter>
        </div>
      </div>
    </Card>
  );
};

export default BookingCard;
