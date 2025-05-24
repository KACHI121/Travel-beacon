import React from 'react';
import { Home, Map, Calendar, Heart, LogIn, LogOut, User } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { cn } from '@/lib/utils';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  
  const navItems = [
    { icon: Home, label: 'Home', href: '/' },
    { icon: Map, label: 'Explore', href: '/explore' },
    { icon: Calendar, label: 'Bookings', href: '/bookings', requireAuth: true },
    { icon: Heart, label: 'Favorites', href: '/favorites', requireAuth: true },
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="h-screen w-20 md:w-64 bg-white border-r shadow-sm flex flex-col fixed left-0 top-0">
      <div className="p-4 flex items-center justify-center md:justify-start">
        <div className="h-10 w-10 rounded-md bg-primary flex items-center justify-center text-white font-bold text-xl">
          W
        </div>
        <h1 className="ml-2 font-bold text-xl hidden md:block">WanderMate</h1>
      </div>
      
      <nav className="mt-8 flex-grow">
        <ul className="space-y-2 px-2">
          {navItems.map((item) => {
            // Skip auth-required items for non-authenticated users
            if (item.requireAuth && !isAuthenticated) return null;
            
            const isActive = location.pathname === item.href || 
                            (item.href !== '/' && location.pathname.startsWith(item.href));
                            
            return (
              <li key={item.label}>
                <Link 
                  to={item.href}
                  className={cn(
                    "flex items-center p-3 rounded-lg",
                    isActive ? "bg-primary/10 text-primary" : "hover:bg-gray-100"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="ml-3 hidden md:block">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      
      <div className="p-4 mt-auto">
        {isAuthenticated ? (
          <div className="space-y-3">
            <div className="flex items-center p-2 rounded-lg bg-gray-50">
              <User className="h-8 w-8 p-1 rounded-full bg-gray-200 text-gray-700" />
              <div className="ml-3 hidden md:block">
                <p className="font-medium text-sm">{user?.name}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              onClick={handleLogout}
              className="w-full flex items-center justify-center md:justify-start gap-2"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden md:block">Sign Out</span>
            </Button>
          </div>
        ) : (
          <Button 
            variant="outline" 
            className="w-full flex items-center justify-center md:justify-start gap-2"
            onClick={() => navigate('/auth')}
          >
            <LogIn className="h-4 w-4" />
            <span className="hidden md:block">Sign In</span>
          </Button>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
