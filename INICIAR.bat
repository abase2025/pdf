@echo off
title bestofthepdf.com - Versao Pendrive
echo.
echo ========================================
echo   bestofthepdf.com - Versao Pendrive
echo ========================================
echo.
echo Iniciando aplicacao...
echo.

REM Detecta o navegador padrão e abre a aplicação
set "html_file=%~dp0public\index.html"

REM Tenta abrir com o navegador padrão
start "" "%html_file%"

echo.
echo Aplicacao iniciada no navegador!
echo.
echo INSTRUCOES:
echo - A aplicacao foi aberta no seu navegador padrao
echo - Todas as funcionalidades estao disponiveis offline
echo - Para fechar, simplesmente feche esta janela
echo.
echo Pressione qualquer tecla para sair...
pause >nul

