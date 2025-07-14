import { useState } from 'react';

export const useDeviceControl = () => {
  const updateDeviceState = async (device: string, value: boolean | number) => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`http://localhost:3001/api/devices/${device}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          state: value,
          deviceId: 'default'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update device');
      }

      return await response.json();
    } catch (error) {
      console.error(`Error updating ${device}:`, error);
      throw error;
    }
  };

  return { updateDeviceState };
};