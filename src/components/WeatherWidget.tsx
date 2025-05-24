import React from 'react';

interface WeatherWidgetProps {
  weather: any;
}

const WeatherWidget: React.FC<WeatherWidgetProps> = ({ weather }) => {
  return (
    <div className="bg-white p-4 rounded-xl shadow-md">
      <h2 className="text-lg font-bold mb-4">Current Weather</h2>
      <div className="flex items-center mb-4">
        <img
          src={`https://openweathermap.org/img/wn/${weather.weather[0].icon}@2x.png`}
          alt={weather.weather[0].description}
          className="w-16 h-16"
        />
        <div className="ml-4">
          <p className="text-xl font-semibold">{weather.main.temp}°C</p>
          <p className="text-sm text-gray-500 capitalize">{weather.weather[0].description}</p>
        </div>
      </div>
      <div className="text-sm text-gray-600">
        <p>Humidity: {weather.main.humidity}%</p>
        <p>Wind Speed: {weather.wind.speed} m/s</p>
      </div>
    </div>
  );
};

export default WeatherWidget;