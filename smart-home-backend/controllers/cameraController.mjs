import { CameraService } from '../services/cameraService.mjs';
import Person from '../models/Person.mjs';

const cameraService = new CameraService();

export const getCameraStatus = async (req, res) => {
    try {
        const status = await cameraService.testConnection();
        res.json({
            success: true,
            status: status,
            isConnected: cameraService.isConnected
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to get camera status',
            error: error.message
        });
    }
};

// Thay thế hàm registerPerson cũ bằng hàm đã được sửa lỗi này
export const registerPerson = async (req, res) => {
    try {
        const { name } = req.body;
        const imageBuffer = req.file?.buffer;

        if (!name || !imageBuffer) {
            return res.status(400).json({ success: false, message: 'Name and image are required' });
        }

        // Service sẽ resolve hoặc reject với thông tin đầy đủ
        const result = await cameraService.registerPerson(name, imageBuffer);
        
        // Chỉ lưu vào DB Person nếu service trả về thành công
        const person = new Person({
            name,
            registered: true,
            registeredAt: new Date()
        });
        await person.save();

        res.json({
            success: true,
            message: 'Person registered successfully',
            person: person
        });

    } catch (errorResultFromPython) {
        // Lỗi này đến từ promise bị reject trong service, chứa thông tin chi tiết
        res.status(400).json({
            success: false,
            // Hiển thị thông báo lỗi từ Python, hoặc một thông báo chung
            message: errorResultFromPython.message || 'Failed to register person'
        });
    }
};


// NEW: Register person from camera capture
export const registerFromCapture = async (req, res) => {
    try {
        const { name } = req.body;

        if (!name) {
            return res.status(400).json({
                success: false,
                message: 'Name is required'
            });
        }

        // Register using camera capture
        const result = await cameraService.registerFromCapture(name);
        
        // Save person to database
        const person = new Person({
            name,
            registered: true,
            registeredAt: new Date()
        });
        await person.save();

        res.json({
            success: true,
            message: 'Person registered from camera successfully',
            person: person,
            faceResult: result
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to register from camera',
            error: error.message
        });
    }
};

// NEW: Capture image from camera
export const captureFromCamera = async (req, res) => {
    try {
        const result = await cameraService.captureFromCamera();
        res.json({
            success: true,
            capture: result
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to capture from camera',
            error: error.message
        });
    }
};

// NEW: Get live frame for preview
export const getLiveFrame = async (req, res) => {
    try {
        const frameBuffer = await cameraService.getLiveFrame();
        
        res.set({
            'Content-Type': 'image/jpeg',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        });
        
        res.send(frameBuffer);
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to get live frame',
            error: error.message
        });
    }
};

export const recognizePerson = async (req, res) => {
    try {
        const imageBuffer = req.file?.buffer;

        if (!imageBuffer) {
            return res.status(400).json({ success: false, message: 'Image file is required for recognition.' });
        }
        
        // Gọi hàm service để nhận diện từ file (chúng ta sẽ tạo hàm này ở bước tiếp theo)
        const result = await cameraService.recognizeFaceFromFile(imageBuffer);
        
        // Log lại nếu nhận diện được
        if (result.recognized) {
            const person = await Person.findOne({ name: result.name });
            if (person) {
                person.lastSeen = new Date();
                await person.save();
            }
        }

        res.json({
            success: true,
            recognition: result
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Recognition failed',
            error: error.message
        });
    }
};

export const getRegisteredPersons = async (req, res) => {
    try {
        const persons = await Person.find({ registered: true });
        res.json({
            success: true,
            persons: persons
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to get persons',
            error: error.message
        });
    }
};

export const startLiveStream = async (req, res) => {
    try {
        const result = await cameraService.startLiveStream();
        res.json(result);
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to start live stream',
            error: error.message
        });
    }
};