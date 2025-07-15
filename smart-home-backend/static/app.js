// Camera System Integration for Smart Home
class CameraManager {
    constructor() {
        this.API_BASE = '/api/camera';
        this.isConnected = false;
        this.init();
    }

    init() {
        this.checkStatus();
        this.setupEventListeners();
        this.loadPersons();
        
        // Check status every 30 seconds
        setInterval(() => this.checkStatus(), 30000);
    }

    async checkStatus() {
        try {
            const response = await fetch(`${this.API_BASE}/status`);
            const data = await response.json();
            this.isConnected = data.success && data.isConnected;
            this.updateStatusUI();
        } catch (error) {
            console.error('Camera status check failed:', error);
            this.isConnected = false;
            this.updateStatusUI();
        }
    }

    updateStatusUI() {
        const statusElements = document.querySelectorAll('.camera-status');
        statusElements.forEach(el => {
            el.className = `camera-status ${this.isConnected ? 'connected' : 'disconnected'}`;
            el.textContent = this.isConnected ? 'Camera Online' : 'Camera Offline';
        });

        // Update status indicator in header
        const indicator = document.getElementById('cameraStatusIndicator');
        if (indicator) {
            indicator.className = `status-indicator ${this.isConnected ? 'online' : ''}`;
        }
    }

    setupEventListeners() {
        // Registration form
        const regForm = document.getElementById('cameraRegisterForm');
        if (regForm) {
            regForm.addEventListener('submit', (e) => this.handleRegistration(e));
        }

        // Recognition button
        const recBtn = document.getElementById('cameraRecognizeBtn');
        if (recBtn) {
            recBtn.addEventListener('click', () => this.handleRecognition());
        }

        // File input
        const fileInput = document.getElementById('cameraImageInput');
        if (fileInput) {
            fileInput.addEventListener('change', (e) => {
                const fileName = e.target.files[0]?.name || 'Choose image...';
                const label = document.querySelector('.camera-file-label');
                if (label) label.textContent = fileName;
            });
        }
    }

    async handleRegistration(e) {
        e.preventDefault();
        
        const nameInput = document.getElementById('cameraNameInput');
        const imageInput = document.getElementById('cameraImageInput');
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const resultDiv = document.getElementById('cameraRegResult');

        if (!nameInput.value.trim() || !imageInput.files[0]) {
            this.showResult(resultDiv, 'Name and image required', 'error');
            return;
        }

        // Loading state
        submitBtn.disabled = true;
        submitBtn.textContent = 'Registering...';
        this.showResult(resultDiv, 'Processing registration...', 'loading');

        try {
            const formData = new FormData();
            formData.append('name', nameInput.value.trim());
            formData.append('image', imageInput.files[0]);

            const response = await fetch(`${this.API_BASE}/register`, {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (data.success) {
                this.showResult(resultDiv, `✅ Registered: ${data.person.name}`, 'success');
                nameInput.value = '';
                imageInput.value = '';
                document.querySelector('.camera-file-label').textContent = 'Choose image...';
                setTimeout(() => this.loadPersons(), 1000);
            } else {
                this.showResult(resultDiv, `❌ ${data.message || data.error}`, 'error');
            }
        } catch (error) {
            this.showResult(resultDiv, `❌ Network error: ${error.message}`, 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Register';
        }
    }

    async handleRecognition() {
        const recBtn = document.getElementById('cameraRecognizeBtn');
        const resultDiv = document.getElementById('cameraRecResult');

        recBtn.disabled = true;
        recBtn.textContent = 'Recognizing...';
        this.showResult(resultDiv, 'Analyzing face...', 'loading');

        try {
            const response = await fetch(`${this.API_BASE}/recognize`, {
                method: 'POST'
            });

            const data = await response.json();

            if (data.success && data.recognition.success) {
                if (data.recognition.recognized) {
                    const confidence = (data.recognition.confidence * 100).toFixed(1);
                    this.showResult(resultDiv, 
                        `✅ Recognized: <strong>${data.recognition.name}</strong> (${confidence}% confidence)`, 'success');
                    setTimeout(() => this.loadPersons(), 1000);
                } else {
                    this.showResult(resultDiv, '❓ No matching face found', 'error');
                }
            } else {
                this.showResult(resultDiv, `❌ ${data.recognition?.message || data.message}`, 'error');
            }
        } catch (error) {
            this.showResult(resultDiv, `❌ Network error: ${error.message}`, 'error');
        } finally {
            recBtn.disabled = false;
            recBtn.textContent = 'Test Recognition';
        }
    }

    async loadPersons() {
        const container = document.getElementById('cameraPersonsList');
        if (!container) return;

        try {
            const response = await fetch(`${this.API_BASE}/persons`);
            const data = await response.json();

            if (data.success) {
                if (data.persons.length === 0) {
                    container.innerHTML = '<div class="no-persons">No persons registered yet</div>';
                } else {
                    container.innerHTML = data.persons.map(person => `
                        <div class="person-card">
                            <h4>${person.name}</h4>
                            <p><strong>Access Level:</strong> ${person.accessLevel}</p>
                            <p><strong>Registered:</strong> ${new Date(person.registeredAt).toLocaleDateString()}</p>
                            <p><strong>Last Seen:</strong> ${person.lastSeen ? 
                                new Date(person.lastSeen).toLocaleString() : 'Never'}</p>
                            <span class="status ${person.isActive ? 'active' : 'inactive'}">
                                ${person.isActive ? '● Active' : '● Inactive'}
                            </span>
                        </div>
                    `).join('');
                }
            } else {
                container.innerHTML = `<div class="error">Failed to load: ${data.message}</div>`;
            }
        } catch (error) {
            container.innerHTML = `<div class="error">Network error: ${error.message}</div>`;
        }
    }

    showResult(element, message, type) {
        if (!element) return;
        element.style.display = 'block';
        element.innerHTML = message;
        element.className = `camera-result ${type}`;
    }
}

// CSS Styles for Camera UI
const cameraStyles = `
    .camera-section {
        background: #f8f9fa;
        border-radius: 10px;
        padding: 25px;
        margin: 30px 0;
        border: 2px solid #e9ecef;
    }
    
    .camera-section h3 {
        color: #2c3e50;
        margin-bottom: 20px;
        display: flex;
        align-items: center;
        gap: 10px;
    }
    
    .camera-status {
        display: inline-block;
        padding: 4px 12px;
        border-radius: 20px;
        font-size: 0.9rem;
        font-weight: 500;
        margin-left: 10px;
    }
    
    .camera-status.connected {
        background: #d4edda;
        color: #155724;
    }
    
    .camera-status.disconnected {
        background: #f8d7da;
        color: #721c24;
    }
    
    .camera-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 30px;
        margin-top: 20px;
    }
    
    .camera-card {
        background: white;
        border-radius: 8px;
        padding: 20px;
        border: 1px solid #dee2e6;
    }
    
    .camera-card h4 {
        color: #495057;
        margin-bottom: 15px;
    }
    
    .camera-form {
        display: grid;
        gap: 15px;
    }
    
    .camera-input-group {
        display: flex;
        flex-direction: column;
        gap: 5px;
    }
    
    .camera-input-group label {
        font-weight: 500;
        color: #495057;
    }
    
    .camera-input-group input {
        padding: 10px 12px;
        border: 2px solid #ced4da;
        border-radius: 6px;
        font-size: 1rem;
        transition: border-color 0.3s;
    }
    
    .camera-input-group input:focus {
        outline: none;
        border-color: #4CAF50;
    }
    
    .camera-file-input {
        position: relative;
        overflow: hidden;
        display: inline-block;
        width: 100%;
    }
    
    .camera-file-input input[type=file] {
        position: absolute;
        left: -9999px;
    }
    
    .camera-file-label {
        padding: 10px 12px;
        background: #f8f9fa;
        border: 2px dashed #ced4da;
        border-radius: 6px;
        cursor: pointer;
        display: block;
        text-align: center;
        transition: all 0.3s;
    }
    
    .camera-file-label:hover {
        background: #e9ecef;
        border-color: #4CAF50;
    }
    
    .camera-btn {
        background: #4CAF50;
        color: white;
        border: none;
        padding: 12px 20px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 1rem;
        font-weight: 500;
        transition: all 0.3s;
        width: 100%;
    }
    
    .camera-btn:hover {
        background: #45a049;
        transform: translateY(-1px);
    }
    
    .camera-btn:disabled {
        background: #6c757d;
        cursor: not-allowed;
        transform: none;
    }
    
    .camera-btn.recognition {
        background: #2196F3;
    }
    
    .camera-btn.recognition:hover {
        background: #1976D2;
    }
    
    .camera-result {
        padding: 12px;
        border-radius: 6px;
        margin-top: 15px;
        display: none;
    }
    
    .camera-result.success {
        background: #d4edda;
        color: #155724;
        border: 1px solid #c3e6cb;
    }
    
    .camera-result.error {
        background: #f8d7da;
        color: #721c24;
        border: 1px solid #f5c6cb;
    }
    
    .camera-result.loading {
        background: #d1ecf1;
        color: #0c5460;
        border: 1px solid #bee5eb;
    }
    
    .persons-section {
        grid-column: span 2;
        margin-top: 20px;
    }
    
    .persons-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: 15px;
        margin-top: 15px;
    }
    
    .person-card {
        background: white;
        border: 1px solid #dee2e6;
        border-radius: 8px;
        padding: 15px;
        transition: transform 0.3s, box-shadow 0.3s;
    }
    
    .person-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }
    
    .person-card h4 {
        margin: 0 0 10px 0;
        color: #2c3e50;
    }
    
    .person-card p {
        margin: 5px 0;
        color: #6c757d;
        font-size: 0.9rem;
    }
    
    .status.active {
        color: #28a745;
        font-weight: 500;
    }
    
    .status.inactive {
        color: #dc3545;
        font-weight: 500;
    }
    
    .no-persons, .error {
        text-align: center;
        padding: 30px;
        color: #6c757d;
        font-style: italic;
    }
    
    .error {
        color: #dc3545;
    }
    
    @media (max-width: 768px) {
        .camera-grid {
            grid-template-columns: 1fr;
            gap: 20px;
        }
        
        .persons-section {
            grid-column: span 1;
        }
        
        .persons-grid {
            grid-template-columns: 1fr;
        }
    }
`;

// HTML template for camera section
function getCameraHTML() {
    return `
        <div class="camera-section">
            <h3>🎥 Camera Security System <span class="camera-status">Checking...</span></h3>
            
            <div class="camera-grid">
                <div class="camera-card">
                    <h4>👤 Register New Person</h4>
                    <form id="cameraRegisterForm" class="camera-form">
                        <div class="camera-input-group">
                            <label>Full Name:</label>
                            <input type="text" id="cameraNameInput" placeholder="Enter person's name" required>
                        </div>
                        <div class="camera-input-group">
                            <label>Face Photo:</label>
                            <div class="camera-file-input">
                                <input type="file" id="cameraImageInput" accept="image/*" required>
                                <label for="cameraImageInput" class="camera-file-label">Choose image...</label>
                            </div>
                        </div>
                        <button type="submit" class="camera-btn">Register</button>
                    </form>
                    <div id="cameraRegResult" class="camera-result"></div>
                </div>
                
                <div class="camera-card">
                    <h4>🔍 Live Face Recognition</h4>
                    <p style="margin-bottom: 20px; color: #666; font-size: 0.95rem;">
                        Test face recognition using live camera feed
                    </p>
                    <button id="cameraRecognizeBtn" class="camera-btn recognition">Test Recognition</button>
                    <div id="cameraRecResult" class="camera-result"></div>
                </div>
                
                <div class="persons-section">
                    <h4>👥 Registered Persons</h4>
                    <div id="cameraPersonsList" class="persons-grid">
                        <div style="grid-column: 1/-1;" class="no-persons">Loading persons...</div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Add CSS to page
function addCameraStyles() {
    const style = document.createElement('style');
    style.textContent = cameraStyles;
    document.head.appendChild(style);
}

// Initialize camera system when DOM loaded
document.addEventListener('DOMContentLoaded', function() {
    // Add camera section to main content
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
        addCameraStyles();
        
        // Create camera section
        const cameraDiv = document.createElement('div');
        cameraDiv.innerHTML = getCameraHTML();
        mainContent.appendChild(cameraDiv);
        
        // Initialize camera manager
        window.cameraManager = new CameraManager();
    }
});

// Export for use in other parts of app
window.CameraManager = CameraManager;