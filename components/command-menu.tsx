"use client"

import * as React from "react"
import { DialogProps } from "@radix-ui/react-dialog"
import { Command } from "cmdk"
import { Search } from "lucide-react"
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog"
import { useRouter } from "next/navigation"

interface CommandMenuProps extends DialogProps {}

export function CommandMenu({ ...props }: CommandMenuProps) {
  const [open, setOpen] = React.useState(false)
  const router = useRouter()

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  const runCommand = React.useCallback((command: () => unknown) => {
    setOpen(false)
    command()
  }, [])

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen} {...props}>
        <DialogContent className="overflow-hidden p-0 shadow-lg">
          <Command className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-group]]:px-2 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5">
            <div className="flex items-center border-b px-3">
              <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
              <Command.Input placeholder="Type a command or search..." />
            </div>
            <Command.List>
              <Command.Empty>No results found.</Command.Empty>
              <Command.Group heading="Suggestions">
                <Command.Item
                  onSelect={() => runCommand(() => router.push("/dashboard"))}
                >
                  <span>Dashboard</span>
                </Command.Item>
                <Command.Item
                  onSelect={() => runCommand(() => router.push("/dashboard/leads"))}
                >
                  <span>Leads</span>
                </Command.Item>
                <Command.Item
                  onSelect={() => runCommand(() => router.push("/dashboard/analytics"))}
                >
                  <span>Analytics</span>
                </Command.Item>
                <Command.Item
                  onSelect={() => runCommand(() => router.push("/dashboard/content"))}
                >
                  <span>Content</span>
                </Command.Item>
                <Command.Item
                  onSelect={() => runCommand(() => router.push("/dashboard/calendar"))}
                >
                  <span>Calendar</span>
                </Command.Item>
                <Command.Item
                  onSelect={() => runCommand(() => router.push("/dashboard/settings"))}
                >
                  <span>Settings</span>
                </Command.Item>
                <Command.Item
                  onSelect={() => runCommand(() => router.push("/dashboard/outreach"))}
                >
                  <span>Outreach</span>
                </Command.Item>
              </Command.Group>
            </Command.List>
          </Command>
        </DialogContent>
      </Dialog>
    </>
  )
}
