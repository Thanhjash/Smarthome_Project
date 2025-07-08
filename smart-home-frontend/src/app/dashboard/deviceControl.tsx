"use client";

import React, { useState } from 'react';

const DeviceControl: React.FC = () => {
  const [ledState, setLedState] = useState(false);
  const [motorAState, setMotorAState] = useState(0);
  const [motorBState, setMotorBState] = useState(0);

  const handleLedToggle = async () => {
    const newState = !ledState;
    await fetch('/api/device/led', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ state: newState }),
    });
    setLedState(newState);
  };

  const handleMotorAChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const newState = Number(event.target.value);
    await fetch('/api/device/motorA', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ state: newState }),
    });
    setMotorAState(newState);
  };

  const handleMotorBChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const newState = Number(event.target.value);
    await fetch('/api/device/motorB', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ state: newState }),
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
        <input type="range" min="0" max="100" value={motorBState} onChange={handleMotorBChange} />
      </div>
    </div>
  );
};

export default DeviceControl;
