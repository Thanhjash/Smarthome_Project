"use client";

import React, { useState } from 'react';

const DeviceControl: React.FC = () => {
  const [ledState, setLedState] = useState(false);
  const [motorAState, setMotorAState] = useState(0);
  const [motorBState, setMotorBState] = useState(0);

  const handleLedToggle = async () => {
    const newState = !ledState;
    const token = localStorage.getItem('token');
    
    await fetch('http://localhost:3001/api/devices/light', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ 
        state: newState,
        deviceId: 'default'
      }),
    });
    setLedState(newState);
  };

  const handleMotorAChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const newState = Number(event.target.value);
    const token = localStorage.getItem('token');
    
    await fetch('http://localhost:3001/api/devices/ventilation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ 
        state: newState,
        deviceId: 'default'
      }),
    });
    setMotorAState(newState);
  };

  const handleMotorBChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const newState = Number(event.target.value);
    const token = localStorage.getItem('token');
    
    await fetch('http://localhost:3001/api/devices/fan', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ 
        state: newState,
        deviceId: 'default'
      }),
    });
    setMotorBState(newState);
  };

  return (
    <div>
      <h2>Device Control</h2>
      <div>
        <label>LED State:</label>
        <button onClick={handleLedToggle}>{ledState ? 'Turn Off' : 'Turn On'}</button>
      </div>
      <div>
        <label>Motor A Speed:</label>
        <input type="range" min="0" max="255" value={motorAState} onChange={handleMotorAChange} />
      </div>
      <div>
        <label>Motor B Speed:</label>
        <input type="range" min="0" max="255" value={motorBState} onChange={handleMotorBChange} />
      </div>
    </div>
  );
};

export default DeviceControl;