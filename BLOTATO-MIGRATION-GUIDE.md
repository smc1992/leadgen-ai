# 🔄 Blotato API Migration Guide

## Von Mock zu Production

Diese Anleitung zeigt, wie du von der Mock-Implementierung zur echten Blotato API migrierst.

---

## 📁 Dateien

### Alt (Mock)
- `/lib/blotato.ts` - Mock-Implementierung für Testing
- Funktioniert **ohne** API Key
- Generiert **keine echten** Posts/Videos

### Neu (Production)
- `/lib/blotato-api.ts` - **Echte Blotato API v2**
- Benötigt **API Key**
- Generiert **echte** Posts/Videos
- **Production-Ready**

---

## 🔑 Setup (5 Minuten)

### 1. API Key erhalten

```bash
# 1. Gehe zu: https://my.blotato.com/settings
# 2. Klicke "API" Tab
# 3. Klicke "Generate API Key"
# 4. Kopiere den Key
```

⚠️ **WICHTIG**: Generieren beendet Free Trial!

### 2. Environment Variable

```bash
# .env.local
BLOTATO_API_KEY=dein_echter_api_key_hier
```

### 3. Social Accounts verbinden

```bash
# Gehe zu: https://my.blotato.com/settings
# Verbinde gewünschte Plattformen
# Notiere die Account IDs (acc_xxxxx)
```

---

## 🔄 Code Migration

### Beispiel 1: Post veröffentlichen

**ALT** (Mock):
```typescript
import { generateText } from '@/lib/blotato'

const result = await generateText({
  prompt: 'Air Freight advantages',
  tone: 'professional',
  channel: 'linkedin'
})
// Gibt Mock-Daten zurück
```

**NEU** (Production):
```typescript
import { createTextPost } from '@/lib/blotato-api'

const result = await createTextPost(
  'acc_12345', // Deine Account ID
  'linkedin',
  'Air Freight advantages: Fast, reliable, global reach! 🚀'
)
// Postet ECHT auf LinkedIn!
```

### Beispiel 2: Video generieren

**ALT** (Mock):
```typescript
import { generateVideo } from '@/lib/blotato'

const result = await generateVideo({
  topic: 'Air Freight Process',
  duration: 30,
  style: 'modern'
})
// Gibt Mock-Daten zurück
```

**NEU** (Production):
```typescript
import { createVideo, pollVideoStatus } from '@/lib/blotato-api'

// 1. Video generieren
const video = await createVideo({
  template: { id: 'base/pov/wakeup' },
  script: 'You wake up as a logistics expert',
  style: 'cinematic'
})

// 2. Warte auf Fertigstellung
const completed = await pollVideoStatus(video.id)

// 3. Video URL nutzen
console.log('Video:', completed.mediaUrl)
// Echtes AI-Video!
```

### Beispiel 3: Media Upload

**ALT** (Mock):
```typescript
// Kein Media Upload in Mock
```

**NEU** (Production):
```typescript
import { uploadMedia, createMediaPost } from '@/lib/blotato-api'

// 1. Upload zu Blotato CDN
const media = await uploadMedia({
  url: 'https://example.com/image.jpg'
})

// 2. Poste mit Media
await createMediaPost(
  'acc_12345',
  'instagram',
  'Check out this image! 📸',
  [media.url]
)
```

---

## 🎯 API Routes Migration

### Text Generator API Route

**Datei**: `app/api/content/generate-text/route.ts`

**ALT**:
```typescript
import { generateText } from '@/lib/blotato'

const generatedContent = await generateText({
  prompt,
  tone,
  channel: platform,
})
```

**NEU**:
```typescript
import { createTextPost } from '@/lib/blotato-api'

const result = await createTextPost(
  accountId, // Aus Request Body
  platform,
  generatedText
)
```

### Video Generator API Route

**Datei**: `app/api/content/generate-video/route.ts`

**ALT**:
```typescript
import { generateVideo } from '@/lib/blotato'

const videoJob = await generateVideo({
  topic,
  duration,
  style
})
```

**NEU**:
```typescript
import { createVideo, pollVideoStatus } from '@/lib/blotato-api'

const video = await createVideo({
  template: { id: 'base/pov/wakeup' },
  script: topic,
  style
})

// Optional: Warte auf Fertigstellung
const completed = await pollVideoStatus(video.id)
```

---

## 🎨 UI Components Migration

### Text Generator Wizard

**Datei**: `components/content/text-generator-wizard.tsx`

**Änderungen**:

1. **Import ändern**:
```typescript
// ALT
import { generateText } from '@/lib/blotato'

// NEU
import { createTextPost } from '@/lib/blotato-api'
```

2. **onSubmit anpassen**:
```typescript
async function onSubmit(data: TextGeneratorFormValues) {
  setIsGenerating(true)

  try {
    // NEU: Echte API nutzen
    const result = await createTextPost(
      'acc_12345', // TODO: Aus User Settings holen
      data.platform,
      `${data.prompt}\n\n${data.includeHashtags ? '#logistics #airfreight' : ''}`
    )

    toast.success("Content published successfully!")
    
    // Optional: Speichere in Supabase
    await fetch('/api/content/save', {
      method: 'POST',
      body: JSON.stringify({
        blotatoId: result.id,
        platform: data.platform,
        text: data.prompt
      })
    })
    
  } catch (error) {
    toast.error("Failed to publish content")
    console.error(error)
  } finally {
    setIsGenerating(false)
  }
}
```

### Video Generator Wizard

**Datei**: `components/content/video-generator-wizard.tsx`

**Änderungen**:

```typescript
async function onSubmit(data: VideoGeneratorFormValues) {
  setIsGenerating(true)
  setStep('processing')

  try {
    // 1. Video generieren
    const video = await createVideo({
      template: { id: 'base/pov/wakeup' },
      script: data.topic,
      style: data.style
    })

    // 2. Poll Status mit Progress Updates
    let attempts = 0
    const maxAttempts = 120 // 10 Minuten
    
    while (attempts < maxAttempts) {
      const status = await getVideo(video.id)
      
      // Update Progress Bar
      setGeneratedVideo(prev => ({
        ...prev,
        progress: status.progress || (attempts / maxAttempts) * 100
      }))
      
      if (status.status === 'completed') {
        setGeneratedVideo({
          id: status.id,
          jobId: video.id,
          status: 'completed',
          videoUrl: status.mediaUrl,
          thumbnailUrl: status.thumbnailUrl,
          duration: data.duration,
          progress: 100
        })
        setStep('preview')
        toast.success("Video generated successfully!")
        return
      }
      
      if (status.status === 'failed') {
        throw new Error('Video generation failed')
      }
      
      await new Promise(resolve => setTimeout(resolve, 5000))
      attempts++
    }
    
    throw new Error('Video generation timeout')
    
  } catch (error) {
    toast.error("Failed to generate video")
    console.error(error)
    setStep('input')
  } finally {
    setIsGenerating(false)
  }
}
```

---

## 🔐 Account Management

### Account IDs speichern

Erstelle eine Settings-Seite für Account IDs:

**Datei**: `app/dashboard/settings/page.tsx`

```typescript
"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

export default function SettingsPage() {
  const [accounts, setAccounts] = useState({
    twitter: '',
    linkedin: '',
    facebook: '',
    instagram: '',
    tiktok: ''
  })

  const handleSave = async () => {
    // Speichere in Supabase oder localStorage
    localStorage.setItem('blotato_accounts', JSON.stringify(accounts))
    toast.success("Account IDs saved!")
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Settings</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Blotato Account IDs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Twitter Account ID</Label>
            <Input
              placeholder="acc_xxxxx"
              value={accounts.twitter}
              onChange={(e) => setAccounts({...accounts, twitter: e.target.value})}
            />
          </div>
          
          <div>
            <Label>LinkedIn Account ID</Label>
            <Input
              placeholder="acc_xxxxx"
              value={accounts.linkedin}
              onChange={(e) => setAccounts({...accounts, linkedin: e.target.value})}
            />
          </div>
          
          {/* Weitere Plattformen... */}
          
          <Button onClick={handleSave}>Save Settings</Button>
        </CardContent>
      </Card>
    </div>
  )
}
```

### Account IDs nutzen

```typescript
// In Wizards
const accounts = JSON.parse(localStorage.getItem('blotato_accounts') || '{}')
const accountId = accounts[platform]

if (!accountId) {
  toast.error(`Please configure ${platform} account ID in Settings`)
  return
}

await createTextPost(accountId, platform, text)
```

---

## ✅ Migration Checklist

### Setup
- [ ] API Key in `.env.local` hinterlegt
- [ ] Social Accounts in Blotato verbunden
- [ ] Account IDs dokumentiert/gespeichert

### Code
- [ ] Imports von `/lib/blotato` auf `/lib/blotato-api` geändert
- [ ] Text Generator Wizard migriert
- [ ] Video Generator Wizard migriert
- [ ] API Routes aktualisiert
- [ ] Account ID Management implementiert

### Testing
- [ ] Text Post Publishing getestet
- [ ] Video Generation getestet
- [ ] Media Upload getestet
- [ ] Scheduling getestet
- [ ] Error Handling getestet

### Production
- [ ] API Dashboard Monitoring eingerichtet
- [ ] Error Logging implementiert
- [ ] Credits/Budget überwacht
- [ ] Backup-Strategie definiert

---

## 🐛 Häufige Probleme

### Problem: "API Key not found"
```typescript
// Lösung: Prüfe .env.local
console.log('API Key:', process.env.BLOTATO_API_KEY ? 'Set' : 'Missing')
```

### Problem: "Account not found"
```typescript
// Lösung: Account in Blotato Dashboard verbinden
// Dann Account ID in Settings speichern
```

### Problem: "Invalid media URL"
```typescript
// Lösung: Media erst uploaden
const media = await uploadMedia({ url: originalUrl })
// Dann Blotato URL nutzen
mediaUrls: [media.url]
```

### Problem: Video bleibt bei "Processing"
```typescript
// Lösung: Geduld! Videos brauchen 2-10 Minuten
// Oder: Credits in Blotato Account prüfen
```

---

## 📊 Kosten-Übersicht

### Kostenlos
- ✅ Post Publishing (unbegrenzt)
- ✅ Media Upload
- ✅ Scheduling

### Credits benötigt
- 💰 Video Generation
  - Flux-Schnell: ~1 Credit
  - Flux-Dev: ~2-3 Credits
  - Kling 1.6 Pro: ~10-15 Credits
  - Animation: Extra Credits

**Credits kaufen**: https://my.blotato.com/settings

---

## 🎉 Nach der Migration

Du hast jetzt:
- ✅ Echte Social Media Posts
- ✅ AI-generierte Videos
- ✅ Multi-Platform Publishing
- ✅ Scheduling
- ✅ Production-Ready System

**Nächste Schritte**:
1. Teste mit echten Posts
2. Überwache API Dashboard
3. Optimiere Workflows
4. Skaliere Content-Produktion

---

**Viel Erfolg! 🚀**
