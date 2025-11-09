#!/bin/bash

echo "========================================="
echo "DATABASE DEBUG INFO"
echo "========================================="
echo ""

echo "1. YOUR POSTGRES CONNECTION:"
PGPASSWORD=ihave237dollars psql -U 237dollar -h localhost -d dataforapp -c "SELECT current_database(), current_user, COUNT(*) as ref_count FROM \"references\";"

echo ""
echo "2. YOUR REFERENCES:"
PGPASSWORD=ihave237dollars psql -U 237dollar -h localhost -d dataforapp -c "SELECT id, title, is_published FROM \"references\" ORDER BY id;"

echo ""
echo "3. BACKEND API RESPONSE:"
curl -s http://localhost:3000/api/references/topics/3 | python3 -c "import sys, json; d=json.load(sys.stdin); print(f'Found {len(d.get(\"references\", []))} references'); [print(f'  ID {r[\"id\"]}: {r[\"title\"]}') for r in d.get('references', [])]"

echo ""
echo "========================================="
