"use client"

import { Suspense, useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useSearchParams } from "next/navigation"

function UnsubscribeContent() {
  const search = useSearchParams()
  const [email, setEmail] = useState("")
  const [campaignId, setCampaignId] = useState("")
  const [leadId, setLeadId] = useState("")
  const [status, setStatus] = useState<"idle"|"success"|"error">("idle")

  useEffect(() => {
    const e = search.get('email') || ''
    const c = search.get('campaignId') || ''
    const l = search.get('leadId') || ''
    setEmail(e)
    setCampaignId(c)
    setLeadId(l)
  }, [search])

  const handleUnsubscribe = async () => {
    try {
      const res = await fetch('/api/outreach/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, campaignId, leadId, reason: 'user' })
      })
      if (!res.ok) throw new Error('Failed to unsubscribe')
      setStatus('success')
    } catch {
      setStatus('error')
    }
  }

  return (
    <div className="max-w-xl mx-auto py-12">
      <Card>
        <CardHeader>
          <CardTitle>Unsubscribe</CardTitle>
          <CardDescription>
            Stop receiving outreach emails from us
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="your@email.com" />
          </div>
          <Button onClick={handleUnsubscribe} disabled={!email}>
            Unsubscribe
          </Button>
          {status === 'success' && (
            <div className="text-green-600">You have been unsubscribed.</div>
          )}
          {status === 'error' && (
            <div className="text-red-600">Unsubscribe failed. Please try again later.</div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function UnsubscribePage() {
  return (
    <Suspense fallback={<div className="py-12 text-center">Loading...</div>}>
      <UnsubscribeContent />
    </Suspense>
  )
}
