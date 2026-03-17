#!/bin/sh
set -e

if [ "$1" = "web" ] || [ "$1" = "backend" ]; then
    python3 manage.py migrate --noinput
    python3 manage.py collectstatic --noinput
    exec daphne -b 0.0.0.0 -p 8000 config.asgi:application
fi

exec "$@"
