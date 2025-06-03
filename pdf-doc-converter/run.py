#!/usr/bin/env python3
"""
Arquivo de execução principal para deploy em produção
Conversor PDF ↔ DOC - Aplicação Web
"""

import os
import sys

# Adicionar diretório src ao path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

from src.main import app

if __name__ == '__main__':
    # Configurações para produção
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_ENV') == 'development'
    
    print(f"🚀 Iniciando Conversor PDF ↔ DOC na porta {port}")
    print(f"🔧 Modo debug: {debug}")
    
    app.run(
        host='0.0.0.0',
        port=port,
        debug=debug
    )

