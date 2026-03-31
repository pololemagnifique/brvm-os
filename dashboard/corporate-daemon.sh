#!/bin/bash
# corporate-daemon.sh — runs scrape_corporate.py every Monday 08:00 UTC
# Persists as a background daemon, survives container restarts via the container itself

INTERVAL_SECS=604800  # 7 days
LOG="/data/brvm-os/dashboard/cron_corporate.log"
PIDFILE="/data/brvm-os/dashboard/corporate-daemon.pid"

# Already running?
if [ -f "$PIDFILE" ]; then
    OLD_PID=$(cat "$PIDFILE")
    if kill -0 "$OLD_PID" 2>/dev/null; then
        echo "$(date) Daemon already running as PID $OLD_PID" >> "$LOG"
        exit 0
    fi
fi

echo $$ > "$PIDFILE"
echo "$(date) BRVM Corporate Daemon started (PID $$)" >> "$LOG"

while true; do
    # Wait until next Monday 08:00 UTC
    NOW=$(date +u --utc)
    NEXT_MON=$(date -u -d "next monday 08:00" +%s 2>/dev/null || date -u -d "monday 08:00" +%s 2>/dev/null)
    NOW_SECS=$(date -u +%s)
    
    # If next Monday is less than 0 secs away, it's already Monday past 8am — wait a week
    if [ -z "$NEXT_MON" ] || [ "$NEXT_MON" -le "$NOW_SECS" ]; then
        NEXT_MON=$((NOW_SECS + 604800))
    fi
    
    SLEEP=$((NEXT_MON - NOW_SECS))
    echo "$(date) Next run in ${SLEEP}s (Monday 08:00 UTC)" >> "$LOG"
    sleep "$SLEEP"
    
    # Run
    echo "$(date) === Running corporate scrape ===" >> "$LOG"
    cd /data/brvm-os/dashboard
    python3 scrape_corporate.py >> "$LOG" 2>&1
    RESULT=$?
    
    if [ $RESULT -eq 0 ]; then
        echo "$(date) ✅ Scrape succeeded" >> "$LOG"
    else
        echo "$(date) ❌ Scrape failed (exit $RESULT)" >> "$LOG"
    fi
    
    # Small random jitter to avoid thundering herd on restarts
    JITTER=$((RANDOM % 3600))
    sleep $JITTER
done
