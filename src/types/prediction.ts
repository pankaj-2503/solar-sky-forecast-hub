
export interface PredictionMetrics {
  mse: number;  // Mean Squared Error
  r2: number;   // R-squared (coefficient of determination)
  mae: number;  // Mean Absolute Error
}

export interface ModelResult {
  name: string;
  predictions: number[];
  metrics: PredictionMetrics;
  featureImportance: Record<string, number>;
  color: string;
}

export interface PredictionResult {
  predictions: number[];  // Array of predicted power outputs (default model)
  metrics: PredictionMetrics;
  featureImportance: Record<string, number>;
  modelResults: ModelResult[];  // Results from multiple models
  actualPower?: number[];  // Actual power values if available (now optional)
}

export interface WeatherPredictionData {
  temperature: number;
  humidity: number;
  windSpeed: number;
  solarIrradiance: number;
  pm10?: number;
  pm25?: number;
  cloudCover?: number;
  actualPower?: number;  // Now optional
  time?: string;
}
