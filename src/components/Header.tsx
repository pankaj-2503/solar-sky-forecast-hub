
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Sun, Moon, Menu, X } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

interface HeaderProps {
  theme: "light" | "dark";
  toggleTheme: () => void;
}

const Header = ({ theme, toggleTheme }: HeaderProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50">
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        <Link to="/" className="flex items-center space-x-2">
          <span className="bg-gradient-to-r from-sky-500 to-solar-500 text-transparent bg-clip-text font-bold text-xl">
            SolarSkyForecast
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          <Link to="/" className="text-gray-700 dark:text-gray-300 hover:text-primary transition-colors">
            Weather Dashboard
          </Link>
          <Link to="/power-prediction" className="text-gray-700 dark:text-gray-300 hover:text-primary transition-colors">
            Power Prediction
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="ml-2"
          >
            {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
          </Button>
        </nav>

        {/* Mobile Navigation */}
        <div className="md:hidden flex items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="mr-2"
          >
            {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
          </Button>
          
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu size={20} />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-64 pt-12">
              <nav className="flex flex-col space-y-4">
                <Link 
                  to="/" 
                  className="text-gray-700 dark:text-gray-300 hover:text-primary transition-colors py-2"
                  onClick={() => setIsOpen(false)}
                >
                  Weather Dashboard
                </Link>
                <Link 
                  to="/power-prediction" 
                  className="text-gray-700 dark:text-gray-300 hover:text-primary transition-colors py-2"
                  onClick={() => setIsOpen(false)}
                >
                  Power Prediction
                </Link>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

export default Header;
