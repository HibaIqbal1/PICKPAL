import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# Paste your copied Neon connection URL inside the quotes below:
SQLALCHEMY_DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://neondb_owner:npg_h2eoOCTZG1zw@ep-sweet-sunset-bdd0qhcy.c-8.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require",
)

# For network resilience against local DNS filters refusing .neon.tech resolution:
if "ep-sweet-sunset-bdd0qhcy" in SQLALCHEMY_DATABASE_URL and "hostaddr=" not in SQLALCHEMY_DATABASE_URL:
    delimiter = "&" if "?" in SQLALCHEMY_DATABASE_URL else "?"
    SQLALCHEMY_DATABASE_URL = f"{SQLALCHEMY_DATABASE_URL}{delimiter}hostaddr=3.142.41.151"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=300,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
