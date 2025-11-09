#!/bin/bash
echo "Checking references in database..."
PGPASSWORD=ihave237dollars psql -U 237dollar -h localhost -d dataforapp -c "SELECT id, title, is_published, topic_id, created_at FROM \"references\" ORDER BY created_at DESC;"
