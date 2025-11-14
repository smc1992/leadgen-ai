"use client"

import { useState, useEffect } from "react"
import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { CommandMenu } from "@/components/command-menu"
import { useGlobalShortcuts } from "@/hooks/use-keyboard-shortcuts"
import { Loader2, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { MobileNav } from "@/components/ui/mobile-nav"

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
      <div className="flex-1 min-h-screen bg-gradient-to-b from-background to-muted/30">
        <header className="sticky top-0 z-40 bg-background/80 backdrop-blur border-b">
          <div className="flex h-14 items-center gap-4 px-4">
            <SidebarTrigger />
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center">E</div>
              <div className="hidden md:block">
                <div className="text-sm font-semibold">Emex Dashboard</div>
                <div className="text-xs text-muted-foreground">Leads & Sales</div>
              </div>
            </div>
            <div className="flex-1" />
            <div className="hidden md:flex items-center gap-3">
              <Input placeholder="Suchen" className="max-w-sm" />
              <CommandMenu />
              <ThemeToggle />
            </div>
            <Button variant="outline" onClick={() => signOut({ callbackUrl: "/auth/signin" })}>
              <LogOut className="mr-2 h-4 w-4" />
              Abmelden
            </Button>
          </div>
        </header>
        <main className="px-4 md:px-6 py-6 max-w-7xl mx-auto">
          {children}
        </main>
        <MobileNav />
      </div>
    </SidebarProvider>
  )
}
