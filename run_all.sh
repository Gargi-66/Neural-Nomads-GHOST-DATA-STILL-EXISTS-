#!/usr/bin/env bash
set -e

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$REPO_ROOT"

echo "👻 Starting AEGIS 3.1 Services..."

# 1. Kill stale processes on target ports if needed
lsof -ti :8000 | xargs kill -9 2>/dev/null || true
lsof -ti :6969 | xargs kill -9 2>/dev/null || true
lsof -ti :8501 | xargs kill -9 2>/dev/null || true

# 2. Start FastAPI Backend (Port 8000)
echo "🚀 Starting FastAPI on http://localhost:8000..."
PYTHONPATH=.:code:code/api python3 -m uvicorn api.app:app --host 0.0.0.0 --port 8000 --reload > /tmp/aegis_fastapi.log 2>&1 &
FASTAPI_PID=$!

# 3. Start React 19 Frontend Console (Port 6969)
echo "⚛️ Starting Web Console on http://localhost:6969..."
(cd web && npm run dev -- --port 6969 --host 0.0.0.0) > /tmp/aegis_web.log 2>&1 &
WEB_PID=$!

# 4. Start Streamlit Warehouse Dashboard (Port 8501)
echo "📊 Starting Streamlit Dashboard on http://localhost:8501..."
python3 -m streamlit run app/app.py --server.port 8501 --server.headless true > /tmp/aegis_streamlit.log 2>&1 &
STREAMLIT_PID=$!

sleep 2

echo "✅ All services running!"
echo "--------------------------------------------------------"
echo "🌐 Web Console:       http://localhost:6969"
echo "🔌 FastAPI Backend:   http://localhost:8000 (Docs: http://localhost:8000/docs)"
echo "📊 Streamlit Hub:     http://localhost:8501"
echo "--------------------------------------------------------"
echo "Logs available at:"
echo "  - /tmp/aegis_fastapi.log"
echo "  - /tmp/aegis_web.log"
echo "  - /tmp/aegis_streamlit.log"
echo "Press Ctrl+C to stop all services."

trap "kill $FASTAPI_PID $WEB_PID $STREAMLIT_PID 2>/dev/null || true; exit" INT TERM
wait

