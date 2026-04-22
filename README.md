# AI System RAG for Software Engineering

NestJS monorepo cho mot he thong RAG thuc te theo mien tri thuc Software Engineering.

## Kien truc

- `apps/api-gateway`: HTTP entrypoint, expose `GET /chat?q=...`
- `apps/ai-service`: gRPC service, retrieve context tu knowledge-service roi moi goi Ollama
- `apps/knowledge-service`: ingest, chunk, embed, vector search, graph enrichment
- `libs/contracts`: proto contract dung chung cho gRPC

Luong chay:

1. Client goi `api-gateway`
2. `api-gateway` goi `ai-service` qua gRPC
3. `ai-service` goi `knowledge-service` de retrieve context va source
4. `ai-service` prompt Ollama bang context da grounding
5. Ket qua tra ve gom `answer`, `sources`, `grounded`, `retrievalStrategy`

## Ha tang can co

- Node.js 22+
- Docker
- Ollama dang chay local
- Neo4j
- ChromaDB

## Bien moi truong

Root `.env` dang duoc dung boi `ai-service` va `knowledge-service`.

Can co toi thieu:

```env
NEO4J_HOST=localhost
NEO4J_PORT=7687
CHROMA_HOST=localhost
CHROMA_PORT=8000
OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_MODEL=llama3:latest
OLLAMA_EMBED_MODEL=nomic-embed-text
OLLAMA_TIMEOUT_MS=120000
OLLAMA_TEMPERATURE=0.2
OLLAMA_NUM_PREDICT=128
KNOWLEDGE_COLLECTION_NAME=se_knowledge_base
KNOWLEDGE_SERVICE_BASE_URL=http://127.0.0.1:3001
KNOWLEDGE_TOP_K=4
```

`apps/knowledge-service/.env` giu `NEO4J_USERNAME` va `NEO4J_PASSWORD`.

## Cach chay

### 1. Cai dependency

```powershell
npm.cmd install
```

### 2. Khoi dong Neo4j va ChromaDB

```powershell
docker compose up -d neo4j chromadb
```

### 3. Khoi dong Ollama va model

```powershell
ollama serve
ollama pull llama3:latest
ollama pull nomic-embed-text
```

### 4. Chay 3 service

Mo 3 terminal rieng:

```powershell
npm.cmd run start:knowledge-service:dev
npm.cmd run start:ai-service:dev
npm.cmd run start:api-gateway:dev
```

## Nap kho tri thuc mau

Repo co seed Software Engineering co san. Sau khi `knowledge-service` chay:

```http
POST http://localhost:3001/knowledge/bootstrap
```

Hoac ingest tai lieu rieng:

```http
POST http://localhost:3001/knowledge/documents
Content-Type: application/json

{
  "documents": [
    {
      "title": "Testing Basics",
      "source": "Internal Handbook",
      "topic": "software-testing",
      "content": "Unit tests validate small isolated behavior...",
      "tags": ["unit test", "regression test"]
    }
  ]
}
```

## API chinh

### Health

```http
GET http://localhost:3001/health/db
```

### Retrieve

```http
POST http://localhost:3001/knowledge/retrieve
Content-Type: application/json

{
  "query": "unit test dung de lam gi?",
  "topK": 4
}
```

### Chat

```http
GET http://localhost:3000/chat?q=unit%20test%20dung%20de%20lam%20gi
```

Vi du response:

```json
{
  "answer": "Unit test dung de kiem tra tung don vi hanh vi rieng le va giup phat hien loi som [Nguon 1].",
  "sources": [
    {
      "id": "software-testing-software-testing-strategy:chunk:0",
      "title": "Software Testing Strategy",
      "source": "SE Handbook",
      "topic": "software-testing",
      "excerpt": "Unit tests check small isolated pieces of behavior.",
      "score": 0.92
    }
  ],
  "grounded": true,
  "retrievalStrategy": "vector+keyword+graph-rerank"
}
```

## Kiem tra

```powershell
npm.cmd run build
npm.cmd test -- --runInBand
```

## Tinh nang hien co

- ingest tai lieu SE
- chunking va embedding bang Ollama
- luu vector vao ChromaDB
- tao graph concept co ban trong Neo4j
- retrieve theo vector + keyword + graph rerank
- grounded generation co source

## Viec nen lam tiep neu dua vao production

- auth va tenant isolation
- async ingestion jobs
- admin UI cho document lifecycle
- evaluation dataset va observability
- reranker model rieng
- streaming response va cache
