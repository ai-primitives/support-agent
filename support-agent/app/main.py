from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Dict, Any
import uuid

from .services.database import get_db, init_db
from .services.rag import rag_service
from .models.models import BusinessProfile, CustomerPersona, Conversation, Message, KnowledgeEmbedding
from .schemas import (
    BusinessProfileCreate, BusinessProfile as BusinessProfileSchema,
    CustomerPersonaCreate, CustomerPersona as CustomerPersonaSchema,
    ConversationCreate, Conversation as ConversationSchema,
    MessageCreate, Message as MessageSchema,
    KnowledgeEmbeddingCreate, KnowledgeEmbedding as KnowledgeEmbeddingSchema
)

app = FastAPI(title="Support Agent API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    init_db()

@app.get("/healthz")
async def healthz():
    return {"status": "ok"}

@app.post("/api/businesses", response_model=BusinessProfileSchema)
async def create_business(business: BusinessProfileCreate, db: Session = Depends(get_db)):
    db_business = BusinessProfile(**business.model_dump())
    db.add(db_business)
    db.commit()
    db.refresh(db_business)
    return db_business

@app.post("/api/businesses/{business_id}/personas", response_model=CustomerPersonaSchema)
async def create_persona(
    business_id: uuid.UUID,
    persona: CustomerPersonaCreate,
    db: Session = Depends(get_db)
):
    db_persona = CustomerPersona(**persona.model_dump(), business_id=business_id)
    db.add(db_persona)
    db.commit()
    db.refresh(db_persona)
    return db_persona

@app.post("/api/conversations", response_model=ConversationSchema)
async def create_conversation(
    conversation: ConversationCreate,
    db: Session = Depends(get_db)
):
    db_conversation = Conversation(**conversation.model_dump())
    db.add(db_conversation)
    db.commit()
    db.refresh(db_conversation)
    return db_conversation

@app.post("/api/conversations/{conversation_id}/messages", response_model=MessageSchema)
async def create_message(
    conversation_id: uuid.UUID,
    message: MessageCreate,
    db: Session = Depends(get_db)
):
    db_message = Message(**message.model_dump(), conversation_id=conversation_id)
    db.add(db_message)
    db.commit()
    db.refresh(db_message)
    return db_message

@app.get("/api/conversations/{conversation_id}/messages", response_model=List[MessageSchema])
async def get_conversation_messages(
    conversation_id: uuid.UUID,
    db: Session = Depends(get_db)
):
    messages = db.query(Message).filter(
        Message.conversation_id == conversation_id
    ).order_by(Message.created_at.asc()).all()
    return messages

@app.post("/api/businesses/{business_id}/knowledge", response_model=KnowledgeEmbeddingSchema)
async def add_knowledge(
    business_id: uuid.UUID,
    knowledge: KnowledgeEmbeddingCreate,
    db: Session = Depends(get_db)
):
    return await rag_service.add_knowledge(db, str(business_id), knowledge.content, knowledge.meta_data)

@app.get("/api/businesses/{business_id}/knowledge/search")
async def search_knowledge(
    business_id: uuid.UUID,
    query: str,
    limit: int = 5,
    db: Session = Depends(get_db)
):
    results = await rag_service.query_knowledge(str(business_id), query, limit)
    return {"results": results}
