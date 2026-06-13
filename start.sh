#!/bin/bash

# Start Python FastAPI server in the background
echo "Starting Python AI Engine..."
python python_backend/main.py &

# Wait 2 seconds to ensure Python is up before Node connects
sleep 2

# Start Node.js backend in the foreground
echo "Starting Node.js Backend..."
cd server && node server.js
