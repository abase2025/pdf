#!/bin/bash

echo "========================================"
echo "  bestofthepdf.com - Versão Pendrive"
echo "========================================"
echo ""
echo "Iniciando aplicação..."
echo ""

# Caminho para o arquivo HTML
HTML_FILE="$(dirname "$0")/public/index.html"

# Detecta o sistema operacional e abre o navegador apropriado
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    open "$HTML_FILE"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    if command -v xdg-open > /dev/null; then
        xdg-open "$HTML_FILE"
    elif command -v firefox > /dev/null; then
        firefox "$HTML_FILE"
    elif command -v google-chrome > /dev/null; then
        google-chrome "$HTML_FILE"
    elif command -v chromium-browser > /dev/null; then
        chromium-browser "$HTML_FILE"
    else
        echo "Navegador não encontrado. Abra manualmente: $HTML_FILE"
    fi
else
    echo "Sistema operacional não suportado automaticamente."
    echo "Abra manualmente o arquivo: $HTML_FILE"
fi

echo ""
echo "Aplicação iniciada no navegador!"
echo ""
echo "INSTRUÇÕES:"
echo "- A aplicação foi aberta no seu navegador padrão"
echo "- Todas as funcionalidades estão disponíveis offline"
echo "- Para fechar, simplesmente feche esta janela"
echo ""
echo "Pressione Enter para sair..."
read

