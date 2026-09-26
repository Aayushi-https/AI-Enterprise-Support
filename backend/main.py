import json
import ollama
import os
import numpy as np
import bcrypt

from jose import jwt
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from pypdf import PdfReader
from docx import Document

from openai import OpenAI
from dotenv import load_dotenv
from sentence_transformers import SentenceTransformer

from database import engine, Base, SessionLocal
from models import Ticket, DocumentChunk, Team, Settings, User

SECRET_KEY = "aayushi-super-secret-key"
ALGORITHM = "HS256"

Base.metadata.create_all(bind=engine)

load_dotenv()

client = OpenAI(
    api_key=os.getenv("OPENAI_API_KEY")
)

embedding_model = SentenceTransformer(
    "all-MiniLM-L6-v2"
)

knowledge_base = []

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def extract_pdf_text(file_path):

    reader = PdfReader(file_path)

    text = ""

    for page in reader.pages:

        text += page.extract_text() or ""

    return text


def extract_docx_text(file_path):

    document = Document(file_path)

    text = ""

    for paragraph in document.paragraphs:

        text += paragraph.text + "\n"

    return text


def chunk_text(text, chunk_size=500):

    chunks = []

    for i in range(0, len(text), chunk_size):

        chunk = text[i:i + chunk_size]

        chunks.append(chunk)

    return chunks

def create_embeddings(chunks):

    embeddings = embedding_model.encode(chunks)

    return embeddings

def cosine_similarity(vector1, vector2):

    return np.dot(vector1, vector2) / (
        np.linalg.norm(vector1)
        * np.linalg.norm(vector2)
    )

@app.get("/")
def root():

    return {
        "message": "AI Support Platform API is running"
    }

@app.get("/documents")
def get_documents():

    os.makedirs("uploads", exist_ok=True)

    files = os.listdir("uploads")

    documents = []

    for index, filename in enumerate(files):

        documents.append({
            "id": index + 1,
            "name": filename
        })

    return {
        "documents": documents
    }

@app.post("/documents/upload")
async def upload_document(
    file: UploadFile = File(...)
):

    allowed_types = [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ]

    if file.content_type not in allowed_types:

        raise HTTPException(
            status_code=400,
            detail="Only PDF and DOCX files are allowed"
        )

    # Create folders
    os.makedirs("uploads", exist_ok=True)
    os.makedirs("extracted_text", exist_ok=True)

    # Save uploaded file
    file_path = f"uploads/{file.filename}"

    with open(file_path, "wb") as buffer:
        buffer.write(await file.read())

    # -----------------------------------------------------
    # PDF
    # -----------------------------------------------------

    if file.content_type == "application/pdf":

        # Extract text
        text = extract_pdf_text(file_path)

        # Create chunks
        chunks = chunk_text(text)

        # Create embeddings
        embeddings = create_embeddings(chunks)

        # Store chunks and embeddings in PostgreSQL
        db = SessionLocal()

        for chunk, embedding in zip(chunks, embeddings):

            db_chunk = DocumentChunk(
                text=chunk,
                embedding=json.dumps(embedding.tolist())
            )

            db.add(db_chunk)

        db.commit()
        db.close()

        # Print information
        print(
            "Total chunks:",
            len(chunks)
        )

        print(
            "Number of embeddings:",
            len(embeddings)
        )

        print(
            "Embedding size:",
            len(embeddings[0])
            if len(embeddings) > 0
            else 0
        )

        print(
            "First chunk:",
            chunks[0]
            if chunks
            else "No text found"
        )

        # Save extracted text
        text_file_path = (
            f"extracted_text/{file.filename}.txt"
        )

        with open(
            text_file_path,
            "w",
            encoding="utf-8"
        ) as text_file:

            text_file.write(text)

    # -----------------------------------------------------
    # DOCX
    # -----------------------------------------------------

    if (
        file.content_type
        == "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ):

        # Extract text
        text = extract_docx_text(file_path)

        # Create chunks
        chunks = chunk_text(text)

        # Create embeddings
        embeddings = create_embeddings(chunks)

        # Store chunks and embeddings in PostgreSQL
        db = SessionLocal()

        for chunk, embedding in zip(chunks, embeddings):

            db_chunk = DocumentChunk(
                text=chunk,
                embedding=json.dumps(embedding.tolist())
            )

            db.add(db_chunk)

        db.commit()
        db.close()

        # Print information
        print(
            "Total chunks:",
            len(chunks)
        )

        print(
            "Number of embeddings:",
            len(embeddings)
        )

        print(
            "Embedding size:",
            len(embeddings[0])
            if len(embeddings) > 0
            else 0
        )

        print(
            "First chunk:",
            chunks[0]
            if chunks
            else "No text found"
        )

        # Save extracted text
        text_file_path = (
            f"extracted_text/{file.filename}.txt"
        )

        with open(
            text_file_path,
            "w",
            encoding="utf-8"
        ) as text_file:

            text_file.write(text)

    # -----------------------------------------------------
    # Response
    # -----------------------------------------------------

    return {
        "message": "Document Uploaded Successfully",
        "filename": file.filename
    }

# =========================================================
# Knowledge base
# =========================================================

@app.get("/knowledge-base")
def get_knowledge_base():

    return {
        "number_of_chunks": len(knowledge_base),

        "chunks": [
            item["text"]
            for item in knowledge_base
        ]
    }


# =========================================================
# Similarity search
# =========================================================

@app.get("/search")
def search_documents(query: str):

    query_embedding = embedding_model.encode(query)

    results = []

    for item in knowledge_base:

        similarity = cosine_similarity(
            query_embedding,
            item["embedding"]
        )

        results.append({
            "text": item["text"],
            "similarity": float(similarity)
        })

    results.sort(
        key=lambda x: x["similarity"],
        reverse=True
    )

    return {
        "query": query,
        "results": results[:3]
    }

@app.get("/test-ollama")
def test_ollama():

    response = ollama.chat(
        model="llama3.2:3b",
        messages=[
            {
                "role": "user",
                "content": "Explain sustainable development in one sentence."
            }
        ]
    )

    return {
        "message": response["message"]["content"]
    }

@app.get("/ask")
def ask_question(query: str):
    db = SessionLocal()

    chunks = db.query(DocumentChunk).all()

    db.close()

    if not chunks:
        return {
            "question": query,
            "answer": "No documents are available.",
            "sources": []
        }

    query_embedding = embedding_model.encode(query)

    results = []

    for chunk in chunks:
        stored_embedding = np.array(
            json.loads(chunk.embedding)
        )

        similarity = cosine_similarity(
            query_embedding,
            stored_embedding
        )

        results.append({
            "text": chunk.text,
            "similarity": float(similarity)
        })

    results.sort(
        key=lambda x: x["similarity"],
        reverse=True
    )

    top_results = results[:3]

    context = "\n\n".join(
        item["text"] for item in top_results
    )

    prompt = f"""
You are an enterprise support assistant.

Answer the user's question using ONLY the information
provided in the context below.

If the answer cannot be found in the context,
say that the information is not available in the documents.

Context:
{context}

User Question:
{query}
"""

    response = ollama.chat(
        model="llama3.2:3b",
        messages=[
            {
                "role": "user",
                "content": prompt
            }
        ]
    )

    return {
        "question": query,
        "answer": response["message"]["content"],
        "sources": top_results
    }  
# =========================================================
# Test OpenAI connection
# =========================================================

@app.get("/test-openai")
def test_openai():

    response = client.models.list()

    return {
        "message": "OpenAI Connection Successful"
    }


# =========================================================
# Test local embeddings
# =========================================================

@app.get("/test-embedding")
def test_embedding():

    chunks = [
        "Our company provides technical support.",
        "Customers can contact support through email.",
        "Technical issues are handled by the support team."
    ]

    embeddings = create_embeddings(
        chunks
    )

    return {
        "message": "Embeddings created successfully",
        "number_of_chunks": len(embeddings),
        "vector_length": len(embeddings[0])
    }

tickets = []


# CREATE TICKET
@app.post("/tickets")
def create_ticket(ticket: dict):
    db = SessionLocal()

    new_ticket = Ticket(
        title=ticket.get("title"),
        description=ticket.get("description"),
        priority=ticket.get("priority", "Medium"),
        status="Open",
    )

    db.add(new_ticket)
    db.commit()
    db.refresh(new_ticket)

    db.close()

    return {
        "message": "Ticket created successfully",
        "ticket": {
            "id": new_ticket.id,
            "title": new_ticket.title,
            "description": new_ticket.description,
            "priority": new_ticket.priority,
            "status": new_ticket.status,
        }
    }


# GET ALL TICKETS
@app.get("/tickets")
def get_tickets():
    db = SessionLocal()

    tickets = db.query(Ticket).all()

    db.close()

    return {
        "tickets": [
            {
                "id": ticket.id,
                "title": ticket.title,
                "description": ticket.description,
                "priority": ticket.priority,
                "status": ticket.status,
                "assigned_team": ticket.assigned_team,
            }
            for ticket in tickets
        ]
    }


@app.put("/tickets/{ticket_id}/status")
def update_ticket_status(ticket_id: int, status: str):
    db = SessionLocal()

    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()

    if not ticket:
        db.close()
        return {"error": "Ticket not found"}

    ticket.status = status

    db.commit()
    db.refresh(ticket)
    db.close()

    return {
        "message": "Ticket status updated successfully",
        "ticket": {
            "id": ticket.id,
            "title": ticket.title,
            "status": ticket.status,
        }
    }

# ANALYZE TICKET WITH AI
@app.post("/tickets/analyze")
def analyze_ticket(ticket: dict):

    prompt = f"""
You are an enterprise IT support assistant.

Analyze the following support ticket.

Ticket Title:
{ticket.get("title")}

Ticket Description:
{ticket.get("description")}

User Selected Priority:
{ticket.get("priority")}

Important:
The user selected the priority.
Do NOT change the priority.
Return exactly the user's selected priority.

Return ONLY valid JSON.

Use exactly these fields:

{{
    "summary": "short summary of the issue",
    "category": "category of the issue",
    "priority": "{ticket.get("priority")}",
    "team": "team that should handle the issue",
    "suggested_response": "professional response to the user"
}}
"""

    # Send ticket to Ollama
    response = ollama.chat(
        model="llama3.2:3b",
        format="json",
        messages=[
            {
                "role": "user",
                "content": prompt
            }
        ]
    )

    # Get AI response
    raw_analysis = response["message"]["content"]

    # Convert JSON string into Python dictionary
    try:
        analysis = json.loads(raw_analysis)

    except json.JSONDecodeError:
        return {
            "error": "AI returned invalid JSON",
            "raw_response": raw_analysis
        }

    # Find the ticket in PostgreSQL
    db = SessionLocal()

    existing_ticket = (
        db.query(Ticket)
        .filter(Ticket.id == ticket.get("id"))
        .first()
    )

    if not existing_ticket:
        db.close()

        raise HTTPException(
            status_code=404,
            detail="Ticket not found"
        )

    # Save AI analysis as JSON text
    existing_ticket.ai_analysis = json.dumps(analysis)

    db.commit()
    db.refresh(existing_ticket)

    db.close()

    return {
        "message": "Ticket analyzed successfully",
        "analysis": analysis,
        "ticket": {
            "id": existing_ticket.id,
            "title": existing_ticket.title,
            "description": existing_ticket.description,
            "priority": existing_ticket.priority,
            "status": existing_ticket.status,
            "ai_analysis": analysis
        }
    }


@app.get("/teams")
def get_teams():
    db = SessionLocal()

    teams = db.query(Team).all()

    db.close()

    return {
        "teams": [
            {
                "id": team.id,
                "name": team.name,
                "description": team.description,
                "members": team.members,
            }
            for team in teams
        ]
    }


@app.post("/teams")
def create_team(team: dict):
    db = SessionLocal()

    new_team = Team(
        name=team.get("name"),
        description=team.get("description"),
        members=team.get("members", 0),
    )

    db.add(new_team)
    db.commit()
    db.refresh(new_team)
    db.close()

    return {
        "message": "Team created successfully",
        "team": {
            "id": new_team.id,
            "name": new_team.name,
            "description": new_team.description,
            "members": new_team.members,
        }
    }


@app.get("/settings")
def get_settings():
    db = SessionLocal()

    settings = db.query(Settings).first()

    if not settings:
        settings = Settings(
            name="",
            email="",
            notifications=1,
            ai_enabled=1
        )

        db.add(settings)
        db.commit()
        db.refresh(settings)

    db.close()

    return {
        "settings": {
            "id": settings.id,
            "name": settings.name,
            "email": settings.email,
            "notifications": bool(settings.notifications),
            "ai_enabled": bool(settings.ai_enabled),
        }
    }

@app.put("/settings")
def update_settings(settings: dict):
    db = SessionLocal()

    existing_settings = db.query(Settings).first()

    if not existing_settings:
        existing_settings = Settings()
        db.add(existing_settings)

    existing_settings.name = settings.get("name", "")
    existing_settings.email = settings.get("email", "")
    existing_settings.notifications = int(
        settings.get("notifications", True)
    )
    existing_settings.ai_enabled = int(
        settings.get("ai_enabled", True)
    )

    db.commit()
    db.refresh(existing_settings)
    db.close()

    return {
        "message": "Settings updated successfully",
        "settings": {
            "id": existing_settings.id,
            "name": existing_settings.name,
            "email": existing_settings.email,
            "notifications": bool(existing_settings.notifications),
            "ai_enabled": bool(existing_settings.ai_enabled),
        }
    }

@app.get("/dashboard")
def get_dashboard(token: str):

    user_id = get_current_user(token)
    
    db = SessionLocal()

    total_tickets = db.query(Ticket).count()

    open_tickets = (
        db.query(Ticket)
        .filter(Ticket.status == "Open")
        .count()
    )

    resolved_tickets = (
        db.query(Ticket)
        .filter(Ticket.status == "Resolved")
        .count()
    )

    db.close()

    return {
        "total_tickets": total_tickets,
        "open_tickets": open_tickets,
        "resolved_tickets": resolved_tickets
    }


@app.post("/register")
def register_user(user: dict):

    db = SessionLocal()

    existing_user = (
        db.query(User)
        .filter(User.email == user.get("email"))
        .first()
    )

    if existing_user:
        db.close()
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    hashed_password = bcrypt.hashpw(
    user.get("password").encode("utf-8"),
    bcrypt.gensalt()
).decode("utf-8")

    new_user = User(
        name=user.get("name"),
        email=user.get("email"),
        password=hashed_password
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    db.close()

    return {
        "message": "User registered successfully",
        "user": {
            "id": new_user.id,
            "name": new_user.name,
            "email": new_user.email
        }
    }

@app.post("/login")
def login_user(user: dict):

    db = SessionLocal()

    existing_user = (
        db.query(User)
        .filter(User.email == user.get("email"))
        .first()
    )

    if not existing_user:
        db.close()
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    password_valid = bcrypt.checkpw(
        user.get("password").encode("utf-8"),
        existing_user.password.encode("utf-8")
    )

    if not password_valid:
        db.close()
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    db.close()

    token_data = {
        "user_id": existing_user.id,
        "email": existing_user.email
    }

    token = jwt.encode(
        token_data,
        SECRET_KEY,
        algorithm=ALGORITHM
    )

    return {
        "message": "Login successful",
        "token": token,
        "user": {
            "id": existing_user.id,
            "name": existing_user.name,
            "email": existing_user.email
        }
    }

def get_current_user(token: str):

    try:
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        user_id = payload.get("user_id")

        if user_id is None:
            raise HTTPException(
                status_code=401,
                detail="Invalid token"
            )

        return user_id

    except Exception:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token"
        )

@app.get("/test-auth")
def test_auth(token: str):

    user_id = get_current_user(token)

    return {
        "message": "Authentication successful",
        "user_id": user_id
    }