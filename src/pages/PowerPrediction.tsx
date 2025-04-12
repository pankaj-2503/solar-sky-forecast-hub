
import { useState } from "react";
import { FileWarning, Database, Sun, ArrowDown, ChevronDown, CloudSun, Wind, Thermometer, Droplets } from "lucide-react";
import FileUpload from "@/components/FileUpload";
import LocationInput from "@/components/LocationInput";
import PredictionResults from "@/components/PredictionResults";
import { PredictionResult, WeatherPredictionData } from "@/types/prediction";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

const PowerPrediction = () => {
  const [uploadedData, setUploadedData] = useState<any[] | null>(null);
  const [predictionResults, setPredictionResults] = useState<PredictionResult | null>(null);
  const [weatherData, setWeatherData] = useState<WeatherPredictionData[] | null>(null);
  const [activeTab, setActiveTab] = useState<string>("upload");

  const handleDataProcessed = (data: any[], results: PredictionResult) => {
    setUploadedData(data);
    setPredictionResults(results);
  };

  const handleLocationSubmit = async (lat: number, lon: number) => {
    try {
      // Generate simulated weather data based on location
      const simulatedData = generateWeatherDataFromLocation(lat, lon);
      setWeatherData(simulatedData);
      toast.success(`Generated weather data for lat: ${lat.toFixed(2)}, lon: ${lon.toFixed(2)}`);
    } catch (error) {
      console.error("Error generating weather data:", error);
      toast.error("Failed to generate weather data");
    }
  };

  // Function to generate weather data based on location
  const generateWeatherDataFromLocation = (lat: number, lon: number): WeatherPredictionData[] => {
    // Generate 24 hours of simulated weather data
    const now = new Date();
    const data: WeatherPredictionData[] = [];
    
    // Use latitude to simulate climate variation (higher latitudes = cooler)
    const baseTempFactor = Math.max(0, 1 - Math.abs(lat) / 90) * 30 + 5; // 5°C to 35°C
    
    // Use longitude for time offset to simulate day/night cycle
    const timeOffset = Math.floor(lon / 15); // rough approximation of time zones
    
    // Different regions have different dust levels
    // Desert regions tend to have higher dust concentrations
    const isDesertRegion = (lat > 15 && lat < 35) || (lat < -15 && lat > -35);
    const isIndustrialRegion = (lat > 30 && lat < 60) && (lon > -10 && lon < 40); // Europe/Industrial
    const basePM10 = isDesertRegion ? 50 : (isIndustrialRegion ? 30 : 15);
    const basePM25 = isDesertRegion ? 25 : (isIndustrialRegion ? 20 : 8);
    
    for (let i = 0; i < 24; i++) {
      const hour = (now.getHours() + i) % 24;
      const time = new Date(now);
      time.setHours(hour);
      
      // Simulate temperature curve over the day
      const hourFactor = Math.sin((hour - 6 + timeOffset) * (Math.PI / 12));
      const temperature = baseTempFactor + hourFactor * 10 * Math.random();
      
      // Higher humidity in the early morning, lower during day
      const humidity = 50 + (hour < 6 ? 30 : 0) + Math.random() * 20;
      
      // Wind tends to pick up during the day
      const windSpeed = 2 + (hour > 8 && hour < 18 ? 5 : 0) + Math.random() * 3;
      
      // Solar irradiance follows daylight pattern
      const daylight = hour >= 6 && hour <= 18;
      const peakHour = Math.abs(hour - 12);
      const solarIrradiance = daylight ? Math.max(0, 1000 * (1 - peakHour / 12) * (1 - Math.abs(lat) / 90)) : 0;
      
      // PM10 dust level varies by region, time of day, etc.
      const daytimePMFactor = (hour > 8 && hour < 18) ? 1.2 : 0.8; // More dust during day
      const pm10 = basePM10 * daytimePMFactor + (Math.random() * 15);
      
      // PM2.5 - often correlated with PM10 but at lower values
      const pm25 = basePM25 * daytimePMFactor + (Math.random() * 10);
      
      // Cloud cover - varies by region and time
      const cloudCover = Math.random() * 100;
      
      data.push({
        temperature,
        humidity,
        windSpeed,
        solarIrradiance,
        pm10,
        pm25,
        cloudCover,
        time: time.toISOString()
      });
    }
    
    return data;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            Solar Power Prediction
          </h1>
          <p className="text-muted-foreground max-w-xl">
            Compare multiple machine learning models to predict solar power output and analyze dust impact on PV performance
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Sun className="mr-2 h-5 w-5 text-yellow-500" />
                Prediction Models
              </CardTitle>
              <CardDescription>
                Choose how you want to provide meteorological data for prediction
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList className="grid grid-cols-2">
                  <TabsTrigger value="upload">Upload Data</TabsTrigger>
                  <TabsTrigger value="location">Use Location</TabsTrigger>
                </TabsList>
                
                <TabsContent value="upload">
                  <FileUpload 
                    onDataProcessed={handleDataProcessed} 
                    weatherData={weatherData || undefined}
                  />
                </TabsContent>
                
                <TabsContent value="location">
                  <LocationInput 
                    onLocationSubmit={handleLocationSubmit} 
                    title="Enter Location for Weather Data"
                    subtitle="We'll generate meteorological data based on your coordinates including regional dust levels"
                  />
                  
                  {weatherData && weatherData.length > 0 && (
                    <div className="mt-6">
                      <Card className="bg-muted/50">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center">
                            <Database className="mr-2 h-4 w-4" />
                            Weather Data Generated
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground">
                            {weatherData.length} hours of meteorological data available
                          </p>
                          <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                            <div className="bg-background rounded p-2">
                              <div className="flex items-center mb-1">
                                <Thermometer className="h-3 w-3 mr-1 text-red-500" />
                                <p className="text-muted-foreground">Temperature</p>
                              </div>
                              <p className="font-medium">{weatherData[0].temperature.toFixed(1)}°C</p>
                            </div>
                            <div className="bg-background rounded p-2">
                              <div className="flex items-center mb-1">
                                <Sun className="h-3 w-3 mr-1 text-yellow-500" />
                                <p className="text-muted-foreground">Irradiance</p>
                              </div>
                              <p className="font-medium">{weatherData[0].solarIrradiance.toFixed(0)} W/m²</p>
                            </div>
                            <div className="bg-background rounded p-2">
                              <div className="flex items-center mb-1">
                                <CloudSun className="h-3 w-3 mr-1 text-amber-500" />
                                <p className="text-muted-foreground">PM10</p>
                              </div>
                              <p className="font-medium">{weatherData[0].pm10?.toFixed(1)} µg/m³</p>
                            </div>
                          </div>
                          
                          <div className="mt-4 grid grid-cols-4 gap-2 text-xs">
                            <div className="bg-background rounded p-2">
                              <div className="flex items-center mb-1">
                                <Droplets className="h-3 w-3 mr-1 text-blue-500" />
                                <p className="text-muted-foreground">Humidity</p>
                              </div>
                              <p className="font-medium">{weatherData[0].humidity.toFixed(1)}%</p>
                            </div>
                            <div className="bg-background rounded p-2">
                              <div className="flex items-center mb-1">
                                <Wind className="h-3 w-3 mr-1 text-cyan-500" />
                                <p className="text-muted-foreground">Wind</p>
                              </div>
                              <p className="font-medium">{weatherData[0].windSpeed.toFixed(1)} m/s</p>
                            </div>
                            <div className="bg-background rounded p-2">
                              <div className="flex items-center mb-1">
                                <CloudSun className="h-3 w-3 mr-1 text-gray-500" />
                                <p className="text-muted-foreground">PM2.5</p>
                              </div>
                              <p className="font-medium">{weatherData[0].pm25?.toFixed(1)} µg/m³</p>
                            </div>
                            <div className="bg-background rounded p-2">
                              <div className="flex items-center mb-1">
                                <CloudSun className="h-3 w-3 mr-1 text-blue-300" />
                                <p className="text-muted-foreground">Cloud</p>
                              </div>
                              <p className="font-medium">{weatherData[0].cloudCover?.toFixed(1)}%</p>
                            </div>
                          </div>
                          
                          <div className="mt-4">
                            <Button 
                              size="sm" 
                              className="w-full"
                              onClick={() => {
                                setActiveTab("upload");
                                toast.info("Use the Process Data button to analyze this weather data");
                              }}
                            >
                              <ArrowDown className="h-4 w-4 mr-2" />
                              Proceed to predictions
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {uploadedData && predictionResults ? (
            <PredictionResults 
              data={uploadedData} 
              results={predictionResults} 
            />
          ) : (
            <div className="mt-12 text-center">
              <FileWarning className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-30" />
              <p className="text-muted-foreground">
                Upload your data or use a location to see prediction results
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PowerPrediction;
