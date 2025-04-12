
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PredictionResult } from "@/types/prediction";

interface PredictionResultsProps {
  data: any[];
  results: PredictionResult;
}

const PredictionResults = ({ data, results }: PredictionResultsProps) => {
  // Combine original data with predictions
  const combinedData = data.map((item, index) => ({
    ...item,
    predictedPower: results.predictions[index]
  }));
  
  // Create data for feature importance chart
  const featureImportanceData = Object.entries(results.featureImportance).map(([feature, importance]) => ({
    feature,
    importance: importance * 100 // Convert to percentage
  })).sort((a, b) => b.importance - a.importance);

  return (
    <div className="mt-8 space-y-6 animate-fade-in">
      <Card className="data-card-gradient">
        <CardHeader>
          <CardTitle>Model Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-background rounded-lg text-center">
              <p className="text-sm text-muted-foreground mb-1">R² Score</p>
              <p className="text-3xl font-bold text-primary">{results.metrics.r2.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground mt-1">Higher is better (0-1)</p>
            </div>
            <div className="p-4 bg-background rounded-lg text-center">
              <p className="text-sm text-muted-foreground mb-1">Mean Absolute Error</p>
              <p className="text-3xl font-bold text-primary">{results.metrics.mae.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground mt-1">Lower is better</p>
            </div>
            <div className="p-4 bg-background rounded-lg text-center">
              <p className="text-sm text-muted-foreground mb-1">Mean Squared Error</p>
              <p className="text-3xl font-bold text-primary">{results.metrics.mse.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground mt-1">Lower is better</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="data-card-gradient">
        <CardHeader>
          <CardTitle>Predicted Power Output</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={combinedData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="time" 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value, index) => `Sample ${index + 1}`}
                />
                <YAxis
                  label={{ value: 'Power (W)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle' } }}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="predictedPower"
                  name="Predicted Power Output"
                  stroke="#0ea5e9"
                  strokeWidth={2}
                  dot={{ r: 1 }}
                  activeDot={{ r: 6 }}
                />
                {data[0].actualPower && (
                  <Line
                    type="monotone"
                    dataKey="actualPower"
                    name="Actual Power Output"
                    stroke="#eab308"
                    strokeWidth={2}
                    dot={{ r: 1 }}
                    activeDot={{ r: 6 }}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      
      <Card className="data-card-gradient">
        <CardHeader>
          <CardTitle>Feature Importance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={featureImportanceData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  type="number" 
                  tick={{ fontSize: 12 }}
                  domain={[0, 100]}
                  tickFormatter={(value) => `${value}%`}
                />
                <YAxis
                  type="category"
                  dataKey="feature"
                  tick={{ fontSize: 12 }}
                  width={100}
                />
                <Tooltip
                  formatter={(value) => [`${value.toFixed(1)}%`, "Importance"]}
                />
                <Bar 
                  dataKey="importance" 
                  name="Importance" 
                  fill="#0ea5e9" 
                  background={{ fill: '#eee' }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            Feature importance shows how each factor affects the prediction of power output.
            Higher values indicate more significant impact on the model's predictions.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default PredictionResults;
