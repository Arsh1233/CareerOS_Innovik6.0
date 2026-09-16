<div align="center">
  <img src="https://img.shields.io/badge/CareerOS-RuBI-6E72E8?style=for-the-badge&logo=react&logoColor=white" alt="CareerOS RuBI Logo" />
  <h1 align="center">CareerOS RuBI</h1>
  <p align="center">
    <strong>The next-generation, AI-driven career operating system bridging Students, Colleges, and Recruiters.</strong>
  </p>
</div>

---

## 🌟 Overview

CareerOS RuBI is a comprehensive platform designed to streamline the transition from education to employment. By providing specialized interfaces for **Students**, **Colleges**, and **Recruiters**, it leverages modern AI and robust analytics to match the right talent with the right opportunities.

### Key Features

*   🎓 **Student Hub**: Personalized career roadmaps, AI-driven mock interviews (voice & text), resume building, and intelligent job matching.
*   🏫 **College Dashboard**: High-level analytics on student placement readiness, skill gap heatmaps across departments, and recruiter engagement tracking.
*   🏢 **Recruiter Portal**: Streamlined applicant tracking, AI-powered candidate match scoring, talent pool pipelines, and live job posting management.
*   ⚡ **Real-time Analytics**: Instant insights powered by Supabase and PostgREST.

---

## 🏗️ Architecture & Tech Stack

CareerOS RuBI is built with a modern, scalable architecture:

### Frontend
*   **Framework**: [React 18](https://react.dev/) + [Vite](https://vitejs.dev/)
*   **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
*   **Icons & Components**: [Lucide React](https://lucide.dev/), [Recharts](https://recharts.org/)
*   **Routing**: React Router
*   **Language**: TypeScript

### Backend
*   **Framework**: [FastAPI](https://fastapi.tiangolo.com/) (Python)
*   **Database & Auth**: [Supabase](https://supabase.com/) (PostgreSQL + PostgREST)
*   **AI Integrations**: Gemini, Groq, Llama, ElevenLabs (Voice)
*   **Vector DB**: Qdrant (for semantic search & matching)

---

## 🚀 Getting Started

### Prerequisites
*   Node.js (v18+)
*   Python (3.10+)
*   Supabase project & API keys

### 1. Clone the repository
```bash
git clone https://github.com/your-org/CareerOS-RuBI.git
cd CareerOS-RuBI
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
*The frontend will start on `http://localhost:8443`*

### 3. Backend Setup
```bash
cd backend
python -m venv .venv
source .venv/Scripts/activate  # (On Windows)
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
*The API will be available at `http://localhost:8000`*

---

## 📁 Project Structure

```text
CareerOS-RuBI/
├── frontend/
│   ├── src/
│   │   ├── components/    # Reusable UI components (AppShell, etc.)
│   │   ├── pages/         # Route-level views (Student, College, Recruiter)
│   │   ├── lib/           # API clients & utilities
│   │   └── context/       # Auth & Toast providers
│   └── vite.config.ts
│
└── backend/
    ├── app/
    │   ├── api/           # FastAPI routers (v1 endpoints)
    │   ├── services/      # Business logic (Analytics, Chat, Jobs)
    │   ├── repositories/  # Database access layer
    │   └── integrations/  # External APIs (LLMs, Supabase, Qdrant)
    └── scripts/           # DB Migrations and seeding scripts
```

---

## 🔒 Security & Roles

CareerOS RuBI enforces strict Role-Based Access Control (RBAC):
*   `student`: Access to learning, jobs, and mock interviews.
*   `college`: Access to aggregate student analytics and department metrics.
*   `recruiter`: Access to job postings and candidate pipelines.
*   `admin`: Superuser access to platform-wide telemetry.

---

<div align="center">
  <i>Built with ❤️ for the future of work.</i>
</div>
