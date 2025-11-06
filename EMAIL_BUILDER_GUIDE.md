# 🎨 Professional Email Builder - Unlayer Integration

## ✨ Was ist neu?

Wir haben den Email Builder durch **Unlayer** ersetzt - den professionellsten Drag & Drop Email Editor für React!

### 🚀 Warum Unlayer?

#### **1. Industrie-Standard**
- ✅ Verwendet von: Mailchimp, SendGrid, HubSpot
- ✅ 2.4k+ Projekte nutzen es
- ✅ Aktiv maintained & supported

#### **2. Features**
- ✅ **Drag & Drop** - Intuitive Bedienung
- ✅ **Responsive** - Mobile-optimiert
- ✅ **WYSIWYG** - Was du siehst, ist was du bekommst
- ✅ **Merge Tags** - Variablen-Support
- ✅ **Templates** - Vorgefertigte Designs
- ✅ **Export HTML** - Sauberer Code

#### **3. Komponenten**
- 📝 Text Blocks
- 🖼️ Image Blocks
- 🔘 Button/CTA Blocks
- 📊 Divider & Spacer
- 🎨 Social Media Icons
- 📱 Video Embeds
- 📋 HTML Blocks
- 🎯 Custom Blocks

## 📍 Wo finde ich es?

**Dashboard → Outreach Campaigns → Email Builder Tab**

## 🎯 Features im Detail

### **1. AI-Integration**
```typescript
// Klick auf "AI Generate" Button
- AI erstellt Email-Content
- Automatische Design-Konvertierung
- Merge Tags werden eingefügt
- Professionelles Layout
```

### **2. Merge Tags (Variablen)**
Vordefinierte Variablen:
- `{{firstName}}` - Vorname
- `{{lastName}}` - Nachname
- `{{company}}` - Firma
- `{{jobTitle}}` - Position
- `{{email}}` - Email
- `{{ctaLink}}` - Call-to-Action Link
- `{{unsubscribeLink}}` - Abmelde-Link

### **3. Design-Optionen**
- **Theme**: Modern Light (anpassbar)
- **Locale**: Deutsch (de-DE)
- **Display Mode**: Email-optimiert
- **Content Width**: 600px (Standard)

### **4. Export-Formate**
```typescript
// Beim Speichern:
{
  html_content: "Responsive HTML",
  design_json: "Unlayer Design JSON",
  variables: ["firstName", "company", ...]
}
```

## 🎨 Verwendung

### **Schritt 1: Template erstellen**
1. Gehe zu **Email Builder** Tab
2. Fülle **Name**, **Subject**, **Category** aus
3. Nutze **AI Generate** oder baue manuell

### **Schritt 2: Design bearbeiten**
1. **Drag & Drop** Elemente aus der linken Sidebar
2. **Klick** auf Elemente zum Bearbeiten
3. **Rechte Sidebar** für Styling
4. **Preview** mit verschiedenen Devices

### **Schritt 3: Variablen einfügen**
1. Text-Element auswählen
2. **Merge Tags** Button klicken
3. Variable auswählen (z.B. {{firstName}})
4. Variable wird eingefügt

### **Schritt 4: Speichern**
1. **"Save Template"** Button klicken
2. HTML & Design JSON werden gespeichert
3. Template ist bereit für Kampagnen

## 🤖 AI-Features

### **AI Generate Workflow:**
```typescript
1. User klickt "AI Generate"
2. System lädt Knowledge Base
3. OpenAI generiert Content
4. Content wird in Unlayer-Design konvertiert
5. Design wird in Editor geladen
6. User kann weiter bearbeiten
```

### **Design-Konvertierung:**
```typescript
// AI Text → Unlayer Design
- Header mit Gradient
- Content-Paragraphen
- CTA Button
- Footer mit Unsubscribe
- Responsive Layout
- Brand Colors
```

## 🎨 Design-Templates

### **Standard-Template:**
```
┌─────────────────────────┐
│   Header (Gradient)     │ ← {{company}}
├─────────────────────────┤
│   Content Paragraph 1   │
│   Content Paragraph 2   │
│   Content Paragraph 3   │
├─────────────────────────┤
│   [CTA Button]          │ ← {{ctaLink}}
├─────────────────────────┤
│   Footer (Gray)         │ ← Copyright & Unsubscribe
└─────────────────────────┘
```

### **Farben:**
- **Primary**: #667eea (Lila)
- **Secondary**: #764ba2 (Pink)
- **Text**: #333333 (Dunkelgrau)
- **Background**: #f5f5f5 (Hellgrau)
- **White**: #ffffff

## 📱 Responsive Design

Unlayer erstellt automatisch responsive Emails:
- ✅ **Desktop**: 600px Breite
- ✅ **Tablet**: Fluid Layout
- ✅ **Mobile**: Stack Layout
- ✅ **Email Clients**: Outlook, Gmail, Apple Mail

## 🔧 Technische Details

### **Installation:**
```bash
npm install react-email-editor --save
```

### **Komponente:**
```typescript
<EmailEditor
  ref={emailEditorRef}
  onReady={onReady}
  options={{
    displayMode: 'email',
    locale: 'de-DE',
    appearance: { theme: 'modern_light' },
    mergeTags: { ... }
  }}
/>
```

### **Export:**
```typescript
unlayer.exportHtml((data) => {
  const { design, html } = data
  // design: JSON für Re-Import
  // html: Responsive HTML
})
```

## 🎯 Best Practices

### **1. Mobile-First**
- Teste auf Mobile Devices
- Nutze große Buttons (min. 44px)
- Kurze Texte
- Klare Hierarchie

### **2. Email-Client Kompatibilität**
- Vermeide komplexe CSS
- Nutze Tables für Layout
- Inline Styles bevorzugen
- Teste in verschiedenen Clients

### **3. Accessibility**
- Alt-Text für Bilder
- Kontrast-Verhältnis beachten
- Lesbare Schriftgrößen (min. 14px)
- Klare Link-Texte

### **4. Performance**
- Bilder optimieren (max. 1MB)
- Externe Fonts vermeiden
- HTML-Größe < 100KB
- Wenige HTTP-Requests

## 🔗 Integration mit Kampagnen

### **Workflow:**
```typescript
1. Email Builder → Template erstellen
2. Templates Tab → Template auswählen
3. Campaigns Tab → Neue Kampagne
4. Template zuweisen
5. Leads auswählen
6. Versenden
```

### **Variable Replacement:**
```typescript
// Beim Versand:
html = html.replace(/\{\{firstName\}\}/g, lead.first_name)
html = html.replace(/\{\{company\}\}/g, lead.company)
// etc.
```

## 📊 Vergleich: Alt vs. Neu

| Feature | Alter Builder | Unlayer |
|---------|--------------|---------|
| Drag & Drop | ❌ | ✅ |
| Visual Editor | ⚠️ Basic | ✅ Professional |
| Templates | ❌ | ✅ |
| Responsive | ⚠️ Manual | ✅ Automatic |
| Email Client Support | ⚠️ Limited | ✅ Excellent |
| AI Integration | ✅ | ✅ |
| Merge Tags | ✅ | ✅ Enhanced |
| Export Quality | ⚠️ Basic HTML | ✅ Production-Ready |

## 🚀 Nächste Schritte

1. ✅ **Unlayer installiert** - npm install abgeschlossen
2. ✅ **Komponente erstellt** - ProfessionalEmailBuilder
3. ✅ **Integration** - Im Dashboard verfügbar
4. ⏭️ **Teste Email Builder** - Erstelle erste Email
5. ⏭️ **AI Generate testen** - Mit OpenAI API Key
6. ⏭️ **Template speichern** - In Supabase
7. ⏭️ **Kampagne erstellen** - Mit neuem Template

## 💡 Tipps & Tricks

### **Schnelle Email erstellen:**
1. Klick "AI Generate"
2. Bearbeite Texte
3. Ändere Farben
4. Füge Logo hinzu
5. Save!

### **Template wiederverwenden:**
1. Template speichern mit design_json
2. Beim nächsten Mal: loadDesign(design_json)
3. Anpassen & neu speichern

### **Branding:**
1. Farben in Design anpassen
2. Logo hochladen
3. Als Template speichern
4. Für alle Kampagnen nutzen

## 🆘 Troubleshooting

### **Editor lädt nicht:**
- Dynamic Import prüfen (SSR disabled)
- Browser-Console checken
- npm install verifizieren

### **Variablen funktionieren nicht:**
- Merge Tags in options definiert?
- Richtige Syntax: {{variableName}}
- Case-sensitive!

### **Export-Probleme:**
- emailEditorRef.current prüfen
- onReady Callback abwarten
- exportHtml Callback nutzen

## 📚 Ressourcen

- **Unlayer Docs**: https://docs.unlayer.com/
- **Live Demo**: https://react-email-editor-demo.netlify.app/
- **GitHub**: https://github.com/unlayer/react-email-editor
- **Support**: https://unlayer.com/support

---

**Der professionelle Email Builder ist jetzt einsatzbereit!** 🎉
