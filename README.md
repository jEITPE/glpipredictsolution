# GLPI AI - Avaliador de Respostas

MVP para avaliação de qualidade de respostas de analistas de TI usando Inteligência Artificial.

## 🚀 Funcionalidades

- **IA 1**: Gera resposta sugerida para tickets/incidentes
- **IA 2**: Avalia qualidade e acurácia da resposta do analista
- **Interface simples**: Duas caixas de texto para entrada
- **Avaliação em tempo real**: Score de 0-100 com análise detalhada
- **Integração OpenAI**: Usa GPT-4 para análises inteligentes

## 📋 Pré-requisitos

- Python 3.8+
- Chave da API OpenAI
- Navegador web moderno

## 🛠️ Instalação

### 1. Instalar dependências Python

```bash
pip install -r requirements.txt
```

### 2. Configurar variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
OPENAI_API_KEY=sua_chave_openai_aqui
MODEL_NAME=gpt-4
```

### 3. Executar o servidor

```bash
python app.py
```

O servidor será iniciado em `http://localhost:5000`

### 4. Abrir a interface

Abra o arquivo `index.html` no seu navegador ou use um servidor local:

```bash
# Usando Python
python -m http.server 8080

# Ou usando Node.js
npx serve .
```

## 📖 Como Usar

1. **Descreva o Ticket**: Digite o incidente/requisição na primeira caixa
2. **Resposta do Analista**: Digite a resposta do analista na segunda caixa
3. **Clique em Avaliar**: O sistema processará com as duas IAs
4. **Veja os Resultados**:
   - Resposta sugerida pela IA
   - Score de qualidade (0-100)
   - Análise detalhada da avaliação

## 🎯 Exemplo de Uso

**Ticket:**
```
Usuário relatando que o computador está muito lento, demora para abrir programas e às vezes trava completamente.
```

**Resposta do Analista:**
```
Verificar o gerenciador de tarefas para identificar processos que estão consumindo muita CPU e memória. Executar limpeza de disco e desfragmentação. Verificar se há vírus no sistema.
```

**Resultado:**
- IA gerará uma resposta técnica detalhada
- Score baseado em precisão, completude, clareza e adequação
- Análise comparativa entre as respostas

## 🔧 Estrutura do Projeto

```
├── index.html          # Interface do usuário
├── styles.css          # Estilos da interface
├── script.js           # Lógica do frontend
├── app.py              # API Python/Flask
├── requirements.txt    # Dependências Python
├── .env               # Configurações (criar)
└── README.md          # Este arquivo
```

## 🤖 APIs Disponíveis

### POST /evaluate
Avalia um ticket e resposta do analista.

**Request:**
```json
{
  "ticket": "Descrição do problema...",
  "analyst_response": "Resposta do analista..."
}
```

**Response:**
```json
{
  "success": true,
  "ai_suggested_response": "Resposta sugerida pela IA...",
  "evaluation": {
    "score": 85,
    "quality_level": "Muito Bom",
    "detailed_evaluation": "Análise detalhada..."
  }
}
```

### GET /health
Verifica status da API e conexão com OpenAI.

## ⚠️ Observações Importantes

- Certifique-se de que sua chave OpenAI está válida e tem créditos
- O modelo GPT-4 pode demorar alguns segundos para responder
- Mantenha o arquivo `.env` seguro e não o compartilhe
- Para produção, configure CORS adequadamente

## 🐛 Solução de Problemas

**Erro de conexão com API:**
- Verifique se o servidor Python está rodando
- Confirme se a porta 5000 está livre

**Erro OpenAI:**
- Verifique sua chave da API no arquivo `.env`
- Confirme se há créditos disponíveis na conta OpenAI

**Interface não carrega:**
- Verifique se todos os arquivos estão no mesmo diretório
- Use um servidor local em vez de abrir o HTML diretamente

## 📝 Licença

Este é um projeto MVP para demonstração. Use por sua conta e risco.
