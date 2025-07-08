// utils/CommandQueue.mjs
import EventEmitter from 'events';
import logger from './logger.mjs';

class CommandQueue extends EventEmitter {
  constructor() {
    super();
    this.queue = [];
    this.processing = false;
    this.maxConcurrent = 1;  // Process one command at a time
    this.activeCommands = 0;
    this.retryDelay = 1000;  // Base retry delay in ms
    this.maxRetries = 3;     // Maximum retry attempts
  }
  
  // Add command to queue with priority
  addCommand(command, priority = 1, metadata = {}) {
    return new Promise((resolve, reject) => {
      const id = `${Date.now()}${Math.random().toString(36).substring(2, 6)}`;
      logger.debug(`Adding command to queue: [${id}] ${metadata.commandType || 'unknown'}`);
      
      this.queue.push({
        id,
        command,
        priority,
        retries: 0,
        metadata,
        timestamp: Date.now(),
        resolve,
        reject
      });
      
      // Sort by priority (higher first) then by timestamp (older first)
      this.queue.sort((a, b) => 
        b.priority - a.priority || 
        a.timestamp - b.timestamp
      );
      
      // Start processing if not already running
      this.processQueue();
      
      // Return command ID for future reference
      return id;
    });
  }
  
  // Process commands in queue
  async processQueue() {
    // Skip if already processing at max capacity or queue is empty
    if (this.activeCommands >= this.maxConcurrent || this.queue.length === 0) {
      return;
    }
    
    this.activeCommands++;
    const item = this.queue.shift();
    
    logger.debug(`Processing command: [${item.id}] ${
      item.metadata.commandType || 'unknown'} (${item.retries} retries)`);
    
    try {
      const startTime = Date.now();
      const result = await item.command();
      const duration = Date.now() - startTime;
      
      logger.debug(`Command completed: [${item.id}] in ${duration}ms`);
      
      // Resolve the promise
      item.resolve(result);
      
      // Emit success event
      this.emit('commandComplete', {
        id: item.id,
        metadata: item.metadata,
        result,
        duration
      });
    } catch (error) {
      // Check if we should retry
      if (item.retries < this.maxRetries) {
        // Calculate exponential backoff delay
        const delay = this.retryDelay * Math.pow(2, item.retries);
        
        logger.warn(`Command [${item.id}] failed, retrying in ${delay}ms (attempt ${item.retries + 1}/${this.maxRetries})`);
        
        // Increment retry count
        item.retries++;
        
        // Re-add to queue with delay and adjusted priority
        setTimeout(() => {
          // Add back to queue with slightly reduced priority
          this.queue.push({
            ...item,
            priority: Math.max(1, item.priority - 0.1),  // Slight priority reduction
            timestamp: Date.now()  // Update timestamp
          });
          
          // Re-sort queue
          this.queue.sort((a, b) => 
            b.priority - a.priority || 
            a.timestamp - b.timestamp
          );
          
          // Continue processing
          this.processQueue();
        }, delay);
      } else {
        // Max retries exceeded
        logger.error(`Command [${item.id}] failed after ${this.maxRetries} retries: ${error.message}`);
        
        // Reject the promise
        item.reject(error);
        
        // Emit failure event
        this.emit('commandFailed', {
          id: item.id,
          metadata: item.metadata,
          error: error.message
        });
      }
    } finally {
      // Decrease active command count
      this.activeCommands--;
      
      // Continue processing queue
      this.processQueue();
    }
  }
  
  // Get queue status
  getStatus() {
    return {
      queueLength: this.queue.length,
      activeCommands: this.activeCommands,
      priorities: this.queue.map(item => item.priority)
    };
  }
  
  // Clear all commands in queue
  clearQueue() {
    const count = this.queue.length;
    
    // Reject all pending commands
    this.queue.forEach(item => {
      item.reject(new Error('Queue was cleared'));
    });
    
    this.queue = [];
    logger.info(`Cleared ${count} commands from queue`);
    
    return count;
  }
}

// Singleton instance
const commandQueue = new CommandQueue();
export default commandQueue;