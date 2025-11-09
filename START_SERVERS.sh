#!/bin/bash

echo "🚀 Starting 237DOLLARS Platform..."
echo ""

# Start PostgreSQL
echo "1️⃣ Starting PostgreSQL..."
service postgresql start
sleep 2

# Start Backend
echo "2️⃣ Starting Backend (port 3000)..."
cd /home/user/237dollars/237dollars-backend
npm run start:dev > /tmp/backend.log 2>&1 &
BACKEND_PID=$!

# Start Frontend
echo "3️⃣ Starting Frontend (port 4200)..."
cd /home/user/237dollars/237dollars-frontend
npm run start > /tmp/frontend.log 2>&1 &
FRONTEND_PID=$!

echo ""
echo "⏳ Waiting for servers to start (30 seconds)..."
sleep 30

echo ""
echo "✅ SERVERS STARTED!"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📱 Frontend: http://localhost:4200"
echo "🔧 Backend:  http://localhost:3000/api"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🔐 ADMIN LOGIN:"
echo "   Email:    admin@237dollars.com"
echo "   Password: admin123"
echo ""
echo "📚 TEST REFERENCES (already created):"
echo "   Topic 1: http://localhost:4200/references/topics/1"
echo "   Topic 2: http://localhost:4200/references/topics/2"
echo "   Topic 3: http://localhost:4200/references/topics/3"
echo ""
echo "⚠️  NOTE: URL is /references/topics/3 (PLURAL 'topics')"
echo "    NOT /references/topic/3 (singular)"
echo ""
echo "📝 To view logs:"
echo "   Backend:  tail -f /tmp/backend.log"
echo "   Frontend: tail -f /tmp/frontend.log"
echo ""
echo "🛑 To stop servers:"
echo "   pkill -f 'nest start'"
echo "   pkill -f 'ng serve'"
echo ""
