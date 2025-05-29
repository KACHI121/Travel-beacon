import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="w-full bg-background mt-auto border-t">
      <div className="container mx-auto py-8">
        <div className="grid grid-cols-1 gap-8 text-center">
          <div className="space-y-6">
            <div className="flex justify-center space-x-6">
              <Link to="/about" className="text-muted-foreground hover:text-foreground transition">
                About
              </Link>
              <Link to="/privacy" className="text-muted-foreground hover:text-foreground transition">
                Privacy Policy
              </Link>
              <Link to="/terms" className="text-muted-foreground hover:text-foreground transition">
                Terms of Service
              </Link>
            </div>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Travel Beacon. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;