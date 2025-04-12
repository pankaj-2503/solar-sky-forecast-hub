
import { useState, useEffect } from "react";
import { useLocalStorage } from "@/hooks/use-local-storage";
import LocationInput from "@/components/LocationInput";
import WeatherCard from "@/components/WeatherCard";
import AirQualityDetails from "@/components/AirQualityDetails";
import SolarPowerCard from "@/components/SolarPowerCard";
import { fetchWeatherData } from "@/services/weatherService";
import { WeatherData } from "@/types/weather";
import { Cloud, MapPin } from "lucide-react";

const Index = () => {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastLocation, setLastLocation] = useLocalStorage<{lat: number, lon: number} | null>("last-location", null);

  // Load last searched location when component mounts
  useEffect(() => {
    if (lastLocation) {
      handleLocationSubmit(lastLocation.lat, lastLocation.lon);
    }
  }, []);

  const handleLocationSubmit = async (latitude: number, longitude: number) => {
    setIsLoading(true);
    try {
      const data = await fetchWeatherData(latitude, longitude);
      setWeatherData(data);
      setLastLocation({ lat: latitude, lon: longitude });
    } catch (error) {
      console.error("Error fetching weather data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center text-center mb-8">
          <div className="inline-flex items-center justify-center p-2 bg-primary rounded-full mb-4">
            <Cloud className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            Solar Sky Forecast Hub
          </h1>
          <p className="text-muted-foreground max-w-md">
            Monitor weather conditions and solar power performance for any location
          </p>
        </div>

        <LocationInput onLocationSubmit={handleLocationSubmit} />

        {!weatherData && !isLoading && (
          <div className="flex flex-col items-center justify-center mt-16 text-center">
            <MapPin className="h-16 w-16 text-muted-foreground mb-4 opacity-30" />
            <p className="text-muted-foreground">
              Enter latitude and longitude to get started with weather and solar data
            </p>
          </div>
        )}

        {(weatherData || isLoading) && (
          <div className="mt-8">
            {weatherData && (
              <div className="mb-6 text-center">
                <h2 className="text-xl font-medium">
                  Weather Data for Location
                </h2>
                <p className="text-muted-foreground">
                  {weatherData.location.latitude.toFixed(6)}, {weatherData.location.longitude.toFixed(6)}
                </p>
              </div>
            )}

            <WeatherCard data={weatherData!} isLoading={isLoading} />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <AirQualityDetails airQuality={weatherData?.airQuality || null} isLoading={isLoading} />
              <SolarPowerCard weatherData={weatherData} isLoading={isLoading} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
