"use client";

import React, { createContext, useContext, ReactNode, memo } from 'react';
import { useSensorData } from '@/hooks/useSensorData';

// Derive context type from hook return
type SensorDataContextType = ReturnType<typeof useSensorData>;

// Create context with null default
const SensorDataContext = createContext<SensorDataContextType | null>(null);

// Memoized Provider component to prevent unnecessary re-renders
export const SensorDataProvider = memo<{ children: ReactNode }>(({ children }) => {
  // Single hook call at provider level
  const sensorData = useSensorData();

  return (
    <SensorDataContext.Provider value={sensorData}>
      {children}
    </SensorDataContext.Provider>
  );
});

SensorDataProvider.displayName = 'SensorDataProvider';

// Custom hook for consuming context
export const useSensorContext = () => {
  const context = useContext(SensorDataContext);
  if (!context) {
    throw new Error('useSensorContext must be used within a SensorDataProvider');
  }
  return context;
};