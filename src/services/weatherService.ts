
import { WeatherData, AirQuality } from "@/types/weather";

// This is a mock service for demonstration purposes
// In a real application, you would make API calls to a weather service

export const fetchWeatherData = async (
  latitude: number,
  longitude: number
): Promise<WeatherData> => {
  console.log(`Fetching weather data for lat: ${latitude}, lon: ${longitude}`);
  
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Generate realistic mock data based on coordinates
  // This could be replaced with actual API calls in production
  
  // Temperature varies with latitude (cooler towards poles)
  const latitudeEffect = Math.abs(latitude) / 90;
  const baseTemp = 30 - latitudeEffect * 30;
  const tempVariation = Math.random() * 10 - 5;
  const temperature = baseTemp + tempVariation;
  
  // Solar irradiance is higher near equator
  const equatorDistance = Math.abs(latitude) / 90;
  const maxIrradiance = 1000 * (1 - equatorDistance * 0.7);
  const timeOfDayFactor = 0.7 + Math.random() * 0.3; // Simulating time of day
  const solarIrradiance = maxIrradiance * timeOfDayFactor;
  
  // Air quality tends to be worse in certain longitude bands (simulating industrial regions)
  const industrialFactor = (Math.sin(longitude / 30) + 1) / 2;
  const aqiBase = 30 + industrialFactor * 70;
  
  const airQuality: AirQuality = {
    aqi: Math.round(aqiBase + Math.random() * 30),
    pm2_5: Math.round((10 + industrialFactor * 40 + Math.random() * 15) * 10) / 10,
    pm10: Math.round((20 + industrialFactor * 60 + Math.random() * 25) * 10) / 10,
    o3: Math.round((40 + Math.random() * 40) * 10) / 10,
    no2: Math.round((10 + industrialFactor * 30 + Math.random() * 20) * 10) / 10,
    so2: Math.round((5 + industrialFactor * 25 + Math.random() * 15) * 10) / 10,
    co: Math.round((300 + industrialFactor * 700 + Math.random() * 300) * 10) / 10
  };
  
  // Wind speed tends to be higher near coasts and in certain regions
  const longitudeFactor = (Math.sin(longitude / 20) + 1) / 2;
  const windSpeed = 2 + longitudeFactor * 10 + Math.random() * 5;
  
  return {
    temperature,
    feelsLike: temperature - 2 + Math.random() * 4,
    humidity: Math.round(40 + Math.random() * 40),
    pressure: Math.round(1000 + Math.random() * 30),
    windSpeed,
    windDirection: Math.round(Math.random() * 360),
    cloudCover: Math.round(10 + Math.random() * 70),
    solarIrradiance,
    uvIndex: Math.round(Math.min(12, (11 * (1 - equatorDistance) * timeOfDayFactor))),
    airQuality,
    location: {
      latitude,
      longitude
    }
  };
};
