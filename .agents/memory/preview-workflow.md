---
name: Preview workflow
description: Environment-specific ordering for the ARCNAVE multi-service preview.
---

The ARCNAVE preview should build the frontend, start FastAPI on port 8000, wait briefly for model startup, and then serve the Vite production preview on port 5000.

**Why:** Starting the preview server before FastAPI makes the first analytics and candidate requests fail while the model loads, and the development HMR client was unstable in the preview harness.

**How to apply:** Keep the workflow as one webview process with FastAPI in the background, include a short startup wait, and use the production Vite preview for the visible app.