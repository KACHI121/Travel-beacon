import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  message?: string;
}

export function Spinner({ className, message, ...props }: SpinnerProps) {
  return (
    <div
      className={cn('flex flex-col items-center justify-center', className)}
      {...props}
    >
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      {message && <p className="mt-4 text-sm text-gray-600">{message}</p>}
    </div>
  );
}
