#!/bin/sh
set -e

mkdir -p /app/data

if [ ! -f /app/data/db.sqlite3 ] && [ -f /app/db.sqlite3 ]; then
    cp /app/db.sqlite3 /app/data/db.sqlite3
fi

ln -sf /app/data/db.sqlite3 /app/db.sqlite3

if [ "$1" = "web" ]; then
    python3 manage.py migrate --noinput
    python3 manage.py collectstatic --noinput
    exec daphne -b 0.0.0.0 -p 8000 config.asgi:application
fi

if [ "$1" = "worker" ]; then
    python3 manage.py migrate --noinput
    exec celery -A config worker -l info
fi

if [ "$1" = "beat" ]; then
    python3 manage.py migrate --noinput
    exec celery -A config beat -l info
fi

exec "$@"
