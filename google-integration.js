// Google Integration Module
class GoogleIntegration {
    constructor() {
        this.clientId = null; // Will be set when user configures
        this.apiKey = null;   // Will be set when user configures
        this.discoveryDoc = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';
        this.scopes = 'https://www.googleapis.com/auth/drive.file';
        this.gapi = null;
        this.isSignedIn = false;
    }

    async loadGoogleAPI() {
        if (window.gapi) {
            this.gapi = window.gapi;
            return;
        }

        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://apis.google.com/js/api.js';
            script.onload = () => {
                this.gapi = window.gapi;
                resolve();
            };
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    async initializeGoogleAPI() {
        try {
            await this.loadGoogleAPI();
            
            await new Promise((resolve) => {
                this.gapi.load('auth2:client', resolve);
            });

            // Note: In production, you would need actual API credentials
            // For demo purposes, we'll simulate the integration
            console.log('Google API initialized (demo mode)');
            
        } catch (error) {
            console.error('Error initializing Google API:', error);
            throw new Error('Erro ao inicializar integração com Google');
        }
    }

    async uploadToGoogleDrive(file, filename) {
        try {
            // Simulate upload to Google Drive
            // In production, this would use the actual Google Drive API
            
            const formData = new FormData();
            formData.append('file', file);
            formData.append('name', filename);
            
            // Simulate API response
            const mockResponse = {
                id: 'mock_file_id_' + Date.now(),
                name: filename,
                webViewLink: `https://docs.google.com/document/d/mock_file_id_${Date.now()}/edit`,
                webContentLink: `https://drive.google.com/file/d/mock_file_id_${Date.now()}/view`
            };
            
            return mockResponse;
            
        } catch (error) {
            throw new Error('Erro ao fazer upload para Google Drive: ' + error.message);
        }
    }

    getGoogleDocsUrl(fileId) {
        return `https://docs.google.com/document/d/${fileId}/edit`;
    }

    getGoogleSheetsUrl(fileId) {
        return `https://docs.google.com/spreadsheets/d/${fileId}/edit`;
    }

    getGoogleSlidesUrl(fileId) {
        return `https://docs.google.com/presentation/d/${fileId}/edit`;
    }
}

// Online Editor Options Module
class OnlineEditorOptions {
    constructor() {
        this.googleIntegration = new GoogleIntegration();
        this.editors = this.getAvailableEditors();
    }

    getAvailableEditors() {
        return {
            google: {
                name: 'Google Docs',
                description: 'Editor de documentos online do Google com colaboração em tempo real',
                icon: '📄',
                supportedTypes: ['pdf', 'word', 'text'],
                url: 'https://docs.google.com/document/create',
                uploadUrl: 'https://docs.google.com/document/?usp=docs_alc&authuser=0',
                features: ['Colaboração em tempo real', 'Comentários', 'Histórico de versões', 'Compartilhamento']
            },
            office365: {
                name: 'Microsoft Office Online',
                description: 'Suite de escritório online da Microsoft',
                icon: '📝',
                supportedTypes: ['word', 'pdf'],
                url: 'https://office.live.com/start/Word.aspx',
                uploadUrl: 'https://office.live.com',
                features: ['Compatibilidade total com Office', 'OneDrive integrado', 'Colaboração']
            },
            onlyoffice: {
                name: 'OnlyOffice',
                description: 'Suite de escritório online gratuita e open source',
                icon: '📋',
                supportedTypes: ['word', 'pdf', 'text'],
                url: 'https://personal.onlyoffice.com',
                uploadUrl: 'https://personal.onlyoffice.com',
                features: ['Gratuito', 'Open source', 'Compatível com formatos MS Office']
            },
            zoho: {
                name: 'Zoho Writer',
                description: 'Editor de documentos online da Zoho',
                icon: '✍️',
                supportedTypes: ['word', 'pdf', 'text'],
                url: 'https://writer.zoho.com',
                uploadUrl: 'https://writer.zoho.com',
                features: ['Interface limpa', 'Colaboração', 'Integração com Zoho Suite']
            },
            notion: {
                name: 'Notion',
                description: 'Workspace all-in-one para notas e documentos',
                icon: '📓',
                supportedTypes: ['text', 'word'],
                url: 'https://notion.so',
                uploadUrl: 'https://notion.so',
                features: ['Blocos flexíveis', 'Banco de dados', 'Templates', 'Colaboração']
            },
            dropboxpaper: {
                name: 'Dropbox Paper',
                description: 'Editor colaborativo de documentos do Dropbox',
                icon: '📄',
                supportedTypes: ['text', 'word'],
                url: 'https://paper.dropbox.com',
                uploadUrl: 'https://paper.dropbox.com',
                features: ['Design minimalista', 'Colaboração', 'Integração com Dropbox']
            },
            adobeacrobat: {
                name: 'Adobe Acrobat Online',
                description: 'Editor de PDF online da Adobe',
                icon: '📕',
                supportedTypes: ['pdf'],
                url: 'https://acrobat.adobe.com/us/en/acrobat/online/pdf-editor.html',
                uploadUrl: 'https://acrobat.adobe.com/us/en/acrobat/online/pdf-editor.html',
                features: ['Edição avançada de PDF', 'Assinatura digital', 'Formulários']
            },
            canva: {
                name: 'Canva Docs',
                description: 'Editor de documentos com design visual',
                icon: '🎨',
                supportedTypes: ['pdf', 'word', 'text'],
                url: 'https://canva.com/docs',
                uploadUrl: 'https://canva.com',
                features: ['Design visual', 'Templates', 'Elementos gráficos', 'Apresentações']
            }
        };
    }

    createEditorSelectionModal(file, convertedFile) {
        const fileType = this.getFileType(convertedFile.filename);
        const compatibleEditors = this.getCompatibleEditors(fileType);
        
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content editor-selection-modal">
                <div class="modal-header">
                    <h2 class="modal-title">Abrir e Editar Online</h2>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">×</button>
                </div>
                <div class="modal-body">
                    <div class="file-info-summary">
                        <div class="file-icon-large">${this.getFileIcon(fileType)}</div>
                        <div class="file-details">
                            <h3>${convertedFile.filename}</h3>
                            <p>Escolha onde deseja abrir e editar seu arquivo convertido</p>
                        </div>
                    </div>
                    
                    <div class="editor-options">
                        <h4>Editores Recomendados</h4>
                        <div class="editor-grid">
                            ${this.renderEditorOptions(compatibleEditors, 'recommended')}
                        </div>
                        
                        <h4>Outras Opções</h4>
                        <div class="editor-grid">
                            ${this.renderEditorOptions(compatibleEditors, 'other')}
                        </div>
                    </div>
                    
                    <div class="upload-instructions">
                        <div class="instruction-card">
                            <h4>📤 Como usar:</h4>
                            <ol>
                                <li>Clique no editor desejado</li>
                                <li>Faça upload do arquivo convertido</li>
                                <li>Comece a editar online</li>
                            </ol>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="this.closest('.modal').remove()">
                        Fechar
                    </button>
                    <button class="btn btn-primary" id="downloadFirst">
                        Baixar Primeiro
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        this.setupEditorModalEvents(modal, convertedFile);
        
        return modal;
    }

    renderEditorOptions(editors, category) {
        const recommended = ['google', 'office365', 'adobeacrobat'];
        const editorsToShow = category === 'recommended' 
            ? editors.filter(([key]) => recommended.includes(key))
            : editors.filter(([key]) => !recommended.includes(key));
        
        return editorsToShow.map(([key, editor]) => `
            <div class="editor-card" data-editor="${key}">
                <div class="editor-icon">${editor.icon}</div>
                <div class="editor-info">
                    <h4>${editor.name}</h4>
                    <p>${editor.description}</p>
                    <div class="editor-features">
                        ${editor.features.slice(0, 2).map(feature => 
                            `<span class="feature-tag">${feature}</span>`
                        ).join('')}
                    </div>
                </div>
                <div class="editor-action">
                    <button class="btn btn-primary btn-sm">Abrir</button>
                </div>
            </div>
        `).join('');
    }

    setupEditorModalEvents(modal, convertedFile) {
        // Editor selection
        const editorCards = modal.querySelectorAll('.editor-card');
        editorCards.forEach(card => {
            card.addEventListener('click', () => {
                const editorKey = card.dataset.editor;
                this.openInEditor(editorKey, convertedFile);
            });
        });

        // Download first button
        const downloadFirst = modal.querySelector('#downloadFirst');
        downloadFirst.addEventListener('click', () => {
            this.downloadFile(convertedFile);
            modal.remove();
        });
    }

    async openInEditor(editorKey, convertedFile) {
        const editor = this.editors[editorKey];
        
        if (!editor) {
            this.showNotification('Editor não encontrado', 'error');
            return;
        }

        try {
            // Show loading
            this.showNotification('Preparando para abrir no editor...', 'info');
            
            if (editorKey === 'google') {
                await this.openInGoogleDocs(convertedFile);
            } else {
                // For other editors, open their upload page
                this.openEditorUploadPage(editor, convertedFile);
            }
            
        } catch (error) {
            console.error('Error opening in editor:', error);
            this.showNotification('Erro ao abrir editor: ' + error.message, 'error');
        }
    }

    async openInGoogleDocs(convertedFile) {
        try {
            // Try to upload to Google Drive (if authenticated)
            if (this.googleIntegration.isSignedIn) {
                const uploadResult = await this.googleIntegration.uploadToGoogleDrive(
                    convertedFile.blob, 
                    convertedFile.filename
                );
                
                // Open the uploaded file in Google Docs
                window.open(uploadResult.webViewLink, '_blank');
                this.showNotification('Arquivo aberto no Google Docs!', 'success');
                
            } else {
                // Open Google Docs upload page
                this.openGoogleDocsUploadPage(convertedFile);
            }
            
        } catch (error) {
            // Fallback to manual upload
            this.openGoogleDocsUploadPage(convertedFile);
        }
    }

    openGoogleDocsUploadPage(convertedFile) {
        // Create instructions modal for Google Docs
        const instructionModal = this.createGoogleDocsInstructionModal(convertedFile);
        document.body.appendChild(instructionModal);
        
        // Open Google Docs in new tab
        window.open('https://docs.google.com/document/?usp=docs_alc&authuser=0', '_blank');
    }

    createGoogleDocsInstructionModal(convertedFile) {
        const modal = document.createElement('div');
        modal.className = 'modal active instruction-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2 class="modal-title">📄 Abrir no Google Docs</h2>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">×</button>
                </div>
                <div class="modal-body">
                    <div class="instruction-steps">
                        <div class="step">
                            <div class="step-number">1</div>
                            <div class="step-content">
                                <h4>Google Docs foi aberto em nova aba</h4>
                                <p>Se não abriu automaticamente, <a href="https://docs.google.com/document/?usp=docs_alc&authuser=0" target="_blank">clique aqui</a></p>
                            </div>
                        </div>
                        
                        <div class="step">
                            <div class="step-number">2</div>
                            <div class="step-content">
                                <h4>Baixe seu arquivo convertido</h4>
                                <button class="btn btn-primary" id="downloadForGoogleDocs">
                                    📥 Baixar ${convertedFile.filename}
                                </button>
                            </div>
                        </div>
                        
                        <div class="step">
                            <div class="step-number">3</div>
                            <div class="step-content">
                                <h4>No Google Docs, clique em "Arquivo" → "Abrir"</h4>
                                <p>Ou use Ctrl+O (Cmd+O no Mac)</p>
                            </div>
                        </div>
                        
                        <div class="step">
                            <div class="step-number">4</div>
                            <div class="step-content">
                                <h4>Selecione "Upload" e escolha o arquivo baixado</h4>
                                <p>Seu documento será aberto e pronto para edição!</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="quick-links">
                        <h4>Links Rápidos:</h4>
                        <div class="link-buttons">
                            <a href="https://docs.google.com/document/create" target="_blank" class="btn btn-outline">
                                📄 Novo Documento
                            </a>
                            <a href="https://drive.google.com" target="_blank" class="btn btn-outline">
                                💾 Google Drive
                            </a>
                            <a href="https://docs.google.com/document/?usp=docs_alc&authuser=0" target="_blank" class="btn btn-outline">
                                📂 Abrir Arquivo
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Setup download button
        const downloadBtn = modal.querySelector('#downloadForGoogleDocs');
        downloadBtn.addEventListener('click', () => {
            this.downloadFile(convertedFile);
            this.showNotification('Download iniciado! Agora abra o arquivo no Google Docs.', 'success');
        });
        
        return modal;
    }

    openEditorUploadPage(editor, convertedFile) {
        // Create instruction modal for other editors
        const modal = document.createElement('div');
        modal.className = 'modal active instruction-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2 class="modal-title">${editor.icon} Abrir no ${editor.name}</h2>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">×</button>
                </div>
                <div class="modal-body">
                    <div class="editor-info-card">
                        <h3>${editor.name}</h3>
                        <p>${editor.description}</p>
                        <div class="features-list">
                            ${editor.features.map(feature => `<span class="feature-badge">${feature}</span>`).join('')}
                        </div>
                    </div>
                    
                    <div class="instruction-steps">
                        <div class="step">
                            <div class="step-number">1</div>
                            <div class="step-content">
                                <h4>Baixe seu arquivo convertido</h4>
                                <button class="btn btn-primary" id="downloadForEditor">
                                    📥 Baixar ${convertedFile.filename}
                                </button>
                            </div>
                        </div>
                        
                        <div class="step">
                            <div class="step-number">2</div>
                            <div class="step-content">
                                <h4>Abra o ${editor.name}</h4>
                                <a href="${editor.uploadUrl}" target="_blank" class="btn btn-primary">
                                    🚀 Abrir ${editor.name}
                                </a>
                            </div>
                        </div>
                        
                        <div class="step">
                            <div class="step-number">3</div>
                            <div class="step-content">
                                <h4>Faça upload do arquivo baixado</h4>
                                <p>Procure por opções como "Upload", "Importar" ou "Abrir arquivo"</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Setup events
        const downloadBtn = modal.querySelector('#downloadForEditor');
        downloadBtn.addEventListener('click', () => {
            this.downloadFile(convertedFile);
            this.showNotification(`Download iniciado! Agora abra o arquivo no ${editor.name}.`, 'success');
        });
    }

    getCompatibleEditors(fileType) {
        return Object.entries(this.editors).filter(([key, editor]) => 
            editor.supportedTypes.includes(fileType)
        );
    }

    getFileType(filename) {
        const extension = filename.split('.').pop().toLowerCase();
        switch (extension) {
            case 'pdf':
                return 'pdf';
            case 'doc':
            case 'docx':
                return 'word';
            case 'txt':
                return 'text';
            default:
                return 'unknown';
        }
    }

    getFileIcon(fileType) {
        const icons = {
            pdf: '📕',
            word: '📄',
            text: '📝',
            unknown: '📄'
        };
        return icons[fileType] || icons.unknown;
    }

    downloadFile(convertedFile) {
        const url = URL.createObjectURL(convertedFile.blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = convertedFile.filename;
        a.style.display = 'none';
        
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        setTimeout(() => URL.revokeObjectURL(url), 100);
    }

    showNotification(message, type = 'info') {
        // Use the main app's notification system
        if (window.bestOfThePDF) {
            window.bestOfThePDF.showNotification(message, type);
        } else {
            alert(message);
        }
    }
}

// Export for use in main application
if (typeof window !== 'undefined') {
    window.OnlineEditorOptions = OnlineEditorOptions;
    window.GoogleIntegration = GoogleIntegration;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { OnlineEditorOptions, GoogleIntegration };
}

