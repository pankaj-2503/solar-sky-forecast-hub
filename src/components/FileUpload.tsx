
import { useState } from "react";
import { Upload, FileType, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";
import { Progress } from "@/components/ui/progress";
import * as XLSX from 'xlsx';
import { PredictionResult } from "@/types/prediction";

interface FileUploadProps {
  onDataProcessed: (data: any[], results: PredictionResult) => void;
}

const FileUpload = ({ onDataProcessed }: FileUploadProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      
      // Check if it's an Excel file
      if (!selectedFile.name.endsWith('.xlsx') && !selectedFile.name.endsWith('.xls') && !selectedFile.name.endsWith('.csv')) {
        toast.error("Please upload an Excel (.xlsx, .xls) or CSV file");
        return;
      }
      
      setFile(selectedFile);
    }
  };

  const processData = async () => {
    if (!file) {
      toast.error("Please select a file first");
      return;
    }

    setUploading(true);
    setProgress(10);

    try {
      const data = await readFileAsArrayBuffer(file);
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
      
      // Process with the random forest model (this is simulated)
      const results = simulateRandomForestPrediction(jsonData);
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

  // This is a simulation of a random forest prediction
  const simulateRandomForestPrediction = (data: any[]): PredictionResult => {
    // In a real app, this would call a proper model
    // For now, we'll simulate results based on the data
    
    // Simulate predicted values
    const predictions = data.map(row => {
      // Very simplified power calculation
      const basePower = row.solarIrradiance * 0.2;
      const tempFactor = 1 - Math.abs(25 - row.temperature) * 0.01;
      const humidityFactor = 1 - (row.humidity * 0.003);
      const dustFactor = row.pm10 ? 1 - (row.pm10 * 0.005) : 1;
      
      const predictedPower = basePower * tempFactor * humidityFactor * dustFactor;
      return predictedPower;
    });
    
    // Calculate model metrics
    const mse = 15.23; // Mean squared error
    const r2 = 0.87; // R-squared
    const mae = 3.78; // Mean absolute error
    
    // Feature importance (simulated)
    const featureImportance = {
      'solarIrradiance': 0.65,
      'temperature': 0.15,
      'humidity': 0.10,
      'pm10': 0.05,
      'windSpeed': 0.03,
      'cloudCover': 0.02
    };
    
    return {
      predictions,
      metrics: {
        mse,
        r2,
        mae
      },
      featureImportance
    };
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
        
        {file && (
          <div className="mt-4">
            <div className="flex items-center text-sm mb-2">
              <FileType className="h-4 w-4 mr-2 text-muted-foreground" /> 
              <span className="text-muted-foreground">{file.name}</span>
              <span className="ml-auto text-xs text-muted-foreground">
                {(file.size / 1024).toFixed(1)} KB
              </span>
            </div>
            
            {uploading ? (
              <div className="space-y-2">
                <Progress value={progress} className="h-2" />
                <p className="text-xs text-muted-foreground">Processing file...</p>
              </div>
            ) : (
              <Button 
                onClick={processData} 
                className="w-full mt-2"
                disabled={!file}
              >
                Process Data
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
          <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 mr-2 shrink-0" />
          <p>For best results, include actual power output for model training</p>
        </div>
      </div>
    </div>
  );
};

export default FileUpload;
