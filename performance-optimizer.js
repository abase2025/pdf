// Performance Optimization Module
class PerformanceOptimizer {
    constructor() {
        this.cache = new Map();
        this.maxCacheSize = 50; // Maximum number of cached items
        this.compressionLevel = 0.8; // Image compression level
        this.chunkSize = 1024 * 1024; // 1MB chunks for large files
    }

    // Cache management
    setCache(key, value, ttl = 300000) { // 5 minutes default TTL
        if (this.cache.size >= this.maxCacheSize) {
            // Remove oldest entry
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }
        
        this.cache.set(key, {
            value,
            timestamp: Date.now(),
            ttl
        });
    }

    getCache(key) {
        const item = this.cache.get(key);
        if (!item) return null;
        
        if (Date.now() - item.timestamp > item.ttl) {
            this.cache.delete(key);
            return null;
        }
        
        return item.value;
    }

    clearCache() {
        this.cache.clear();
    }

    // File optimization
    async optimizeFile(file) {
        const cacheKey = `optimized_${file.name}_${file.size}_${file.lastModified}`;
        const cached = this.getCache(cacheKey);
        
        if (cached) {
            return cached;
        }

        let optimizedFile = file;

        // Optimize images
        if (file.type.startsWith('image/')) {
            optimizedFile = await this.optimizeImage(file);
        }

        // Optimize PDFs
        if (file.type === 'application/pdf') {
            optimizedFile = await this.optimizePdf(file);
        }

        this.setCache(cacheKey, optimizedFile);
        return optimizedFile;
    }

    async optimizeImage(file) {
        return new Promise((resolve, reject) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();

            img.onload = () => {
                // Calculate optimal dimensions
                const maxWidth = 1920;
                const maxHeight = 1080;
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
                    if (blob && blob.size < file.size) {
                        resolve(new File([blob], file.name, { type: file.type }));
                    } else {
                        resolve(file); // Keep original if optimization didn't help
                    }
                }, file.type, this.compressionLevel);
            };

            img.onerror = () => resolve(file);
            img.src = URL.createObjectURL(file);
        });
    }

    async optimizePdf(file) {
        try {
            if (!window.PDFLib) return file;

            const arrayBuffer = await file.arrayBuffer();
            const pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);

            // Save with optimization
            const optimizedBytes = await pdfDoc.save({
                useObjectStreams: true,
                addDefaultPage: false,
                objectsPerTick: 50,
            });

            const optimizedBlob = new Blob([optimizedBytes], { type: 'application/pdf' });
            
            if (optimizedBlob.size < file.size) {
                return new File([optimizedBlob], file.name, { type: file.type });
            }

            return file;
        } catch (error) {
            console.warn('PDF optimization failed:', error);
            return file;
        }
    }

    // Progress tracking for large files
    async processLargeFile(file, processor, progressCallback) {
        const chunks = Math.ceil(file.size / this.chunkSize);
        
        if (chunks <= 1) {
            return await processor(file, progressCallback);
        }

        // For very large files, process in chunks
        progressCallback(0, 'Preparando processamento de arquivo grande...');
        
        try {
            const result = await processor(file, (progress, message) => {
                progressCallback(progress, `${message} (Arquivo grande: ${chunks} partes)`);
            });
            
            return result;
        } catch (error) {
            throw new Error(`Erro ao processar arquivo grande: ${error.message}`);
        }
    }

    // Memory management
    cleanupMemory() {
        // Clear caches
        this.clearCache();
        
        // Force garbage collection if available
        if (window.gc) {
            window.gc();
        }
        
        // Clear blob URLs
        const scripts = document.querySelectorAll('script[src^="blob:"]');
        scripts.forEach(script => {
            URL.revokeObjectURL(script.src);
        });
    }

    // Performance monitoring
    measurePerformance(operation, func) {
        return async (...args) => {
            const startTime = performance.now();
            const startMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;
            
            try {
                const result = await func(...args);
                
                const endTime = performance.now();
                const endMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;
                
                console.log(`Performance [${operation}]:`, {
                    duration: `${(endTime - startTime).toFixed(2)}ms`,
                    memoryDelta: `${((endMemory - startMemory) / 1024 / 1024).toFixed(2)}MB`
                });
                
                return result;
            } catch (error) {
                console.error(`Performance [${operation}] failed:`, error);
                throw error;
            }
        };
    }

    // Batch processing
    async processBatch(files, processor, progressCallback) {
        const results = [];
        const total = files.length;
        
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const fileProgress = (i / total) * 100;
            
            progressCallback(fileProgress, `Processando arquivo ${i + 1} de ${total}: ${file.name}`);
            
            try {
                const result = await processor(file, (progress, message) => {
                    const totalProgress = fileProgress + (progress / total);
                    progressCallback(totalProgress, `${message} (${i + 1}/${total})`);
                });
                
                results.push(result);
            } catch (error) {
                console.error(`Error processing file ${file.name}:`, error);
                results.push({ error: error.message, filename: file.name });
            }
        }
        
        progressCallback(100, 'Processamento em lote concluído');
        return results;
    }

    // Network optimization
    async preloadLibraries() {
        const libraries = [
            'https://unpkg.com/pdf-lib@1.17.1/dist/pdf-lib.min.js',
            'https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.min.js',
            'https://unpkg.com/tesseract.js@4.1.1/dist/tesseract.min.js',
            'https://unpkg.com/mammoth@1.6.0/mammoth.browser.min.js'
        ];

        const preloadPromises = libraries.map(url => {
            return new Promise((resolve) => {
                const link = document.createElement('link');
                link.rel = 'preload';
                link.as = 'script';
                link.href = url;
                link.onload = resolve;
                link.onerror = resolve; // Don't fail if preload fails
                document.head.appendChild(link);
            });
        });

        await Promise.all(preloadPromises);
    }

    // Error recovery
    async retryOperation(operation, maxRetries = 3, delay = 1000) {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                return await operation();
            } catch (error) {
                if (attempt === maxRetries) {
                    throw new Error(`Operação falhou após ${maxRetries} tentativas: ${error.message}`);
                }
                
                console.warn(`Tentativa ${attempt} falhou, tentando novamente em ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
                delay *= 2; // Exponential backoff
            }
        }
    }

    // Quality assessment
    assessFileQuality(originalFile, processedFile) {
        const sizeRatio = processedFile.size / originalFile.size;
        const compressionRatio = ((originalFile.size - processedFile.size) / originalFile.size) * 100;
        
        return {
            originalSize: originalFile.size,
            processedSize: processedFile.size,
            sizeRatio: sizeRatio.toFixed(2),
            compressionRatio: compressionRatio.toFixed(1),
            quality: sizeRatio > 0.8 ? 'high' : sizeRatio > 0.6 ? 'medium' : 'low'
        };
    }
}

// Export for use in main application
if (typeof window !== 'undefined') {
    window.PerformanceOptimizer = PerformanceOptimizer;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = PerformanceOptimizer;
}

