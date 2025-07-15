import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

export class CameraService {
    constructor() {
        this.faceDbPath = './faces_db';
        this.tempPath = './temp';
        this.ensureDirectoriesExist();
    }

    ensureDirectoriesExist() {
        if (!fs.existsSync(this.faceDbPath)) {
            fs.mkdirSync(this.faceDbPath, { recursive: true });
        }
        if (!fs.existsSync(this.tempPath)) {
            fs.mkdirSync(this.tempPath, { recursive: true });
        }
    }


    // Thay thế hàm registerPerson cũ bằng hàm đã được sửa lỗi triệt để này
    async registerPerson(name, imageBuffer) {
        return new Promise((resolve, reject) => {
            const personDir = path.join(this.faceDbPath, name);
            if (!fs.existsSync(personDir)) {
                fs.mkdirSync(personDir, { recursive: true });
            }

            const imagePath = path.join(personDir, `${Date.now()}.jpg`);
            fs.writeFileSync(imagePath, imageBuffer);

            const python = spawn('python', [
                './scripts/register_face.py',
                name,
                imagePath
            ]);

            let stdoutData = '';
            let stderrData = '';

            python.stdout.on('data', (data) => {
                stdoutData += data.toString();
            });

            python.stderr.on('data', (data) => {
                stderrData += data.toString();
            });

            python.on('close', (code) => {
                try {
                    const result = JSON.parse(stdoutData.trim());
                    
                    if (code === 0 && result.success) { // Nếu script chạy thành công VÀ trả về success: true
                        if (stderrData) console.warn(`Python Warnings (register_face): ${stderrData}`);
                        resolve(result); // Trả về kết quả thành công
                    } else { // Nếu script chạy lỗi HOẶC trả về success: false
                        // **LOGIC SỬA LỖI QUAN TRỌNG: Xóa file ảnh không hợp lệ**
                        if (fs.existsSync(imagePath)) {
                            fs.unlinkSync(imagePath);
                        }
                        console.error(`Python Error or logical failure (register_face): ${stderrData || result.message}`);
                        reject(result); // Reject promise với thông báo lỗi chi tiết từ Python
                    }
                } catch (e) {
                    // Nếu không parse được JSON -> Lỗi nghiêm trọng
                    if (fs.existsSync(imagePath)) {
                        fs.unlinkSync(imagePath);
                    }
                    console.error(`Failed to parse Python output: ${stdoutData}. Stderr: ${stderrData}`);
                    reject({ success: false, message: "Internal script error." });
                }
            });
        });
    }
    
    
    async recognizeFaceFromFile(imageBuffer) {
        return new Promise((resolve, reject) => {
            const tempImagePath = path.join(this.tempPath, `rec_${Date.now()}.jpg`);
            fs.writeFileSync(tempImagePath, imageBuffer);

            const python = spawn('python', [
                './scripts/recognize_face.py',
                tempImagePath,
                this.faceDbPath
            ]);

            let stdoutData = '';
            let stderrData = '';

            python.stdout.on('data', (data) => {
                stdoutData += data.toString();
            });

            python.stderr.on('data', (data) => {
                stderrData += data.toString();
            });

            python.on('close', (code) => {
                if (fs.existsSync(tempImagePath)) {
                    fs.unlinkSync(tempImagePath);
                }
                
                if (code === 0) { // Thành công
                    if (stderrData) {
                        console.warn(`Python Warnings (recognize_face): ${stderrData}`);
                    }
                    try {
                        resolve(JSON.parse(stdoutData.trim()));
                    } catch (error) {
                        reject({ success: false, message: 'Failed to parse Python success result.' });
                    }
                } else { // Thất bại
                    console.error(`Python Error (recognize_face): ${stderrData}`);
                    reject({ success: false, message: `Recognition script failed with exit code ${code}.` });
                }
            });
        });
    }
}