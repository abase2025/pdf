# Dockerfile para Conversor PDF ↔ DOC
FROM python:3.11-slim

# Definir diretório de trabalho
WORKDIR /app

# Instalar dependências do sistema
RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Copiar requirements e instalar dependências Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar código da aplicação
COPY src/ ./src/
COPY run.py .

# Criar diretório para uploads temporários
RUN mkdir -p /tmp/pdf_converter_uploads

# Expor porta
EXPOSE 5000

# Definir variáveis de ambiente
ENV FLASK_ENV=production
ENV PYTHONPATH=/app

# Comando para executar a aplicação
CMD ["python", "run.py"]

