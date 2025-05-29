import React, { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Explore from "./pages/Explore";
import Bookings from "./pages/Bookings";
import Favorites from "./pages/Favorites";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import LocationDetail from "./pages/LocationDetail";
import About from "./pages/About";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import { LocationProvider } from "./contexts/LocationContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { LocationErrorBoundary } from "./components/LocationErrorBoundary";
import ProtectedRoute from "./components/ProtectedRoute";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { useLocations } from "./contexts/LocationContext";
import { Spinner } from "@/components/ui/spinner";

// Create a new QueryClient instance
const queryClient = new QueryClient();

const LocationBoundaryWrapper = ({ children }: { children: React.ReactNode }) => {
  const { isOutsideZambia } = useLocations();

  return (
    <>
      {isOutsideZambia && (
        <Alert className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            You appear to be outside Zambia. Some features may be limited, and locations will be shown relative to Lusaka.
          </AlertDescription>
        </Alert>
      )}
      <LocationErrorBoundary>
        {children}
      </LocationErrorBoundary>
    </>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <LocationProvider>
            <div className="min-h-screen">
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <React.Suspense 
                  fallback={
                    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
                      <Spinner className="w-12 h-12 text-primary mb-4" />
                      <p className="text-gray-600 text-sm">Loading WanderMate...</p>
                    </div>
                  }
                >
                  <Routes>
                    <Route path="/" element={
                      <LocationBoundaryWrapper>
                        <Index />
                      </LocationBoundaryWrapper>
                    } />
                    <Route path="/explore" element={
                      <LocationBoundaryWrapper>
                        <Explore />
                      </LocationBoundaryWrapper>
                    } />
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/location/:locationId" element={
                      <LocationBoundaryWrapper>
                        <LocationDetail />
                      </LocationBoundaryWrapper>
                    } />
                    <Route path="/bookings" element={
                      <ProtectedRoute>
                        <LocationBoundaryWrapper>
                          <Bookings />
                        </LocationBoundaryWrapper>
                      </ProtectedRoute>
                    } />
                    <Route path="/favorites" element={
                      <ProtectedRoute>
                        <LocationBoundaryWrapper>
                          <Favorites />
                        </LocationBoundaryWrapper>
                      </ProtectedRoute>
                    } />
                    <Route path="/about" element={<About />} />
                    <Route path="/privacy" element={<Privacy />} />
                    <Route path="/terms" element={<Terms />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </React.Suspense>
              </BrowserRouter>
            </div>
          </LocationProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
