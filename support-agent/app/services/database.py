import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.engine import URL
from dotenv import load_dotenv
from ..models.models import Base

load_dotenv()

# Get database URL and ensure it uses postgresql:// scheme
db_url = os.getenv("POSTGRES_URL", "")
if not db_url:
    raise ValueError("POSTGRES_URL environment variable is not set")

# Convert postgres:// to postgresql:// if needed
if db_url.startswith("postgres://"):
    db_url = "postgresql://" + db_url[len("postgres://"):]

# Create engine with explicit driver specification
engine = create_engine(
    db_url,
    pool_pre_ping=True,  # Enable connection health checks
    pool_size=5,         # Set connection pool size
    max_overflow=10      # Allow up to 10 connections beyond pool_size
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    Base.metadata.create_all(bind=engine)
