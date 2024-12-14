from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, UUID4

class BusinessProfileBase(BaseModel):
    name: str
    settings: dict = {}

class BusinessProfileCreate(BusinessProfileBase):
    pass

class BusinessProfile(BusinessProfileBase):
    id: UUID4
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class CustomerPersonaBase(BaseModel):
    name: str
    description: str
    settings: dict = {}

class CustomerPersonaCreate(CustomerPersonaBase):
    pass

class CustomerPersona(CustomerPersonaBase):
    id: UUID4
    business_id: UUID4
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ConversationBase(BaseModel):
    channel: str
    meta_data: dict = {}

class ConversationCreate(ConversationBase):
    business_id: UUID4
    persona_id: UUID4

class Conversation(ConversationBase):
    id: UUID4
    business_id: UUID4
    persona_id: UUID4
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class MessageBase(BaseModel):
    role: str
    content: str
    meta_data: dict = {}

class MessageCreate(MessageBase):
    pass

class Message(MessageBase):
    id: UUID4
    conversation_id: UUID4
    created_at: datetime

    class Config:
        from_attributes = True

class KnowledgeEmbeddingBase(BaseModel):
    content: str
    meta_data: dict = {}
    vector_id: str

class KnowledgeEmbeddingCreate(KnowledgeEmbeddingBase):
    pass

class KnowledgeEmbedding(KnowledgeEmbeddingBase):
    id: UUID4
    business_id: UUID4
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
