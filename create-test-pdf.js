// Create a simple test PDF
const { PDFDocument, StandardFonts, rgb } = PDFLib;

async function createTestPDF() {
    const pdfDoc = await PDFDocument.create();
    const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
    
    const page = pdfDoc.addPage();
    const { width, height } = page.getSize();
    
    page.drawText('Documento de Teste - bestofthepdf.com', {
        x: 50,
        y: height - 100,
        size: 18,
        font: timesRomanFont,
        color: rgb(0, 0, 0),
    });
    
    page.drawText('Este é um documento PDF de teste para verificar', {
        x: 50,
        y: height - 150,
        size: 12,
        font: timesRomanFont,
        color: rgb(0, 0, 0),
    });
    
    page.drawText('as funcionalidades de conversão da aplicação.', {
        x: 50,
        y: height - 170,
        size: 12,
        font: timesRomanFont,
        color: rgb(0, 0, 0),
    });
    
    page.drawText('Funcionalidades testadas:', {
        x: 50,
        y: height - 220,
        size: 14,
        font: timesRomanFont,
        color: rgb(0, 0, 0),
    });
    
    page.drawText('• Conversão PDF para Word', {
        x: 70,
        y: height - 250,
        size: 12,
        font: timesRomanFont,
        color: rgb(0, 0, 0),
    });
    
    page.drawText('• Conversão Word para PDF', {
        x: 70,
        y: height - 270,
        size: 12,
        font: timesRomanFont,
        color: rgb(0, 0, 0),
    });
    
    page.drawText('• OCR de documentos', {
        x: 70,
        y: height - 290,
        size: 12,
        font: timesRomanFont,
        color: rgb(0, 0, 0),
    });
    
    page.drawText('• Desbloqueio de PDFs', {
        x: 70,
        y: height - 310,
        size: 12,
        font: timesRomanFont,
        color: rgb(0, 0, 0),
    });
    
    page.drawText('• Integração com editores online', {
        x: 70,
        y: height - 330,
        size: 12,
        font: timesRomanFont,
        color: rgb(0, 0, 0),
    });
    
    page.drawText('Data de criação: ' + new Date().toLocaleDateString('pt-BR'), {
        x: 50,
        y: height - 380,
        size: 10,
        font: timesRomanFont,
        color: rgb(0.5, 0.5, 0.5),
    });
    
    const pdfBytes = await pdfDoc.save();
    return pdfBytes;
}

// Export function
if (typeof window !== 'undefined') {
    window.createTestPDF = createTestPDF;
}

