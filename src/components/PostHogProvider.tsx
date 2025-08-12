// app/providers.tsx
'use client'

import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import posthog from 'posthog-js'
import { PostHogProvider as PHProvider } from 'posthog-js/react'

type Props = { children: React.ReactNode }

export function PostHogProvider({ children }: Props) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Initialize once on the client
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY as string, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || '/ingest',
      ui_host: 'https://us.posthog.com',
      capture_exceptions: true,
      person_profiles: 'identified_only',
      debug: process.env.NODE_ENV === 'development',
    })
  }, [])

  useEffect(() => {
    // Capture pageviews on App Router navigations
    if (!pathname) return
    posthog.capture('$pageview')
  }, [pathname, searchParams])

  return <PHProvider client={posthog}>{children}</PHProvider>
}
