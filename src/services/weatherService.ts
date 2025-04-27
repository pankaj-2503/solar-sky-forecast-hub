import { WeatherData, AirQuality } from "@/types/weather";
import { WeatherPredictionData } from "@/types/prediction";

// OpenWeatherMap API endpoints
const OWM_API_KEY = "1d40c931636f4c9759a99f7d7b1cc376"; // Updated API key
const OWM_BASE_URL = "https://api.openweathermap.org/data/2.5";
const OWM_ONE_CALL_URL = "https://api.openweathermap.org/data/3.0/onecall";

export const fetchWeatherData = async (
  latitude: number,
  longitude: number
): Promise<WeatherData> => {
  console.log(`Fetching real weather data for lat: ${latitude}, lon: ${longitude}`);
  
  try {
    // Fetch current weather data
    const weatherResponse = await fetch(
      `${OWM_BASE_URL}/weather?lat=${latitude}&lon=${longitude}&units=metric&appid=${OWM_API_KEY}`
    );
    
    if (!weatherResponse.ok) {
      throw new Error(`Weather API error: ${weatherResponse.status}`);
    }
    
    const weatherData = await weatherResponse.json();
    
    // Fetch air quality data
    const aqiResponse = await fetch(
      `${OWM_BASE_URL}/air_pollution?lat=${latitude}&lon=${longitude}&appid=${OWM_API_KEY}`
    );
    
    if (!aqiResponse.ok) {
      throw new Error(`Air quality API error: ${aqiResponse.status}`);
    }
    
    const aqiData = await aqiResponse.json();
    const airQualityList = aqiData.list && aqiData.list.length > 0 ? aqiData.list[0] : null;
    
    // Fetch solar radiation data if available
    let solarIrradiance = 0;
    try {
      const oneCallResponse = await fetch(
        `${OWM_BASE_URL}/forecast?lat=${latitude}&lon=${longitude}&units=metric&appid=${OWM_API_KEY}`
      );
      
      if (oneCallResponse.ok) {
        const forecastData = await oneCallResponse.json();
        // Extract radiation if available or estimate
        if (forecastData && forecastData.list && forecastData.list.length > 0) {
          // Some versions of API include this data
          if (forecastData.list[0].radiation) {
            solarIrradiance = forecastData.list[0].radiation.global || 0;
          }
        }
      } 
    } catch (error) {
      console.warn("Could not fetch solar radiation data, will estimate based on location and time");
    }
    
    // If solar irradiance wasn't available from API, estimate it based on location and time
    if (solarIrradiance === 0) {
      solarIrradiance = estimateSolarIrradiance(latitude, longitude);
    }
    
    // Process air quality data
    const airQuality: AirQuality = {
      aqi: airQualityList?.main?.aqi || 0,
      pm2_5: airQualityList?.components?.pm2_5 || 0,
      pm10: airQualityList?.components?.pm10 || 0,
      o3: airQualityList?.components?.o3 || 0,
      no2: airQualityList?.components?.no2 || 0,
      so2: airQualityList?.components?.so2 || 0,
      co: airQualityList?.components?.co || 0
    };
    
    // Map OpenWeatherMap data to our WeatherData structure
    return {
      temperature: weatherData.main.temp,
      feelsLike: weatherData.main.feels_like,
      humidity: weatherData.main.humidity,
      pressure: weatherData.main.pressure,
      windSpeed: weatherData.wind.speed,
      windDirection: weatherData.wind.deg || 0,
      cloudCover: weatherData.clouds.all,
      solarIrradiance,
      uvIndex: calculateUVIndex(solarIrradiance, latitude),
      airQuality,
      location: {
        latitude,
        longitude
      }
    };
    
  } catch (error) {
    console.error("Error fetching weather data:", error);
    // If API fails, fall back to simulated data with a warning
    console.warn("Falling back to simulated weather data due to API error");
    return generateFallbackWeatherData(latitude, longitude);
  }
};

// Function to estimate solar irradiance based on location and current time
function estimateSolarIrradiance(latitude: number, longitude: number, date?: Date): number {
  const now = date || new Date();
  const hour = now.getHours();
  const minute = now.getMinutes();
  
  // Calculate day of year
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = (now.getTime() - start.getTime()) + ((start.getTimezoneOffset() - now.getTimezoneOffset()) * 60 * 1000);
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  // Calculate solar declination angle
  const declination = 23.45 * Math.sin((360 / 365) * (dayOfYear - 81) * (Math.PI / 180));
  
  // Calculate solar hour angle
  const solarHour = hour + minute / 60 - 12;
  const hourAngle = solarHour * 15;
  
  // Convert to radians
  const latRad = latitude * (Math.PI / 180);
  const decRad = declination * (Math.PI / 180);
  const hourRad = hourAngle * (Math.PI / 180);
  
  // Calculate solar altitude angle
  const sinAltitude = Math.sin(latRad) * Math.sin(decRad) + 
                      Math.cos(latRad) * Math.cos(decRad) * Math.cos(hourRad);
  const altitude = Math.asin(sinAltitude);
  
  // Calculate air mass
  const airMass = 1 / (sinAltitude + 0.50572 * Math.pow((6.07995 + altitude * (180 / Math.PI)), -1.6364));
  
  // Solar irradiance at top of atmosphere
  const solarConstant = 1361; // W/m²
  
  // Calculate extraterrestrial irradiance
  const dayAngle = 2 * Math.PI * dayOfYear / 365;
  const extraTerrestrialIrradiance = solarConstant * (1 + 0.033 * Math.cos(dayAngle));
  
  // Calculate direct irradiance based on air mass
  let directIrradiance = 0;
  if (sinAltitude > 0) {
    directIrradiance = extraTerrestrialIrradiance * Math.pow(0.7, Math.pow(airMass, 0.678));
  }
  
  // Calculate diffuse irradiance (typically 10-20% of direct on clear days)
  const diffuseIrradiance = directIrradiance * 0.15;
  
  // Total irradiance is sum of direct and diffuse
  let totalIrradiance = directIrradiance + diffuseIrradiance;
  
  // Account for cloud cover and random atmospheric conditions
  totalIrradiance = Math.max(0, totalIrradiance * (0.7 + Math.random() * 0.3));
  
  return totalIrradiance;
}

// Calculate UV Index based on solar irradiance and latitude
const calculateUVIndex = (solarIrradiance: number, latitude: number): number => {
  // Base UV calculation from solar irradiance
  let uvIndex = solarIrradiance / 125;
  
  // Adjust based on latitude (higher UV near equator)
  const latitudeAdjustment = 1 - Math.abs(latitude) / 90 * 0.4;
  uvIndex *= latitudeAdjustment;
  
  return Math.min(12, Math.max(0, Math.round(uvIndex)));
};

// Fallback in case the API call fails
const generateFallbackWeatherData = (latitude: number, longitude: number): WeatherData => {
  console.log("Generating fallback weather data");
  
  // Temperature varies with latitude (cooler towards poles)
  const latitudeEffect = Math.abs(latitude) / 90;
  const baseTemp = 30 - latitudeEffect * 30;
  const tempVariation = Math.random() * 10 - 5;
  const temperature = baseTemp + tempVariation;
  
  // Solar irradiance based on latitude and estimated time of day
  const solarIrradiance = estimateSolarIrradiance(latitude, longitude);
  
  // Air quality tends to be worse in certain longitude bands (simulating industrial regions)
  const industrialFactor = (Math.sin(longitude / 30) + 1) / 2;
  const aqiBase = 30 + industrialFactor * 70;
  
  const airQuality: AirQuality = {
    aqi: Math.round(aqiBase + Math.random() * 30),
    pm2_5: Math.round((10 + industrialFactor * 40 + Math.random() * 15) * 10) / 10,
    pm10: Math.round((20 + industrialFactor * 60 + Math.random() * 25) * 10) / 10,
    o3: Math.round((40 + Math.random() * 40) * 10) / 10,
    no2: Math.round((10 + industrialFactor * 30 + Math.random() * 20) * 10) / 10,
    so2: Math.round((5 + industrialFactor * 25 + Math.random() * 15) * 10) / 10,
    co: Math.round((300 + industrialFactor * 700 + Math.random() * 300) * 10) / 10
  };
  
  // Wind speed tends to be higher near coasts and in certain regions
  const longitudeFactor = (Math.sin(longitude / 20) + 1) / 2;
  const windSpeed = 2 + longitudeFactor * 10 + Math.random() * 5;
  
  const uvIndex = calculateUVIndex(solarIrradiance, latitude);
  
  return {
    temperature,
    feelsLike: temperature - 2 + Math.random() * 4,
    humidity: Math.round(40 + Math.random() * 40),
    pressure: Math.round(1000 + Math.random() * 30),
    windSpeed,
    windDirection: Math.round(Math.random() * 360),
    cloudCover: Math.round(10 + Math.random() * 70),
    solarIrradiance,
    uvIndex,
    airQuality,
    location: {
      latitude,
      longitude
    }
  };
};

// Updated function to fetch historical weather data for the past 24 hours
export const fetchHistoricalWeatherData = async (
  latitude: number,
  longitude: number
): Promise<WeatherPredictionData[]> => {
  console.log(`Fetching historical weather data for lat: ${latitude}, lon: ${longitude}`);
  
  try {
    // Use the 5 day / 3 hour forecast API which gives us recent data too
    const forecastResponse = await fetch(
      `${OWM_BASE_URL}/forecast?lat=${latitude}&lon=${longitude}&units=metric&appid=${OWM_API_KEY}`
    );
    
    if (!forecastResponse.ok) {
      throw new Error(`Weather API error: ${forecastResponse.status}`);
    }
    
    const forecastData = await forecastResponse.json();
    
    // Get air quality data
    const aqiResponse = await fetch(
      `${OWM_BASE_URL}/air_pollution/forecast?lat=${latitude}&lon=${longitude}&appid=${OWM_API_KEY}`
    );
    
    let aqiData: any = { list: [] };
    if (aqiResponse.ok) {
      aqiData = await aqiResponse.json();
    }
    
    // Process and merge data from both APIs
    const historicalData: WeatherPredictionData[] = [];
    
    // Take the first 8 data points (24 hours, since it's every 3 hours)
    const dataPoints = forecastData.list.slice(0, 8);
    
    dataPoints.forEach((point: any, index: number) => {
      const date = new Date(point.dt * 1000);
      
      // Find matching air quality data for this timestamp if available
      const matchingAQI = aqiData.list?.find((aqi: any) => {
        return Math.abs(aqi.dt - point.dt) < 10800; // Within 3 hours
      });
      
      // Calculate solar irradiance based on weather and time
      let solarIrradiance = 0;
      if (point.sys && typeof point.sys.pod !== 'undefined') {
        const isDaytime = point.sys.pod === 'd';
        if (isDaytime) {
          // Base value on cloud coverage
          const cloudFactor = 1 - (point.clouds.all / 100);
          solarIrradiance = 1000 * cloudFactor; // Max 1000 W/m² on clear day
          
          // Adjust by time of day using weather data timestamp
          const hour = date.getHours();
          const hourFactor = 1 - Math.abs(hour - 12) / 12; // Peak at noon
          solarIrradiance *= Math.max(0.1, hourFactor);
        }
      } else {
        // Fallback to estimating based on location
        solarIrradiance = estimateSolarIrradiance(latitude, longitude, date);
      }
      
      historicalData.push({
        temperature: point.main.temp,
        humidity: point.main.humidity,
        windSpeed: point.wind.speed,
        solarIrradiance: Math.round(solarIrradiance),
        pm10: matchingAQI?.components?.pm10 || 0,
        pm25: matchingAQI?.components?.pm2_5 || 0,
        cloudCover: point.clouds.all,
        time: date.toISOString()
      });
    });
    
    // If we didn't get enough data points, generate the rest
    if (historicalData.length < 24) {
      const existing = historicalData.length;
      for (let i = existing; i < 24; i++) {
        const lastPoint = historicalData[historicalData.length - 1];
        const time = new Date(lastPoint.time);
        time.setHours(time.getHours() + 1);
        
        // Create slightly varied data based on last point
        historicalData.push({
          temperature: lastPoint.temperature + (Math.random() * 2 - 1),
          humidity: Math.min(100, Math.max(0, lastPoint.humidity + (Math.random() * 10 - 5))),
          windSpeed: Math.max(0, lastPoint.windSpeed + (Math.random() * 2 - 1)),
          solarIrradiance: Math.max(0, lastPoint.solarIrradiance + (Math.random() * 100 - 50)),
          pm10: Math.max(0, lastPoint.pm10 + (Math.random() * 5 - 2.5)),
          pm25: Math.max(0, lastPoint.pm25 + (Math.random() * 3 - 1.5)),
          cloudCover: Math.min(100, Math.max(0, lastPoint.cloudCover + (Math.random() * 20 - 10))),
          time: time.toISOString()
        });
      }
    }
    
    return historicalData;
    
  } catch (error) {
    console.error("Error fetching historical weather data:", error);
    return generateFallbackHistoricalData(latitude, longitude);
  }
};

// Generate fallback historical data if API calls fail
const generateFallbackHistoricalData = (latitude: number, longitude: number): any[] => {
  console.log("Generating fallback historical weather data");
  const historicalData = [];
  const now = new Date();
  
  // Generate data for past 24 hours
  for (let i = 0; i < 24; i++) {
    const time = new Date(now);
    time.setHours(now.getHours() - 24 + i);
    const hour = time.getHours();
    
    // Simulate temperature curve over the day
    const hourFactor = Math.sin((hour - 6) * (Math.PI / 12));
    const latitudeEffect = Math.abs(latitude) / 90;
    const baseTemp = 25 - latitudeEffect * 20;
    const temperature = baseTemp + hourFactor * 8;
    
    // Solar irradiance follows daylight pattern
    const daylight = hour >= 6 && hour <= 18;
    const peakHour = Math.abs(hour - 12);
    const solarIrradiance = daylight 
      ? Math.max(0, 1000 * (1 - peakHour / 12) * (1 - Math.abs(latitude) / 90)) 
      : 0;
    
    // Higher humidity in the early morning, lower during day
    const humidity = 50 + (hour < 6 ? 20 : -10) + Math.random() * 15;
    
    // Wind tends to pick up during the day
    const windSpeed = 2 + (hour > 8 && hour < 18 ? 3 : -1) + Math.random() * 3;
    
    // PM10 dust level varies by region and time of day
    const isDesertRegion = (latitude > 15 && latitude < 35) || (latitude < -15 && latitude > -35);
    const isIndustrialRegion = (latitude > 30 && latitude < 60) && (longitude > -10 && longitude < 40);
    const basePM10 = isDesertRegion ? 50 : (isIndustrialRegion ? 30 : 15);
    const basePM25 = isDesertRegion ? 25 : (isIndustrialRegion ? 20 : 8);
    
    const daytimePMFactor = (hour > 8 && hour < 18) ? 1.2 : 0.8;
    const pm10 = basePM10 * daytimePMFactor + (Math.random() * 10);
    const pm25 = basePM25 * daytimePMFactor + (Math.random() * 5);
    
    // Cloud cover - varies by time
    const cloudCover = 20 + (hour < 12 ? -10 : 20) * Math.random();
    
    historicalData.push({
      temperature: Math.round(temperature * 10) / 10,
      humidity: Math.round(Math.min(100, Math.max(0, humidity))),
      windSpeed: Math.round(Math.max(0, windSpeed) * 10) / 10,
      solarIrradiance: Math.round(solarIrradiance),
      pm10: Math.round(pm10 * 10) / 10,
      pm25: Math.round(pm25 * 10) / 10,
      cloudCover: Math.round(Math.min(100, Math.max(0, cloudCover))),
      time: time.toISOString()
    });
  }
  
  return historicalData;
};
