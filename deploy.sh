#!/usr/bin/env bash
set -euo pipefail

# =============================================================================
# deploy.sh — Build and deploy with Docker Compose
# =============================================================================

ENV_FILE=".env.production"

# ── Validate env file ─────────────────────────────────────────
if [ ! -f "$ENV_FILE" ]; then
  echo "ERROR: $ENV_FILE not found."
  echo "Copy .env.production.example to .env.production and fill in your values."
  exit 1
fi

# Source env file so docker compose can interpolate build args
set -a
source "$ENV_FILE"
set +a

echo "Building images..."
docker compose build

echo "Starting services..."
docker compose up -d

# ── Health check ──────────────────────────────────────────────
echo "Waiting for backend to become healthy..."
MAX_WAIT=60
ELAPSED=0

while [ $ELAPSED -lt $MAX_WAIT ]; do
  STATUS=$(docker compose ps backend-api --format json 2>/dev/null | grep -o '"Health":"[^"]*"' | head -1 || true)
  if echo "$STATUS" | grep -q "healthy"; then
    echo "Backend is healthy!"
    break
  fi
  sleep 3
  ELAPSED=$((ELAPSED + 3))
  echo "  waiting... (${ELAPSED}s)"
done

if [ $ELAPSED -ge $MAX_WAIT ]; then
  echo "WARNING: Backend did not become healthy within ${MAX_WAIT}s"
  echo "Check logs: docker compose logs backend-api"
fi

# ── Summary ───────────────────────────────────────────────────
echo ""
echo "=== Deployment Summary ==="
docker compose ps
echo ""
echo "Health:   curl http://localhost/health"
echo "MCP:      curl -X POST http://localhost/mcp/universal"
echo "Frontend: http://localhost"
