"use client"

import { ReactNode } from 'react'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { AppSidebar } from '@/components/app-sidebar'
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from '@/components/ui/breadcrumb'
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@radix-ui/react-separator'
import { usePathname } from 'next/navigation'

function BreadcrumbNav() {
  const pathname = usePathname()
  const segments = pathname.split('/').filter(Boolean)

  return (
    <BreadcrumbList>
      {segments.map((segment, index) => {
        const path = `/${segments.slice(0, index + 1).join('/')}`
        const isLast = index === segments.length - 1
        const formattedSegment = segment.charAt(0).toUpperCase() + segment.slice(1)

        return (
          <div key={path} className="flex items-center">
            <BreadcrumbItem className="hidden md:block">
              {isLast ? (
                <BreadcrumbPage>{formattedSegment}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink href={path}>{formattedSegment}</BreadcrumbLink>
              )}
            </BreadcrumbItem>
            {!isLast && (
              <BreadcrumbSeparator className="hidden md:block" />
            )}
          </div>
        )
      })}
    </BreadcrumbList>
  )
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className="border border-accent overflow-hidden">
          <header className="flex h-16 shrink-0 items-center gap-2">
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator
                orientation="vertical"
                className="mr-2 data-[orientation=vertical]:h-4"
              />
              <Breadcrumb>
                <BreadcrumbNav />
              </Breadcrumb>
            </div>
          </header>
          {children}
        </SidebarInset>
      </SidebarProvider>
    </ProtectedRoute>
  )
}