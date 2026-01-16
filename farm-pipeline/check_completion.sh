#!/bin/bash

echo "🎯 Farm Description Workflow - Completion Check"
echo "=============================================="
echo "⏰ $(date)"
echo ""

# Run the monitoring script
python3 src/monitor_description_progress.py

echo ""
echo "💡 To check again in 10 minutes, run: ./check_completion.sh"
echo "💡 To apply descriptions when ready, run: python3 src/apply_descriptions.py"
echo "💡 Live site: https://farm-frontend-qfv7qde7w-abdur-rahman-morris-projects.vercel.app"
