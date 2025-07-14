import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

export class CameraService {
    constructor() {
        this.cameraConfig = {
            ip: "192.168.3.100",
            username: "admin", 
            password: "251005PAnh",
            rtspUrl: "rtsp://admin:251005PAnh@192.168.3.100:554/onvif1"
        };
        this.isConnected = false;
        this.faceDbPath = './faces_db';
        this.ensureFaceDbExists();
    }

    ensureFaceDbExists() {
        if (!fs.existsSync(this.faceDbPath)) {
            fs.mkdirSync(this.faceDbPath, { recursive: true });
        }
    }

    async testConnection() {
        return new Promise((resolve, reject) => {
            const python = spawn('python', [
                './scripts/test_camera.py', 
                this.cameraConfig.rtspUrl
            ]);

            let output = '';
            python.stdout.on('data', (data) => {
                output += data.toString();
            });

            python.on('close', (code) => {
                if (code === 0) {
                    this.isConnected = true;
                    resolve({ success: true, message: 'Camera connected successfully' });
                } else {
                    this.isConnected = false;
                    reject({ success: false, message: 'Camera connection failed', output });
                }
            });

            python.stderr.on('data', (data) => {
                console.error('Camera test error:', data.toString());
            });
        });
    }

    async registerPerson(name, imageBuffer) {
        return new Promise((resolve, reject) => {
            const personDir = path.join(this.faceDbPath, name);
            if (!fs.existsSync(personDir)) {
                fs.mkdirSync(personDir, { recursive: true });
            }

            const imagePath = path.join(personDir, 'face.jpg');
            fs.writeFileSync(imagePath, imageBuffer);

            const python = spawn('python', [
                './scripts/register_face.py',
                name,
                imagePath
            ]);

            python.on('close', (code) => {
                if (code === 0) {
                    resolve({ success: true, name, message: 'Person registered successfully' });
                } else {
                    reject({ success: false, message: 'Face registration failed' });
                }
            });
        });
    }

    async recognizeFace() {
        return new Promise((resolve, reject) => {
            const python = spawn('python', [
                './scripts/recognize_face.py',
                this.cameraConfig.rtspUrl,
                this.faceDbPath
            ]);

            let result = '';
            python.stdout.on('data', (data) => {
                result += data.toString();
            });

            python.stderr.on('data', (data) => {
                console.error('Python stderr:', data.toString());
            });

            python.on('close', (code) => {
                console.log('Raw Python output:', result);
                console.log('Trying to parse:', result.trim());
                try {
                    const parsed = JSON.parse(result.trim());
                    resolve(parsed);
                } catch (error) {
                    console.error('Parse error:', error.message);
                    reject({ success: false, message: 'Recognition parsing failed', rawOutput: result });
                }
            });

            // Add timeout
            setTimeout(() => {
                python.kill();
                reject({ success: false, message: 'Recognition timeout after 60 seconds' });
            }, 60000);
        });
    }

    async startLiveStream() {
        return new Promise((resolve, reject) => {
            const python = spawn('python', [
                './scripts/live_stream.py',
                this.cameraConfig.rtspUrl
            ]);

            python.on('spawn', () => {
                resolve({ success: true, message: 'Live stream started' });
            });

            python.on('error', (error) => {
                reject({ success: false, message: 'Failed to start live stream', error: error.message });
            });
        });
    }
}