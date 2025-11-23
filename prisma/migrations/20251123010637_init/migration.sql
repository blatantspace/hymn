-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "spotifyId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "spotifyAccessToken" TEXT,
    "spotifyRefreshToken" TEXT,
    "spotifyTokenExpiry" TIMESTAMP(3),
    "googleAccessToken" TEXT,
    "googleRefreshToken" TEXT,
    "googleTokenExpiry" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserPreferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "newsCategories" TEXT[],
    "musicMoods" TEXT[],
    "interruptionLevel" TEXT NOT NULL DEFAULT 'moderate',
    "explorationLevel" TEXT NOT NULL DEFAULT 'balanced',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserPreferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MusicProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "topGenres" TEXT[],
    "topArtistIds" TEXT[],
    "topArtists" JSONB NOT NULL,
    "topTracks" JSONB NOT NULL,
    "recentTracks" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MusicProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Timeline" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "currentPosition" TIMESTAMP(3) NOT NULL,
    "generatedUntil" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Timeline_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimelineItem" (
    "id" TEXT NOT NULL,
    "timelineId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "duration" INTEGER NOT NULL,
    "locked" BOOLEAN NOT NULL DEFAULT false,
    "title" TEXT,
    "artist" TEXT,
    "imageUrl" TEXT,
    "spotifyUri" TEXT,
    "audioFileUrl" TEXT,
    "streamUrl" TEXT,
    "voiceContent" TEXT,
    "voiceAudioUrl" TEXT,
    "priority" TEXT,
    "mood" TEXT,
    "volume" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "fadeIn" INTEGER NOT NULL DEFAULT 0,
    "fadeOut" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TimelineItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CalendarEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "description" TEXT,
    "start" TIMESTAMP(3) NOT NULL,
    "end" TIMESTAMP(3) NOT NULL,
    "location" TEXT,
    "attendees" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CalendarEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_spotifyId_key" ON "User"("spotifyId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "UserPreferences_userId_key" ON "UserPreferences"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "MusicProfile_userId_key" ON "MusicProfile"("userId");

-- CreateIndex
CREATE INDEX "Timeline_userId_date_idx" ON "Timeline"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "Timeline_userId_date_key" ON "Timeline"("userId", "date");

-- CreateIndex
CREATE INDEX "TimelineItem_timelineId_timestamp_idx" ON "TimelineItem"("timelineId", "timestamp");

-- CreateIndex
CREATE INDEX "TimelineItem_timestamp_idx" ON "TimelineItem"("timestamp");

-- CreateIndex
CREATE INDEX "CalendarEvent_userId_start_idx" ON "CalendarEvent"("userId", "start");

-- CreateIndex
CREATE UNIQUE INDEX "CalendarEvent_userId_eventId_key" ON "CalendarEvent"("userId", "eventId");

-- AddForeignKey
ALTER TABLE "UserPreferences" ADD CONSTRAINT "UserPreferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MusicProfile" ADD CONSTRAINT "MusicProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Timeline" ADD CONSTRAINT "Timeline_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimelineItem" ADD CONSTRAINT "TimelineItem_timelineId_fkey" FOREIGN KEY ("timelineId") REFERENCES "Timeline"("id") ON DELETE CASCADE ON UPDATE CASCADE;
