import React from 'react';
import { useSensorData } from '@/hooks/useSensorData';
import GaugeChart from 'react-gauge-chart';

export const GaugeCharts: React.FC = () => {
  const { temperatureData, humidityData, lightData } = useSensorData();

  const latestTemperature = temperatureData.length ? temperatureData[temperatureData.length - 1].value : 0;
  const latestHumidity = humidityData.length ? humidityData[humidityData.length - 1].value : 0;
  const latestLight = lightData.length ? lightData[lightData.length - 1].value : 0;

  return (
    <div className="grid grid-cols-1 gap-4">
      <div className="h-32">
        <GaugeChart id="temperature-gauge" percent={latestTemperature ? latestTemperature / 100 : 0} />
        <p className="text-center mt-2">Temperature: {latestTemperature}°C</p>
      </div>
      <div className="h-32">
        <GaugeChart id="humidity-gauge" percent={latestHumidity ? latestHumidity / 100 : 0} />
        <p className="text-center mt-2">Humidity: {latestHumidity}%</p>
      </div>
      <div className="h-32">
        <GaugeChart id="light-gauge" percent={latestLight ? latestLight / 100 : 0} />
        <p className="text-center mt-2">Light Level: {latestLight} lux</p>
      </div>
    </div>
  );
};
