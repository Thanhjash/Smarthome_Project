import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ThresholdConfiguration = () => {
  const [thresholds, setThresholds] = useState({});
  const [sensor, setSensor] = useState('');
  const [value, setValue] = useState('');

  useEffect(() => {
    // Fetch existing thresholds on mount
    const fetchThresholds = async () => {
      try {
        const response = await axios.get('/api/thresholds');
        setThresholds(response.data);
      } catch (error) {
        console.error('Error fetching thresholds:', error);
      }
    };

    fetchThresholds();
  }, []);

  const handleSave = async () => {
    try {
      const response = await axios.post('/api/thresholds', { sensor, value });
      setThresholds({ ...thresholds, [sensor]: response.data.value });
      setSensor('');
      setValue('');
    } catch (error) {
      console.error('Error saving threshold:', error);
    }
  };

  return (
    <div>
      <h2>Threshold Configuration</h2>
      <div>
        <input
          type="text"
          placeholder="Sensor"
          value={sensor}
          onChange={(e) => setSensor(e.target.value)}
        />
        <input
          type="number"
          placeholder="Value"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        <button onClick={handleSave}>Save</button>
      </div>
      <div>
        <h3>Existing Thresholds</h3>
        <ul>
          {Object.entries(thresholds).map(([sensor, value]) => (
            <li key={sensor}>
              {sensor}: {value}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default ThresholdConfiguration;
