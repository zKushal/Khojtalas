# KhojTalas Django Backend

Django replacement backend for the lost-and-found platform.

## Features
- JWT auth for user and admin
- 2FA (TOTP) setup and verify endpoints
- Lost/Found item reporting with media upload and dynamic feature JSON
- AI matching service with >=95% threshold auto-notification
- Real-time notification socket endpoint via Django Channels
- Admin moderation endpoints

## Quick Start
1. Create virtual env and install requirements.
2. Copy `.env.example` to `.env`.
3. Run migrations and start server.

```bash
python manage.py makemigrations
python manage.py migrate
python manage.py runserver 0.0.0.0:5000
```

## API Base
- `http://localhost:5000/api`

## WebSocket
- `ws://localhost:5000/ws/notifications/<user_id>/`
