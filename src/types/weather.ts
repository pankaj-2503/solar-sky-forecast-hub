
export interface AirQuality {
  aqi: number;  // Air Quality Index
  pm2_5: number;  // PM2.5 in μg/m³
  pm10: number;  // PM10 in μg/m³
  o3: number;  // Ozone in μg/m³
  no2: number;  // Nitrogen Dioxide in μg/m³
  so2: number;  // Sulfur Dioxide in μg/m³
  co: number;  // Carbon Monoxide in μg/m³
}

export interface WeatherData {
  temperature: number;  // in Celsius
  feelsLike: number;  // in Celsius
  humidity: number;  // percentage
  pressure: number;  // hPa
  windSpeed: number;  // m/s
  windDirection: number;  // degrees
  cloudCover: number;  // percentage
  solarIrradiance: number;  // W/m²
  uvIndex: number;  // UV index
  airQuality: AirQuality;
  location: {
    latitude: number;
    longitude: number;
  };
}
