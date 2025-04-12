
import { 
  Cloud, 
  Droplets, 
  Wind, 
  Thermometer, 
  Gauge, 
  Sun, 
  AlertTriangle
} from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { WeatherData } from "@/types/weather";

interface WeatherCardProps {
  data: WeatherData;
  isLoading: boolean;
}

const WeatherCard = ({ data, isLoading }: WeatherCardProps) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6 animate-fade-in">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="data-card-gradient h-32 animate-pulse-slow">
            <CardContent className="p-6 flex items-center justify-center">
              <div className="w-full h-full bg-gray-200 dark:bg-gray-700 rounded-md opacity-50"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!data) {
    return null;
  }

  // Air quality index interpretation
  const getAQICategory = (aqi: number) => {
    if (aqi <= 50) return { label: "Good", color: "text-green-500" };
    if (aqi <= 100) return { label: "Moderate", color: "text-yellow-500" };
    if (aqi <= 150) return { label: "Unhealthy for Sensitive Groups", color: "text-orange-500" };
    if (aqi <= 200) return { label: "Unhealthy", color: "text-red-500" };
    if (aqi <= 300) return { label: "Very Unhealthy", color: "text-purple-500" };
    return { label: "Hazardous", color: "text-rose-700" };
  };

  const aqiInfo = getAQICategory(data.airQuality.aqi);

  const cards = [
    {
      title: "Temperature",
      value: `${data.temperature.toFixed(1)}°C`,
      icon: <Thermometer className="h-6 w-6 text-red-500" />,
      detail: `Feels like: ${data.feelsLike.toFixed(1)}°C`
    },
    {
      title: "Pressure",
      value: `${data.pressure} hPa`,
      icon: <Gauge className="h-6 w-6 text-blue-500" />,
      detail: data.pressure > 1013 ? "High pressure" : "Low pressure"
    },
    {
      title: "Wind",
      value: `${data.windSpeed.toFixed(1)} m/s`,
      icon: <Wind className="h-6 w-6 text-sky-500" />,
      detail: `Direction: ${data.windDirection}°`
    },
    {
      title: "Solar Irradiance",
      value: `${data.solarIrradiance.toFixed(0)} W/m²`,
      icon: <Sun className="h-6 w-6 text-solar-500" />,
      detail: data.solarIrradiance > 600 ? "High" : data.solarIrradiance > 300 ? "Medium" : "Low"
    },
    {
      title: "Humidity",
      value: `${data.humidity}%`,
      icon: <Droplets className="h-6 w-6 text-sky-400" />,
      detail: data.humidity > 70 ? "High humidity" : data.humidity < 30 ? "Low humidity" : "Moderate humidity"
    },
    {
      title: "Air Quality",
      value: `AQI: ${data.airQuality.aqi}`,
      icon: <AlertTriangle className={`h-6 w-6 ${aqiInfo.color}`} />,
      detail: aqiInfo.label
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6 animate-fade-in">
      {cards.map((card, index) => (
        <Card key={index} className="data-card-gradient overflow-hidden">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">
                  {card.title}
                </h3>
                <p className="text-2xl font-bold">{card.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{card.detail}</p>
              </div>
              <div>
                {card.icon}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default WeatherCard;
