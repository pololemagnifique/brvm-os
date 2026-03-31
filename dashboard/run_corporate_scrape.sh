#!/bin/bash
# run_corporate_scrape.sh — BRVM Corporate Calendar Cron Wrapper
set -e

LOG="/data/brvm-os/dashboard/scrape_corporate.log"
DATE=$(date '+%Y-%m-%d %H:%M:%S')
echo "[$DATE] === Starting corporate scrape ===" >> "$LOG"

cd /data/brvm-os/dashboard
python3 scrape_corporate.py >> "$LOG" 2>&1
RESULT=$?

if [ $RESULT -eq 0 ]; then
    echo "[$DATE] ✅ Corporate scrape succeeded" >> "$LOG"
else
    echo "[$DATE] ❌ Corporate scrape failed (exit $RESULT)" >> "$LOG"
fi

echo "[$DATE] === Done ===" >> "$LOG"
