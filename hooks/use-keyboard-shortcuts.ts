"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

interface ShortcutConfig {
  key: string
  ctrlKey?: boolean
  metaKey?: boolean
  shiftKey?: boolean
  action: () => void
  description: string
}

export function useKeyboardShortcuts(shortcuts: ShortcutConfig[]) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      shortcuts.forEach(({ key, ctrlKey, metaKey, shiftKey, action }) => {
        const modifierMatch = 
          (ctrlKey === undefined || e.ctrlKey === ctrlKey) &&
          (metaKey === undefined || e.metaKey === metaKey) &&
          (shiftKey === undefined || e.shiftKey === shiftKey)

        if (e.key.toLowerCase() === key.toLowerCase() && modifierMatch) {
          // Don't trigger if user is typing in an input
          if (
            e.target instanceof HTMLInputElement ||
            e.target instanceof HTMLTextAreaElement
          ) {
            return
          }

          e.preventDefault()
          action()
        }
      })
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [shortcuts])
}

// Global shortcuts hook
export function useGlobalShortcuts() {
  const router = useRouter()

  const shortcuts: ShortcutConfig[] = [
    {
      key: "d",
      metaKey: true,
      action: () => router.push("/dashboard"),
      description: "Go to Dashboard",
    },
    {
      key: "l",
      metaKey: true,
      action: () => router.push("/dashboard/leads"),
      description: "Go to Leads",
    },
    {
      key: "o",
      metaKey: true,
      action: () => router.push("/dashboard/outreach"),
      description: "Go to Outreach",
    },
    {
      key: "c",
      metaKey: true,
      action: () => router.push("/dashboard/content"),
      description: "Go to Content",
    },
    {
      key: "a",
      metaKey: true,
      action: () => router.push("/dashboard/analytics"),
      description: "Go to Analytics",
    },
  ]

  useKeyboardShortcuts(shortcuts)
}
