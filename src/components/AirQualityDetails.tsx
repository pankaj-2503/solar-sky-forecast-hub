
import { Lungs, AlertTriangle, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { AirQuality } from "@/types/weather";

interface AirQualityDetailsProps {
  airQuality: AirQuality | null;
  isLoading: boolean;
}

const AirQualityDetails = ({ airQuality, isLoading }: AirQualityDetailsProps) => {
  if (isLoading) {
    return (
      <Card className="data-card-gradient mt-4 animate-pulse-slow">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center">
            <Lungs className="mr-2 h-5 w-5" />
            Air Quality Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="space-y-1">
                <div className="bg-gray-200 dark:bg-gray-700 h-4 w-24 rounded"></div>
                <Progress value={0} className="h-2 bg-gray-200 dark:bg-gray-700" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!airQuality) {
    return null;
  }

  // Helper to get color based on pollutant value
  const getPollutantColor = (value: number, max: number) => {
    const percentage = (value / max) * 100;
    if (percentage <= 33) return "text-green-500";
    if (percentage <= 66) return "text-yellow-500";
    return "text-red-500";
  };

  // Helper to get progress color
  const getProgressColor = (value: number, max: number) => {
    const percentage = (value / max) * 100;
    if (percentage <= 33) return "bg-green-500";
    if (percentage <= 66) return "bg-yellow-500";
    return "bg-red-500";
  };

  const pollutants = [
    { name: "PM2.5", value: airQuality.pm2_5, unit: "μg/m³", max: 75 },
    { name: "PM10", value: airQuality.pm10, unit: "μg/m³", max: 150 },
    { name: "NO2", value: airQuality.no2, unit: "μg/m³", max: 200 },
    { name: "SO2", value: airQuality.so2, unit: "μg/m³", max: 350 },
    { name: "O3", value: airQuality.o3, unit: "μg/m³", max: 180 },
  ];

  // Get overall AQI category
  const getAQICategory = (aqi: number) => {
    if (aqi <= 50) return { label: "Good", color: "text-green-500", description: "Air quality is satisfactory, and poses little or no risk." };
    if (aqi <= 100) return { label: "Moderate", color: "text-yellow-500", description: "Air quality is acceptable. However, there may be moderate health concern for a small number of sensitive people." };
    if (aqi <= 150) return { label: "Unhealthy for Sensitive Groups", color: "text-orange-500", description: "Members of sensitive groups may experience health effects. The general public is less likely to be affected." };
    if (aqi <= 200) return { label: "Unhealthy", color: "text-red-500", description: "Some members of the general public may experience health effects. Sensitive groups may experience more serious effects." };
    if (aqi <= 300) return { label: "Very Unhealthy", color: "text-purple-500", description: "Health alert: The risk of health effects is increased for everyone." };
    return { label: "Hazardous", color: "text-rose-700", description: "Health warning of emergency conditions. The entire population is likely to be affected." };
  };

  const aqiInfo = getAQICategory(airQuality.aqi);

  return (
    <Card className="data-card-gradient mt-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center">
          <Lungs className="mr-2 h-5 w-5" />
          Air Quality Details
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4 p-4 rounded-md bg-gray-100 dark:bg-gray-800">
          <div className="flex items-start justify-between">
            <div>
              <p className={`font-medium ${aqiInfo.color}`}>AQI: {airQuality.aqi} - {aqiInfo.label}</p>
              <p className="text-sm mt-1 text-muted-foreground">{aqiInfo.description}</p>
            </div>
            <AlertTriangle className={`h-5 w-5 ${aqiInfo.color}`} />
          </div>
        </div>
        
        <div className="space-y-3">
          {pollutants.map((pollutant) => (
            <div key={pollutant.name} className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">{pollutant.name}</span>
                <span className={`text-sm ${getPollutantColor(pollutant.value, pollutant.max)}`}>
                  {pollutant.value} {pollutant.unit}
                </span>
              </div>
              <Progress 
                value={(pollutant.value / pollutant.max) * 100} 
                className={`h-2 ${getProgressColor(pollutant.value, pollutant.max)}`}
              />
            </div>
          ))}
        </div>
        
        <div className="mt-4 pt-3 border-t text-xs text-muted-foreground flex items-center">
          <RefreshCw className="h-3 w-3 mr-1" />
          <span>Updated {new Date().toLocaleTimeString()}</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default AirQualityDetails;
