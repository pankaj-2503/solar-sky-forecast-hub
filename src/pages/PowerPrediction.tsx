
import { useState } from "react";
import { FileWarning } from "lucide-react";
import FileUpload from "@/components/FileUpload";
import PredictionResults from "@/components/PredictionResults";
import { PredictionResult } from "@/types/prediction";

const PowerPrediction = () => {
  const [uploadedData, setUploadedData] = useState<any[] | null>(null);
  const [predictionResults, setPredictionResults] = useState<PredictionResult | null>(null);

  const handleDataProcessed = (data: any[], results: PredictionResult) => {
    setUploadedData(data);
    setPredictionResults(results);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            Solar Power Prediction
          </h1>
          <p className="text-muted-foreground max-w-md">
            Upload your meteorological data to predict solar power output and analyze dust impact
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          <div className="card-glass p-6">
            <h2 className="text-xl font-medium mb-4">Random Forest Model</h2>
            <p className="text-sm text-muted-foreground mb-6">
              This tool uses a Random Forest regression model to predict solar PV power output
              based on meteorological data and dust measurements. Upload your data to get started.
            </p>
            
            <FileUpload onDataProcessed={handleDataProcessed} />
          </div>

          {uploadedData && predictionResults ? (
            <PredictionResults 
              data={uploadedData} 
              results={predictionResults} 
            />
          ) : (
            <div className="mt-12 text-center">
              <FileWarning className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-30" />
              <p className="text-muted-foreground">
                Upload your data to see prediction results
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PowerPrediction;
