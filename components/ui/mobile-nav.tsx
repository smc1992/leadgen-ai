"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Users, Mail, Gauge, Bot, Database } from "lucide-react"

const items = [
  { title: "Home", url: "/dashboard", icon: Home },
  { title: "Leads", url: "/dashboard/leads", icon: Users },
  { title: "Scraper", url: "/dashboard/leads/scraper", icon: Database },
  { title: "Sales", url: "/dashboard/sales", icon: Gauge },
  { title: "Outreach", url: "/dashboard/outreach", icon: Mail },
  { title: "AI", url: "/dashboard/ai", icon: Bot },
]

export function MobileNav() {
  const pathname = usePathname()
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur border-t z-50">
      <div className="grid grid-cols-6">
        {items.map((it) => {
          const ActiveIcon = it.icon
          const active = pathname.startsWith(it.url)
          return (
            <Link key={it.url} href={it.url} className={`flex flex-col items-center justify-center h-14 text-xs ${active ? 'text-primary' : 'text-muted-foreground'}`}>
              <ActiveIcon className="h-5 w-5" />
              <span>{it.title}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

