"use client"

import { ReactNode } from 'react'
import { PublicRoute } from '@/components/auth/PublicRoute'

export default function LoginLayout({ children }: { children: ReactNode }) {
  return (
    <PublicRoute redirectTo="/dashboard">
      {children}
    </PublicRoute>
  )
} 