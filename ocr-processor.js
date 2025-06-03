// OCR Processor Module
class OCRProcessor {
    constructor() {
        this.tesseractWorker = null;
        this.loadDependencies();
    }

    async loadDependencies() {
        // Load Tesseract.js if not already loaded
        if (!window.Tesseract) {
            await this.loadScript('https://unpkg.com/tesseract.js@4.1.1/dist/tesseract.min.js');
        }
        
        // Load PDF.js for PDF to image conversion
        if (!window.pdfjsLib) {
            await this.loadScript('https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.min.js');
            window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
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

    async initTesseract() {
        if (!this.tesseractWorker) {
            this.tesseractWorker = await Tesseract.createWorker('por', 1, {
                logger: m => console.log(m)
            });
        }
        return this.tesseractWorker;
    }

    async convertPdfToOcr(file, progressCallback) {
        try {
            progressCallback(5, 'Inicializando OCR...');
            
            await this.initTesseract();
            
            progressCallback(10, 'Carregando PDF...');
            
            const arrayBuffer = await file.arrayBuffer();
            const loadingTask = pdfjsLib.getDocument(arrayBuffer);
            const pdf = await loadingTask.promise;
            
            progressCallback(20, 'Convertendo páginas para imagens...');
            
            let fullText = '';
            const totalPages = pdf.numPages;
            
            for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
                const baseProgress = 20 + ((pageNum - 1) / totalPages) * 60;
                
                progressCallback(baseProgress, `Processando página ${pageNum} de ${totalPages}...`);
                
                const page = await pdf.getPage(pageNum);
                const viewport = page.getViewport({ scale: 2.0 }); // Higher scale for better OCR
                
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                canvas.height = viewport.height;
                canvas.width = viewport.width;
                
                // Render page to canvas
                await page.render({ canvasContext: context, viewport: viewport }).promise;
                
                // Preprocess image for better OCR results
                const preprocessedCanvas = this.preprocessImageForOCR(canvas);
                
                progressCallback(baseProgress + 10, `Executando OCR na página ${pageNum}...`);
                
                // Perform OCR on the page
                const { data: { text } } = await this.tesseractWorker.recognize(preprocessedCanvas, {
                    logger: m => {
                        if (m.status === 'recognizing text') {
                            const ocrProgress = baseProgress + 10 + (m.progress * 30);
                            progressCallback(ocrProgress, `OCR página ${pageNum}: ${Math.round(m.progress * 100)}%`);
                        }
                    }
                });
                
                // Clean and format the extracted text
                const cleanedText = this.cleanOCRText(text);
                fullText += `\n\n=== PÁGINA ${pageNum} ===\n\n${cleanedText}\n`;
            }
            
            progressCallback(90, 'Finalizando extração...');
            
            // Post-process the full text
            const finalText = this.postProcessOCRText(fullText);
            
            progressCallback(100, 'OCR concluído!');
            
            return {
                blob: new Blob([finalText], { type: 'text/plain; charset=utf-8' }),
                filename: file.name.replace('.pdf', '_ocr.txt'),
                text: finalText,
                pageCount: totalPages
            };
            
        } catch (error) {
            console.error('PDF to OCR conversion error:', error);
            throw new Error('Erro na conversão PDF para OCR: ' + error.message);
        }
    }

    async convertImageToOcr(file, progressCallback) {
        try {
            progressCallback(10, 'Inicializando OCR...');
            
            await this.initTesseract();
            
            progressCallback(20, 'Carregando imagem...');
            
            const imageUrl = URL.createObjectURL(file);
            const img = new Image();
            
            await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = reject;
                img.src = imageUrl;
            });
            
            progressCallback(30, 'Preprocessando imagem...');
            
            // Create canvas and preprocess image
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            
            const preprocessedCanvas = this.preprocessImageForOCR(canvas);
            
            progressCallback(40, 'Executando OCR...');
            
            // Perform OCR
            const { data: { text, confidence } } = await this.tesseractWorker.recognize(preprocessedCanvas, {
                logger: m => {
                    if (m.status === 'recognizing text') {
                        const ocrProgress = 40 + (m.progress * 50);
                        progressCallback(ocrProgress, `OCR: ${Math.round(m.progress * 100)}%`);
                    }
                }
            });
            
            progressCallback(95, 'Processando texto...');
            
            const cleanedText = this.cleanOCRText(text);
            
            progressCallback(100, 'OCR concluído!');
            
            URL.revokeObjectURL(imageUrl);
            
            return {
                blob: new Blob([cleanedText], { type: 'text/plain; charset=utf-8' }),
                filename: file.name.replace(/\.(jpg|jpeg|png|gif|bmp|tiff)$/i, '_ocr.txt'),
                text: cleanedText,
                confidence: confidence
            };
            
        } catch (error) {
            console.error('Image to OCR conversion error:', error);
            throw new Error('Erro na conversão de imagem para OCR: ' + error.message);
        }
    }

    async convertOcrToPdf(file, progressCallback) {
        try {
            progressCallback(10, 'Carregando texto...');
            
            const text = await file.text();
            
            progressCallback(30, 'Criando PDF...');
            
            // Load PDF-lib
            if (!window.PDFLib) {
                await this.loadScript('https://unpkg.com/pdf-lib@1.17.1/dist/pdf-lib.min.js');
            }
            
            const pdfDoc = await PDFLib.PDFDocument.create();
            const font = await pdfDoc.embedFont(PDFLib.StandardFonts.Helvetica);
            const boldFont = await pdfDoc.embedFont(PDFLib.StandardFonts.HelveticaBold);
            
            progressCallback(50, 'Formatando texto...');
            
            // Split text into pages
            const lines = text.split('\n');
            const pageWidth = 595; // A4 width in points
            const pageHeight = 842; // A4 height in points
            const margin = 50;
            const lineHeight = 14;
            const maxLinesPerPage = Math.floor((pageHeight - 2 * margin) / lineHeight);
            
            progressCallback(70, 'Adicionando páginas...');
            
            for (let i = 0; i < lines.length; i += maxLinesPerPage) {
                const page = pdfDoc.addPage([pageWidth, pageHeight]);
                const pageLines = lines.slice(i, i + maxLinesPerPage);
                
                pageLines.forEach((line, index) => {
                    const y = pageHeight - margin - (index * lineHeight);
                    
                    if (line.trim()) {
                        // Detect headers/titles
                        const isHeader = line.includes('===') || 
                                        (line.length < 60 && line.trim().length > 0 && 
                                         line.toUpperCase() === line);
                        
                        // Wrap long lines
                        const maxCharsPerLine = 80;
                        const wrappedLines = this.wrapText(line, maxCharsPerLine);
                        
                        wrappedLines.forEach((wrappedLine, wrapIndex) => {
                            const lineY = y - (wrapIndex * lineHeight);
                            if (lineY > margin) {
                                page.drawText(wrappedLine, {
                                    x: margin,
                                    y: lineY,
                                    size: isHeader ? 12 : 10,
                                    font: isHeader ? boldFont : font,
                                    maxWidth: pageWidth - (margin * 2),
                                });
                            }
                        });
                    }
                });
                
                // Add page number
                const pageNumber = Math.floor(i / maxLinesPerPage) + 1;
                page.drawText(`Página ${pageNumber}`, {
                    x: pageWidth - margin - 50,
                    y: margin / 2,
                    size: 8,
                    font: font,
                });
            }
            
            progressCallback(90, 'Gerando PDF...');
            
            const pdfBytes = await pdfDoc.save();
            
            progressCallback(100, 'PDF criado com sucesso!');
            
            return {
                blob: new Blob([pdfBytes], { type: 'application/pdf' }),
                filename: file.name.replace(/\.(txt|ocr)$/i, '.pdf')
            };
            
        } catch (error) {
            console.error('OCR to PDF conversion error:', error);
            throw new Error('Erro na conversão OCR para PDF: ' + error.message);
        }
    }

    preprocessImageForOCR(canvas) {
        const ctx = canvas.getContext('2d');
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        // Convert to grayscale and increase contrast
        for (let i = 0; i < data.length; i += 4) {
            const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
            
            // Increase contrast
            const contrast = 1.5;
            const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
            const enhancedGray = factor * (gray - 128) + 128;
            
            // Apply threshold for better text recognition
            const threshold = 128;
            const finalValue = enhancedGray > threshold ? 255 : 0;
            
            data[i] = finalValue;     // Red
            data[i + 1] = finalValue; // Green
            data[i + 2] = finalValue; // Blue
            // Alpha channel remains unchanged
        }
        
        ctx.putImageData(imageData, 0, 0);
        return canvas;
    }

    cleanOCRText(text) {
        return text
            // Remove extra whitespace
            .replace(/\s+/g, ' ')
            // Fix common OCR errors
            .replace(/\|/g, 'I')
            .replace(/0/g, 'O')
            .replace(/5/g, 'S')
            .replace(/1/g, 'l')
            // Remove isolated single characters that are likely errors
            .replace(/\s[a-z]\s/g, ' ')
            // Fix line breaks
            .replace(/\n\s*\n/g, '\n\n')
            .trim();
    }

    postProcessOCRText(text) {
        return text
            // Normalize line breaks
            .replace(/\r\n/g, '\n')
            .replace(/\r/g, '\n')
            // Remove excessive blank lines
            .replace(/\n{3,}/g, '\n\n')
            // Fix common Portuguese OCR errors
            .replace(/ç/g, 'ç')
            .replace(/ã/g, 'ã')
            .replace(/õ/g, 'õ')
            // Capitalize first letter of sentences
            .replace(/\.\s+([a-z])/g, (match, letter) => '. ' + letter.toUpperCase())
            .trim();
    }

    wrapText(text, maxChars) {
        if (text.length <= maxChars) {
            return [text];
        }
        
        const words = text.split(' ');
        const lines = [];
        let currentLine = '';
        
        words.forEach(word => {
            if ((currentLine + word).length <= maxChars) {
                currentLine += (currentLine ? ' ' : '') + word;
            } else {
                if (currentLine) {
                    lines.push(currentLine);
                }
                currentLine = word;
            }
        });
        
        if (currentLine) {
            lines.push(currentLine);
        }
        
        return lines;
    }

    async terminate() {
        if (this.tesseractWorker) {
            await this.tesseractWorker.terminate();
            this.tesseractWorker = null;
        }
    }
}

// Export for use in main application
if (typeof window !== 'undefined') {
    window.OCRProcessor = OCRProcessor;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = OCRProcessor;
}

