
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PredictionResult, ModelResult } from "@/types/prediction";
import { ChartPieIcon, BarChart3Icon, LineChartIcon, ExternalLink, Download, Wind, Droplets, Thermometer, SunIcon, CloudIcon, Gauge } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PredictionResultsProps {
  data: any[];
  results: PredictionResult;
}

const PredictionResults = ({ data, results }: PredictionResultsProps) => {
  const combinedData = data.map((item, index) => {
    const dataPoint: any = { ...item, index: index + 1 };
    
    results.modelResults.forEach(model => {
      dataPoint[`${model.name}`] = model.predictions[index];
    });
    
    if (results.actualPower) {
      dataPoint.actualPower = results.actualPower[index];
    }
    
    return dataPoint;
  });
  
  // Format date for X-axis if time is available
  const formatXAxis = (value: number) => {
    // If we have timestamp data in the original dataset
    if (data[value-1] && data[value-1].time) {
      const date = new Date(data[value-1].time);
      return date.getHours() + ':00';
    }
    return value;
  };
  
  const featureImportanceData = Object.entries(results.featureImportance).map(([feature, importance]) => ({
    feature,
    importance: importance * 100
  })).sort((a, b) => b.importance - a.importance);

  const modelMetricsData = results.modelResults.map(model => ({
    model: model.name,
    r2: model.metrics.r2 * 100,
    accuracy: (1 - model.metrics.mse / 100) * 100,
    efficiency: (1 - model.metrics.mae / 10) * 100,
  }));

  const formatModelName = (name: string) => {
    return name.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const getFeatureIcon = (feature: string) => {
    switch (feature.toLowerCase()) {
      case 'temperature':
        return <Thermometer className="h-4 w-4 text-red-500" />;
      case 'humidity':
        return <Droplets className="h-4 w-4 text-blue-500" />;
      case 'windspeed':
        return <Wind className="h-4 w-4 text-cyan-500" />;
      case 'solarirradiance':
        return <SunIcon className="h-4 w-4 text-yellow-500" />;
      case 'pm10':
        return <Gauge className="h-4 w-4 text-amber-500" />;
      case 'pm25':
        return <Gauge className="h-4 w-4 text-orange-500" />;
      case 'pm2.5':
        return <Gauge className="h-4 w-4 text-orange-500" />;
      case 'cloudcover':
        return <CloudIcon className="h-4 w-4 text-gray-500" />;
      default:
        return <ChartPieIcon className="h-4 w-4 text-indigo-500" />;
    }
  };

  const calculateMaxDustImpact = () => {
    const maxPM10 = Math.max(...data.map(row => row.pm10 || 0));
    const maxPM25 = Math.max(...data.map(row => row.pm25 || 0));
    
    const pm10Impact = maxPM10 * 0.005; // 0.5% per unit
    const pm25Impact = maxPM25 * 0.01;  // 1% per unit
    
    const maxImpact = Math.max(pm10Impact, pm25Impact) * 100;
    return Math.round(maxImpact);
  };

  // Try to determine if we have time-based data
  const hasTimeData = data && data.length > 0 && data[0].time !== undefined;

  return (
    <div className="mt-8 space-y-6 animate-fade-in">
      <Card className="data-card-gradient">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Model Comparison</CardTitle>
            <CardDescription>
              Comparing multiple prediction models for solar power output
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" className="hidden md:flex">
            <Download className="h-4 w-4 mr-2" />
            Export Results
          </Button>
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
                  margin={{ top: 5, right: 30, left: 20, bottom: 25 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="index" 
                    tick={{ fontSize: 12 }}
                    tickFormatter={hasTimeData ? formatXAxis : undefined}
                    label={{ 
                      value: hasTimeData ? 'Time (hours)' : 'Sample Index', 
                      position: 'insideBottom', 
                      offset: -5 
                    }}
                  />
                  <YAxis
                    label={{ 
                      value: 'Power Output (W/m²)', 
                      angle: -90, 
                      position: 'insideLeft', 
                      style: { textAnchor: 'middle' },
                      offset: 10
                    }}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip formatter={(value) => [`${value} W/m²`, 'Power Output']} />
                  <Legend />
                  
                  {results.modelResults.map((model) => (
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
                  <PolarAngleAxis dataKey="model" tickFormatter={formatModelName} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
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
                      <TableHead className="text-right">MAE (W/m²)</TableHead>
                      <TableHead className="text-right">MSE (W/m²)²</TableHead>
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {results.modelResults.map((model) => (
              <div key={model.name} className="p-4 bg-background rounded-lg text-center border-l-4" style={{ borderLeftColor: model.color }}>
                <p className="text-sm text-muted-foreground mb-1">{formatModelName(model.name)}</p>
                <p className="text-3xl font-bold" style={{ color: model.color }}>{model.metrics.r2.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground mt-1">R² Score (0-1)</p>
                <div className="flex justify-between mt-2 text-xs">
                  <div>
                    <p className="text-muted-foreground">MAE</p>
                    <p className="font-medium">{model.metrics.mae.toFixed(2)} W/m²</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">MSE</p>
                    <p className="font-medium">{model.metrics.mse.toFixed(2)} (W/m²)²</p>
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
          <CardDescription>
            How different meteorological factors affect power prediction
          </CardDescription>
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
                  label={{ value: 'Importance (%)', position: 'insideBottom', offset: -5 }}
                />
                <YAxis
                  type="category"
                  dataKey="feature"
                  tick={{ fontSize: 12 }}
                  width={120}
                  tickFormatter={(value) => {
                    return value === 'pm25' ? 'PM2.5' : value.charAt(0).toUpperCase() + value.slice(1)
                  }}
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
          
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            {featureImportanceData.slice(0, 4).map(item => (
              <div key={item.feature} className="bg-background rounded-lg p-3 flex items-center">
                <div className="mr-3">
                  {getFeatureIcon(item.feature)}
                </div>
                <div>
                  <p className="text-xs font-medium capitalize">
                    {item.feature === 'pm25' ? 'PM2.5' : item.feature}
                  </p>
                  <p className="text-sm font-bold">{item.importance.toFixed(1)}%</p>
                </div>
              </div>
            ))}
          </div>
          
          <p className="text-sm text-muted-foreground mt-4">
            Higher values indicate more significant impact on the model's power output predictions.
            {featureImportanceData.some(item => ['pm10', 'pm25'].includes(item.feature.toLowerCase())) && 
              " Dust metrics (PM10, PM2.5) show substantial influence on solar panel efficiency."}
          </p>
        </CardContent>
      </Card>
      
      <Card className="data-card-gradient">
        <CardHeader>
          <CardTitle>Parameter Impact Analysis</CardTitle>
          <CardDescription>
            How changes in environmental conditions affect power generation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-sm font-medium flex items-center">
                <Thermometer className="h-4 w-4 mr-2 text-red-500" />
                Temperature Effect
              </h3>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={combinedData.map((item, i) => ({
                      index: i + 1,
                      temperature: item.temperature,
                      power: results.modelResults[0].predictions[i]
                    }))}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="index"
                      tickFormatter={hasTimeData ? formatXAxis : undefined}
                      label={{ 
                        value: hasTimeData ? 'Time (hours)' : 'Sample Index', 
                        position: 'insideBottom', 
                        offset: -5 
                      }}
                    />
                    <YAxis yAxisId="left" orientation="left" stroke="#ef4444" domain={['auto', 'auto']} 
                          label={{ value: 'Temperature (°C)', angle: -90, position: 'insideLeft' }} />
                    <YAxis yAxisId="right" orientation="right" stroke="#0ea5e9" domain={['auto', 'auto']} 
                          label={{ value: 'Power (W/m²)', angle: 90, position: 'insideRight' }} />
                    <Tooltip formatter={(value, name) => [
                      `${value} ${name === 'temperature' ? '°C' : 'W/m²'}`,
                      name === 'temperature' ? 'Temperature' : 'Power Output'
                    ]}/>
                    <Legend />
                    <Line yAxisId="left" type="monotone" dataKey="temperature" stroke="#ef4444" name="Temperature" />
                    <Line yAxisId="right" type="monotone" dataKey="power" stroke="#0ea5e9" name="Power Output" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-sm font-medium flex items-center">
                <Gauge className="h-4 w-4 mr-2 text-amber-500" />
                Dust Impact (PM10/PM2.5)
              </h3>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={combinedData.map((item, i) => ({
                      index: i + 1,
                      pm: item.pm10 || item.pm25 || 0,
                      power: results.modelResults[0].predictions[i]
                    }))}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="index"
                      tickFormatter={hasTimeData ? formatXAxis : undefined}
                      label={{ 
                        value: hasTimeData ? 'Time (hours)' : 'Sample Index', 
                        position: 'insideBottom', 
                        offset: -5 
                      }}
                    />
                    <YAxis yAxisId="left" orientation="left" stroke="#f59e0b" domain={['auto', 'auto']} 
                          label={{ value: 'PM Level (µg/m³)', angle: -90, position: 'insideLeft' }} />
                    <YAxis yAxisId="right" orientation="right" stroke="#0ea5e9" domain={['auto', 'auto']} 
                          label={{ value: 'Power (W/m²)', angle: 90, position: 'insideRight' }} />
                    <Tooltip formatter={(value, name) => [
                      `${value} ${name === 'pm' ? 'µg/m³' : 'W/m²'}`, 
                      name === 'pm' ? 'PM Level' : 'Power Output'
                    ]}/>
                    <Legend />
                    <Line yAxisId="left" type="monotone" dataKey="pm" stroke="#f59e0b" name="PM Level" />
                    <Line yAxisId="right" type="monotone" dataKey="power" stroke="#0ea5e9" name="Power Output" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-900">
            <div className="flex items-start">
              <div className="mr-3 mt-1">
                <SunIcon className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <h4 className="font-medium text-sm">Dust Accumulation Impact</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Based on this analysis, PM10 and PM2.5 dust particles can reduce solar power output by 
                  up to {calculateMaxDustImpact()}% under high concentration conditions.
                  Regular cleaning can help maintain optimal efficiency.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PredictionResults;
