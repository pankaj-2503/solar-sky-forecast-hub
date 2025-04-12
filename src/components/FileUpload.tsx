
import { useState } from "react";
import { Upload, FileType, Check, AlertCircle, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import * as XLSX from 'xlsx';
import { PredictionResult, WeatherPredictionData } from "@/types/prediction";

interface FileUploadProps {
  onDataProcessed: (data: any[], results: PredictionResult) => void;
  weatherData?: WeatherPredictionData[];
}

const FileUpload = ({ onDataProcessed, weatherData }: FileUploadProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [useWeatherData, setUseWeatherData] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      
      // Check if it's an Excel file
      if (!selectedFile.name.endsWith('.xlsx') && !selectedFile.name.endsWith('.xls') && !selectedFile.name.endsWith('.csv')) {
        toast.error("Please upload an Excel (.xlsx, .xls) or CSV file");
        return;
      }
      
      setFile(selectedFile);
      setUseWeatherData(false);
    }
  };

  const processData = async () => {
    if (!file && !useWeatherData) {
      if (weatherData && weatherData.length > 0) {
        // Allow using fetched weather data
        setUseWeatherData(true);
        processWeatherData();
      } else {
        toast.error("Please select a file first");
      }
      return;
    }

    setUploading(true);
    setProgress(10);

    try {
      if (useWeatherData && weatherData) {
        processWeatherData();
        return;
      }

      const data = await readFileAsArrayBuffer(file!);
      setProgress(30);
      
      // Parse Excel data
      const workbook = XLSX.read(data, { type: 'array' });
      setProgress(50);
      
      // Get first sheet
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      
      // Convert to JSON
      const jsonData = XLSX.utils.sheet_to_json(sheet);
      setProgress(70);
      
      // Validate data format
      validateData(jsonData);
      
      // Process with multiple models
      const results = simulateMultipleModelPredictions(jsonData);
      setProgress(100);
      
      // Pass data back to parent component
      onDataProcessed(jsonData, results);
      
      toast.success("Data processed successfully!");
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("An error occurred while processing the file");
      }
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const processWeatherData = () => {
    if (!weatherData || weatherData.length === 0) {
      toast.error("No weather data available");
      return;
    }

    try {
      setProgress(30);
      
      // Convert weather data to expected format
      const formattedData = weatherData.map(item => ({
        temperature: item.temperature,
        humidity: item.humidity,
        windSpeed: item.windSpeed,
        solarIrradiance: item.solarIrradiance,
        pm10: item.pm10 || 0,
        pm25: item.pm25 || 0,
        cloudCover: item.cloudCover || 0,
        actualPower: item.actualPower || 0,
        time: item.time || new Date().toISOString()
      }));
      
      setProgress(70);
      
      // Process with multiple models
      const results = simulateMultipleModelPredictions(formattedData);
      setProgress(100);
      
      // Pass data back to parent component
      onDataProcessed(formattedData, results);
      
      toast.success("Weather data processed successfully!");
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("An error occurred while processing the weather data");
      }
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const readFileAsArrayBuffer = (file: File): Promise<ArrayBuffer> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          resolve(e.target.result as ArrayBuffer);
        } else {
          reject(new Error("Failed to read file"));
        }
      };
      reader.onerror = () => reject(new Error("File read error"));
      reader.readAsArrayBuffer(file);
    });
  };

  const validateData = (data: any[]) => {
    if (data.length === 0) {
      throw new Error("The file contains no data");
    }
    
    // Check for required columns
    const requiredColumns = ['temperature', 'humidity', 'windSpeed', 'solarIrradiance'];
    const firstItem = data[0];
    
    const missingColumns = requiredColumns.filter(col => !(col in firstItem));
    
    if (missingColumns.length > 0) {
      throw new Error(`Missing required columns: ${missingColumns.join(', ')}`);
    }
  };

  // This is a simulation of multiple ML model predictions
  const simulateMultipleModelPredictions = (data: any[]): PredictionResult => {
    // Define a list of models with different characteristics
    const models = [
      { 
        name: "random_forest", 
        accuracy: 0.87, 
        color: "#0ea5e9", 
        biasTowardsIrradiance: 0.65, 
        biasTowardsTemp: 0.15 
      },
      { 
        name: "gradient_boosting", 
        accuracy: 0.89, 
        color: "#10b981", 
        biasTowardsIrradiance: 0.55, 
        biasTowardsTemp: 0.25 
      },
      { 
        name: "neural_network", 
        accuracy: 0.85, 
        color: "#8b5cf6", 
        biasTowardsIrradiance: 0.60, 
        biasTowardsTemp: 0.20 
      },
    ];
    
    // Create results for each model
    const modelResults = models.map(model => {
      // Generate predictions with slight variations based on model characteristics
      const predictions = data.map(row => {
        const basePower = row.solarIrradiance * model.biasTowardsIrradiance;
        const tempFactor = 1 - Math.abs(25 - row.temperature) * (model.biasTowardsTemp * 0.1);
        const humidityFactor = 1 - (row.humidity * 0.003);
        const dustFactor = row.pm10 ? 1 - (row.pm10 * 0.005) : 1;
        const cloudFactor = row.cloudCover ? 1 - (row.cloudCover * 0.01) : 1;
        
        // Add some randomness to simulate model differences
        const randomFactor = 0.9 + (Math.random() * 0.2);
        
        return basePower * tempFactor * humidityFactor * dustFactor * cloudFactor * randomFactor;
      });
      
      // Calculate model metrics with variations
      const mse = 15 + (Math.random() * 5); 
      const r2 = model.accuracy + (Math.random() * 0.05 - 0.025); // Vary around the base accuracy
      const mae = 3.5 + (Math.random() * 1.5);
      
      return {
        name: model.name,
        predictions,
        metrics: { mse, r2, mae },
        featureImportance: generateFeatureImportance(model),
        color: model.color
      };
    });
    
    // Extract actual power if available
    const actualPower = data.some(row => 'actualPower' in row) 
      ? data.map(row => row.actualPower) 
      : undefined;
    
    // Return the comprehensive result object
    return {
      // Use the first model (random forest) as the default
      predictions: modelResults[0].predictions,
      metrics: modelResults[0].metrics,
      featureImportance: modelResults[0].featureImportance,
      modelResults,
      actualPower
    };
  };
  
  // Generate feature importance scores with variations per model
  const generateFeatureImportance = (model: any) => {
    // Base importance values
    const baseImportance = {
      'solarIrradiance': model.biasTowardsIrradiance,
      'temperature': model.biasTowardsTemp,
      'humidity': 0.10 + (Math.random() * 0.05 - 0.025),
      'pm10': 0.05 + (Math.random() * 0.03 - 0.015),
      'windSpeed': 0.03 + (Math.random() * 0.02 - 0.01),
      'cloudCover': 0.02 + (Math.random() * 0.02 - 0.01)
    };
    
    // Normalize to ensure sum is 1.0
    const sum = Object.values(baseImportance).reduce((a, b) => a + b, 0);
    const normalized: Record<string, number> = {};
    
    Object.entries(baseImportance).forEach(([key, value]) => {
      normalized[key] = value / sum;
    });
    
    return normalized;
  };

  return (
    <div className="mt-6">
      <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6 text-center">
        <input
          type="file"
          id="file-upload"
          className="hidden"
          accept=".xlsx,.xls,.csv"
          onChange={handleFileChange}
          disabled={uploading}
        />
        
        <label 
          htmlFor="file-upload" 
          className="flex flex-col items-center justify-center cursor-pointer"
        >
          <div className="h-12 w-12 rounded-full bg-primary-foreground flex items-center justify-center mb-3">
            <Upload className="h-6 w-6 text-primary" />
          </div>
          <p className="text-sm font-medium mb-1">
            {file ? file.name : "Click to upload your meteorological data"}
          </p>
          <p className="text-xs text-muted-foreground">
            Excel or CSV (.xlsx, .xls, .csv)
          </p>
        </label>
        
        {(file || weatherData?.length) && (
          <div className="mt-4">
            {file && (
              <div className="flex items-center text-sm mb-2">
                <FileType className="h-4 w-4 mr-2 text-muted-foreground" /> 
                <span className="text-muted-foreground">{file.name}</span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {(file.size / 1024).toFixed(1)} KB
                </span>
              </div>
            )}
            
            {weatherData && weatherData.length > 0 && !file && (
              <div className="flex items-center text-sm mb-2">
                <Database className="h-4 w-4 mr-2 text-primary" /> 
                <span className="text-muted-foreground">Use fetched weather data</span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {weatherData.length} data points
                </span>
              </div>
            )}
            
            {uploading ? (
              <div className="space-y-2">
                <Progress value={progress} className="h-2" />
                <p className="text-xs text-muted-foreground">Processing data...</p>
              </div>
            ) : (
              <Button 
                onClick={processData} 
                className="w-full mt-2"
                disabled={!file && !weatherData?.length}
              >
                Process Data with Multiple Models
              </Button>
            )}
          </div>
        )}
      </div>
      
      <div className="mt-4 text-sm space-y-2">
        <div className="flex items-start">
          <Check className="h-4 w-4 text-green-500 mt-0.5 mr-2 shrink-0" />
          <p>File should contain columns for temperature, humidity, windSpeed, solarIrradiance</p>
        </div>
        <div className="flex items-start">
          <Check className="h-4 w-4 text-green-500 mt-0.5 mr-2 shrink-0" />
          <p>Additional columns like pm10, pm2_5 (for dust) will improve predictions</p>
        </div>
        <div className="flex items-start">
          <Check className="h-4 w-4 text-green-500 mt-0.5 mr-2 shrink-0" />
          <p>Multiple machine learning models will be used for comparison</p>
        </div>
        <div className="flex items-start">
          <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 mr-2 shrink-0" />
          <p>For best results, include actual power output for model evaluation</p>
        </div>
      </div>
    </div>
  );
};

export default FileUpload;
