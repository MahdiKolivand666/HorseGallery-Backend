#!/bin/bash

# Kill all processes on port 4001
echo "🔍 Checking for processes on port 4001..."
PIDS=$(lsof -ti:4001 2>/dev/null)

if [ -z "$PIDS" ]; then
  echo "✅ No processes found on port 4001"
else
  echo "🛑 Killing processes on port 4001: $PIDS"
  kill -9 $PIDS 2>/dev/null
  sleep 2
fi

# Kill all node/nest processes related to this project
echo "🔍 Checking for node/nest processes..."
NODE_PIDS=$(ps aux | grep -E "nest start|node.*nest" | grep -v grep | awk '{print $2}')

if [ ! -z "$NODE_PIDS" ]; then
  echo "🛑 Killing node/nest processes: $NODE_PIDS"
  kill -9 $NODE_PIDS 2>/dev/null
  sleep 2
fi

# Wait a bit for ports to be released
sleep 1

# Start the server
echo "🚀 Starting server on port 4001..."
cd /Users/mahdi/WebSiteFree/horsegallery/horse-gallery-backend
npm run start:dev
