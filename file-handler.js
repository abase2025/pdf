// File Handler Module
class FileHandler {
    constructor() {
        this.maxFileSize = 100 * 1024 * 1024; // 100MB
        this.supportedTypes = {
            pdf: ['application/pdf'],
            word: ['application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
            image: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/bmp', 'image/tiff'],
            text: ['text/plain']
        };
    }

    validateFile(file, allowedTypes = []) {
        const errors = [];
        
        // Check file size
        if (file.size > this.maxFileSize) {
            errors.push(`Arquivo muito grande. Tamanho máximo: ${this.formatFileSize(this.maxFileSize)}`);
        }
        
        // Check file type
        if (allowedTypes.length > 0) {
            const isValidType = allowedTypes.some(type => {
                if (this.supportedTypes[type]) {
                    return this.supportedTypes[type].includes(file.type);
                }
                return file.type === type;
            });
            
            if (!isValidType) {
                errors.push(`Tipo de arquivo não suportado. Tipos aceitos: ${allowedTypes.join(', ')}`);
            }
        }
        
        // Check file extension
        const extension = this.getFileExtension(file.name);
        if (!extension) {
            errors.push('Arquivo deve ter uma extensão válida');
        }
        
        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    getFileExtension(filename) {
        return filename.split('.').pop()?.toLowerCase();
    }

    getFileType(file) {
        const extension = this.getFileExtension(file.name);
        
        for (const [type, mimeTypes] of Object.entries(this.supportedTypes)) {
            if (mimeTypes.includes(file.type)) {
                return type;
            }
        }
        
        // Fallback to extension-based detection
        switch (extension) {
            case 'pdf':
                return 'pdf';
            case 'doc':
            case 'docx':
                return 'word';
            case 'jpg':
            case 'jpeg':
            case 'png':
            case 'gif':
            case 'bmp':
            case 'tiff':
                return 'image';
            case 'txt':
                return 'text';
            default:
                return 'unknown';
        }
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    async readFileAsArrayBuffer(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
            reader.readAsArrayBuffer(file);
        });
    }

    async readFileAsText(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
            reader.readAsText(file, 'utf-8');
        });
    }

    async readFileAsDataURL(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
            reader.readAsDataURL(file);
        });
    }

    downloadFile(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.style.display = 'none';
        
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        // Clean up the URL object
        setTimeout(() => URL.revokeObjectURL(url), 100);
    }

    async compressImage(file, quality = 0.8, maxWidth = 1920, maxHeight = 1080) {
        return new Promise((resolve, reject) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();
            
            img.onload = () => {
                // Calculate new dimensions
                let { width, height } = img;
                
                if (width > maxWidth || height > maxHeight) {
                    const ratio = Math.min(maxWidth / width, maxHeight / height);
                    width *= ratio;
                    height *= ratio;
                }
                
                canvas.width = width;
                canvas.height = height;
                
                // Draw and compress
                ctx.drawImage(img, 0, 0, width, height);
                
                canvas.toBlob((blob) => {
                    if (blob) {
                        resolve(blob);
                    } else {
                        reject(new Error('Erro na compressão da imagem'));
                    }
                }, file.type, quality);
            };
            
            img.onerror = () => reject(new Error('Erro ao carregar imagem'));
            img.src = URL.createObjectURL(file);
        });
    }

    async splitPdf(file, pageRanges) {
        try {
            if (!window.PDFLib) {
                await this.loadScript('https://unpkg.com/pdf-lib@1.17.1/dist/pdf-lib.min.js');
            }
            
            const arrayBuffer = await this.readFileAsArrayBuffer(file);
            const pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);
            const totalPages = pdfDoc.getPageCount();
            
            const results = [];
            
            for (const range of pageRanges) {
                const newPdfDoc = await PDFLib.PDFDocument.create();
                const { start, end } = range;
                
                // Validate range
                const startPage = Math.max(1, Math.min(start, totalPages));
                const endPage = Math.max(startPage, Math.min(end, totalPages));
                
                // Copy pages
                const pageIndices = [];
                for (let i = startPage - 1; i < endPage; i++) {
                    pageIndices.push(i);
                }
                
                const copiedPages = await newPdfDoc.copyPages(pdfDoc, pageIndices);
                copiedPages.forEach((page) => newPdfDoc.addPage(page));
                
                const pdfBytes = await newPdfDoc.save();
                const blob = new Blob([pdfBytes], { type: 'application/pdf' });
                
                results.push({
                    blob,
                    filename: `${file.name.replace('.pdf', '')}_pages_${startPage}-${endPage}.pdf`,
                    pageRange: `${startPage}-${endPage}`
                });
            }
            
            return results;
            
        } catch (error) {
            throw new Error('Erro ao dividir PDF: ' + error.message);
        }
    }

    async mergePdfs(files) {
        try {
            if (!window.PDFLib) {
                await this.loadScript('https://unpkg.com/pdf-lib@1.17.1/dist/pdf-lib.min.js');
            }
            
            const mergedPdf = await PDFLib.PDFDocument.create();
            
            for (const file of files) {
                const arrayBuffer = await this.readFileAsArrayBuffer(file);
                const pdf = await PDFLib.PDFDocument.load(arrayBuffer);
                const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
                copiedPages.forEach((page) => mergedPdf.addPage(page));
            }
            
            const pdfBytes = await mergedPdf.save();
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            
            return {
                blob,
                filename: 'merged_document.pdf'
            };
            
        } catch (error) {
            throw new Error('Erro ao juntar PDFs: ' + error.message);
        }
    }

    async rotatePdf(file, rotation = 90) {
        try {
            if (!window.PDFLib) {
                await this.loadScript('https://unpkg.com/pdf-lib@1.17.1/dist/pdf-lib.min.js');
            }
            
            const arrayBuffer = await this.readFileAsArrayBuffer(file);
            const pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);
            const pages = pdfDoc.getPages();
            
            pages.forEach(page => {
                page.setRotation(PDFLib.degrees(rotation));
            });
            
            const pdfBytes = await pdfDoc.save();
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            
            return {
                blob,
                filename: file.name.replace('.pdf', '_rotated.pdf')
            };
            
        } catch (error) {
            throw new Error('Erro ao rotacionar PDF: ' + error.message);
        }
    }

    loadScript(src) {
        return new Promise((resolve, reject) => {
            if (document.querySelector(`script[src="${src}"]`)) {
                resolve();
                return;
            }
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    generateUniqueFilename(originalName) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const extension = this.getFileExtension(originalName);
        const nameWithoutExt = originalName.replace(`.${extension}`, '');
        return `${nameWithoutExt}_${timestamp}.${extension}`;
    }

    async createThumbnail(file, width = 200, height = 200) {
        if (!this.supportedTypes.image.includes(file.type)) {
            throw new Error('Arquivo não é uma imagem válida');
        }
        
        return new Promise((resolve, reject) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();
            
            img.onload = () => {
                canvas.width = width;
                canvas.height = height;
                
                // Calculate aspect ratio
                const aspectRatio = img.width / img.height;
                let drawWidth = width;
                let drawHeight = height;
                let offsetX = 0;
                let offsetY = 0;
                
                if (aspectRatio > 1) {
                    drawHeight = width / aspectRatio;
                    offsetY = (height - drawHeight) / 2;
                } else {
                    drawWidth = height * aspectRatio;
                    offsetX = (width - drawWidth) / 2;
                }
                
                // Fill background
                ctx.fillStyle = '#f0f0f0';
                ctx.fillRect(0, 0, width, height);
                
                // Draw image
                ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
                
                canvas.toBlob((blob) => {
                    if (blob) {
                        resolve(blob);
                    } else {
                        reject(new Error('Erro ao criar thumbnail'));
                    }
                }, 'image/jpeg', 0.8);
            };
            
            img.onerror = () => reject(new Error('Erro ao carregar imagem'));
            img.src = URL.createObjectURL(file);
        });
    }

    async extractPdfMetadata(file) {
        try {
            if (!window.PDFLib) {
                await this.loadScript('https://unpkg.com/pdf-lib@1.17.1/dist/pdf-lib.min.js');
            }
            
            const arrayBuffer = await this.readFileAsArrayBuffer(file);
            const pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);
            
            const pageCount = pdfDoc.getPageCount();
            const title = pdfDoc.getTitle();
            const author = pdfDoc.getAuthor();
            const subject = pdfDoc.getSubject();
            const creator = pdfDoc.getCreator();
            const producer = pdfDoc.getProducer();
            const creationDate = pdfDoc.getCreationDate();
            const modificationDate = pdfDoc.getModificationDate();
            
            return {
                pageCount,
                title,
                author,
                subject,
                creator,
                producer,
                creationDate,
                modificationDate,
                fileSize: file.size,
                fileName: file.name
            };
            
        } catch (error) {
            throw new Error('Erro ao extrair metadados: ' + error.message);
        }
    }
}

// Export for use in main application
if (typeof window !== 'undefined') {
    window.FileHandler = FileHandler;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = FileHandler;
}

