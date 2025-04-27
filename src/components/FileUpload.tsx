import { useState } from "react";
import { Upload, FileType, Check, AlertCircle, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import * as XLSX from 'xlsx';
import { PredictionResult, WeatherPredictionData } from "@/types/prediction";
import { generatePredictions } from "@/services/mlModelService";

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
      
      // Validate data format with new requirements
      validateData(jsonData);
      
      // Process with real machine learning models
      const results = await generatePredictions(jsonData, true);
      setProgress(100);
      
      // Pass data back to parent component
      onDataProcessed(jsonData, results);
      
      toast.success("Data processed using machine learning models!");
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

  const processWeatherData = async () => {
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
        time: item.time || new Date().toISOString()
      }));
      
      setProgress(70);
      
      // Process with real machine learning models
      const results = await generatePredictions(formattedData, true);
      setProgress(100);
      
      // Pass data back to parent component
      onDataProcessed(formattedData, results);
      
      toast.success("Weather data processed using machine learning models!");
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
    
    // Check for required columns - update to include all our needed parameters
    const requiredColumns = ['temperature', 'humidity', 'windSpeed', 'solarIrradiance'];
    const firstItem = data[0];
    
    const missingColumns = requiredColumns.filter(col => !(col in firstItem));
    
    if (missingColumns.length > 0) {
      throw new Error(`Missing required columns: ${missingColumns.join(', ')}`);
    }
    
    // Optional columns to check for and inform user
    const optionalColumns = ['pm10', 'pm25', 'cloudCover'];
    const availableOptional = optionalColumns.filter(col => col in firstItem);
    
    if (availableOptional.length > 0) {
      toast.info(`Additional data found: ${availableOptional.join(', ')}. This will improve predictions.`);
    }
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
                <p className="text-xs text-muted-foreground">Processing data with machine learning models...</p>
              </div>
            ) : (
              <Button 
                onClick={processData} 
                className="w-full mt-2"
                disabled={!file && !weatherData?.length}
              >
                Process Data with ML Models
              </Button>
            )}
          </div>
        )}
      </div>
      
      <div className="mt-4 text-sm space-y-2">
        <div className="flex items-start">
          <Check className="h-4 w-4 text-green-500 mt-0.5 mr-2 shrink-0" />
          <p>Required: temperature, humidity, windSpeed, solarIrradiance</p>
        </div>
        <div className="flex items-start">
          <Check className="h-4 w-4 text-green-500 mt-0.5 mr-2 shrink-0" />
          <p>Optional: pm10, pm25 (dust particles), cloudCover (improves predictions)</p>
        </div>
        <div className="flex items-start">
          <Check className="h-4 w-4 text-green-500 mt-0.5 mr-2 shrink-0" />
          <p>Optional: actualPower (for comparing with predictions if available)</p>
        </div>
        <div className="flex items-start">
          <Check className="h-4 w-4 text-green-500 mt-0.5 mr-2 shrink-0" />
          <p>Real machine learning models analyze impact of dust on solar power output</p>
        </div>
      </div>
    </div>
  );
};

export default FileUpload;
