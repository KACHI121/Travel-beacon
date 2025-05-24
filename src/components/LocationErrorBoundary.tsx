import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class LocationErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Location error:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };
  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 max-w-md mx-auto bg-white rounded-lg shadow-lg">
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-5 w-5" />
            <AlertTitle>Location Error</AlertTitle>
            <AlertDescription>
              {this.state.error?.message || 'An error occurred while fetching location data.'}
            </AlertDescription>
          </Alert>
          <div className="mt-6 space-y-6">
            <div className="bg-gray-50 p-4 rounded-md">
              <h3 className="font-medium text-gray-900 mb-2">This could be due to:</h3>
              <ul className="list-disc list-inside space-y-2 text-sm text-gray-600">
                <li>No internet connection</li>
                <li>Location services being disabled</li>
                <li>Being outside the supported region (Zambia)</li>
              </ul>
            </div>
            <div className="flex flex-col space-y-3">
              <Button 
                onClick={this.handleRetry}
                className="w-full"
                size="lg"
              >
                Try Again
              </Button>
              <Button 
                variant="outline" 
                onClick={() => window.location.href = '/explore'}
                className="w-full"
                size="lg"
              >
                Browse Without Location
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
