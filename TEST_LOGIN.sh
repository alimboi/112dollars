#!/bin/bash

echo "========================================="
echo "TESTING LOGIN - Admin123"
echo "========================================="

response=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@237dollars.com","password":"Admin123"}')

echo "$response" | python3 -m json.tool 2>/dev/null || echo "$response"

if echo "$response" | grep -q "accessToken"; then
    echo ""
    echo "========================================="
    echo "✅ LOGIN WORKS!"
    echo "========================================="
    echo "Email: admin@237dollars.com"
    echo "Password: Admin123"
    echo ""
    echo "Backend URL: http://localhost:3000"
    echo "Frontend URL: http://localhost:4200"
    echo ""
    echo "USE INCOGNITO MODE IN BROWSER!"
else
    echo ""
    echo "❌ LOGIN FAILED"
fi
