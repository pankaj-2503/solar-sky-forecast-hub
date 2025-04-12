
import { Sun, Droplets, Wind, BatteryCharging } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { WeatherData } from "@/types/weather";

interface SolarPowerCardProps {
  weatherData: WeatherData | null;
  isLoading: boolean;
}

const SolarPowerCard = ({ weatherData, isLoading }: SolarPowerCardProps) => {
  if (isLoading) {
    return (
      <Card className="data-card-gradient mt-4 animate-pulse-slow">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center">
            <Sun className="mr-2 h-5 w-5" />
            Solar Power Conditions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
        </CardContent>
      </Card>
    );
  }

  if (!weatherData) {
    return null;
  }

  // Calculate estimated solar power efficiency
  const calculateSolarEfficiency = () => {
    let efficiency = 100;
    
    // Reduce efficiency based on weather conditions
    if (weatherData.cloudCover > 30) {
      efficiency -= (weatherData.cloudCover - 30) * 0.8;
    }
    
    if (weatherData.humidity > 70) {
      efficiency -= (weatherData.humidity - 70) * 0.3;
    }
    
    // PM2.5 and PM10 greatly affect solar panel efficiency
    if (weatherData.airQuality.pm2_5 > 15) {
      efficiency -= (weatherData.airQuality.pm2_5 - 15) * 0.5;
    }
    
    if (weatherData.airQuality.pm10 > 30) {
      efficiency -= (weatherData.airQuality.pm10 - 30) * 0.3;
    }
    
    // Wind actually can help clean panels at moderate speeds
    if (weatherData.windSpeed > 3 && weatherData.windSpeed < 10) {
      efficiency += 2;
    }
    
    // Cap between 0 and 100
    return Math.max(0, Math.min(100, efficiency));
  };

  const estimatedEfficiency = calculateSolarEfficiency();
  
  // Get color based on efficiency
  const getEfficiencyColor = (efficiency: number) => {
    if (efficiency >= 80) return "text-green-500";
    if (efficiency >= 60) return "text-yellow-500";
    if (efficiency >= 40) return "text-orange-500";
    return "text-red-500";
  };

  // Get estimated power output (very simplified)
  const estimatePowerOutput = () => {
    // Assume a 1kW system with standard test conditions producing 1000W
    const standardTestOutput = 1000; // watts
    const currentOutput = (standardTestOutput * weatherData.solarIrradiance / 1000) * (estimatedEfficiency / 100);
    return Math.max(0, currentOutput);
  };

  const powerOutput = estimatePowerOutput();

  // Factors affecting solar power
  const factors = [
    {
      name: "Solar Irradiance",
      value: `${weatherData.solarIrradiance.toFixed(0)} W/m²`,
      icon: <Sun className="h-4 w-4 text-solar-500" />,
      impact: weatherData.solarIrradiance > 600 ? "Optimal" : weatherData.solarIrradiance > 300 ? "Moderate" : "Low",
      impactColor: weatherData.solarIrradiance > 600 ? "text-green-500" : weatherData.solarIrradiance > 300 ? "text-yellow-500" : "text-red-500"
    },
    {
      name: "Cloud Cover",
      value: `${weatherData.cloudCover}%`,
      icon: <Cloud className="h-4 w-4 text-gray-500" />,
      impact: weatherData.cloudCover < 30 ? "Low impact" : weatherData.cloudCover < 70 ? "Moderate impact" : "High impact",
      impactColor: weatherData.cloudCover < 30 ? "text-green-500" : weatherData.cloudCover < 70 ? "text-yellow-500" : "text-red-500"
    },
    {
      name: "Humidity",
      value: `${weatherData.humidity}%`,
      icon: <Droplets className="h-4 w-4 text-sky-500" />,
      impact: weatherData.humidity < 60 ? "Low impact" : weatherData.humidity < 80 ? "Moderate impact" : "High impact",
      impactColor: weatherData.humidity < 60 ? "text-green-500" : weatherData.humidity < 80 ? "text-yellow-500" : "text-red-500"
    },
    {
      name: "Dust (PM10)",
      value: `${weatherData.airQuality.pm10.toFixed(1)} μg/m³`,
      icon: <Wind className="h-4 w-4 text-orange-400" />,
      impact: weatherData.airQuality.pm10 < 20 ? "Low impact" : weatherData.airQuality.pm10 < 50 ? "Moderate impact" : "High impact",
      impactColor: weatherData.airQuality.pm10 < 20 ? "text-green-500" : weatherData.airQuality.pm10 < 50 ? "text-yellow-500" : "text-red-500"
    }
  ];

  return (
    <Card className="data-card-gradient mt-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center">
          <BatteryCharging className="mr-2 h-5 w-5 text-solar-500" />
          Solar Power Conditions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center mb-4">
          <div className="inline-flex items-center justify-center h-24 w-24 rounded-full bg-gradient-to-br from-solar-200 to-solar-400 mb-2">
            <span className="text-2xl font-bold">{estimatedEfficiency.toFixed(0)}%</span>
          </div>
          <h3 className="font-medium">Estimated Panel Efficiency</h3>
          <p className={`text-sm ${getEfficiencyColor(estimatedEfficiency)}`}>
            {powerOutput.toFixed(0)} W output (1kW system)
          </p>
        </div>
        
        <div className="space-y-3">
          <p className="text-sm font-medium mb-1">Factors affecting power output:</p>
          {factors.map((factor) => (
            <div key={factor.name} className="flex items-center justify-between text-sm p-2 bg-gray-100 dark:bg-gray-800 rounded">
              <div className="flex items-center">
                {factor.icon}
                <span className="ml-2">{factor.name}: {factor.value}</span>
              </div>
              <span className={factor.impactColor}>{factor.impact}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default SolarPowerCard;
