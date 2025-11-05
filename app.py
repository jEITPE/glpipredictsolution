from flask import Flask, request, jsonify
from flask_cors import CORS
import openai
import os
from dotenv import load_dotenv
import logging

# Carregar variáveis de ambiente
load_dotenv()

app = Flask(__name__)
CORS(app)  # Permitir requisições do frontend

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configurar OpenAI
openai.api_key = os.getenv('OPENAI_API_KEY')
MODEL_NAME = os.getenv('MODEL_NAME')

class AIResponseGenerator:
    """IA 1: Gera resposta sugerida para o ticket"""
    
    @staticmethod
    def generate_response(ticket_description):
        try:
            prompt = f"""
Você é um analista de TI experiente. Analise este ticket e forneça uma resposta profissional em texto corrido, sem tópicos ou listas.

TICKET: {ticket_description}

Exemplos de bom estilo de resposta:
- "Realizada ação de expurgo de dados do HOM/DEV do ambiente de produção. Aproximadamente 40TB. Plano de migração gradual para converter os volumes Thick existentes para o formato Thin Provision."
- "Avaliar viabilidade de atualizar para uma versão mais recente do SMB. Caso seja possível, ajustar também os parâmetros de montagem para otimizar o desempenho."
- "Realizar análise das queries em execução no momento da ocorrência do problema, a fim de identificar possíveis gargalos de desempenho e fatores que contribuíram para a instabilidade."

Forneça uma resposta técnica em texto corrido, explicando a solução de forma natural e fluida. Use parágrafos apenas se necessário para separar ideias diferentes. Seja conciso mas completo."""

            response = openai.ChatCompletion.create(
                model=MODEL_NAME,
                messages=[
                    {"role": "system", "content": "Você é um analista de TI experiente. Responda sempre em texto corrido, sem listas ou tópicos. Use linguagem técnica mas natural. Máximo 120 palavras."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=180,
                temperature=0.4
            )
            
            return {
                "success": True,
                "response": response.choices[0].message.content.strip()
            }
            
        except Exception as e:
            logger.error(f"Erro ao gerar resposta da IA: {str(e)}")
            return {
                "success": False,
                "error": f"Erro ao gerar resposta: {str(e)}"
            }

class AIQualityEvaluator:
    """IA 2: Avalia qualidade e acurácia da resposta do analista"""
    
    @staticmethod
    def evaluate_response(ticket_description, analyst_response, ai_suggested_response):
        try:
            prompt = f"""
Compare e avalie a resposta do analista em relação à solução ideal da IA:

TICKET: {ticket_description}

RESPOSTA DO ANALISTA: {analyst_response}

RESPOSTA IDEAL DA IA: {ai_suggested_response}

Avalie o quão próxima a resposta do analista está da resposta ideal, considerando:
- Precisão técnica: O analista demonstra o mesmo nível de conhecimento técnico?
- Completude: A solução do analista aborda os mesmos pontos essenciais da IA?
- Clareza: A comunicação é tão clara quanto a resposta de referência?
- Adequação: A resposta está alinhada com a abordagem ideal para o problema?

- Não seja muito rígido na avaliação, porém sério e seja flexível e considere o contexto do ticket e a resposta do analista.

Formato OBRIGATÓRIO:
SCORE: [número 0-100 baseado na proximidade com a resposta ideal]
PRECISÃO: [0-25] - Comparação do conhecimento técnico demonstrado versus resposta ideal.
COMPLETUDE: [0-25] - Comparação da abrangência da solução versus resposta ideal.
CLAREZA: [0-25] - Comparação da clareza comunicativa versus resposta ideal.
ADEQUAÇÃO: [0-25] - Comparação do alinhamento ao problema versus resposta ideal.
RESUMO: Análise de quanto a resposta do analista se aproxima da qualidade e abordagem da resposta ideal."""

            response = openai.ChatCompletion.create(
                model=MODEL_NAME,
                messages=[
                    {"role": "system", "content": "Você é um supervisor de qualidade em TI. Compare a resposta do analista com a resposta ideal da IA para medir proximidade e qualidade. Avalie objetivamente o grau de acurácia. Use texto corrido. Máximo 120 palavras."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=160,
                temperature=0.3
            )
            
            evaluation_text = response.choices[0].message.content.strip()
            
            # Extrair score do texto
            score = AIQualityEvaluator._extract_score(evaluation_text)
            
            return {
                "success": True,
                "score": score,
                "evaluation": evaluation_text,
                "quality_level": AIQualityEvaluator._get_quality_level(score)
            }
            
        except Exception as e:
            logger.error(f"Erro ao avaliar resposta: {str(e)}")
            return {
                "success": False,
                "error": f"Erro ao avaliar resposta: {str(e)}"
            }
    
    @staticmethod
    def _extract_score(evaluation_text):
        """Extrai o score numérico do texto de avaliação"""
        try:
            lines = evaluation_text.split('\n')
            for line in lines:
                if 'SCORE:' in line.upper():
                    score_text = line.split(':')[-1].strip()
                    # Extrair apenas números
                    import re
                    numbers = re.findall(r'\d+', score_text)
                    if numbers:
                        score = int(numbers[0])
                        return min(100, max(0, score))  # Garantir entre 0-100
            return 0
        except:
            return 0
    
    @staticmethod
    def _get_quality_level(score):
        """Determina o nível de qualidade baseado no score"""
        if score >= 90:
            return "Excelente"
        elif score >= 80:
            return "Muito Bom"
        elif score >= 70:
            return "Bom"
        elif score >= 60:
            return "Satisfatório"
        elif score >= 50:
            return "Precisa Melhorar"
        else:
            return "Inadequado"

@app.route('/')
def home():
    return jsonify({
        "message": "GLPI AI - Avaliador de Respostas API",
        "status": "online",
        "endpoints": ["/evaluate"]
    })

@app.route('/evaluate', methods=['POST'])
def evaluate():
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "Dados não fornecidos"}), 400
        
        ticket = data.get('ticket', '').strip()
        analyst_response = data.get('analyst_response', '').strip()
        
        if not ticket or not analyst_response:
            return jsonify({"error": "Ticket e resposta do analista são obrigatórios"}), 400
        
        logger.info(f"Processando avaliação para ticket: {ticket[:50]}...")
        
        # IA 1: Gerar resposta sugerida
        logger.info("Gerando resposta sugerida pela IA...")
        ai_response_result = AIResponseGenerator.generate_response(ticket)
        
        if not ai_response_result["success"]:
            return jsonify({"error": ai_response_result["error"]}), 500
        
        ai_suggested_response = ai_response_result["response"]
        
        # IA 2: Avaliar qualidade da resposta do analista
        logger.info("Avaliando qualidade da resposta do analista...")
        evaluation_result = AIQualityEvaluator.evaluate_response(
            ticket, analyst_response, ai_suggested_response
        )
        
        if not evaluation_result["success"]:
            return jsonify({"error": evaluation_result["error"]}), 500
        
        # Resposta final
        result = {
            "success": True,
            "ai_suggested_response": ai_suggested_response,
            "evaluation": {
                "score": evaluation_result["score"],
                "quality_level": evaluation_result["quality_level"],
                "detailed_evaluation": evaluation_result["evaluation"]
            }
        }
        
        logger.info(f"Avaliação concluída. Score: {evaluation_result['score']}")
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"Erro no endpoint /evaluate: {str(e)}")
        return jsonify({"error": f"Erro interno: {str(e)}"}), 500

@app.route('/health', methods=['GET'])
def health_check():
    """Endpoint para verificar saúde da API"""
    try:
        # Testar conexão com OpenAI
        openai.Model.list()
        return jsonify({
            "status": "healthy",
            "openai_connection": "ok",
            "model": MODEL_NAME
        })
    except Exception as e:
        return jsonify({
            "status": "unhealthy",
            "openai_connection": "error",
            "error": str(e)
        }), 500

if __name__ == '__main__':
    # Verificar se a chave da API está configurada
    if not os.getenv('OPENAI_API_KEY'):
        logger.error("OPENAI_API_KEY não encontrada no arquivo .env")
        exit(1)
    
    logger.info("Iniciando GLPI AI - Avaliador de Respostas API...")
    logger.info(f"Modelo configurado: {MODEL_NAME}")
    
    app.run(debug=True, host='0.0.0.0', port=5000)
