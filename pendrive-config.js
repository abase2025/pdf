// Configuração específica para versão pendrive
const PENDRIVE_CONFIG = {
    version: '1.0.0',
    mode: 'offline',
    features: {
        analytics: false, // Desabilita analytics offline
        onlineEditors: true, // Mantém opções mas avisa sobre necessidade de internet
        autoSave: true, // Salva automaticamente no navegador
        cache: true, // Usa cache agressivo
        compression: true // Comprime arquivos por padrão
    },
    limits: {
        maxFileSize: 100 * 1024 * 1024, // 100MB
        maxConcurrentFiles: 5,
        cacheSize: 50 * 1024 * 1024 // 50MB cache
    },
    messages: {
        welcome: 'Bem-vindo ao bestofthepdf.com - Versão Pendrive!',
        offline: 'Funcionando 100% offline - seus arquivos estão seguros!',
        internetRequired: 'Esta funcionalidade requer conexão com a internet.',
        processing: 'Processando localmente no seu computador...'
    }
};

// Aplicar configurações na inicialização
if (typeof window !== 'undefined') {
    window.PENDRIVE_CONFIG = PENDRIVE_CONFIG;
    
    // Adicionar indicador de versão pendrive
    document.addEventListener('DOMContentLoaded', function() {
        // Adicionar badge de versão offline
        const badge = document.createElement('div');
        badge.innerHTML = '🔒 Versão Offline';
        badge.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: #10B981;
            color: white;
            padding: 5px 10px;
            border-radius: 15px;
            font-size: 12px;
            font-weight: bold;
            z-index: 10000;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        `;
        document.body.appendChild(badge);
        
        // Mostrar mensagem de boas-vindas
        setTimeout(() => {
            if (window.showNotification) {
                window.showNotification(PENDRIVE_CONFIG.messages.welcome, 'success');
            }
        }, 1000);
    });
}

