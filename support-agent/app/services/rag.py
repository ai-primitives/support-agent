import os
from typing import List, Dict, Any
import httpx
import json
import logging
from fastapi import HTTPException
from ..models.models import KnowledgeEmbedding
from sqlalchemy.orm import Session

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class MockVectorStore:
    def __init__(self):
        self.vectors = {}  # id -> (values, metadata)
        logger.info("Initialized MockVectorStore")

    def insert(self, vector_id: str, values: List[float], metadata: Dict[str, Any] = None):
        self.vectors[vector_id] = (values, metadata or {})
        logger.info(f"Inserted vector {vector_id} with metadata {metadata}")

    def search(self, query_vector: List[float], limit: int = 5) -> List[Dict[str, Any]]:
        # Simple cosine similarity search
        def cosine_similarity(a: List[float], b: List[float]) -> float:
            dot_product = sum(x * y for x, y in zip(a, b))
            norm_a = sum(x * x for x in a) ** 0.5
            norm_b = sum(x * x for x in b) ** 0.5
            return dot_product / (norm_a * norm_b) if norm_a and norm_b else 0

        scores = []
        logger.info(f"Searching through {len(self.vectors)} vectors")

        for vid, (values, metadata) in self.vectors.items():
            score = cosine_similarity(query_vector, values)
            scores.append((score, vid, metadata))
            logger.debug(f"Vector {vid} score: {score}")

        # Sort by score descending and take top k
        scores.sort(reverse=True)
        results = [
            {"id": vid, "score": score, "metadata": metadata}
            for score, vid, metadata in scores[:limit]
        ]
        logger.info(f"Found {len(results)} results")
        return results

class RAGService:
    def __init__(self):
        self.mock_mode = os.getenv("MOCK_MODE", "true").lower() == "true"
        logger.info(f"Initializing RAG Service in {'mock' if self.mock_mode else 'production'} mode")

        if self.mock_mode:
            self.vector_store = MockVectorStore()
            logger.info("Mock vector store initialized")
        else:
            self.account_id = os.getenv("CLOUDFLARE_ACCOUNT_ID")
            self.api_token = os.getenv("CLOUDFLARE_API_TOKEN")
            self.index_name = os.getenv("VECTORIZE_INDEX_NAME", "support-agent-kb")

            if not all([self.account_id, self.api_token]):
                logger.error("Missing required Cloudflare credentials")
                raise ValueError("Missing required Cloudflare credentials")

            self.headers = {
                "Authorization": f"Bearer {self.api_token}",
                "Content-Type": "application/json"
            }

            self.vectorize_url = f"https://api.cloudflare.com/client/v4/accounts/{self.account_id}/vectorize/indexes/{self.index_name}"
            self.workers_ai_url = f"https://api.cloudflare.com/client/v4/accounts/{self.account_id}/ai/run/@cf/baai/bge-base-en-v1.5"
            logger.info("Production vector store initialized")

    async def create_embedding(self, text: str) -> List[float]:
        """Generate embeddings using Workers AI or mock embeddings"""
        logger.info(f"Creating embedding for text: {text[:50]}...")

        if self.mock_mode:
            # Generate deterministic mock embedding based on text hash
            import hashlib
            hash_obj = hashlib.sha256(text.encode())
            hash_bytes = hash_obj.digest()
            # Convert hash bytes to floats between -1 and 1
            embedding = [(float(b) / 128.0) - 1.0 for b in hash_bytes[:64]]  # 64-dim mock embedding
            logger.info("Created mock embedding")
            return embedding

        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(
                    self.workers_ai_url,
                    headers=self.headers,
                    json={"text": text}
                )

                if response.status_code != 200:
                    logger.error(f"Failed to generate embedding: {response.text}")
                    raise Exception(f"Failed to generate embedding: {response.text}")

                result = response.json()
                logger.info("Successfully generated embedding")
                return result["result"]["embedding"]
            except Exception as e:
                logger.error(f"Error generating embedding: {str(e)}")
                raise

    async def insert_vector(self, vector_id: str, values: List[float], metadata: Dict[str, Any] = None):
        """Insert vector into store"""
        logger.info(f"Inserting vector {vector_id} with metadata {metadata}")

        if self.mock_mode:
            self.vector_store.insert(vector_id, values, metadata)
            return

        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(
                    f"{self.vectorize_url}/vectors",
                    headers=self.headers,
                    json={
                        "vectors": [{
                            "id": vector_id,
                            "values": values,
                            "metadata": metadata or {}
                        }]
                    }
                )

                if response.status_code != 200:
                    logger.error(f"Failed to insert vector: {response.text}")
                    raise Exception(f"Failed to insert vector: {response.text}")

                logger.info(f"Successfully inserted vector {vector_id}")
            except Exception as e:
                logger.error(f"Error inserting vector: {str(e)}")
                raise

    async def search_similar(self, query_embedding: List[float], limit: int = 5) -> List[Dict[str, Any]]:
        """Search for similar vectors"""
        logger.info(f"Searching for similar vectors with limit {limit}")

        if self.mock_mode:
            results = self.vector_store.search(query_embedding, limit)
            logger.info(f"Found {len(results)} results in mock mode")
            return results

        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(
                    f"{self.vectorize_url}/query",
                    headers=self.headers,
                    json={
                        "vector": query_embedding,
                        "topK": limit
                    }
                )

                if response.status_code != 200:
                    logger.error(f"Failed to search vectors: {response.text}")
                    raise Exception(f"Failed to search vectors: {response.text}")

                result = response.json()
                matches = result.get("result", {}).get("matches", [])
                logger.info(f"Found {len(matches)} matches")
                return matches
            except Exception as e:
                logger.error(f"Error searching vectors: {str(e)}")
                raise

    async def add_knowledge(self, db: Session, business_id: str, content: str, metadata: Dict[str, Any] = None) -> KnowledgeEmbedding:
        """Add new knowledge to the RAG system"""
        logger.info(f"Adding knowledge for business {business_id}")
        try:
            # Generate embedding
            embedding = await self.create_embedding(content)

            # Create vector ID
            import hashlib
            content_hash = hashlib.sha256(content.encode()).hexdigest()[:16]
            vector_id = f"{business_id}-{content_hash}"
            logger.info(f"Generated vector ID: {vector_id}")

            # Store in vector store
            await self.insert_vector(vector_id, embedding, metadata)

            # Store in database
            knowledge = KnowledgeEmbedding(
                business_id=business_id,
                content=content,
                vector_id=vector_id,
                meta_data=metadata or {}
            )
            db.add(knowledge)
            db.commit()
            db.refresh(knowledge)
            logger.info(f"Successfully added knowledge with ID {knowledge.id}")

            return knowledge
        except Exception as e:
            logger.error(f"Error adding knowledge: {str(e)}")
            db.rollback()
            raise HTTPException(status_code=500, detail=str(e))

    async def query_knowledge(self, business_id: str, query: str, limit: int = 5) -> List[Dict[str, Any]]:
        """Query the knowledge base"""
        logger.info(f"Querying knowledge base for business {business_id} with query: {query}")
        try:
            # Generate query embedding
            query_embedding = await self.create_embedding(query)

            # Search vector store
            results = await self.search_similar(query_embedding, limit)
            logger.info(f"Found {len(results)} results for query")

            return results
        except Exception as e:
            logger.error(f"Error querying knowledge: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))

# Initialize the RAG service
rag_service = RAGService()
