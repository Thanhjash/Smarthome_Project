import { WebSocketServer } from 'ws';
import logger from '../utils/logger.mjs';
import { updateLedState, updateMotorAState, updateMotorBState, updateBuzzerState, updateAutoMode } from '../controllers/deviceController.mjs';

export const setupWebSocket = (server) => {
  const wss = new WebSocketServer({ server });
  
  // Theo dõi số lượng kết nối
  let connectionCount = 0;

  wss.on('connection', (ws, req) => {
    connectionCount++;
    const clientIP = req.socket.remoteAddress;
    logger.info(`WebSocket connection established from ${clientIP}. Total connections: ${connectionCount}`);

    // Gửi thông báo chào mừng
    ws.send(JSON.stringify({
      type: 'connection_established',
      message: 'Connected to Smart Home Bot Server',
      timestamp: new Date().toISOString()
    }));

    // Xử lý đóng kết nối
    ws.on('close', () => {
      connectionCount--;
      logger.info(`WebSocket connection closed. Remaining connections: ${connectionCount}`);
    });

    // Xử lý tin nhắn từ client
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message);
        logger.info('Received WebSocket message:', data);

        // Xử lý các lệnh điều khiển thiết bị từ WebSocket
        handleWebSocketCommand(data);
      } catch (error) {
        logger.error('Error processing WebSocket message:', error);
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Invalid message format',
          error: error.message
        }));
      }
    });

    // Xử lý lỗi kết nối
    ws.on('error', (error) => {
      logger.error('WebSocket error:', error);
    });
  });

  // Hàm gửi thông báo cho tất cả clients
  wss.broadcast = (data) => {
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(data));
      }
    });
  };

  // Hàm xử lý lệnh điều khiển từ WebSocket
  const handleWebSocketCommand = async (data) => {
    if (!data || !data.command) {
      logger.error('Invalid WebSocket command:', data);
      return;
    }

    try {
      let result;
      switch (data.command) {
        case 'setLed':
          if (typeof data.state !== 'boolean') {
            logger.error('Invalid LED state:', data.state);
            return;
          }
          result = await updateLedState({ body: { state: data.state } }, { 
            status: () => ({ json: (data) => data }) 
          });
          break;
        
        case 'setMotorA':
          if (typeof data.speed !== 'number' || data.speed < 0 || data.speed > 255) {
            logger.error('Invalid motorA speed:', data.speed);
            return;
          }
          result = await updateMotorAState({ body: { speed: data.speed } }, { 
            status: () => ({ json: (data) => data }) 
          });
          break;
        
        case 'setMotorB':
          if (typeof data.speed !== 'number' || data.speed < 0 || data.speed > 255) {
            logger.error('Invalid motorB speed:', data.speed);
            return;
          }
          result = await updateMotorBState({ body: { speed: data.speed } }, { 
            status: () => ({ json: (data) => data }) 
          });
          break;
        
        case 'setBuzzer':
          if (typeof data.state !== 'boolean') {
            logger.error('Invalid buzzer state:', data.state);
            return;
          }
          result = await updateBuzzerState({ body: { state: data.state } }, { 
            status: () => ({ json: (data) => data }) 
          });
          break;
        
        case 'setAutoMode':
          if (typeof data.state !== 'boolean') {
            logger.error('Invalid autoMode state:', data.state);
            return;
          }
          result = await updateAutoMode({ body: { state: data.state } }, { 
            status: () => ({ json: (data) => data }) 
          });
          break;
        
        default:
          logger.error('Unknown command:', data.command);
          result = { success: false, message: 'Unknown command' };
      }

      // Gửi kết quả lệnh về cho client
      wss.broadcast({
        type: 'command_result',
        command: data.command,
        result: result
      });
      
    } catch (error) {
      logger.error('Error handling WebSocket command:', error);
      wss.broadcast({
        type: 'command_error',
        command: data.command,
        error: error.message
      });
    }
  };

  // Thiết lập ping định kỳ để kiểm tra kết nối
  const interval = setInterval(() => {
    wss.clients.forEach((ws) => {
      if (ws.isAlive === false) return ws.terminate();
      
      ws.isAlive = false;
      ws.ping(() => {});
    });
  }, 30000);

  wss.on('close', () => {
    clearInterval(interval);
  });

  return wss;
};