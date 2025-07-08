#include <Wire.h>
#include <DFRobot_DF2301Q.h>      // Gravity Voice Recognition (I²C)
#include <DFRobotDFPlayerMini.h>  // DFPlayer Mini control

// — Voice Recognition on I²C —
// Default I²C address 0x50; uses Wire (A4/A5)
DFRobot_DF2301Q_I2C asr(&Wire, DF2301Q_I2C_ADDR);

// — DFPlayer Mini on hardware Serial1 (D0/D1) — 
DFRobotDFPlayerMini myDFPlayer;

// — Built-in Voice Command IDs (Gravity table) — 
const uint8_t CMD_PLAY_MUSIC  = 92;  // "Play music"
const uint8_t CMD_STOP_MUSIC  = 93;  // "Stop playing"
const uint8_t CMD_PREV_TRACK  = 94;  // "The last track"
const uint8_t CMD_NEXT_TRACK  = 95;  // "The next track"

// — Power Management & Recovery Variables —
unsigned long lastCommandTime = 0;
unsigned long lastStatusCheck = 0;
unsigned long playStartTime = 0;
bool isPlaying = false;
bool playerInitialized = false;
uint8_t currentTrack = 1;
uint8_t initAttempts = 0;
const uint8_t MAX_INIT_ATTEMPTS = 3;

// — Timing constants —
const unsigned long STATUS_CHECK_INTERVAL = 1000;  // Check status every 1 second
const unsigned long COMMAND_DEBOUNCE = 500;        // 500ms between commands
const unsigned long REINIT_DELAY = 2000;           // Wait 2s before reinit attempts

void setup() {
  // — Serial Monitor for debugging —
  Serial.begin(115200);
  while (!Serial) { delay(10); }
  
  Serial.println(F("=== Voice-Controlled Music Player ==="));
  Serial.println(F("Starting initialization..."));

  // — Initialize Voice Recognition Module (I²C) —
  Wire.begin();  // SDA = A4, SCL = A5
  if (!asr.begin()) {
    Serial.println(F("ERROR: Voice module not found! Check I²C wiring & switch."));
    while (true) { delay(1000); }
  }
  Serial.println(F("✓ Voice module ready (I²C)"));
  asr.setMuteMode(0);   // Unmute speaker on module
  asr.setWakeTime(100);  // Auto-sleep after 15 seconds of no command

  // — Initialize DFPlayer Mini with retries —
  initializeDFPlayer();
  
  Serial.println(F("=== Setup Complete ==="));
  Serial.println(F("Say 'Play music' to start!"));
  Serial.println();
}

void initializeDFPlayer() {
  Serial.println(F("Initializing DFPlayer Mini..."));
  Serial1.begin(9600);  // D0 = RX1, D1 = TX1
  delay(100);           // Extra settling time
  
  initAttempts = 0;
  playerInitialized = false;
  
  while (!playerInitialized && initAttempts < MAX_INIT_ATTEMPTS) {
    initAttempts++;
    Serial.print(F("DFPlayer init attempt "));
    Serial.print(initAttempts);
    Serial.print(F("/"));
    Serial.println(MAX_INIT_ATTEMPTS);
    
    if (myDFPlayer.begin(Serial1)) {
      Serial.println(F("✓ DFPlayer Mini initialized successfully"));
      
      // Configure DFPlayer with conservative settings
      delay(100);
      myDFPlayer.volume(20);  // Start with lower volume (0-30)
      delay(100);
      myDFPlayer.EQ(DFPLAYER_EQ_NORMAL);  // Normal EQ
      delay(100);
      
      // Get initial file count
      int fileCount = myDFPlayer.readFileCounts();
      if (fileCount > 0) {
        Serial.print(F("✓ Found "));
        Serial.print(fileCount);
        Serial.println(F(" files on SD card"));
        playerInitialized = true;
      } else {
        Serial.println(F("⚠ No files found on SD card"));
        playerInitialized = true; // Still consider it initialized
      }
    } else {
      Serial.print(F("✗ DFPlayer init failed, attempt "));
      Serial.println(initAttempts);
      if (initAttempts < MAX_INIT_ATTEMPTS) {
        delay(1000);  // Wait before retry
      }
    }
  }
  
  if (!playerInitialized) {
    Serial.println(F("ERROR: DFPlayer init failed after all attempts!"));
    Serial.println(F("Check: 1) Wiring 2) SD card 3) Power supply 4) Capacitor"));
  }
}

void loop() {
  unsigned long currentTime = millis();
  
  // 1) Poll Voice Module for commands
  handleVoiceCommands(currentTime);
  
  // 2) Monitor DFPlayer status and handle recovery
  monitorDFPlayerStatus(currentTime);
  
  // 3) Check for player health
  checkPlayerHealth(currentTime);
  
  delay(10);  // Small delay to prevent overwhelming the modules
}

void handleVoiceCommands(unsigned long currentTime) {
  // Debounce voice commands
  if (currentTime - lastCommandTime < COMMAND_DEBOUNCE) {
    return;
  }
  
  uint8_t id = asr.getCMDID();
  if (id >= 90) {
    lastCommandTime = currentTime;
    
    // Print every ID ≥ 90 for debugging
    Serial.print(F("Voice ID = "));
    Serial.print(id);
    Serial.print(F(" at "));
    Serial.print(currentTime);
    Serial.println(F("ms"));

    if (!playerInitialized) {
      Serial.println(F("⚠ DFPlayer not ready, attempting reinit..."));
      initializeDFPlayer();
      if (!playerInitialized) {
        Serial.println(F("✗ Cannot execute command - DFPlayer unavailable"));
        return;
      }
    }

    switch (id) {
      case CMD_PLAY_MUSIC:
        Serial.println(F("→ 'Play music' detected"));
        playMusic();
        break;

      case CMD_STOP_MUSIC:
        Serial.println(F("→ 'Stop playing' detected"));
        stopMusic();
        break;

      case CMD_PREV_TRACK:
        Serial.println(F("→ 'The last track' detected"));
        previousTrack();
        break;

      case CMD_NEXT_TRACK:
        Serial.println(F("→ 'The next track' detected"));
        nextTrack();
        break;

      default:
        Serial.print(F("→ Unmapped ID = "));
        Serial.println(id);
        break;
    }
  }
}

void playMusic() {
  if (!playerInitialized) return;
  
  Serial.print(F("Starting playback of track "));
  Serial.println(currentTrack);
  
  // Use play() instead of loop() for better control
  myDFPlayer.play(currentTrack);
  isPlaying = true;
  playStartTime = millis();
  
  delay(100);  // Give command time to process
}

void stopMusic() {
  if (!playerInitialized) return;
  
  Serial.println(F("Stopping playback"));
  myDFPlayer.stop();
  isPlaying = false;
  delay(100);
}

void nextTrack() {
  if (!playerInitialized) return;
  
  currentTrack++;
  if (currentTrack > 99) currentTrack = 1;  // Wrap around
  
  Serial.print(F("Next track: "));
  Serial.println(currentTrack);
  
  if (isPlaying) {
    myDFPlayer.play(currentTrack);
    playStartTime = millis();
  }
  delay(100);
}

void previousTrack() {
  if (!playerInitialized) return;
  
  currentTrack--;
  if (currentTrack < 1) currentTrack = 1;  // Stay at track 1
  
  Serial.print(F("Previous track: "));
  Serial.println(currentTrack);
  
  if (isPlaying) {
    myDFPlayer.play(currentTrack);
    playStartTime = millis();
  }
  delay(100);
}

void monitorDFPlayerStatus(unsigned long currentTime) {
  if (!playerInitialized) return;
  
  // Check for DFPlayer status messages
  if (myDFPlayer.available()) {
    uint8_t type = myDFPlayer.readType();
    uint16_t value = myDFPlayer.read();
    
    Serial.print(F("DFPlayer → type="));
    Serial.print(type);
    Serial.print(F(" value="));
    Serial.print(value);
    Serial.print(F(" ("));
    Serial.print(currentTime);
    Serial.println(F("ms)"));
    
    // Handle different status types
    switch (type) {
      case DFPlayerPlayFinished:
        Serial.println(F("Track finished - restarting"));
        if (isPlaying) {
          // Auto-restart the same track to create loop effect
          delay(100);
          myDFPlayer.play(currentTrack);
          playStartTime = millis();
        }
        break;
        
      case DFPlayerError:
        Serial.print(F("DFPlayer Error: "));
        Serial.println(value);
        handleDFPlayerError(value);
        break;
        
      case DFPlayerCardInserted:
        Serial.println(F("SD Card inserted"));
        break;
        
      case DFPlayerCardRemoved:
        Serial.println(F("SD Card removed!"));
        isPlaying = false;
        break;
    }
  }
}

void handleDFPlayerError(uint16_t errorCode) {
  Serial.print(F("Handling DFPlayer error: "));
  Serial.println(errorCode);
  
  switch (errorCode) {
    case 1:
      Serial.println(F("Error: Module busy"));
      break;
    case 2:
      Serial.println(F("Error: Module sleeping"));
      break;
    case 3:
      Serial.println(F("Error: Serial wrong stack"));
      break;
    case 4:
      Serial.println(F("Error: Checksum not match"));
      break;
    case 5:
      Serial.println(F("Error: File index out of bound"));
      break;
    case 6:
      Serial.println(F("Error: File not found"));
      break;
    case 7:
      Serial.println(F("Error: Insert error"));
      break;
    case 8:
      Serial.println(F("Error: SD card error"));
      break;
    case 10:
      Serial.println(F("Error: Module sleep"));
      break;
    default:
      Serial.println(F("Error: Unknown"));
      break;
  }
  
  // Try to recover from certain errors
  if (errorCode == 1 || errorCode == 2 || errorCode == 10) {
    Serial.println(F("Attempting error recovery..."));
    delay(500);
    if (isPlaying) {
      myDFPlayer.play(currentTrack);
    }
  }
}

void checkPlayerHealth(unsigned long currentTime) {
  if (!playerInitialized) return;
  
  // Check if we should be playing but haven't heard from DFPlayer in a while
  if (isPlaying && currentTime - playStartTime > 5000) {  // 5 seconds
    if (currentTime - lastStatusCheck > STATUS_CHECK_INTERVAL) {
      lastStatusCheck = currentTime;
      
      Serial.println(F("Health check: Checking if playback is still active..."));
      
      // Try to get current status
      int state = myDFPlayer.readState();
      if (state != 1) {  // 1 = playing
        Serial.println(F("⚠ Playback appears to have stopped unexpectedly"));
        Serial.println(F("Attempting to restart playback..."));
        
        // Try to restart
        delay(100);
        myDFPlayer.play(currentTrack);
        playStartTime = millis();
      } else {
        Serial.println(F("✓ Playback health OK"));
      }
    }
  }
}