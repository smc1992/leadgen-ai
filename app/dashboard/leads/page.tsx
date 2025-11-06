"use client"

import { LeadsManagement } from "@/components/leads-management"

export default function LeadsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Leads</h1>
        <p className="text-muted-foreground">
          Manage and analyze your lead database with advanced filtering, scraping und scoring
        </p>
      </div>
      <LeadsManagement />
    </div>
  )
}
