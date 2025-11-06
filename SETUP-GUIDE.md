# Emex Dashboard - Setup Guide

Schritt-für-Schritt-Anleitung zur Einrichtung des Emex Lead Generation Dashboards.

## ✅ Was bereits erledigt ist

- ✅ Next.js 16+ Projekt initialisiert
- ✅ TailwindCSS v4 konfiguriert
- ✅ shadcn-ui Komponenten installiert
- ✅ Moderne Dashboard-UI mit Sidebar-Navigation
- ✅ Alle Module implementiert (Leads, Outreach, Content, Analytics)
- ✅ API-Integrationen vorbereitet (Apify, Instantly, Blotato)
- ✅ Supabase Client konfiguriert
- ✅ Lead-Scoring-Logik implementiert

## 🚀 Nächste Schritte

### 1. Supabase Projekt erstellen

1. Gehe zu [supabase.com](https://supabase.com)
2. Erstelle ein neues Projekt
3. Notiere dir:
   - Project URL
   - Anon/Public Key

### 2. Datenbank initialisieren

1. Öffne den SQL Editor in Supabase
2. Kopiere den Inhalt von `supabase-schema.sql`
3. Führe das SQL-Skript aus
4. Verifiziere, dass alle Tabellen erstellt wurden:
   - `leads`
   - `emails`
   - `campaigns`
   - `scrape_runs`
   - `content_items`

### 3. Umgebungsvariablen konfigurieren

1. Kopiere `env.example` zu `.env.local`:
```bash
cp env.example .env.local
```

2. Fülle die Werte aus:

```env
# Supabase (ERFORDERLICH)
NEXT_PUBLIC_SUPABASE_URL=https://dein-projekt.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=dein-anon-key

# Apify (Optional - für Lead-Scraping)
APIFY_TOKEN=dein-apify-token
APIFY_ACTOR_ID_LINKEDIN=supreme_coder/linkedin-profile-scraper
APIFY_ACTOR_ID_VALIDATOR=anchor/email-check-verify-validate
APIFY_ACTOR_ID_GMAPS=compass/crawler-google-places

# Instantly (Optional - für E-Mail-Outreach)
INSTANTLY_API_KEY=dein-instantly-key

# Blotato (Optional - für Content-Generierung)
BLOTATO_API_KEY=dein-blotato-key

# OpenAI (Optional - für erweiterte Content-Verfeinerung)
OPENAI_API_KEY=dein-openai-key
```

### 4. Development Server starten

```bash
npm run dev
```

Das Dashboard ist jetzt unter [http://localhost:3000](http://localhost:3000) verfügbar.

## 📋 API-Keys besorgen

### Supabase (Erforderlich)
1. Erstelle ein Projekt auf [supabase.com](https://supabase.com)
2. Gehe zu Settings → API
3. Kopiere Project URL und anon/public key

### Apify (Optional)
1. Registriere dich auf [apify.com](https://apify.com)
2. Gehe zu Settings → Integrations
3. Erstelle einen API Token
4. Suche nach den gewünschten Actors:
   - LinkedIn Profile Scraper
   - Email Validator
   - Google Maps Scraper

### Instantly (Optional)
1. Registriere dich auf [instantly.ai](https://instantly.ai)
2. Gehe zu Settings → API
3. Generiere einen API Key

### Blotato (Optional)
1. Registriere dich auf [blotato.com](https://blotato.com)
2. Erstelle einen API Key im Dashboard

## 🧪 Funktionen testen

### Leads-Modul testen
1. Navigiere zu `/dashboard/leads`
2. Klicke auf "Import" um Test-Leads zu importieren
3. Verwende die Filter, um Leads zu durchsuchen

### Outreach-Modul testen
1. Navigiere zu `/dashboard/outreach`
2. Erstelle eine neue Kampagne
3. Füge Leads zur Kampagne hinzu

### Content-Modul testen
1. Navigiere zu `/dashboard/content`
2. Generiere neuen Content mit AI
3. Plane Posts für verschiedene Plattformen

### Analytics testen
1. Navigiere zu `/dashboard/analytics`
2. Betrachte die verschiedenen Charts und Metriken
3. Wechsle zwischen den Tabs (Leads, Outreach, Content)

## 🔧 Anpassungen

### Design anpassen
- Farben: Bearbeite `app/globals.css` für Theme-Farben
- Komponenten: Alle UI-Komponenten sind in `components/ui/`
- Layout: Sidebar in `components/app-sidebar.tsx`

### Neue Features hinzufügen
- API Routes: Erstelle neue Dateien in `app/api/`
- Seiten: Füge neue Routen in `app/(dashboard)/` hinzu
- Komponenten: Erstelle wiederverwendbare Komponenten in `components/`

### Lead-Scoring anpassen
Bearbeite `lib/scoring.ts` um die Scoring-Logik anzupassen:
- Jobtitel-Keywords
- Regionen-Gewichtung
- E-Mail-Validierung
- Score-Schwellenwerte

## 📊 Datenbank-Wartung

### Materialized View aktualisieren
```sql
SELECT refresh_weekly_leads_by_region();
```

### Backup erstellen
Nutze Supabase's eingebaute Backup-Funktion oder:
```bash
pg_dump -h db.xxx.supabase.co -U postgres -d postgres > backup.sql
```

## 🚢 Deployment auf Vercel

1. Pushe dein Projekt zu GitHub
2. Verbinde GitHub mit Vercel
3. Importiere das Repository
4. Füge alle Environment Variables hinzu
5. Deploy!

Vercel wird automatisch bei jedem Push deployen.

## 🐛 Troubleshooting

### "Module not found" Fehler
```bash
npm install
```

### Supabase Connection Error
- Überprüfe `.env.local` Werte
- Stelle sicher, dass RLS-Policies korrekt sind
- Prüfe Supabase Dashboard für Fehler

### Build Fehler
```bash
rm -rf .next
npm run build
```

### Port bereits in Verwendung
```bash
# Ändere Port in package.json oder:
npm run dev -- -p 3001
```

## 📚 Weitere Ressourcen

- [Next.js Dokumentation](https://nextjs.org/docs)
- [shadcn-ui Komponenten](https://ui.shadcn.com)
- [Supabase Docs](https://supabase.com/docs)
- [TailwindCSS Docs](https://tailwindcss.com/docs)

## 💡 Best Practices

1. **Sicherheit**
   - Niemals API Keys in Git committen
   - Nutze Environment Variables
   - Aktiviere RLS in Supabase

2. **Performance**
   - Nutze Server Components wo möglich
   - Implementiere Caching für API-Calls
   - Optimiere Bilder mit Next.js Image

3. **Code-Qualität**
   - Nutze TypeScript für Type Safety
   - Schreibe wiederverwendbare Komponenten
   - Kommentiere komplexe Logik

## 🎯 Roadmap

Mögliche zukünftige Erweiterungen:
- [ ] Authentifizierung mit Supabase Auth
- [ ] Real-time Updates mit Supabase Subscriptions
- [ ] Erweiterte Lead-Segmentierung
- [ ] A/B Testing für E-Mail-Templates
- [ ] Webhook-Integration für externe Tools
- [ ] Mobile App mit React Native
- [ ] Team-Collaboration Features
- [ ] Advanced Analytics mit Custom Reports

---

**Viel Erfolg mit deinem Emex Dashboard! 🚀**

Bei Fragen oder Problemen, siehe die Dokumentations-Dateien im Hauptordner.
