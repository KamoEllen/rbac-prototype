#!/bin/bash

echo " Debugging Authentication Flow"
echo "================================"
echo ""

rm -f cookies.txt

echo "1️ Requesting passwordless link..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@acme.com"}')

echo "Login Response:"
echo $LOGIN_RESPONSE | jq '.'
echo ""

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.token')
echo "Extracted Token: $TOKEN"
echo ""

echo "2️ Verifying token (verbose)..."
curl -v -X POST http://localhost:3000/auth/verify \
  -H "Content-Type: application/json" \
  -d "{\"token\": \"$TOKEN\"}" \
  -c cookies.txt 2>&1 | tee verify-output.txt

echo ""
echo "3️ Cookie file contents:"
cat cookies.txt
echo ""

SESSION_TOKEN=$(grep -oP 'session\s+\K[^\s]+' cookies.txt 2>/dev/null || echo "")
echo "Session token from file: $SESSION_TOKEN"
echo ""

echo "4️ Testing /auth/me with cookie..."
echo "Request:"
curl -v http://localhost:3000/auth/me -b cookies.txt 2>&1 | grep -E "(> |< |Cookie:)"
echo ""
echo "Response:"
curl -s http://localhost:3000/auth/me -b cookies.txt | jq '.'
echo ""

if [ ! -z "$SESSION_TOKEN" ]; then
  echo "5️ Testing /auth/me with Authorization header..."
  curl -s http://localhost:3000/auth/me \
    -H "Authorization: Bearer $SESSION_TOKEN" | jq '.'
  echo ""
fi

echo "6️ Checking sessions in database..."
echo "Run this in psql:"
echo "  SELECT token, user_id, expires_at FROM sessions ORDER BY created_at DESC LIMIT 5;"
echo ""

echo " Debug complete. Check verify-output.txt for full details."
