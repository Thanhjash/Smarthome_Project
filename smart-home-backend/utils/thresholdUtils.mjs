import dotenv from 'dotenv';
import Threshold from '../models/Threshold.mjs';

dotenv.config();

// Lấy giá trị từ biến môi trường, với giá trị mặc định nếu không tồn tại
const getEnvNumber = (key, defaultValue) => {
  const value = process.env[key];
  return value ? parseFloat(value) : defaultValue;
};

// Tạo ngưỡng mặc định từ biến môi trường
export const getDefaultThresholds = () => {
  return {
    temperature: getEnvNumber('TEMPERATURE_THRESHOLD', 30),
    humidity: getEnvNumber('HUMIDITY_THRESHOLD', 70),
    light: getEnvNumber('LIGHT_LEVEL_THRESHOLD', 300),
    co2: getEnvNumber('CO2_THRESHOLD', 1000),
    co: getEnvNumber('CO_THRESHOLD', 50),
    lpg: getEnvNumber('LPG_THRESHOLD', 500),
    smoke: getEnvNumber('SMOKE_THRESHOLD', 100),
    nh3: getEnvNumber('NH3_THRESHOLD', 10)
  };
};

// Lấy ngưỡng từ database hoặc sử dụng giá trị mặc định
export const getThresholds = async (userId = null) => {
  try {
    // Tìm ngưỡng cho user cụ thể hoặc ngưỡng mặc định
    const query = userId ? { userId } : { userId: { $exists: false } };
    let thresholds = await Threshold.findOne(query);
    
    // Nếu không tìm thấy, tạo ngưỡng mặc định
    if (!thresholds) {
      const defaultValues = getDefaultThresholds();
      thresholds = new Threshold({
        ...defaultValues,
        userId: userId
      });
      await thresholds.save();
      console.log('Created default thresholds:', defaultValues);
    }
    
    return thresholds;
  } catch (error) {
    console.error('Error getting thresholds:', error);
    // Trả về giá trị mặc định trong trường hợp lỗi
    return getDefaultThresholds();
  }
};

// Kiểm tra xem một giá trị vượt quá ngưỡng hay không
export const isValueExceedingThreshold = (value, threshold, margin = 0) => {
  return value > threshold + margin;
};

// Kiểm tra mức độ của giá trị so với ngưỡng
export const getThresholdLevel = (value, threshold) => {
  if (value <= threshold * 0.7) return 'normal';
  if (value <= threshold) return 'warning';
  if (value <= threshold * 1.5) return 'high';
  return 'critical';
};