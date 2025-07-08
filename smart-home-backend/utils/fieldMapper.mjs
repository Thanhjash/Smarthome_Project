// utils/fieldMapper.mjs
/**
 * Field mapper utility for standardizing field names between Arduino and backend
 * This helps maintain consistent naming while allowing for different conventions
 */

/**
 * Mapping for device control fields
 * 
 * Arduino field name => Database field name
 */
export const DEVICE_FIELDS = {
  ARDUINO_TO_DB: {
    'led': 'ledState',
    'buzzer': 'buzzerState',
    'motorA': 'ventilationSpeed',
    'motorB': 'fanSpeed',
    'autoMode': 'autoModeEnabled',
    'emergencyMode': 'emergencyMode'
  },
  
  DB_TO_ARDUINO: {
    'ledState': 'led',
    'buzzerState': 'buzzer',
    'ventilationSpeed': 'motorA',
    'fanSpeed': 'motorB',
    'autoModeEnabled': 'autoMode',
    'emergencyMode': 'emergencyMode'
  }
};

/**
 * Mapping for sensor data fields
 * 
 * Arduino field name => Database field name
 */
export const SENSOR_FIELDS = {
  ARDUINO_TO_DB: {
    'light': 'lightLevel',
    'flame': 'flameDetected',
    'co2': 'co2Level',
    'co': 'coLevel',
    'smoke': 'smokeLevel',
    'nh3': 'nh3Level',
    'lpg': 'lpgLevel',
    'temperature': 'temperature',
    'humidity': 'humidity'
  },
  
  DB_TO_ARDUINO: {
    'lightLevel': 'light',
    'flameDetected': 'flame',
    'co2Level': 'co2',
    'coLevel': 'co',
    'smokeLevel': 'smoke',
    'nh3Level': 'nh3',
    'lpgLevel': 'lpg',
    'temperature': 'temperature',
    'humidity': 'humidity'
  }
};

/**
 * Convert field names from Arduino format to database format
 * 
 * @param {Object} data - Data object with Arduino field names
 * @param {String} fieldType - Type of mapping to use: 'DEVICE_FIELDS' or 'SENSOR_FIELDS'
 * @returns {Object} - Data object with database field names
 */
export function mapArduinoToDb(data, fieldType = 'DEVICE_FIELDS') {
  if (!data || typeof data !== 'object') {
    return data;
  }
  
  const mapping = fieldType === 'DEVICE_FIELDS' ? 
    DEVICE_FIELDS.ARDUINO_TO_DB : 
    SENSOR_FIELDS.ARDUINO_TO_DB;
  
  const result = {};
  
  Object.entries(data).forEach(([key, value]) => {
    const mappedKey = mapping[key] || key;
    result[mappedKey] = value;
  });
  
  return result;
}

/**
 * Convert field names from database format to Arduino format
 * 
 * @param {Object} data - Data object with database field names
 * @param {String} fieldType - Type of mapping to use: 'DEVICE_FIELDS' or 'SENSOR_FIELDS'
 * @returns {Object} - Data object with Arduino field names
 */
export function mapDbToArduino(data, fieldType = 'DEVICE_FIELDS') {
  if (!data || typeof data !== 'object') {
    return data;
  }
  
  const mapping = fieldType === 'DEVICE_FIELDS' ? 
    DEVICE_FIELDS.DB_TO_ARDUINO : 
    SENSOR_FIELDS.DB_TO_ARDUINO;
  
  const result = {};
  
  Object.entries(data).forEach(([key, value]) => {
    const mappedKey = mapping[key] || key;
    result[mappedKey] = value;
  });
  
  return result;
}