import Device from '../models/Device.mjs';
import ManualControl from '../models/ManualControl.mjs';
import mqttClient from '../config/mqttConfig.js';
import Threshold from '../models/Threshold.mjs';
import { getThresholds as fetchThresholds, getDefaultThresholds } from '../utils/thresholdUtils.mjs';

// Trạng thái thiết bị trong bộ nhớ
let deviceState = {
  led: false,
  buzzer: false,
  motorA: 0,
  motorB: 0,
  autoMode: true,
  emergencyMode: false
};

// Dữ liệu cảm biến mới nhất
let sensorData = {};

// Ngưỡng cảnh báo hiện tại
let thresholds = {};

// Trạng thái điều khiển thủ công
let manualControl = {
  led: false,
  motorA: false,
  motorB: false
};

// Theo dõi các lệnh đang chờ xác nhận
const pendingCommands = new Map();

// Theo dõi lần thử lại lệnh
const commandRetries = new Map();

// Số lần thử lại tối đa
const MAX_RETRIES = 3;

// Hàng đợi lệnh với ưu tiên
class CommandQueue {
  constructor() {
    this.queue = [];
    this.processing = false;
  }
  
  addCommand(command, priority = 0) {
    return new Promise((resolve, reject) => {
      this.queue.push({ 
        command, 
        priority, 
        timestamp: Date.now(),
        resolve,
        reject
      });
      this.queue.sort((a, b) => b.priority - a.priority || a.timestamp - b.timestamp);
      
      if (!this.processing) {
        this.processQueue();
      }
    });
  }
  
  async processQueue() {
    if (this.queue.length === 0) {
      this.processing = false;
      return;
    }
    
    this.processing = true;
    const { command, resolve, reject } = this.queue.shift();
    
    try {
      const result = await command();
      resolve(result);
    } catch (error) {
      console.error('Error processing command:', error);
      reject(error);
    }
    
    // Process next command with a small delay
    setTimeout(() => this.processQueue(), 100);
  }
}

const commandQueue = new CommandQueue();

// Khởi tạo MQTT listeners
const setupMqttListeners = () => {
  mqttClient.subscribe('home/sensors');
  mqttClient.subscribe('home/device_status');
  mqttClient.subscribe('home/thresholds');
  mqttClient.subscribe('home/emergency');
  mqttClient.subscribe('home/confirm/+');  // Subscribe to all confirmation topics

  mqttClient.on('message', (topic, message) => {
    console.log(`Received message on topic ${topic}: ${message.toString()}`);
    if (topic === 'home/sensors') {
      sensorData = JSON.parse(message.toString());
      handleSensorData();
    } else if (topic === 'home/device_status') {
      const newDeviceState = JSON.parse(message.toString());
      deviceState = { ...deviceState, ...newDeviceState };
    } else if (topic === 'home/thresholds') {
      thresholds = JSON.parse(message.toString());
    } else if (topic === 'home/emergency') {
      const isEmergency = message.toString() === 'true';
      if (isEmergency !== deviceState.emergencyMode) {
        handleEmergencyStateChange(isEmergency);
      }
    } else if (topic.startsWith('home/confirm/')) {
      const requestId = topic.split('/')[2];
      handleCommandConfirmation(requestId, message.toString());
    }
  });
};

// Xử lý xác nhận lệnh
const handleCommandConfirmation = (requestId, messageStr) => {
  try {
    const confirmation = JSON.parse(messageStr);
    const pendingCommand = pendingCommands.get(requestId);
    
    if (pendingCommand) {
      pendingCommands.delete(requestId);
      clearTimeout(pendingCommand.timeoutId);
      
      if (confirmation.success) {
        console.log(`Command ${requestId} confirmed successful by device`);
        pendingCommand.resolve(confirmation);
      } else {
        console.error(`Command ${requestId} failed on device: ${confirmation.message}`);
        pendingCommand.reject(new Error(confirmation.message || 'Command failed on device'));
      }
    }
  } catch (error) {
    console.error(`Error parsing confirmation message: ${error.message}`);
  }
};

// Khởi tạo trạng thái thiết bị từ database
export const initDeviceState = async () => {
  console.log('Initializing device state...');
  try {
    // Khôi phục trạng thái thiết bị từ database
    const devices = await Device.find();
    if (devices.length > 0) {
      devices.forEach(device => {
        if (device.name in deviceState) {
          deviceState[device.name] = device.state;
          console.log(`Restored ${device.name} state to ${device.state}`);
        }
      });
    } else {
      console.log('No device states found in database, using defaults');
    }
    
    // Khôi phục trạng thái điều khiển thủ công
    const manualControlData = await ManualControl.findOne();
    if (manualControlData) {
      manualControl = {
        led: manualControlData.led || false,
        motorA: manualControlData.motorA || false,
        motorB: manualControlData.motorB || false
      };
      console.log('Restored manual control flags:', manualControl);
    } else {
      // Tạo bản ghi ManualControl mới nếu không tồn tại
      const newManualControl = new ManualControl(manualControl);
      await newManualControl.save();
      console.log('Created new manual control record');
    }
    
    // Khôi phục ngưỡng từ database
    thresholds = await fetchThresholds();
    console.log('Restored thresholds from database');
    
    // Thiết lập MQTT listeners
    setupMqttListeners();
    
    // Yêu cầu đồng bộ với thiết bị thực
    requestDeviceSync();
    
    return deviceState;
  } catch (error) {
    console.error('Error initializing device state:', error);
    return deviceState;
  }
};

// Yêu cầu đồng bộ với thiết bị thực
const requestDeviceSync = async () => {
  try {
    const requestId = Date.now().toString();
    console.log('Requesting device sync with requestId:', requestId);
    await mqttClient.publish('home/sync_request', JSON.stringify({ requestId }));
  } catch (error) {
    console.error('Error requesting device sync:', error);
  }
};

// Xử lý dữ liệu cảm biến
const handleSensorData = () => {
  const isEmergency = checkEmergencyCondition();
  if (isEmergency !== deviceState.emergencyMode) {
    handleEmergencyStateChange(isEmergency);
  } else if (deviceState.autoMode && !deviceState.emergencyMode) {
    processAutoMode();
  }
};

  // Kiểm tra điều kiện khẩn cấp
const checkEmergencyCondition = () => {
  return sensorData.flame || 
         (sensorData.co && sensorData.co > (thresholds.co || 50)) || 
         (sensorData.lpg && sensorData.lpg > (thresholds.lpg || 500)) || 
         (sensorData.smoke && sensorData.smoke > (thresholds.smoke || 100)) || 
         (sensorData.nh3 && sensorData.nh3 > (thresholds.nh3 || 10));
};

// Xử lý thay đổi trạng thái khẩn cấp
const handleEmergencyStateChange = async (isEmergency) => {
  if (isEmergency) {
    await handleEmergency();
  } else {
    await disableEmergency();
  }
};

// Xử lý tình huống khẩn cấp
const handleEmergency = async () => {
  try {
    console.log('EMERGENCY MODE ACTIVATED!');
    
    // Đặt cờ khẩn cấp trước
    await updateDeviceStateAndPublish('emergencyMode', true);
    
    // Thực hiện các hành động khẩn cấp với độ ưu tiên cao
    await Promise.all([
      commandQueue.addCommand(() => updatePropertyValueWithConfirmation('motorA', 255), 10),
      commandQueue.addCommand(() => updatePropertyValueWithConfirmation('motorB', 0), 10),
      commandQueue.addCommand(() => updatePropertyValueWithConfirmation('buzzer', true), 10),
      commandQueue.addCommand(() => updatePropertyValueWithConfirmation('led', true), 10)
    ]);
    
    console.log('Emergency actions completed');
  } catch (error) {
    console.error('Error in handleEmergency:', error);
  }
};

// Tắt chế độ khẩn cấp
const disableEmergency = async () => {
  try {
    console.log('Disabling emergency mode');
    
    // Tắt còi báo động
    await commandQueue.addCommand(() => updatePropertyValueWithConfirmation('buzzer', false), 5);
    
    // Cập nhật trạng thái
    await updateDeviceStateAndPublish('emergencyMode', false);
    
    // Nếu ở chế độ tự động, xử lý lại
    if (deviceState.autoMode) {
      processAutoMode();
    }
    
    console.log('Emergency mode disabled');
  } catch (error) {
    console.error('Error in disableEmergency:', error);
  }
};

// Hàm gửi lệnh điều khiển với xác nhận
const updatePropertyValueWithConfirmation = async (device, value) => {
  const requestId = Date.now().toString();
  const message = JSON.stringify({ device, state: value, requestId });
  
  return new Promise((resolve, reject) => {
    // Thiết lập timeout handler
    const timeoutId = setTimeout(() => {
      // Nếu không nhận được xác nhận sau 5 giây
      if (pendingCommands.has(requestId)) {
        pendingCommands.delete(requestId);
        
        // Kiểm tra số lần thử lại
        const retries = commandRetries.get(requestId) || 0;
        if (retries < MAX_RETRIES) {
          console.log(`Command ${requestId} timed out, retrying (${retries + 1}/${MAX_RETRIES})...`);
          commandRetries.set(requestId, retries + 1);
          
          // Thử lại lệnh
          updatePropertyValueWithConfirmation(device, value)
            .then(resolve)
            .catch(reject);
        } else {
          console.error(`Command ${requestId} failed after ${MAX_RETRIES} retries`);
          commandRetries.delete(requestId);
          reject(new Error(`Command confirmation timeout for device ${device} after ${MAX_RETRIES} retries`));
        }
      }
    }, 5000);
    
    // Lưu thông tin lệnh đang chờ
    pendingCommands.set(requestId, {
      device,
      value,
      requestId,
      timeoutId,
      resolve,
      reject
    });
    
    // Gửi lệnh
    mqttClient.publish('home/control', message, (err) => {
      if (err) {
        clearTimeout(timeoutId);
        pendingCommands.delete(requestId);
        reject(err);
      } else {
        console.log(`Command sent to device ${device} with value ${value}, requestId: ${requestId}`);
      }
    });
  });
};

// Hàm cập nhật trạng thái thiết bị đơn giản (không xác nhận)
const updatePropertyValue = async (device, value) => {
  const message = JSON.stringify({ device, state: value });
  try {
    await mqttClient.publish('home/control', message);
    console.log(`Device ${device} updated with value ${value} (no confirmation)`);
  } catch (error) {
    console.error(`Error updating device ${device}:`, error.message);
    throw error;
  }
};

// Cập nhật trạng thái thiết bị trong bộ nhớ và database
const updateDeviceStateAndPublish = async (device, state) => {
  // Cập nhật trong bộ nhớ
  deviceState[device] = state;
  
  // Cập nhật trong database
  await Device.findOneAndUpdate(
    { name: device },
    { state, lastUpdated: new Date() },
    { upsert: true, new: true }
  );
  
  // Thông báo thay đổi trạng thái
  const message = JSON.stringify({ [device]: state });
  await mqttClient.publish('home/device_status', message);
  
  console.log(`Device state updated and published: ${device} = ${state}`);
};

// Cập nhật trạng thái điều khiển thủ công trong bộ nhớ và database
const updateManualControl = async (device, isManual) => {
  // Cập nhật trong bộ nhớ
  manualControl[device] = isManual;
  
  // Cập nhật trong database
  await ManualControl.findOneAndUpdate(
    {},
    { [device]: isManual, lastUpdated: new Date() },
    { upsert: true, new: true }
  );
  
  console.log(`Manual control flag updated: ${device} = ${isManual}`);
};

// Cập nhật thiết bị với ưu tiên
const updateDeviceWithPriority = async (deviceName, state, speed = null) => {
  // Kiểm tra chế độ khẩn cấp
  if (deviceState.emergencyMode && (deviceName !== 'buzzer')) {
    console.log(`Update blocked for ${deviceName}: Device control is locked due to emergency mode`);
    return { success: false, message: 'Device control is locked due to emergency mode' };
  }

  // Thiết lập cờ điều khiển thủ công
  await updateManualControl(deviceName, true);

  // Chuẩn bị giá trị cần cập nhật
  const valueToUpdate = speed !== null ? speed : state;
  
  try {
    // Thêm lệnh vào hàng đợi với ưu tiên thấp (1)
    await commandQueue.addCommand(() => 
      updatePropertyValueWithConfirmation(deviceName, valueToUpdate), 1);
    
    // Cập nhật trạng thái trong bộ nhớ và database
    await updateDeviceStateAndPublish(deviceName, valueToUpdate);
    
    return { success: true, message: `${deviceName} state updated successfully to ${valueToUpdate}` };
  } catch (error) {
    console.error(`Error updating ${deviceName}:`, error);
    return { success: false, message: `Failed to update ${deviceName}: ${error.message}` };
  }
};

// Xử lý chế độ tự động
const processAutoMode = async () => {
  console.log("Processing auto mode with sensor data:", sensorData);
  
  // Nếu đang ở chế độ khẩn cấp hoặc không phải chế độ tự động, bỏ qua
  if (deviceState.emergencyMode || !deviceState.autoMode) {
    console.log("Auto mode processing skipped: emergencyMode=" + deviceState.emergencyMode + ", autoMode=" + deviceState.autoMode);
    return;
  }

  try {
    // Nếu không có ngưỡng, lấy từ database
    if (!thresholds || Object.keys(thresholds).length === 0) {
      thresholds = await Threshold.findOne();
      if (!thresholds) {
        console.log("No thresholds found, auto mode cannot proceed");
        return;
      }
    }

    // Lấy dữ liệu cảm biến và ngưỡng
    const { temperature, humidity, co2, light } = sensorData;
    const { temperature: tempThreshold, humidity: humidThreshold, co2: co2Threshold, light: lightThreshold } = thresholds;
    
    console.log("Auto mode processing with thresholds:", {
      tempThreshold, humidThreshold, co2Threshold, lightThreshold
    });

    // Quạt (MotorB) - Kiểm soát nhiệt độ và độ ẩm
    if (!manualControl.motorB && temperature !== undefined && humidity !== undefined) {
      if (temperature > tempThreshold || humidity > humidThreshold) {
        await commandQueue.addCommand(() => 
          updatePropertyValueWithConfirmation('motorB', 255), 2);
        await updateDeviceStateAndPublish('motorB', 255);
      } else if (temperature > tempThreshold - 2 || humidity > humidThreshold - 5) {
        await commandQueue.addCommand(() => 
          updatePropertyValueWithConfirmation('motorB', 128), 2);
        await updateDeviceStateAndPublish('motorB', 128);
      } else {
        await commandQueue.addCommand(() => 
          updatePropertyValueWithConfirmation('motorB', 0), 2);
        await updateDeviceStateAndPublish('motorB', 0);
      }
    }

    // Thông gió (MotorA) - Kiểm soát CO2
    if (!manualControl.motorA && co2 !== undefined) {
      if (co2 > co2Threshold * 1.5) {
        await commandQueue.addCommand(() => 
          updatePropertyValueWithConfirmation('motorA', 255), 2);
        await updateDeviceStateAndPublish('motorA', 255);
      } else if (co2 > co2Threshold) {
        await commandQueue.addCommand(() => 
          updatePropertyValueWithConfirmation('motorA', 155), 2);
        await updateDeviceStateAndPublish('motorA', 155);
      } else {
        await commandQueue.addCommand(() => 
          updatePropertyValueWithConfirmation('motorA', 0), 2);
        await updateDeviceStateAndPublish('motorA', 0);
      }
    }

    // Đèn LED - Kiểm soát ánh sáng
    if (!manualControl.led && light !== undefined) {
      const shouldTurnOnLed = light < lightThreshold;
      if (shouldTurnOnLed !== deviceState.led) {
        console.log(`Auto mode: Changing LED state to ${shouldTurnOnLed} based on light level: ${light} < ${lightThreshold}`);
        await commandQueue.addCommand(() => 
          updatePropertyValueWithConfirmation('led', shouldTurnOnLed), 2);
        await updateDeviceStateAndPublish('led', shouldTurnOnLed);
      }
    }

    // Còi báo động - Kiểm tra các điều kiện nguy hiểm
    const dangerCondition = temperature > tempThreshold + 10 || 
                           humidity > humidThreshold + 20 || 
                           (co2 !== undefined && co2 > co2Threshold * 2);
    
    if (dangerCondition !== deviceState.buzzer) {
      await commandQueue.addCommand(() => 
        updatePropertyValueWithConfirmation('buzzer', dangerCondition), 3);
      await updateDeviceStateAndPublish('buzzer', dangerCondition);
    }

  } catch (error) {
    console.error('Error in processAutoMode:', error);
  }
};

// ===== API ENDPOINTS =====

// Cập nhật trạng thái đèn LED
export const updateLedState = async (req, res) => {
  const { state } = req.body;
  if (typeof state !== 'boolean') {
    return res.status(400).json({ message: 'Invalid LED state value' });
  }

  const result = await updateDeviceWithPriority('led', state);
  res.status(result.success ? 200 : 403).json({ message: result.message });
};

// Cập nhật động cơ thông gió (MotorA)
export const updateMotorAState = async (req, res) => {
  const { speed } = req.body;
  if (typeof speed !== 'number' || speed < 0 || speed > 255) {
    return res.status(400).json({ message: 'Invalid motor A speed value' });
  }

  const result = await updateDeviceWithPriority('motorA', null, speed);
  res.status(result.success ? 200 : 403).json({ message: result.message });
};

// Cập nhật động cơ quạt (MotorB)
export const updateMotorBState = async (req, res) => {
  const { speed } = req.body;
  if (typeof speed !== 'number' || speed < 0 || speed > 255) {
    return res.status(400).json({ message: 'Invalid motor B speed value' });
  }

  const result = await updateDeviceWithPriority('motorB', null, speed);
  res.status(result.success ? 200 : 403).json({ message: result.message });
};

// Cập nhật trạng thái còi báo động
export const updateBuzzerState = async (req, res) => {
  const { state } = req.body;
  if (typeof state !== 'boolean') {
    return res.status(400).json({ message: 'Invalid buzzer state value' });
  }

  const result = await updateDeviceWithPriority('buzzer', state);
  res.status(result.success ? 200 : 403).json({ message: result.message });
};

// Cập nhật chế độ tự động
export const updateAutoMode = async (req, res) => {
  try {
    const { state } = req.body;
    if (typeof state !== 'boolean') {
      return res.status(400).json({ message: 'Invalid autoMode state value' });
    }

    // Cập nhật trạng thái
    await updateDeviceStateAndPublish('autoMode', state);
    await commandQueue.addCommand(() => updatePropertyValueWithConfirmation('autoMode', state), 1);

    // Nếu bật chế độ tự động, reset cờ điều khiển thủ công
    if (state) {
      // Reset cờ điều khiển thủ công
      await ManualControl.findOneAndUpdate(
        {},
        { led: false, motorA: false, motorB: false, lastUpdated: new Date() },
        { upsert: true, new: true }
      );
      
      manualControl = {
        led: false,
        motorA: false,
        motorB: false
      };
      
      console.log('Auto mode enabled, reset manual control flags');
      
      // Xử lý chế độ tự động ngay lập tức
      processAutoMode();
    }

    res.status(200).json({ message: `AutoMode state updated to ${state}` });
  } catch (error) {
    console.error('Error updating AutoMode state:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Cập nhật chế độ khẩn cấp
export const updateEmergencyMode = async (req, res) => {
  try {
    const { state } = req.body;
    if (typeof state !== 'boolean') {
      return res.status(400).json({ message: 'Invalid emergency mode state value' });
    }

    // Xử lý thay đổi trạng thái khẩn cấp
    if (state) {
      await handleEmergency();
    } else {
      await disableEmergency();
    }

    res.status(200).json({ message: `Emergency mode state updated to ${state}` });
  } catch (error) {
    console.error('Error updating Emergency mode state:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Lấy trạng thái thiết bị
export const getDeviceStates = async (req, res) => {
  try {
    res.status(200).json(deviceState);
  } catch (error) {
    console.error('Error getting device states:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Lấy ngưỡng cảnh báo
export const getThresholds = async (req, res) => {
  try {
    // Nếu không có thông tin người dùng, sử dụng ngưỡng mặc định
    const thresholdsData = await fetchThresholds(req.user ? req.user._id : null);
    res.status(200).json(thresholdsData || {});
  } catch (error) {
    console.error('Error getting thresholds:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Cập nhật ngưỡng cảnh báo
export const setThresholds = async (req, res) => {
  try {
    const { temperature, humidity, co2, light } = req.body;
    
    // Kiểm tra giá trị hợp lệ
    if (
      typeof temperature !== 'number' || 
      typeof humidity !== 'number' || 
      typeof co2 !== 'number' || 
      typeof light !== 'number'
    ) {
      return res.status(400).json({ message: 'Invalid threshold values' });
    }
    
    // Tạo query dựa trên thông tin người dùng nếu có
    const query = req.user ? { userId: req.user._id } : {};
    
    // Cập nhật ngưỡng trong database
    const updatedThresholds = await Threshold.findOneAndUpdate(
      query,
      { temperature, humidity, co2, light },
      { new: true, upsert: true }
    );

    // Cập nhật trong bộ nhớ
    thresholds = updatedThresholds;

    // Gửi ngưỡng mới qua MQTT
    await mqttClient.publish('home/thresholds', JSON.stringify(updatedThresholds));
    
    res.status(200).json({ 
      message: 'Thresholds updated successfully', 
      thresholds: updatedThresholds 
    });
  } catch (error) {
    console.error('Error setting thresholds:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Reset cờ điều khiển thủ công
export const resetManualControl = async (req, res) => {
  try {
    // Reset trong bộ nhớ
    manualControl = {
      led: false,
      motorA: false,
      motorB: false
    };
    
    // Reset trong database
    await ManualControl.findOneAndUpdate(
      {},
      { led: false, motorA: false, motorB: false, lastUpdated: new Date() },
      { upsert: true, new: true }
    );
    
    // Nếu ở chế độ tự động, xử lý lại
    if (deviceState.autoMode && !deviceState.emergencyMode) {
      processAutoMode();
    }
    
    res.status(200).json({ message: 'Manual control reset successfully' });
  } catch (error) {
    console.error('Error resetting manual control:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Cập nhật tất cả thiết bị
export const updateAllDevices = async (req, res) => {
  const { led, motorA, motorB, buzzer, autoMode } = req.body;
  
  // Kiểm tra giá trị hợp lệ
  if (
    typeof led !== 'boolean' || 
    typeof motorA !== 'number' || motorA < 0 || motorA > 255 ||
    typeof motorB !== 'number' || motorB < 0 || motorB > 255 ||
    typeof buzzer !== 'boolean' ||
    typeof autoMode !== 'boolean'
  ) {
    return res.status(400).json({ message: 'Invalid device state values' });
  }
  
  try {
    const results = [];
    
    // Cập nhật tự động trước
    if (autoMode !== deviceState.autoMode) {
      const autoModeResult = await updateAutoMode({ body: { state: autoMode } }, { 
        status: () => ({ 
          json: (data) => {
            results.push({ device: 'autoMode', ...data });
            return {}; 
          } 
        }) 
      });
    }
    
    // Sau đó cập nhật các thiết bị khác
    const updatePromises = [
      updateDeviceWithPriority('led', led).then(result => {
        results.push({ device: 'led', ...result });
      }),
      updateDeviceWithPriority('motorA', null, motorA).then(result => {
        results.push({ device: 'motorA', ...result });
      }),
      updateDeviceWithPriority('motorB', null, motorB).then(result => {
        results.push({ device: 'motorB', ...result });
      }),
      updateDeviceWithPriority('buzzer', buzzer).then(result => {
        results.push({ device: 'buzzer', ...result });
      })
    ];
    
    await Promise.all(updatePromises);
    
    res.status(200).json({ 
      message: 'All devices updated', 
      results 
    });
  } catch (error) {
    console.error('Error updating all devices:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Export các hàm khởi tạo và xử lý để sử dụng trong các file khác
export { processAutoMode };