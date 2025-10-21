# Database Setup for Hymn

Hymn uses PostgreSQL via Prisma to store radio timelines.

## Option 1: Vercel Postgres (Recommended - Easiest)

### Setup:
1. Go to [vercel.com](https://vercel.com)
2. Create/select your project
3. Go to **Storage** tab
4. Click **Create Database** → **Postgres**
5. Click **".env.local" tab** and copy the `POSTGRES_PRISMA_URL`
6. Add to your `.env.local`:
   ```bash
   DATABASE_URL="your_postgres_prisma_url_here"
   ```

### Cost:
- Free tier: 256 MB database
- Pro: $20/month for 512 MB

---

## Option 2: Heroku Postgres

### Setup:
1. Install Heroku CLI: `brew install heroku`
2. Login: `heroku login`
3. Create app: `heroku create hymn-db`
4. Add Postgres: `heroku addons:create heroku-postgresql:mini`
5. Get connection string: `heroku config:get DATABASE_URL -a hymn-db`
6. Add to `.env.local`:
   ```bash
   DATABASE_URL="postgresql://..."
   ```

### Cost:
- Mini: $5/month
- Basic: $9/month

---

## Option 3: Local PostgreSQL (Development Only)

### Setup:
1. Install PostgreSQL: `brew install postgresql@15`
2. Start service: `brew services start postgresql@15`
3. Create database: `createdb hymn`
4. Add to `.env.local`:
   ```bash
   DATABASE_URL="postgresql://localhost:5432/hymn"
   ```

---

## After Adding DATABASE_URL:

### 1. Generate Prisma Client
```bash
npx prisma generate
```

### 2. Run Migrations
```bash
npx prisma migrate dev --name init
```

### 3. (Optional) View Database
```bash
npx prisma studio
```

---

## What Gets Stored:

- **Users:** Spotify/Google auth tokens
- **Timelines:** One per user per day
- **TimelineItems:** Tracks and voice segments with timestamps
- **MusicProfile:** User's taste (top artists, genres)
- **CalendarEvents:** Cached calendar data

---

## Why Database?

The radio timeline concept requires:
- ✅ **Persistent timeline** across sessions
- ✅ **Locked past items** that can't change
- ✅ **Shared timelines** (future feature: tune into others)
- ✅ **Playhead position** tracking
- ✅ **Efficient querying** by timestamp

---

## Quick Start (Vercel Postgres):

```bash
# 1. Get DATABASE_URL from Vercel
# 2. Add to .env.local
# 3. Run these commands:

npx prisma generate
npx prisma migrate dev --name init
npm run dev

# Done! Timeline will auto-create on first load
```

