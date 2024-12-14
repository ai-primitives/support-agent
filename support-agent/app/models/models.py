from datetime import datetime
import uuid
from sqlalchemy import Column, String, DateTime, JSON, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()

class BusinessProfile(Base):
    __tablename__ = "business_profiles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    settings = Column(JSON, nullable=False, default={})
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    personas = relationship("CustomerPersona", back_populates="business")
    conversations = relationship("Conversation", back_populates="business")
    embeddings = relationship("KnowledgeEmbedding", back_populates="business")

class CustomerPersona(Base):
    __tablename__ = "customer_personas"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    business_id = Column(UUID(as_uuid=True), ForeignKey("business_profiles.id"), nullable=False)
    name = Column(String, nullable=False)
    description = Column(String, nullable=False)
    settings = Column(JSON, nullable=False, default={})
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    business = relationship("BusinessProfile", back_populates="personas")
    conversations = relationship("Conversation", back_populates="persona")

class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    business_id = Column(UUID(as_uuid=True), ForeignKey("business_profiles.id"), nullable=False)
    persona_id = Column(UUID(as_uuid=True), ForeignKey("customer_personas.id"), nullable=False)
    channel = Column(String, nullable=False)  # email, slack, or chat
    meta_data = Column(JSON, nullable=False, default={})
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    business = relationship("BusinessProfile", back_populates="conversations")
    persona = relationship("CustomerPersona", back_populates="conversations")
    messages = relationship("Message", back_populates="conversation")

class Message(Base):
    __tablename__ = "messages"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    conversation_id = Column(UUID(as_uuid=True), ForeignKey("conversations.id"), nullable=False)
    role = Column(String, nullable=False)  # user or assistant
    content = Column(String, nullable=False)
    meta_data = Column(JSON, nullable=False, default={})
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    conversation = relationship("Conversation", back_populates="messages")

class KnowledgeEmbedding(Base):
    __tablename__ = "knowledge_embeddings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    business_id = Column(UUID(as_uuid=True), ForeignKey("business_profiles.id"), nullable=False)
    content = Column(String, nullable=False)
    meta_data = Column(JSON, nullable=False, default={})
    vector_id = Column(String, nullable=False)  # Reference to OpenAI embedding
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    business = relationship("BusinessProfile", back_populates="embeddings")
