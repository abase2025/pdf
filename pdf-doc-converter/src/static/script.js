// Conversor PDF ↔ DOC - JavaScript Frontend
class PDFDocConverter {
    constructor() {
        this.selectedFiles = [];
        this.conversionType = 'pdf-to-doc';
        this.isConverting = false;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateUI();
    }

    setupEventListeners() {
        // Conversion type selection
        document.querySelectorAll('input[name="conversionType"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.conversionType = e.target.value;
                this.updateUI();
            });
        });

        // File input
        const fileInput = document.getElementById('file-input');
        fileInput.addEventListener('change', (e) => {
            this.handleFiles(e.target.files);
        });

        // Drag and drop
        const uploadArea = document.getElementById('upload-area');
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });

        uploadArea.addEventListener('dragleave', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            this.handleFiles(e.dataTransfer.files);
        });

        // Convert button
        document.getElementById('convert-btn').addEventListener('click', () => {
            this.startConversion();
        });

        // Cancel button
        document.getElementById('cancel-btn').addEventListener('click', () => {
            this.cancelConversion();
        });

        // New conversion button
        document.getElementById('new-conversion-btn').addEventListener('click', () => {
            this.resetInterface();
        });

        // Download all button
        document.getElementById('download-all-btn').addEventListener('click', () => {
            this.downloadAll();
        });
    }

    updateUI() {
        // Show/hide relevant sections based on conversion type
        const passwordSection = document.getElementById('password-section');
        const ocrLanguageSection = document.getElementById('ocr-language-section');
        const ocrEngineSection = document.getElementById('ocr-engine-section');

        // Reset visibility
        passwordSection.style.display = 'none';
        ocrLanguageSection.style.display = 'none';
        ocrEngineSection.style.display = 'none';

        // Show relevant options
        if (this.conversionType === 'pdf-to-doc' || this.conversionType === 'ocr-pdf') {
            passwordSection.style.display = 'block';
        }

        if (this.conversionType === 'ocr-pdf') {
            ocrLanguageSection.style.display = 'block';
            ocrEngineSection.style.display = 'block';
        }

        // Update file input accept attribute
        const fileInput = document.getElementById('file-input');
        switch (this.conversionType) {
            case 'pdf-to-doc':
            case 'ocr-pdf':
                fileInput.accept = '.pdf';
                break;
            case 'doc-to-pdf':
                fileInput.accept = '.doc,.docx';
                break;
        }

        // Update convert button state
        this.updateConvertButton();
    }

    handleFiles(files) {
        const validFiles = [];
        const errors = [];

        Array.from(files).forEach(file => {
            // Validate file type
            if (!this.isValidFileType(file)) {
                errors.push(`${file.name}: Tipo de arquivo não suportado`);
                return;
            }

            // Validate file size (50MB limit)
            if (file.size > 50 * 1024 * 1024) {
                errors.push(`${file.name}: Arquivo muito grande (máximo 50MB)`);
                return;
            }

            validFiles.push(file);
        });

        // Show errors if any
        if (errors.length > 0) {
            this.showAlert('Alguns arquivos não puderam ser adicionados:', errors, 'warning');
        }

        // Add valid files
        this.selectedFiles = [...this.selectedFiles, ...validFiles];
        this.displayFiles();
        this.updateConvertButton();
    }

    isValidFileType(file) {
        const allowedTypes = {
            'pdf-to-doc': ['application/pdf'],
            'ocr-pdf': ['application/pdf'],
            'doc-to-pdf': [
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            ]
        };

        return allowedTypes[this.conversionType].includes(file.type) ||
               (this.conversionType !== 'doc-to-pdf' && file.name.toLowerCase().endsWith('.pdf')) ||
               (this.conversionType === 'doc-to-pdf' && (file.name.toLowerCase().endsWith('.doc') || file.name.toLowerCase().endsWith('.docx')));
    }

    displayFiles() {
        const fileList = document.getElementById('file-list');
        const filesContainer = document.getElementById('files-container');

        if (this.selectedFiles.length === 0) {
            fileList.style.display = 'none';
            return;
        }

        fileList.style.display = 'block';
        filesContainer.innerHTML = '';

        this.selectedFiles.forEach((file, index) => {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item d-flex justify-content-between align-items-center';
            fileItem.innerHTML = `
                <div class="d-flex align-items-center">
                    <i class="fas ${this.getFileIcon(file)} me-3 text-primary"></i>
                    <div>
                        <div class="fw-medium">${file.name}</div>
                        <small class="text-muted">${this.formatFileSize(file.size)}</small>
                    </div>
                </div>
                <button class="btn btn-outline-danger btn-sm" onclick="converter.removeFile(${index})">
                    <i class="fas fa-times"></i>
                </button>
            `;
            filesContainer.appendChild(fileItem);
        });
    }

    getFileIcon(file) {
        if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
            return 'fa-file-pdf';
        } else if (file.name.toLowerCase().endsWith('.doc') || file.name.toLowerCase().endsWith('.docx')) {
            return 'fa-file-word';
        }
        return 'fa-file';
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    removeFile(index) {
        this.selectedFiles.splice(index, 1);
        this.displayFiles();
        this.updateConvertButton();
    }

    updateConvertButton() {
        const convertBtn = document.getElementById('convert-btn');
        const hasFiles = this.selectedFiles.length > 0;
        
        convertBtn.disabled = !hasFiles || this.isConverting;
        
        if (hasFiles && !this.isConverting) {
            convertBtn.innerHTML = `
                <i class="fas fa-magic me-2"></i>
                <span>Converter ${this.selectedFiles.length} arquivo${this.selectedFiles.length > 1 ? 's' : ''}</span>
            `;
        } else {
            convertBtn.innerHTML = `
                <i class="fas fa-magic me-2"></i>
                <span>Converter Arquivos</span>
            `;
        }
    }

    async startConversion() {
        if (this.selectedFiles.length === 0 || this.isConverting) return;

        this.isConverting = true;
        this.showProgressSection();
        this.updateConvertButton();

        try {
            const formData = new FormData();
            
            // Add files
            this.selectedFiles.forEach((file, index) => {
                formData.append('files', file);
            });

            // Add conversion settings
            formData.append('conversion_type', this.conversionType);
            formData.append('quality', document.getElementById('quality').value);
            
            const password = document.getElementById('pdf-password').value;
            if (password) {
                formData.append('password', password);
            }

            if (this.conversionType === 'ocr-pdf') {
                formData.append('ocr_language', document.getElementById('ocr-language').value);
                formData.append('ocr_engine', document.getElementById('ocr-engine').value);
            }

            // Start conversion
            const response = await fetch('/api/convert', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error(`Erro na conversão: ${response.statusText}`);
            }

            const result = await response.json();
            
            if (result.success) {
                this.showResults(result.files);
            } else {
                throw new Error(result.error || 'Erro desconhecido na conversão');
            }

        } catch (error) {
            console.error('Conversion error:', error);
            this.showAlert('Erro na Conversão', [error.message], 'danger');
            this.hideProgressSection();
        } finally {
            this.isConverting = false;
            this.updateConvertButton();
        }
    }

    showProgressSection() {
        document.getElementById('progress-section').style.display = 'block';
        this.updateProgress(0, 'Iniciando conversão...');
        
        // Simulate progress for better UX
        this.simulateProgress();
    }

    hideProgressSection() {
        document.getElementById('progress-section').style.display = 'none';
    }

    simulateProgress() {
        let progress = 0;
        const messages = [
            'Analisando arquivos...',
            'Detectando tipo de conteúdo...',
            'Processando conversão...',
            'Aplicando OCR...',
            'Finalizando...'
        ];

        const interval = setInterval(() => {
            if (!this.isConverting) {
                clearInterval(interval);
                return;
            }

            progress += Math.random() * 15;
            if (progress > 90) progress = 90;

            const messageIndex = Math.floor((progress / 100) * messages.length);
            this.updateProgress(progress, messages[Math.min(messageIndex, messages.length - 1)]);
        }, 500);
    }

    updateProgress(percentage, message) {
        const progressBar = document.getElementById('progress-bar');
        const progressText = document.getElementById('progress-text');
        
        progressBar.style.width = `${percentage}%`;
        progressText.textContent = message;
    }

    cancelConversion() {
        this.isConverting = false;
        this.hideProgressSection();
        this.updateConvertButton();
        this.showAlert('Conversão Cancelada', ['A conversão foi cancelada pelo usuário.'], 'info');
    }

    showResults(files) {
        this.hideProgressSection();
        
        const resultsSection = document.getElementById('results-section');
        const resultsContainer = document.getElementById('results-container');
        
        resultsContainer.innerHTML = '';
        
        files.forEach(file => {
            const resultItem = document.createElement('div');
            resultItem.className = 'result-item d-flex justify-content-between align-items-center mb-3 p-3 bg-white rounded border';
            resultItem.innerHTML = `
                <div class="d-flex align-items-center">
                    <i class="fas ${this.getFileIcon({name: file.output_filename})} me-3 text-success fa-2x"></i>
                    <div>
                        <div class="fw-medium">${file.output_filename}</div>
                        <small class="text-muted">Convertido de: ${file.original_filename}</small>
                    </div>
                </div>
                <a href="/api/download/${file.file_id}" class="btn btn-success" download>
                    <i class="fas fa-download me-2"></i>Baixar
                </a>
            `;
            resultsContainer.appendChild(resultItem);
        });
        
        resultsSection.style.display = 'block';
        
        // Scroll to results
        resultsSection.scrollIntoView({ behavior: 'smooth' });
    }

    downloadAll() {
        const downloadLinks = document.querySelectorAll('#results-container a[href^="/api/download/"]');
        downloadLinks.forEach(link => {
            setTimeout(() => link.click(), 100);
        });
    }

    resetInterface() {
        this.selectedFiles = [];
        this.isConverting = false;
        
        // Hide sections
        document.getElementById('file-list').style.display = 'none';
        document.getElementById('progress-section').style.display = 'none';
        document.getElementById('results-section').style.display = 'none';
        
        // Reset form
        document.getElementById('file-input').value = '';
        document.getElementById('pdf-password').value = '';
        
        // Reset to first conversion type
        document.getElementById('pdf-to-doc').checked = true;
        this.conversionType = 'pdf-to-doc';
        
        this.updateUI();
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    showAlert(title, messages, type = 'info') {
        // Create alert element
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
        alertDiv.style.cssText = 'top: 20px; right: 20px; z-index: 9999; max-width: 400px;';
        
        const messageList = messages.map(msg => `<li>${msg}</li>`).join('');
        
        alertDiv.innerHTML = `
            <h6 class="alert-heading">${title}</h6>
            <ul class="mb-0">${messageList}</ul>
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        document.body.appendChild(alertDiv);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.remove();
            }
        }, 5000);
    }
}

// Initialize converter when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.converter = new PDFDocConverter();
});

// Prevent default drag behaviors on document
document.addEventListener('dragover', (e) => e.preventDefault());
document.addEventListener('drop', (e) => e.preventDefault());

