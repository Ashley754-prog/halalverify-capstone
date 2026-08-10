# HalalVerify Capstone Project

HalalVerify is a web-based Progressive Web Application for halal product label verification and halal certificate authentication using a computer vision workflow.

## Current Project Status

The frontend is already built as a polished demo interface with:
- a login and authentication flow
- a scanner screen for label and certificate analysis
- a local registry view for additives and establishments
- a scan history table and issue reporting flow
- PWA support through manifest and service worker files

The project now also includes a lightweight backend API skeleton for future integration with real computer vision models.

## Project Structure

- frontend/: React + Vite frontend for the PWA
- backend/: FastAPI backend for analysis endpoints and future model integration

## Run the App

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

## Notes for the Capstone

To align the project with your proposal, the next strongest improvements would be:
- replace the simulated analysis with a real OCR/object-detection pipeline
- connect the UI to live backend responses instead of relying purely on fallback data
- add a proper local database or Supabase integration for certified establishments and additives
- prepare evaluation metrics and screenshots for the thesis manuscript


frontend/.env.example
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_API_BASE_URL=http://127.0.0.1:8000

backend/.env.example
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here