#!/bin/bash
# Script de redémarrage des services BRVM-OS sur le VPS
# Usage: bash scripts/restart-services.sh

set -e

BACKEND_DIR="/data/brvm-os/backend"
FRONTEND_DIR="/data/brvm-os/frontend"
LOG_DIR="/tmp/brvmos-logs"
mkdir -p "$LOG_DIR"

echo "=== BRVM-OS — Redémarrage des services ==="

# PostgreSQL
if command -v pg_ctl &>/dev/null; then
    export PGDATA="${PGDATA:-/home/linuxbrew/.linuxbrew/var/postgresql@16}"
    if pg_ctl status -D "$PGDATA" 2>/dev/null | grep -q "server is running"; then
        echo "[OK] PostgreSQL already running"
    else
        pg_ctl start -D "$PGDATA" -l "$LOG_DIR/postgres.log" 2>/dev/null || echo "[WARN] PostgreSQL start failed"
    fi
fi

# Redis
if command -v redis-server &>/dev/null; then
    if ! pgrep -x redis-server &>/dev/null; then
        redis-server --daemonize yes --logfile "$LOG_DIR/redis.log"
        echo "[OK] Redis started"
    else
        echo "[OK] Redis already running"
    fi
fi

# Backend
echo "[Backend] Stopping old process..."
pkill -f "node.*3000" 2>/dev/null || true
sleep 1
echo "[Backend] Starting..."
cd "$BACKEND_DIR"
PORT=3000 nohup npm run start:prod > "$LOG_DIR/backend.log" 2>&1 &
BACKEND_PID=$!
echo "[OK] Backend started (PID $BACKEND_PID)"

# Frontend
echo "[Frontend] Stopping old process..."
pkill -f "node.*3003" 2>/dev/null || true
sleep 1
echo "[Frontend] Starting..."
cd "$FRONTEND_DIR"
PORT=3003 nohup npm run start > "$LOG_DIR/frontend.log" 2>&1 &
FRONTEND_PID=$!
echo "[OK] Frontend started (PID $FRONTEND_PID)"

sleep 5
# Health check
if curl -sf http://localhost:3000/api/health -o /dev/null; then
    echo "[OK] Backend health: 200"
else
    echo "[WARN] Backend not responding on port 3000"
fi

if curl -sf http://localhost:3003 -o /dev/null; then
    echo "[OK] Frontend health: 200"
else
    echo "[WARN] Frontend not responding on port 3003"
fi

echo "=== Redémarrage terminé ==="
