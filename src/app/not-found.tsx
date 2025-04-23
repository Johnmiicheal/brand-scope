'use client'; // Required for Framer Motion and potentially Button onClick

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { MapPinOff } from 'lucide-react';
import { motion } from 'framer-motion';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center px-4 bg-background">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center"
      >
        <MapPinOff className="w-24 h-24 text-muted-foreground mb-6" strokeWidth={1} />
        <h1 className="text-6xl md:text-8xl font-bold text-primary mb-2">404</h1>
        <h2 className="text-2xl md:text-3xl font-semibold mb-4">Page Not Found</h2>
        <p className="text-muted-foreground max-w-md mb-8">
          Oops! It seems like the page you were looking for doesn&apos;t exist or has been moved.
        </p>
        <Link href="/dashboard">
          <Button size="lg">
            Go Back Home
          </Button>
        </Link>
      </motion.div>
    </div>
  );
} 