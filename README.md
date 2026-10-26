# 🏹 Project Eklavya — AI EdTech Platform

> **Indian Curriculum-Aligned 1-on-1 Academic AI Mentor with Vector RAG Grounding, Active-Recall Checkpoints, D3 Concept Maps, and Interactive Study Tools.**

[![Node.js](https://img.shields.io/badge/Node.js-22.x-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19-blue.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.x-38bdf8.svg)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## 📖 Table of Contents
1. [Overview](#-overview)
2. [Key Features](#-key-features)
3. [Architecture Overview](#-architecture-overview)
4. [Prerequisites](#-prerequisites)
5. [Setup & Installation](#-setup--installation)
6. [Environment Variables](#-environment-variables)
7. [Running the Application](#-running-the-application)
8. [API Endpoints Reference](#-api-endpoints-reference)
9. [Sample Data & Automated Testing](#-sample-data--automated-testing)
10. [Technical Design Document](#-technical-design-document)
11. [License](#-license)

---

## 🎯 Overview

Named after the legendary archer **Eklavya** from the Indian epic *Mahabharata*—who achieved supreme mastery through disciplined self-directed practice—**Project Eklavya** provides students under Indian educational boards (CBSE, ICSE, and State Boards) with an intelligent, highly personalized 1-on-1 academic tutor.

Rather than providing superficial answers that encourage rote memorization, Eklavya combines **Retrieval-Augmented Generation (RAG)** grounded in NCERT textbooks with **Cognitive Science principles**:
- **Active-Recall Checkpoints:** Enforces mental retrieval practice at the end of every conceptual explanation.
- **D3 Concept Mapping:** Visualizes inter-chapter prerequisite dependencies.
- **Spaced Repetition Flashcards & Adaptive Quizzes:** Locks learning into long-term memory.
- **Multilingual Support:** Switches smoothly between English, Hinglish, and Hindi.

---

## ✨ Key Features

- **🏹 Eklavya AI Mentor:** Natural language question-answering strictly grounded in official textbooks using Supabase pgvector search and Groq LPU high-speed inference (`llama-3.3-70b-versatile`).
- **🎯 Active-Recall Checkpoints:** Interactive self-test cards with expandable derivation solutions and +10 XP gamification rewards.
- **📚 Curriculum Vault:** PDF ingestion pipeline that extracts, semantically segments, and vectorizes classroom notes and textbooks.
- **🕸️ D3.js Force-Directed Concept Graph:** Interactive curriculum network linking chapters across Mathematics, Science, and Social Science.
- **⚡ 3D Flashcard Arena & Quiz Engine:** Dynamic generation of NCERT-aligned flashcards and board exam questions.
- **🎙️ Real-time Speech-to-Text & TTS:** Full voice interface for listening to mentor explanations and dictating questions.

---

## 🏗️ Architecture Overview

Project Eklavya operates as a unified full-stack application running on port `3000`:
- **Frontend SPA:** React 19, TypeScript, Tailwind CSS, Lucide icons, D3.js, Recharts, and Canvas Confetti.
- **Backend API:** Express server (`server.ts`) hosting API routes (`/api/*`) and mounting Vite middlewares in development.
- **Vector Database:** Supabase PostgreSQL with `pgvector` extension (384-dimensional dense vectors).
- **Inference Engine:** Dual-tier setup with primary Groq LLMs (`llama-3.3-70b-versatile`, `openai/gpt-oss-120b`) and Google Gemini backup (`gemini-3.8-flash`).
- **Embedding Tier:** Hugging Face Inference Router (`sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2`) with a deterministic, L2 unit-normalized local 384-d semantic fallback.

For comprehensive architectural diagrams and database schemas, see [TECHNICAL_DESIGN.md](TECHNICAL_DESIGN.md).

---

## 📋 Prerequisites

Before running the application, make sure you have:
- **Node.js:** v18.0.0 or later (Node 20+ recommended)
- **npm** or **bun** package manager
- *(Optional)* A free [Groq Cloud](https://console.groq.com) account for high-speed Llama 3 inference
- *(Optional)* A free [Supabase](https://supabase.com) project with pgvector enabled

---

## 🚀 Setup & Installation

### Step 1: Clone the repository
```bash
git clone https://github.com/your-username/project-eklavya.git
cd project-eklavya
```

### Step 2: Install dependencies
```bash
npm install
```

### Step 3: Configure Environment Variables
Copy the sample environment file:
```bash
cp .env.example .env
```
Open `.env` in your editor and configure the keys described in the section below.

---

## 🔑 Environment Variables

The project uses the following environment variables (stored in `.env`):

| Variable | Description | Example / Default | Required? |
|---|---|---|---|
| `OPENAI_API_KEY` | API Key for LLM inference (Groq or OpenAI) | `gsk_...` | **Yes** (or GEMINI_API_KEY) |
| `OPENAI_BASE_URL` | Base URL for LLM provider | `https://api.groq.com/openai/v1` | **Yes** (when using Groq) |
| `MODEL_RAG_TUTOR` | Default model alias for RAG tutoring | `llama-3.3-70b-versatile` | No (defaults to llama-3) |
| `SUPABASE_URL` | Supabase Cloud project URL | `https://xyzcompany.supabase.co` | Optional (falls back to memory) |
| `SUPABASE_KEY` | Supabase Service Role / Anon API Key | `eyJhbGciOi...` | Optional (falls back to memory) |
| `HF_TOKEN` | Hugging Face Inference API token | `hf_...` | Optional (falls back to local 384-d vectorizer) |
| `GEMINI_API_KEY` | Google Gemini API Key for secondary backup | `AIzaSy...` | Optional |
| `PORT` | Local server port | `3000` | No (defaults to 3000) |
| `VITE_API_BASE_URL` | Frontend API override URL | `""` (empty for same-origin) | No |

---

## 💻 Running the Application

### Development Mode (Full-Stack)
Starts the unified Express server with Vite middleware on port 3000:
```bash
npm run dev
```
Open your browser to: **`http://localhost:3000`**

### Production Build
Builds optimized production assets and bundles:
```bash
npm run build
npm start
```

### Code Quality & Type Checking
```bash
npm run lint
```

---

## 📡 API Endpoints Reference

All API routes are served under `/api`:

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Service health telemetry, database status, and LLM model info |
| `POST` | `/api/user/sync` | Syncs student profile, daily study streak, and XP points |
| `POST` | `/api/user/onboard` | Updates student board (CBSE/ICSE), grade, and enrolled subjects |
| `POST` | `/api/upload` | Ingests PDF file, extracts text, chunks, and vectorizes into Supabase |
| `GET` | `/api/documents/:userId` | Retrieves all cataloged documents in the student's vault |
| `PATCH` | `/api/documents/:docId` | Renames a custom document title in the vault |
| `POST` | `/api/query` | Executes RAG similarity search and generates mentor response with Active Recall |
| `POST` | `/api/study-tools` | Generates active-recall flashcards, chapter quizzes, or career pathways |

---

## 🧪 Sample Data & Automated Testing

The repository includes pre-built sample curriculum data, vector chunks, and benchmark test cases in [`SAMPLE_DATA.json`](SAMPLE_DATA.json).

### Run the Benchmark Test Suite:
```bash
npm test
# or
npm run test:curriculum
```

This automated runner (`tests/run_tests.ts`) executes:
1. **Health Telemetry Validation:** Confirms backend routes and database bindings.
2. **RAG Retrieval & Concept Benchmark:** Tests quadratic root derivation, ensuring the response strictly incorporates required mathematical formulas and includes the dedicated Active-Recall Checkpoint.
3. **Study Tools JSON Schema Validation:** Confirms AI study tools conform strictly to valid, parseable JSON schemas.

---

## 📄 Technical Design Document

For in-depth architectural diagrams, entity relationship diagrams (ERD), vector similarity formulas, and component lifecycles, please refer to the [Technical Design Document](TECHNICAL_DESIGN.md).

---

## ⚖️ License

Project Eklavya is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for complete details.
