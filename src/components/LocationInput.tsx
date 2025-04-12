
import { useState } from 'react';
import { Search, MapPin } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface LocationInputProps {
  onLocationSubmit: (lat: number, lon: number) => void;
  title?: string;
  subtitle?: string;
}

const LocationInput = ({ onLocationSubmit, title = "Enter Location Coordinates", subtitle }: LocationInputProps) => {
  const [latitude, setLatitude] = useState<string>('');
  const [longitude, setLongitude] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);
    
    if (isNaN(lat) || isNaN(lon)) {
      toast.error("Please enter valid latitude and longitude values");
      return;
    }
    
    if (lat < -90 || lat > 90) {
      toast.error("Latitude must be between -90 and 90 degrees");
      return;
    }
    
    if (lon < -180 || lon > 180) {
      toast.error("Longitude must be between -180 and 180 degrees");
      return;
    }
    
    onLocationSubmit(lat, lon);
    toast.success("Fetching weather data for the specified location");
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        
        setLatitude(lat.toFixed(6));
        setLongitude(lon.toFixed(6));
        
        onLocationSubmit(lat, lon);
        toast.success("Using your current location");
      },
      () => {
        toast.error("Unable to retrieve your location");
      }
    );
  };

  return (
    <div className="w-full max-w-3xl mx-auto animate-fade-in">
      <div className="card-glass p-4 md:p-6">
        <h2 className="text-lg font-medium mb-4">{title}</h2>
        {subtitle && <p className="text-sm text-muted-foreground mb-4">{subtitle}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="latitude" className="text-sm font-medium">
                Latitude
              </label>
              <Input
                id="latitude"
                type="number"
                step="any"
                placeholder="Enter latitude (e.g. 37.7749)"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="longitude" className="text-sm font-medium">
                Longitude
              </label>
              <Input
                id="longitude"
                type="number"
                step="any"
                placeholder="Enter longitude (e.g. -122.4194)"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                required
              />
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <Button type="submit" className="flex-1">
              <Search className="mr-2 h-4 w-4" />
              Get Weather Data
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={getCurrentLocation}
              className="flex-1"
            >
              <MapPin className="mr-2 h-4 w-4" />
              Use My Location
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LocationInput;
