# 🚀 Outreach-Modul Features

## 📍 Wo finde ich was?

### Dashboard Navigation
Gehe zu: **Dashboard → Outreach Campaigns**

## 🎯 Verfügbare Tabs

### 1. **Campaigns** 
- ✅ Alle Email-Kampagnen anzeigen
- ✅ Kampagnen erstellen, starten, pausieren
- ✅ Statistiken: Sent, Delivered, Opened, Clicked, Converted
- ✅ Progress Bars für Open & Click Rates
- 🎨 Moderne Card-Ansicht mit Hover-Effekten

**Aktionen:**
- "New Campaign" Button oben rechts
- Dropdown-Menü für Start/Pause/Delete
- "View Details" für Analytics

### 2. **Templates**
- ✅ Email-Vorlagen mit Variablen erstellen
- ✅ Subject & Content Editor
- ✅ Variable Detection ({{firstName}}, {{company}}, etc.)
- ✅ Live Preview mit Sample-Daten
- 🎨 Gradient-Header Design

**Features:**
- Variablen automatisch erkannt
- Preview mit Beispiel-Daten
- Kategorie-System

### 3. **Email Builder** ⭐ NEU!
- ✅ Visual Editor mit Drag & Drop
- ✅ HTML Editor für Custom-Code
- ✅ Plain Text Editor
- ✅ AI-Generation Button
- ✅ Live Preview mit iframe
- 🎨 3 Modi: Visual, HTML, Text

**AI-Features:**
- Ein Klick → Fertige Email
- Nutzt Knowledge Base
- Personalisierte Inhalte

### 4. **AI Prompts** ⭐ NEU!
- ✅ Prompt Library Management
- ✅ 5 Standard-Prompts vorinstalliert
- ✅ Kategorien: Email, Sequence, Campaign, Follow-up
- ✅ Variable Extraction
- 🎨 Card-Grid Layout

**Verfügbare Prompts:**
1. Cold Outreach B2B
2. Follow-up Email
3. Product Launch Announcement
4. Meeting Request
5. Nurture Sequence - 3 Emails

**Aktionen:**
- "New Prompt" erstellen
- Prompts bearbeiten/löschen
- Variablen automatisch erkannt

### 5. **Sequences**
- 🚧 Coming Soon
- Multi-Step Email Automation

### 6. **Knowledge Base**
- ✅ Dokumente hochladen
- ✅ AI nutzt diese für Personalisierung
- 📁 Supabase Storage Integration

### 7. **Analytics**
- ✅ Echte Daten aus Supabase
- ✅ Performance Metrics
- ✅ Top Campaigns
- 📊 Charts & Visualisierungen

## 🎨 Dashboard Stats (Oben)

6 farbcodierte Karten:
- 🔵 **Total Sent** - Alle versendeten Emails
- 🟢 **Delivered** - Zugestellte Emails
- 🟣 **Opened** - Geöffnete Emails
- 🟠 **Clicked** - Geklickte Links
- 🔴 **Converted** - Conversions
- 🟦 **Active** - Laufende Kampagnen

## 🤖 AI-Integration

### Wie nutze ich AI?

1. **Email Builder öffnen** (Tab 3)
2. **"AI Generate" klicken**
3. AI generiert automatisch:
   - Subject Line
   - Email Content
   - Variablen
4. **Bearbeiten & Speichern**

### AI nutzt:
- ✅ Knowledge Base Daten
- ✅ Custom Prompts
- ✅ OpenAI GPT-4o
- ✅ Tone & Length Control

## 📧 Email-Versand

### Workflow:
1. **Campaign erstellen** (Tab 1)
2. **Template auswählen** (Tab 2 oder 3)
3. **Leads auswählen**
4. **"Send" klicken**

### Features:
- ✅ Tracking Pixel (Open Rates)
- ✅ Link Tracking (Click Rates)
- ✅ Variable Replacement
- ✅ Batch-Versand mit Rate Limiting
- ✅ Resend API Integration

## 🔧 Setup erforderlich

### Environment Variables (.env.local):
```bash
# OpenAI (für AI-Features)
OPENAI_API_KEY=sk-xxx

# Resend (für Email-Versand)
RESEND_API_KEY=re_xxx
EMAIL_FROM=noreply@yourdomain.com

# Supabase (bereits konfiguriert)
NEXT_PUBLIC_SUPABASE_URL=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx
```

## 🎯 Quick Start

1. **Gehe zu Dashboard → Outreach**
2. **Klicke auf "AI Prompts" Tab**
3. **Sieh dir die 5 Standard-Prompts an**
4. **Wechsle zu "Email Builder" Tab**
5. **Klicke "AI Generate"**
6. **Fertig! 🎉**

## 📊 Was ist neu?

### Design:
- ✅ Gradient Stats Cards
- ✅ Hover-Effekte & Animations
- ✅ Progress Bars
- ✅ Dark Mode optimiert
- ✅ Responsive Grid Layout

### Funktionen:
- ✅ AI Email Generation
- ✅ Visual Email Builder
- ✅ Prompt Management
- ✅ Knowledge Base Integration
- ✅ Real-time Analytics
- ✅ Email Tracking

## 🚀 Nächste Schritte

1. ✅ **Migration abgeschlossen** - Alles in Supabase
2. ⏭️ **API Keys eintragen** - OpenAI & Resend
3. ⏭️ **Domain verifizieren** - Bei Resend
4. ⏭️ **Test-Email senden** - Erste Kampagne
5. ⏭️ **AI-Prompts anpassen** - Für dein Business

## 💡 Tipps

- **Variablen**: Nutze {{firstName}}, {{company}}, {{jobTitle}}
- **AI-Prompts**: Erstelle spezifische Prompts für deine Zielgruppe
- **Knowledge Base**: Lade Unternehmensdokumente hoch für bessere AI-Ergebnisse
- **Testing**: Teste Emails erst mit kleinen Listen

## 🆘 Support

Alle Features sind jetzt sichtbar im Dashboard unter:
**Dashboard → Outreach Campaigns**

Tabs von links nach rechts:
1. Campaigns
2. Templates  
3. **Email Builder** ⭐
4. **AI Prompts** ⭐
5. Sequences
6. Knowledge Base
7. Analytics
