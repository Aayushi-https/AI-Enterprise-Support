# AI Enterprise Support Platform

An AI-powered enterprise support platform that combines support ticket management with document-based AI assistance.

Users can create support tickets, analyze issues with AI, upload company documents, and ask questions based on the uploaded knowledge base.

## Features

- User registration and JWT-based authentication
- Support ticket creation and management
- Ticket status tracking
- AI-powered ticket analysis
- PDF and DOCX document upload
- Retrieval-Augmented Generation (RAG)
- Semantic document search using embeddings
- AI-powered document question answering
- Source-based answers from uploaded documents
- Support team management
- User settings and preferences
- Support dashboard with ticket statistics

## Architecture

```text
                    ┌─────────────────────┐
                    │     React.js UI     │
                    │      + Vite         │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │      FastAPI        │
                    │      Backend        │
                    └───────┬─────┬───────┘
                            │     │
                ┌───────────┘     └────────────┐
                ▼                              ▼
       ┌─────────────────┐            ┌─────────────────┐
       │   PostgreSQL    │            │   Ollama LLM    │
       │                 │            │   Llama 3.2     │
       │ Tickets         │            └─────────────────┘
       │ Users           │
       │ Teams           │
       │ Document chunks │
       │ Embeddings      │
       └─────────────────┘
