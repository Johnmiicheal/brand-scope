"use client";

import { ReactNode, useEffect } from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AppSidebar } from "@/components/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@radix-ui/react-separator";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { BrandDataProvider } from "@/contexts/brand-data-context";

function BreadcrumbNav() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  return (
    <BreadcrumbList>
      {segments.map((segment, index) => {
        const path = `/${segments.slice(0, index + 1).join("/")}`;
        const isLast = index === segments.length - 1;
        const formattedSegment =
          segment.charAt(0).toUpperCase() + segment.slice(1);

        return (
          <div key={path} className="flex items-center">
            <BreadcrumbItem className="hidden md:block">
              {isLast ? (
                <BreadcrumbPage>{formattedSegment}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink href={path}>{formattedSegment}</BreadcrumbLink>
              )}
            </BreadcrumbItem>
            {!isLast && <BreadcrumbSeparator className="hidden md:block" />}
          </div>
        );
      })}
    </BreadcrumbList>
  );
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  useEffect(() => {
    const checkAndCreateUser = async () => {
      try {
        // Check if user exists
        const { data } = await supabase.auth.getSession();

        if (!data.session?.user) return;

        const { data: existingUser, error: userError } = await supabase
          .from("users")
          .select("id")
          .eq("id", data.session.user.id)
          .single();

        // Handle potential errors (excluding 'not found')
        if (userError && userError.code !== "PGRST116") {
          console.error("Error checking user existence:", userError);
          // Maybe show a toast notification
          return;
        }

        // If user doesn't exist, create them
        if (!existingUser) {
          const { error: createError } = await supabase.from("users").insert({
            id: data.session.user.id,
            email: data.session.user.email,
            full_name: data.session.user.user_metadata?.full_name || null,
            created_at: new Date().toISOString(),
            plan_type: "free",
          });

          if (createError) {
            console.error("Error creating user record:", createError);
            // Maybe show a toast notification
          } 
        }
      } catch (checkCreateError) {
        console.error(
          "Error during post-signin user check/create:",
          checkCreateError
        );
        // Maybe show a toast notification
      }
    };

    checkAndCreateUser();
  }, []);
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
          <BrandDataProvider>{children}</BrandDataProvider>
        </SidebarInset>
      </SidebarProvider>
    </ProtectedRoute>
  );
}
