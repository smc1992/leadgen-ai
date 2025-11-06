"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { CommandMenu } from "@/components/command-menu"
import { useGlobalShortcuts } from "@/hooks/use-keyboard-shortcuts"
import { Loader2 } from "lucide-react"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isCommandMenuOpen, setIsCommandMenuOpen] = useState(false)

  // Enable global keyboard shortcuts
  useGlobalShortcuts()

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === "loading") return // Still loading
    if (!session) {
      router.push("/auth/signin")
    }
  }, [session, status, router])

  // Show loading while checking authentication
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    )
  }

  // Don't render if not authenticated
  if (!session) {
    return null
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <div className="flex-1 min-h-screen">
        <header className="sticky top-0 z-40 border-b bg-background">
          <div className="flex h-16 items-center gap-4 px-4">
            <SidebarTrigger />
            <div className="flex-1" />
            <CommandMenu />
          </div>
        </header>
        <main className="p-4 md:p-6">
          {children}
        </main>
      </div>
    </SidebarProvider>
  )
}
