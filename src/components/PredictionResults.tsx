
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PredictionResult, ModelResult } from "@/types/prediction";
import { ChartPieIcon, BarChart3Icon, LineChartIcon, Activity } from "lucide-react";

interface PredictionResultsProps {
  data: any[];
  results: PredictionResult;
}

const PredictionResults = ({ data, results }: PredictionResultsProps) => {
  // Combine original data with predictions from all models
  const combinedData = data.map((item, index) => {
    const dataPoint: any = { ...item, index: index + 1 };
    
    // Add prediction from each model
    results.modelResults.forEach(model => {
      dataPoint[`${model.name}`] = model.predictions[index];
    });
    
    // Add actual power if available
    if (results.actualPower) {
      dataPoint.actualPower = results.actualPower[index];
    }
    
    return dataPoint;
  });
  
  // Create data for feature importance chart
  const featureImportanceData = Object.entries(results.featureImportance).map(([feature, importance]) => ({
    feature,
    importance: importance * 100 // Convert to percentage
  })).sort((a, b) => b.importance - a.importance);

  // Create comparative model data for radar chart
  const modelMetricsData = results.modelResults.map(model => ({
    model: model.name,
    r2: model.metrics.r2 * 100, // Convert to percentage
    accuracy: (1 - model.metrics.mse / 100) * 100, // Simplified accuracy metric
    efficiency: (1 - model.metrics.mae / 10) * 100, // Efficiency metric
  }));
  
  // Color palette for models
  const getModelColor = (index: number, modelName: string) => {
    const model = results.modelResults.find(m => m.name === modelName);
    return model ? model.color : "#0ea5e9";
  };

  // Format name for display
  const formatModelName = (name: string) => {
    return name.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  return (
    <div className="mt-8 space-y-6 animate-fade-in">
      <Card className="data-card-gradient">
        <CardHeader>
          <CardTitle>Model Comparison</CardTitle>
          <CardDescription>
            Comparing multiple prediction models for solar power output
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="chart" className="space-y-4">
            <TabsList className="grid grid-cols-3 w-full max-w-md mx-auto">
              <TabsTrigger value="chart">
                <LineChartIcon className="h-4 w-4 mr-2" />
                Line Chart
              </TabsTrigger>
              <TabsTrigger value="radar">
                <ChartPieIcon className="h-4 w-4 mr-2" />
                Radar
              </TabsTrigger>
              <TabsTrigger value="table">
                <BarChart3Icon className="h-4 w-4 mr-2" />
                Table
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="chart" className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={combinedData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="index" 
                    tick={{ fontSize: 12 }}
                    label={{ value: 'Sample Index', position: 'insideBottom', offset: -5 }}
                  />
                  <YAxis
                    label={{ value: 'Power (W)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle' } }}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip />
                  <Legend />
                  
                  {results.modelResults.map((model, idx) => (
                    <Line
                      key={model.name}
                      type="monotone"
                      dataKey={model.name}
                      name={formatModelName(model.name)}
                      stroke={model.color}
                      strokeWidth={2}
                      dot={{ r: 1 }}
                      activeDot={{ r: 6 }}
                    />
                  ))}
                  
                  {results.actualPower && (
                    <Line
                      type="monotone"
                      dataKey="actualPower"
                      name="Actual Power Output"
                      stroke="#eab308"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={{ r: 1 }}
                      activeDot={{ r: 6 }}
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </TabsContent>
            
            <TabsContent value="radar" className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={modelMetricsData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="model" />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} />
                  <Radar name="R² Score" dataKey="r2" stroke="#0ea5e9" fill="#0ea5e9" fillOpacity={0.6} />
                  <Radar name="Accuracy" dataKey="accuracy" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
                  <Radar name="Efficiency" dataKey="efficiency" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.6} />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </TabsContent>
            
            <TabsContent value="table">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Model</TableHead>
                      <TableHead className="text-right">R² Score</TableHead>
                      <TableHead className="text-right">MAE</TableHead>
                      <TableHead className="text-right">MSE</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.modelResults.map((model) => (
                      <TableRow key={model.name}>
                        <TableCell className="font-medium flex items-center">
                          <span className="h-3 w-3 rounded-full mr-2" style={{ backgroundColor: model.color }}></span>
                          {formatModelName(model.name)}
                        </TableCell>
                        <TableCell className="text-right">{model.metrics.r2.toFixed(2)}</TableCell>
                        <TableCell className="text-right">{model.metrics.mae.toFixed(2)}</TableCell>
                        <TableCell className="text-right">{model.metrics.mse.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      <Card className="data-card-gradient">
        <CardHeader>
          <CardTitle>Model Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {results.modelResults.map((model, idx) => (
              <div key={model.name} className="p-4 bg-background rounded-lg text-center border-l-4" style={{ borderLeftColor: model.color }}>
                <p className="text-sm text-muted-foreground mb-1">{formatModelName(model.name)}</p>
                <p className="text-3xl font-bold" style={{ color: model.color }}>{model.metrics.r2.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground mt-1">R² Score (0-1)</p>
                <div className="flex justify-between mt-2 text-xs">
                  <div>
                    <p className="text-muted-foreground">MAE</p>
                    <p className="font-medium">{model.metrics.mae.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">MSE</p>
                    <p className="font-medium">{model.metrics.mse.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            ))}
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
                  formatter={(value) => {
                    if (typeof value === 'number') {
                      return [`${value.toFixed(1)}%`, "Importance"];
                    }
                    return [value, "Importance"];
                  }}
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
