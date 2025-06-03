#!/bin/bash
# Script para upload inicial para GitHub
# Conversor PDF ↔ DOC

echo "🚀 Preparando upload para GitHub..."

# Verificar se Git está instalado
if ! command -v git &> /dev/null; then
    echo "❌ Git não está instalado. Instale o Git primeiro."
    exit 1
fi

# Inicializar repositório Git
echo "📁 Inicializando repositório Git..."
git init

# Adicionar todos os arquivos
echo "📝 Adicionando arquivos..."
git add .

# Fazer commit inicial
echo "💾 Fazendo commit inicial..."
git commit -m "🎉 Aplicação completa de conversão PDF ↔ DOC

✨ Funcionalidades implementadas:
- Conversão bidirecional PDF ↔ DOC/DOCX
- OCR híbrido (APIs online + bibliotecas offline)
- Interface moderna e responsiva inspirada no iLovePDF
- Suporte a PDFs protegidos por senha
- Múltiplas engines de OCR (Google Vision, Amazon Textract, Azure, Paddle OCR, Tesseract)
- Drag & drop para upload de arquivos
- Sistema de progresso com cancelamento
- Download automático dos resultados
- Arquitetura híbrida para máxima confiabilidade

🛠️ Tecnologias utilizadas:
- Backend: Flask com blueprints modulares
- Frontend: HTML5, CSS3, JavaScript ES6
- OCR: Integração com APIs e bibliotecas offline
- Conversão: pdf2docx, python-docx, reportlab
- Interface: Bootstrap 5 + animações customizadas

🔧 Pronto para deploy em:
- Heroku (Procfile incluído)
- Railway (railway.json incluído)
- Docker (Dockerfile incluído)
- Qualquer plataforma Python

📚 Documentação completa incluída no README.md"

echo "✅ Commit realizado com sucesso!"
echo ""
echo "🔗 Próximos passos:"
echo "1. Crie um repositório no GitHub"
echo "2. Execute: git remote add origin https://github.com/SEU_USUARIO/conversor-pdf-doc.git"
echo "3. Execute: git push -u origin main"
echo ""
echo "🌐 Para deploy online:"
echo "- Heroku: heroku create conversor-pdf-doc && git push heroku main"
echo "- Railway: Conecte seu GitHub em railway.app"
echo "- Docker: docker build -t conversor-pdf-doc . && docker run -p 5000:5000 conversor-pdf-doc"

