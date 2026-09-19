# ARCNAVE on Replit

## Run the app

The `Start application` workflow builds the React/Vite frontend, starts the existing FastAPI model service on port 8000, and serves the production frontend preview on port 5000.

```bash
npm run build
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000
```

The frontend uses `/api` by default. Vite proxies that path to the local FastAPI service, so no API URL is needed for the Replit preview.

## API configuration

To point the frontend at a separately hosted backend, set:

```bash
VITE_API_BASE_URL=https://your-backend.example.com
```

The value is read by `src/services/api.ts`; do not put a production URL directly in a component.

## Existing model

The frontend calls the existing `POST /predict` endpoint with the nine documented model features. The Random Forest file at `backend/exo_planet.pkl` is loaded as-is. The additional `GET /analytics` and `GET /candidates` endpoints only read the supplied CSV datasets for the explorer and analytics views.