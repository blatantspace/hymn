'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function Home() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <main className="min-h-screen bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 text-neutral-100 flex items-center justify-center p-4">
      <div className="max-w-4xl mx-auto text-center">
        {/* Logo/Title */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-8"
        >
          <h1 className="text-7xl md:text-9xl font-light tracking-tight mb-4">
            Hymn
          </h1>
          <p className="text-xl md:text-2xl text-neutral-400 font-light">
            Your personal AI DJ companion
          </p>
        </motion.div>

        {/* Description */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mb-12 max-w-2xl mx-auto"
        >
          <p className="text-neutral-300 text-lg leading-relaxed">
            Hymn adapts to your day. Connect your calendar and Spotify, and let
            AI create the perfect audio experience—whether you're in deep focus,
            heading to a meeting, or just need some energy.
          </p>
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="grid md:grid-cols-3 gap-6 mb-12"
        >
          <FeatureCard
            icon="🎵"
            title="Smart Blocks"
            description="AI analyzes your schedule and creates perfect hour-long audio experiences"
          />
          <FeatureCard
            icon="🗓️"
            title="Calendar Aware"
            description="Adjusts music and updates based on your meetings and events"
          />
          <FeatureCard
            icon="🎧"
            title="Seamless Flow"
            description="Music, news, and reminders blend naturally throughout your day"
          />
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
        >
          <Link href="/setup">
            <button className="px-8 py-4 bg-neutral-100 text-neutral-900 rounded-full font-medium hover:bg-neutral-200 transition-colors text-lg min-w-[200px]">
              Get Started
            </button>
          </Link>
          <button className="px-8 py-4 border border-neutral-700 text-neutral-100 rounded-full font-medium hover:border-neutral-600 hover:bg-neutral-900 transition-colors text-lg min-w-[200px]">
            Learn More
          </button>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1 }}
          className="mt-20 text-neutral-600 text-sm"
        >
          Powered by Spotify, Google Calendar, and OpenAI
        </motion.div>
      </div>
    </main>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="p-6 bg-neutral-900/50 border border-neutral-800 rounded-2xl hover:border-neutral-700 transition-colors">
      <div className="text-4xl mb-3">{icon}</div>
      <h3 className="text-lg font-medium mb-2">{title}</h3>
      <p className="text-neutral-400 text-sm leading-relaxed">{description}</p>
    </div>
  );
}
