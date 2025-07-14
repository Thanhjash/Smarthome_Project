import { CameraService } from '../services/cameraService.mjs';

const cameraService = new CameraService();

async function testCameraConnection() {
    console.log('Testing camera connection...');
    
    try {
        const result = await cameraService.testConnection();
        console.log('✅ Camera test result:', result);
        return true;
    } catch (error) {
        console.log('❌ Camera test failed:', error);
        return false;
    }
}

async function runTests() {
    console.log('=== Camera Service Tests ===');
    
    const connectionTest = await testCameraConnection();
    
    console.log('\n=== Test Results ===');
    console.log(`Camera Connection: ${connectionTest ? 'PASS' : 'FAIL'}`);
}

// Run tests
runTests().catch(console.error);