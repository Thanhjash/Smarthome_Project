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

export const registerPerson = async (req, res) => {
    try {
        const { name } = req.body;
        const imageBuffer = req.file?.buffer;

        if (!name || !imageBuffer) {
            return res.status(400).json({
                success: false,
                message: 'Name and image are required'
            });
        }

        // Register face with camera service
        const result = await cameraService.registerPerson(name, imageBuffer);
        
        // Save person to database
        const person = new Person({
            name,
            registered: true,
            registeredAt: new Date()
        });
        await person.save();

        res.json({
            success: true,
            message: 'Person registered successfully',
            person: person,
            faceResult: result
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to register person',
            error: error.message
        });
    }
};

export const recognizePerson = async (req, res) => {
    try {
        const result = await cameraService.recognizeFace();
        
        // Log recognition attempt
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