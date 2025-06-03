// Main Application JavaScript
class BestOfThePDF {
    constructor() {
        this.init();
        this.setupEventListeners();
        this.loadLibraries();
    }

    init() {
        console.log('BestOfThePDF initialized');
        this.currentTool = null;
        this.uploadedFile = null;
        this.processedFile = null;
    }

    async loadLibraries() {
        // Load external libraries dynamically
        try {
            // Load PDF-lib
            if (!window.PDFLib) {
                await this.loadScript('https://unpkg.com/pdf-lib@1.17.1/dist/pdf-lib.min.js');
            }
            
            // Load Tesseract.js for OCR
            if (!window.Tesseract) {
                await this.loadScript('https://unpkg.com/tesseract.js@4.1.1/dist/tesseract.min.js');
            }
            
            // Load jsPDF
            if (!window.jsPDF) {
                await this.loadScript('https://unpkg.com/jspdf@2.5.1/dist/jspdf.umd.min.js');
            }
            
            // Load Mammoth.js for Word conversion
            if (!window.mammoth) {
                await this.loadScript('https://unpkg.com/mammoth@1.6.0/mammoth.browser.min.js');
            }
            
            console.log('All libraries loaded successfully');
        } catch (error) {
            console.error('Error loading libraries:', error);
            this.showNotification('Erro ao carregar bibliotecas necessárias', 'error');
        }
    }

    loadScript(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    setupEventListeners() {
        // Navigation toggle
        const navToggle = document.getElementById('navToggle');
        const navMenu = document.getElementById('navMenu');
        
        if (navToggle && navMenu) {
            navToggle.addEventListener('click', () => {
                navMenu.classList.toggle('active');
                navToggle.classList.toggle('active');
            });
        }

        // Tool cards
        const toolCards = document.querySelectorAll('.tool-card');
        toolCards.forEach(card => {
            card.addEventListener('click', () => {
                const tool = card.dataset.tool;
                this.openTool(tool);
            });
        });

        // Main upload area
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('fileInput');
        const selectFiles = document.getElementById('selectFiles');

        if (uploadArea && fileInput) {
            // Drag and drop
            uploadArea.addEventListener('dragover', (e) => {
                e.preventDefault();
                uploadArea.classList.add('dragover');
            });

            uploadArea.addEventListener('dragleave', () => {
                uploadArea.classList.remove('dragover');
            });

            uploadArea.addEventListener('drop', (e) => {
                e.preventDefault();
                uploadArea.classList.remove('dragover');
                const files = e.dataTransfer.files;
                if (files.length > 0) {
                    this.handleFileUpload(files[0]);
                }
            });

            // Click to upload
            uploadArea.addEventListener('click', () => {
                fileInput.click();
            });

            selectFiles.addEventListener('click', (e) => {
                e.stopPropagation();
                fileInput.click();
            });

            fileInput.addEventListener('change', (e) => {
                if (e.target.files.length > 0) {
                    this.handleFileUpload(e.target.files[0]);
                }
            });
        }
    }

    openTool(toolName) {
        this.currentTool = toolName;
        this.createToolModal(toolName);
    }

    createToolModal(toolName) {
        const toolConfig = this.getToolConfig(toolName);
        
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2 class="modal-title">${toolConfig.title}</h2>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">×</button>
                </div>
                <div class="modal-body">
                    <p class="tool-description">${toolConfig.description}</p>
                    
                    <div class="tool-interface">
                        <div class="upload-section">
                            <div class="upload-area-small" id="toolUploadArea">
                                <div class="upload-content">
                                    <div class="upload-icon">
                                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                            <polyline points="7,10 12,15 17,10"/>
                                            <line x1="12" y1="15" x2="12" y2="3"/>
                                        </svg>
                                    </div>
                                    <h4>Selecione seu arquivo</h4>
                                    <p>Formatos aceitos: ${toolConfig.acceptedFormats}</p>
                                    <button class="btn btn-primary" id="selectToolFile">Escolher Arquivo</button>
                                    <input type="file" id="toolFileInput" accept="${toolConfig.accept}" hidden>
                                </div>
                            </div>
                            
                            <div class="file-preview" id="filePreview" style="display: none;">
                                <div class="file-info">
                                    <div class="file-icon">PDF</div>
                                    <div class="file-details">
                                        <h4 id="fileName">arquivo.pdf</h4>
                                        <p id="fileSize">2.5 MB</p>
                                    </div>
                                </div>
                                <button class="btn btn-danger btn-icon" id="removeFile">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <polyline points="3,6 5,6 21,6"/>
                                        <path d="M19,6v14a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6m3,0V4a2,2,0,0,1,2-2h4a2,2,0,0,1,2,2V6"/>
                                    </svg>
                                </button>
                            </div>
                        </div>
                        
                        <div class="conversion-section" id="conversionSection" style="display: none;">
                            <div class="progress-container">
                                <div class="progress-bar">
                                    <div class="progress-fill" id="progressFill" style="width: 0%"></div>
                                </div>
                                <p class="progress-text" id="progressText">Preparando conversão...</p>
                            </div>
                        </div>
                        
                        <div class="download-section" id="downloadSection" style="display: none;">
                            <div class="success-message">
                                <div class="success-icon">
                                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <polyline points="20,6 9,17 4,12"/>
                                    </svg>
                                </div>
                                <h4>Conversão concluída!</h4>
                                <p>Seu arquivo foi convertido com sucesso.</p>
                            </div>
                            
                            <div class="download-actions">
                                <button class="btn btn-primary" id="downloadFile">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                        <polyline points="7,10 12,15 17,10"/>
                                        <line x1="12" y1="15" x2="12" y2="3"/>
                                    </svg>
                                    Baixar Arquivo
                                </button>
                                <button class="btn btn-secondary" id="convertAnother">Converter Outro</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        this.setupToolModalEvents(modal, toolName);
    }

    setupToolModalEvents(modal, toolName) {
        const uploadArea = modal.querySelector('#toolUploadArea');
        const fileInput = modal.querySelector('#toolFileInput');
        const selectFile = modal.querySelector('#selectToolFile');
        const filePreview = modal.querySelector('#filePreview');
        const conversionSection = modal.querySelector('#conversionSection');
        const downloadSection = modal.querySelector('#downloadSection');
        const removeFile = modal.querySelector('#removeFile');
        const downloadFile = modal.querySelector('#downloadFile');
        const convertAnother = modal.querySelector('#convertAnother');

        // File selection
        selectFile.addEventListener('click', () => fileInput.click());
        uploadArea.addEventListener('click', () => fileInput.click());

        // Drag and drop
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.handleToolFileUpload(files[0], toolName, modal);
            }
        });

        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.handleToolFileUpload(e.target.files[0], toolName, modal);
            }
        });

        // Remove file
        removeFile.addEventListener('click', () => {
            this.resetToolModal(modal);
        });

        // Download file
        downloadFile.addEventListener('click', () => {
            this.downloadProcessedFile();
        });

        // Convert another
        convertAnother.addEventListener('click', () => {
            this.resetToolModal(modal);
        });

        // Open online editor
        const openOnlineBtn = modal.querySelector('#openOnlineEditor');
        if (openOnlineBtn) {
            openOnlineBtn.addEventListener('click', () => {
                this.openOnlineEditorSelection();
            });
        }
    }

    updateDownloadSection(downloadSection, result) {
        // Update the download section HTML to include online editor option
        downloadSection.innerHTML = `
            <div class="success-message">
                <div class="success-icon">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="20,6 9,17 4,12"/>
                    </svg>
                </div>
                <h4>Conversão concluída!</h4>
                <p>Seu arquivo foi convertido com sucesso.</p>
            </div>
            
            <div class="download-actions">
                <button class="btn btn-primary" id="downloadFile">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="7,10 12,15 17,10"/>
                        <line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                    Baixar Arquivo
                </button>
                <button class="btn btn-success" id="openOnlineEditor">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                        <polyline points="15,3 21,3 21,9"/>
                        <line x1="10" y1="14" x2="21" y2="3"/>
                    </svg>
                    Abrir e Editar Online
                </button>
                <button class="btn btn-secondary" id="convertAnother">Converter Outro</button>
            </div>
        `;

        // Re-setup event listeners for the new buttons
        const downloadFile = downloadSection.querySelector('#downloadFile');
        const openOnlineEditor = downloadSection.querySelector('#openOnlineEditor');
        const convertAnother = downloadSection.querySelector('#convertAnother');

        downloadFile.addEventListener('click', () => {
            this.downloadProcessedFile();
        });

        openOnlineEditor.addEventListener('click', () => {
            this.openOnlineEditorSelection();
        });

        convertAnother.addEventListener('click', () => {
            const modal = downloadSection.closest('.modal');
            this.resetToolModal(modal);
        });
    }

    openOnlineEditorSelection() {
        if (!this.onlineEditorOptions) {
            this.onlineEditorOptions = new OnlineEditorOptions();
        }
        
        if (!this.processedFile) {
            this.showNotification('Nenhum arquivo processado encontrado', 'error');
            return;
        }

        // Close current modal
        const currentModal = document.querySelector('.modal');
        if (currentModal) {
            currentModal.remove();
        }

        // Open editor selection modal
        this.onlineEditorOptions.createEditorSelectionModal(this.uploadedFile, this.processedFile);
    }

    async handleToolFileUpload(file, toolName, modal) {
        this.uploadedFile = file;
        
        // Show file preview
        const filePreview = modal.querySelector('#filePreview');
        const fileName = modal.querySelector('#fileName');
        const fileSize = modal.querySelector('#fileSize');
        const uploadArea = modal.querySelector('#toolUploadArea');
        
        fileName.textContent = file.name;
        fileSize.textContent = this.formatFileSize(file.size);
        
        uploadArea.style.display = 'none';
        filePreview.style.display = 'flex';
        
        // Start conversion automatically
        setTimeout(() => {
            this.startConversion(toolName, modal);
        }, 500);
    }

    async startConversion(toolName, modal) {
        const conversionSection = modal.querySelector('#conversionSection');
        const downloadSection = modal.querySelector('#downloadSection');
        const progressFill = modal.querySelector('#progressFill');
        const progressText = modal.querySelector('#progressText');
        
        conversionSection.style.display = 'block';
        
        try {
            let result;
            
            // Initialize specialized processors
            if (!this.pdfConverter) {
                this.pdfConverter = new PDFConverter();
            }
            if (!this.ocrProcessor) {
                this.ocrProcessor = new OCRProcessor();
            }
            if (!this.onlineEditorOptions) {
                this.onlineEditorOptions = new OnlineEditorOptions();
            }
            
            const progressCallback = (progress, message) => {
                progressFill.style.width = progress + '%';
                progressText.textContent = message;
            };
            
            switch (toolName) {
                case 'pdf-to-word':
                    result = await this.pdfConverter.convertPdfToWord(this.uploadedFile, progressCallback);
                    break;
                case 'word-to-pdf':
                    result = await this.pdfConverter.convertWordToPdf(this.uploadedFile, progressCallback);
                    break;
                case 'pdf-ocr':
                    result = await this.ocrProcessor.convertPdfToOcr(this.uploadedFile, progressCallback);
                    break;
                case 'ocr-to-pdf':
                    result = await this.ocrProcessor.convertOcrToPdf(this.uploadedFile, progressCallback);
                    break;
                case 'unlock-pdf':
                    result = await this.pdfConverter.unlockPdf(this.uploadedFile, progressCallback);
                    break;
                case 'remove-watermark':
                    result = await this.pdfConverter.removeWatermark(this.uploadedFile, progressCallback);
                    break;
                case 'compress-pdf':
                    result = await this.pdfConverter.compressPdf(this.uploadedFile, progressCallback);
                    break;
                default:
                    throw new Error('Ferramenta não implementada');
            }
            
            this.processedFile = result;
            
            // Update download section with online editor options
            this.updateDownloadSection(downloadSection, result);
            
            // Show download section
            conversionSection.style.display = 'none';
            downloadSection.style.display = 'block';
            
        } catch (error) {
            console.error('Conversion error:', error);
            this.showNotification('Erro na conversão: ' + error.message, 'error');
            this.resetToolModal(modal);
        }
    }

    async convertPdfToWord(file, progressFill, progressText) {
        progressText.textContent = 'Carregando PDF...';
        progressFill.style.width = '20%';
        
        const arrayBuffer = await file.arrayBuffer();
        const pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);
        
        progressText.textContent = 'Extraindo texto...';
        progressFill.style.width = '50%';
        
        const pages = pdfDoc.getPages();
        let fullText = '';
        
        for (let i = 0; i < pages.length; i++) {
            const page = pages[i];
            // Simulação de extração de texto (em produção, usar biblioteca específica)
            fullText += `Página ${i + 1}\n\nTexto extraído da página ${i + 1} do PDF.\n\n`;
        }
        
        progressText.textContent = 'Gerando documento Word...';
        progressFill.style.width = '80%';
        
        // Criar documento Word simples (em produção, usar biblioteca específica)
        const wordContent = this.createWordDocument(fullText);
        
        progressText.textContent = 'Conversão concluída!';
        progressFill.style.width = '100%';
        
        return {
            blob: new Blob([wordContent], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }),
            filename: file.name.replace('.pdf', '.docx')
        };
    }

    async convertWordToPdf(file, progressFill, progressText) {
        progressText.textContent = 'Carregando documento Word...';
        progressFill.style.width = '20%';
        
        const arrayBuffer = await file.arrayBuffer();
        
        progressText.textContent = 'Extraindo conteúdo...';
        progressFill.style.width = '50%';
        
        let text = '';
        if (window.mammoth) {
            const result = await mammoth.extractRawText({ arrayBuffer });
            text = result.value;
        } else {
            // Fallback para texto simples
            text = 'Conteúdo extraído do documento Word';
        }
        
        progressText.textContent = 'Gerando PDF...';
        progressFill.style.width = '80%';
        
        const pdfDoc = await PDFLib.PDFDocument.create();
        const page = pdfDoc.addPage();
        const { width, height } = page.getSize();
        
        // Adicionar texto ao PDF
        page.drawText(text, {
            x: 50,
            y: height - 50,
            size: 12,
            maxWidth: width - 100,
        });
        
        progressText.textContent = 'Conversão concluída!';
        progressFill.style.width = '100%';
        
        const pdfBytes = await pdfDoc.save();
        
        return {
            blob: new Blob([pdfBytes], { type: 'application/pdf' }),
            filename: file.name.replace(/\.(doc|docx)$/, '.pdf')
        };
    }

    async convertPdfToOcr(file, progressFill, progressText) {
        progressText.textContent = 'Carregando PDF...';
        progressFill.style.width = '10%';
        
        const arrayBuffer = await file.arrayBuffer();
        const pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);
        
        progressText.textContent = 'Convertendo páginas para imagens...';
        progressFill.style.width = '30%';
        
        // Simulação de conversão para imagem (em produção, usar pdf2pic ou similar)
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 800;
        canvas.height = 1000;
        
        // Simular conteúdo da página
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'black';
        ctx.font = '16px Arial';
        ctx.fillText('Texto simulado para OCR', 50, 100);
        ctx.fillText('Este é um exemplo de texto', 50, 130);
        ctx.fillText('que seria extraído via OCR', 50, 160);
        
        progressText.textContent = 'Executando OCR...';
        progressFill.style.width = '70%';
        
        let ocrText = '';
        if (window.Tesseract) {
            try {
                const { data: { text } } = await Tesseract.recognize(canvas, 'por', {
                    logger: m => {
                        if (m.status === 'recognizing text') {
                            const progress = Math.round(m.progress * 30 + 70);
                            progressFill.style.width = progress + '%';
                        }
                    }
                });
                ocrText = text;
            } catch (error) {
                console.error('OCR error:', error);
                ocrText = 'Texto simulado extraído via OCR\n\nEste é um exemplo de texto\nque seria extraído via OCR';
            }
        } else {
            ocrText = 'Texto simulado extraído via OCR\n\nEste é um exemplo de texto\nque seria extraído via OCR';
        }
        
        progressText.textContent = 'Conversão concluída!';
        progressFill.style.width = '100%';
        
        return {
            blob: new Blob([ocrText], { type: 'text/plain' }),
            filename: file.name.replace('.pdf', '_ocr.txt')
        };
    }

    async convertOcrToPdf(file, progressFill, progressText) {
        progressText.textContent = 'Carregando arquivo de texto...';
        progressFill.style.width = '20%';
        
        const text = await file.text();
        
        progressText.textContent = 'Gerando PDF...';
        progressFill.style.width = '60%';
        
        const pdfDoc = await PDFLib.PDFDocument.create();
        const page = pdfDoc.addPage();
        const { width, height } = page.getSize();
        
        // Dividir texto em linhas
        const lines = text.split('\n');
        const lineHeight = 20;
        const startY = height - 50;
        
        progressText.textContent = 'Adicionando texto ao PDF...';
        progressFill.style.width = '80%';
        
        lines.forEach((line, index) => {
            const y = startY - (index * lineHeight);
            if (y > 50) { // Verificar se ainda cabe na página
                page.drawText(line, {
                    x: 50,
                    y: y,
                    size: 12,
                    maxWidth: width - 100,
                });
            }
        });
        
        progressText.textContent = 'Conversão concluída!';
        progressFill.style.width = '100%';
        
        const pdfBytes = await pdfDoc.save();
        
        return {
            blob: new Blob([pdfBytes], { type: 'application/pdf' }),
            filename: file.name.replace(/\.(txt|ocr)$/, '.pdf')
        };
    }

    createWordDocument(text) {
        // Simulação de documento Word (em produção, usar biblioteca específica)
        const wordHeader = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:body>
<w:p>
<w:r>
<w:t>${text}</w:t>
</w:r>
</w:p>
</w:body>
</w:document>`;
        return wordHeader;
    }

    downloadProcessedFile() {
        if (!this.processedFile) return;
        
        const url = URL.createObjectURL(this.processedFile.blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = this.processedFile.filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showNotification('Download iniciado!', 'success');
    }

    resetToolModal(modal) {
        const uploadArea = modal.querySelector('#toolUploadArea');
        const filePreview = modal.querySelector('#filePreview');
        const conversionSection = modal.querySelector('#conversionSection');
        const downloadSection = modal.querySelector('#downloadSection');
        const fileInput = modal.querySelector('#toolFileInput');
        
        uploadArea.style.display = 'block';
        filePreview.style.display = 'none';
        conversionSection.style.display = 'none';
        downloadSection.style.display = 'none';
        
        fileInput.value = '';
        this.uploadedFile = null;
        this.processedFile = null;
    }

    getToolConfig(toolName) {
        const configs = {
            'pdf-to-word': {
                title: 'PDF para Word',
                description: 'Converta seus arquivos PDF para documentos Word editáveis mantendo a formatação original.',
                acceptedFormats: 'PDF',
                accept: '.pdf'
            },
            'word-to-pdf': {
                title: 'Word para PDF',
                description: 'Transforme documentos Word em PDFs profissionais com qualidade superior.',
                acceptedFormats: 'DOC, DOCX',
                accept: '.doc,.docx'
            },
            'pdf-ocr': {
                title: 'PDF OCR',
                description: 'Extraia texto de PDFs escaneados usando reconhecimento óptico de caracteres.',
                acceptedFormats: 'PDF',
                accept: '.pdf'
            },
            'ocr-to-pdf': {
                title: 'OCR para PDF',
                description: 'Converta arquivos de texto extraídos via OCR em documentos PDF formatados.',
                acceptedFormats: 'TXT',
                accept: '.txt'
            }
        };
        
        return configs[toolName] || {
            title: 'Ferramenta',
            description: 'Ferramenta de conversão de documentos.',
            acceptedFormats: 'Vários',
            accept: '*'
        };
    }

    handleFileUpload(file) {
        // Detectar tipo de arquivo e sugerir ferramenta
        const extension = file.name.split('.').pop().toLowerCase();
        let suggestedTool = null;
        
        switch (extension) {
            case 'pdf':
                suggestedTool = 'pdf-to-word';
                break;
            case 'doc':
            case 'docx':
                suggestedTool = 'word-to-pdf';
                break;
            case 'txt':
                suggestedTool = 'ocr-to-pdf';
                break;
        }
        
        if (suggestedTool) {
            this.openTool(suggestedTool);
            // Simular upload do arquivo na ferramenta
            setTimeout(() => {
                const modal = document.querySelector('.modal');
                if (modal) {
                    this.handleToolFileUpload(file, suggestedTool, modal);
                }
            }, 500);
        } else {
            this.showNotification('Tipo de arquivo não suportado', 'warning');
        }
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type} show`;
        notification.innerHTML = `
            <div class="notification-content">
                <div class="notification-icon">
                    ${this.getNotificationIcon(type)}
                </div>
                <div class="notification-text">
                    <p>${message}</p>
                </div>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }

    getNotificationIcon(type) {
        const icons = {
            success: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20,6 9,17 4,12"/></svg>',
            error: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
            warning: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
            info: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>'
        };
        return icons[type] || icons.info;
    }
}

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.bestOfThePDF = new BestOfThePDF();
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BestOfThePDF;
}

