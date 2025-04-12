
export interface PredictionMetrics {
  mse: number;  // Mean Squared Error
  r2: number;   // R-squared (coefficient of determination)
  mae: number;  // Mean Absolute Error
}

export interface PredictionResult {
  predictions: number[];  // Array of predicted power outputs
  metrics: PredictionMetrics;
  featureImportance: Record<string, number>;  // Feature importance scores
}
