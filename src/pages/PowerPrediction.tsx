
import { useState, useEffect } from "react";
import { FileWarning, Database, Sun, ArrowDown, ChevronDown, CloudSun, Wind, Thermometer, Droplets } from "lucide-react";
import FileUpload from "@/components/FileUpload";
import LocationInput from "@/components/LocationInput";
import PredictionResults from "@/components/PredictionResults";
import { PredictionResult, WeatherPredictionData } from "@/types/prediction";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { fetchHistoricalWeatherData } from "@/services/weatherService";
import { generatePredictions } from "@/services/mlModelService";

const PowerPrediction = () => {
  const [uploadedData, setUploadedData] = useState<any[] | null>(null);
  const [predictionResults, setPredictionResults] = useState<PredictionResult | null>(null);
  const [weatherData, setWeatherData] = useState<WeatherPredictionData[] | null>(null);
  const [activeTab, setActiveTab] = useState<string>("upload");
  const [loading, setLoading] = useState<boolean>(false);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(false);

  // Auto-refresh weather data every 30 minutes if enabled
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;
    
    if (autoRefresh && weatherData && weatherData.length > 0) {
      // Get last used coordinates
      const lastLat = weatherData[0].latitude || 0;
      const lastLon = weatherData[0].longitude || 0;
      
      if (lastLat && lastLon) {
        intervalId = setInterval(() => {
          handleLocationSubmit(lastLat, lastLon);
          toast.info("Refreshing weather data...");
        }, 30 * 60 * 1000); // 30 minutes
      }
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [autoRefresh, weatherData]);

  const handleDataProcessed = async (data: any[], results: PredictionResult) => {
    setUploadedData(data);
    setPredictionResults(results);
  };

  const handleLocationSubmit = async (lat: number, lon: number) => {
    try {
      setLoading(true);
      // Fetch real historical weather data based on location
      const historicalData = await fetchHistoricalWeatherData(lat, lon);
      
      // Add coordinates to data for possible refresh
      const enhancedData = historicalData.map(item => ({
        ...item,
        latitude: lat,
        longitude: lon
      }));
      
      setWeatherData(enhancedData);
      toast.success(`Fetched ${historicalData.length} hours of weather data for lat: ${lat.toFixed(2)}, lon: ${lon.toFixed(2)}`);
    } catch (error) {
      console.error("Error fetching historical weather data:", error);
      toast.error("Failed to fetch historical weather data");
    } finally {
      setLoading(false);
    }
  };

  // Function to process weather data with ML models
  const processWeatherWithModels = async () => {
    if (!weatherData || weatherData.length === 0) {
      toast.error("No weather data available");
      return;
    }
    
    try {
      setLoading(true);
      
      // Process with ML models
      const results = await generatePredictions(weatherData, true);
      
      // Update state
      setUploadedData(weatherData);
      setPredictionResults(results);
      
      toast.success("Weather data analyzed successfully with machine learning models");
    } catch (error) {
      console.error("Error processing weather data:", error);
      toast.error("Failed to analyze weather data");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            Solar Power Prediction
          </h1>
          <p className="text-muted-foreground max-w-xl">
            Dynamic ML models to predict solar power output and analyze dust impact on PV performance using real-time data
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Sun className="mr-2 h-5 w-5 text-yellow-500" />
                ML Prediction Models
              </CardTitle>
              <CardDescription>
                Fetch real-time meteorological data for machine learning prediction
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
                    subtitle="We'll fetch real meteorological data for the past 24 hours including regional dust levels"
                  />
                  
                  {loading && (
                    <div className="mt-4 p-4 text-center">
                      <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
                      <p className="text-sm text-muted-foreground">Fetching real-time weather data...</p>
                    </div>
                  )}
                  
                  {weatherData && weatherData.length > 0 && (
                    <div className="mt-6">
                      <Card className="bg-muted/50">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center justify-between">
                            <div className="flex items-center">
                              <Database className="mr-2 h-4 w-4" />
                              Real Weather Data Fetched
                            </div>
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => setAutoRefresh(!autoRefresh)}
                              className="text-xs h-6 px-2"
                            >
                              {autoRefresh ? "Auto-refresh on" : "Auto-refresh off"}
                            </Button>
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
                              <p className="font-medium">{weatherData[weatherData.length-1].temperature.toFixed(1)}°C</p>
                            </div>
                            <div className="bg-background rounded p-2">
                              <div className="flex items-center mb-1">
                                <Sun className="h-3 w-3 mr-1 text-yellow-500" />
                                <p className="text-muted-foreground">Irradiance</p>
                              </div>
                              <p className="font-medium">{weatherData[weatherData.length-1].solarIrradiance.toFixed(0)} W/m²</p>
                            </div>
                            <div className="bg-background rounded p-2">
                              <div className="flex items-center mb-1">
                                <CloudSun className="h-3 w-3 mr-1 text-amber-500" />
                                <p className="text-muted-foreground">PM10</p>
                              </div>
                              <p className="font-medium">{weatherData[weatherData.length-1].pm10?.toFixed(1)} µg/m³</p>
                            </div>
                          </div>
                          
                          <div className="mt-4 grid grid-cols-4 gap-2 text-xs">
                            <div className="bg-background rounded p-2">
                              <div className="flex items-center mb-1">
                                <Droplets className="h-3 w-3 mr-1 text-blue-500" />
                                <p className="text-muted-foreground">Humidity</p>
                              </div>
                              <p className="font-medium">{weatherData[weatherData.length-1].humidity.toFixed(1)}%</p>
                            </div>
                            <div className="bg-background rounded p-2">
                              <div className="flex items-center mb-1">
                                <Wind className="h-3 w-3 mr-1 text-cyan-500" />
                                <p className="text-muted-foreground">Wind</p>
                              </div>
                              <p className="font-medium">{weatherData[weatherData.length-1].windSpeed.toFixed(1)} m/s</p>
                            </div>
                            <div className="bg-background rounded p-2">
                              <div className="flex items-center mb-1">
                                <CloudSun className="h-3 w-3 mr-1 text-gray-500" />
                                <p className="text-muted-foreground">PM2.5</p>
                              </div>
                              <p className="font-medium">{weatherData[weatherData.length-1].pm25?.toFixed(1)} µg/m³</p>
                            </div>
                            <div className="bg-background rounded p-2">
                              <div className="flex items-center mb-1">
                                <CloudSun className="h-3 w-3 mr-1 text-blue-300" />
                                <p className="text-muted-foreground">Cloud</p>
                              </div>
                              <p className="font-medium">{weatherData[weatherData.length-1].cloudCover?.toFixed(1)}%</p>
                            </div>
                          </div>
                          
                          <div className="mt-4">
                            <Button 
                              size="sm" 
                              className="w-full"
                              onClick={processWeatherWithModels}
                              disabled={loading}
                            >
                              <ArrowDown className="h-4 w-4 mr-2" />
                              Analyze with Machine Learning Models
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
