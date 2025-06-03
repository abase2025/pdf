from flask import Blueprint, request, jsonify, send_file
import os
import uuid
import tempfile
from werkzeug.utils import secure_filename
from src.services.converter_service import ConverterService

converter_bp = Blueprint('converter', __name__)
converter_service = ConverterService()

# Configurações
UPLOAD_FOLDER = tempfile.mkdtemp()
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB
ALLOWED_EXTENSIONS = {
    'pdf': ['pdf'],
    'doc': ['doc', 'docx']
}

def allowed_file(filename, conversion_type):
    """Verifica se o arquivo é permitido para o tipo de conversão"""
    if '.' not in filename:
        return False
    
    ext = filename.rsplit('.', 1)[1].lower()
    
    if conversion_type in ['pdf-to-doc', 'ocr-pdf']:
        return ext in ALLOWED_EXTENSIONS['pdf']
    elif conversion_type == 'doc-to-pdf':
        return ext in ALLOWED_EXTENSIONS['doc']
    
    return False

@converter_bp.route('/convert', methods=['POST'])
def convert_files():
    """Endpoint principal para conversão de arquivos"""
    try:
        # Verificar se há arquivos na requisição
        if 'files' not in request.files:
            return jsonify({'success': False, 'error': 'Nenhum arquivo enviado'}), 400
        
        files = request.files.getlist('files')
        if not files or all(f.filename == '' for f in files):
            return jsonify({'success': False, 'error': 'Nenhum arquivo selecionado'}), 400
        
        # Obter parâmetros de conversão
        conversion_type = request.form.get('conversion_type', 'pdf-to-doc')
        quality = request.form.get('quality', 'high')
        password = request.form.get('password', '')
        ocr_language = request.form.get('ocr_language', 'por')
        ocr_engine = request.form.get('ocr_engine', 'auto')
        
        converted_files = []
        
        for file in files:
            if file.filename == '':
                continue
                
            # Validar arquivo
            if not allowed_file(file.filename, conversion_type):
                return jsonify({
                    'success': False, 
                    'error': f'Tipo de arquivo não suportado: {file.filename}'
                }), 400
            
            # Verificar tamanho do arquivo
            file.seek(0, os.SEEK_END)
            file_size = file.tell()
            file.seek(0)
            
            if file_size > MAX_FILE_SIZE:
                return jsonify({
                    'success': False,
                    'error': f'Arquivo muito grande: {file.filename} (máximo 50MB)'
                }), 400
            
            # Salvar arquivo temporário
            filename = secure_filename(file.filename)
            file_id = str(uuid.uuid4())
            temp_input_path = os.path.join(UPLOAD_FOLDER, f"{file_id}_{filename}")
            file.save(temp_input_path)
            
            try:
                # Processar conversão
                result = converter_service.convert_file(
                    input_path=temp_input_path,
                    conversion_type=conversion_type,
                    quality=quality,
                    password=password,
                    ocr_language=ocr_language,
                    ocr_engine=ocr_engine,
                    file_id=file_id
                )
                
                if result['success']:
                    converted_files.append({
                        'file_id': file_id,
                        'original_filename': filename,
                        'output_filename': result['output_filename'],
                        'output_path': result['output_path']
                    })
                else:
                    return jsonify({
                        'success': False,
                        'error': f'Erro ao converter {filename}: {result["error"]}'
                    }), 500
                    
            except Exception as e:
                return jsonify({
                    'success': False,
                    'error': f'Erro ao processar {filename}: {str(e)}'
                }), 500
            finally:
                # Limpar arquivo de entrada
                if os.path.exists(temp_input_path):
                    os.remove(temp_input_path)
        
        return jsonify({
            'success': True,
            'message': f'{len(converted_files)} arquivo(s) convertido(s) com sucesso',
            'files': converted_files
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Erro interno do servidor: {str(e)}'
        }), 500

@converter_bp.route('/download/<file_id>', methods=['GET'])
def download_file(file_id):
    """Endpoint para download de arquivos convertidos"""
    try:
        file_path = converter_service.get_converted_file_path(file_id)
        
        if not file_path or not os.path.exists(file_path):
            return jsonify({'error': 'Arquivo não encontrado'}), 404
        
        # Obter nome do arquivo
        filename = os.path.basename(file_path)
        
        return send_file(
            file_path,
            as_attachment=True,
            download_name=filename,
            mimetype='application/octet-stream'
        )
        
    except Exception as e:
        return jsonify({'error': f'Erro ao baixar arquivo: {str(e)}'}), 500

@converter_bp.route('/status/<file_id>', methods=['GET'])
def get_conversion_status(file_id):
    """Endpoint para verificar status de conversão"""
    try:
        status = converter_service.get_conversion_status(file_id)
        return jsonify(status)
    except Exception as e:
        return jsonify({'error': f'Erro ao obter status: {str(e)}'}), 500

@converter_bp.route('/health', methods=['GET'])
def health_check():
    """Endpoint para verificação de saúde do serviço"""
    return jsonify({
        'status': 'healthy',
        'service': 'PDF-DOC Converter',
        'version': '1.0.0',
        'supported_conversions': ['pdf-to-doc', 'doc-to-pdf', 'ocr-pdf']
    })

@converter_bp.route('/engines', methods=['GET'])
def get_available_engines():
    """Endpoint para obter engines de OCR disponíveis"""
    try:
        engines = converter_service.get_available_ocr_engines()
        return jsonify({
            'success': True,
            'engines': engines
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Erro ao obter engines: {str(e)}'
        }), 500

