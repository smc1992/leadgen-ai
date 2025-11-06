# 🎨 kie.ai - Alle Modelle, Features & Pricing

## 📊 Verfügbare Image Generation APIs

### 1. **Flux Kontext API** ✅ Implementiert
**Endpoint**: `https://api.kie.ai/api/v1/flux/kontext/generate`

#### Models:
| Model | Quality | Speed | Best For | Credits/Image |
|-------|---------|-------|----------|---------------|
| **flux-kontext-pro** | Good | Fast (10-15s) | Social Media, Quick iterations | ~0.5-1 Credits |
| **flux-kontext-max** | Excellent | Slower (20-30s) | Professional, Marketing | ~1-2 Credits |

#### Features:
- ✅ Text-to-Image
- ✅ Image Editing (mit inputImage)
- ✅ 7 Aspect Ratios (1:1, 16:9, 9:16, 4:3, 3:4, 21:9, 16:21)
- ✅ Prompt Enhancement (AI verbessert Prompt)
- ✅ Safety Tolerance (0-6)
- ✅ Output Format (PNG, JPEG)
- ✅ Auto Translation

---

### 2. **4O Image API** 🔄 Verfügbar (GPT-4O Vision)
**Endpoint**: `https://api.kie.ai/api/v1/gpt4o-image/generate`

#### Model:
| Model | Quality | Speed | Best For | Credits/Image |
|-------|---------|-------|----------|---------------|
| **gpt-4o-image** | Excellent | Medium (15-25s) | Complex scenes, Editing | ~1.5-2.5 Credits |

#### Features:
- ✅ Text-to-Image
- ✅ Image Editing (mit filesUrl)
- ✅ Image Variants (nVariants: 1-4)
- ✅ 3 Aspect Ratios (1:1, 3:2, 2:3)
- ✅ Prompt Enhancement (isEnhance)
- ✅ Fallback Mechanism (enableFallback)
- ✅ Mask Editing (für präzise Bearbeitung)
- ✅ Multiple Variants pro Generation

---

## 🎯 Model Vergleich - Detailliert

### Flux Kontext Pro
**Preis**: ~0.5-1 Credits pro Image
**Speed**: 10-15 Sekunden
**Quality**: Good (Standard)

**Pros**:
- ✅ Schnell
- ✅ Günstig
- ✅ Gut für Social Media
- ✅ Balanced Performance

**Cons**:
- ⚠️ Weniger Details bei komplexen Szenen
- ⚠️ Basic Quality

**Best For**:
- Instagram Posts
- Quick Iterations
- Testing Prompts
- High Volume Generation

---

### Flux Kontext Max
**Preis**: ~1-2 Credits pro Image
**Speed**: 20-30 Sekunden
**Quality**: Excellent (Premium)

**Pros**:
- ✅ Höchste Qualität
- ✅ Komplexe Szenen
- ✅ Mehr Details
- ✅ Bessere Farben

**Cons**:
- ⚠️ Langsamer
- ⚠️ Teurer

**Best For**:
- Marketing Material
- Professional Content
- Print Quality
- Hero Images

---

### GPT-4O Image
**Preis**: ~1.5-2.5 Credits pro Image
**Speed**: 15-25 Sekunden
**Quality**: Excellent (AI-Enhanced)

**Pros**:
- ✅ GPT-4 Vision powered
- ✅ Excellent für Editing
- ✅ Multiple Variants
- ✅ Smart Fallback
- ✅ Mask Editing

**Cons**:
- ⚠️ Teurer
- ⚠️ Weniger Aspect Ratios (nur 3)

**Best For**:
- Image Editing
- Variants Generation
- Complex Instructions
- Precise Modifications

---

## 💰 Kosten-Kalkulation

### Beispiel-Szenarien:

#### Szenario 1: Social Media Manager (100 Images/Monat)
```
Model: Flux Kontext Pro
Images: 100
Credits pro Image: 0.75
Total: 75 Credits/Monat
```

#### Szenario 2: Marketing Agency (50 Images/Monat)
```
Model: Flux Kontext Max
Images: 50
Credits pro Image: 1.5
Total: 75 Credits/Monat
```

#### Szenario 3: E-Commerce (200 Product Edits/Monat)
```
Model: GPT-4O Image
Images: 200
Credits pro Image: 2
Total: 400 Credits/Monat
```

---

## 🎨 Feature Matrix

| Feature | Flux Pro | Flux Max | 4O Image |
|---------|----------|----------|----------|
| **Text-to-Image** | ✅ | ✅ | ✅ |
| **Image Editing** | ✅ | ✅ | ✅ |
| **Mask Editing** | ❌ | ❌ | ✅ |
| **Variants** | ❌ | ❌ | ✅ (1-4) |
| **Aspect Ratios** | 7 | 7 | 3 |
| **Prompt Enhancement** | ✅ | ✅ | ✅ |
| **Safety Control** | ✅ (0-6) | ✅ (0-6) | ❌ |
| **Output Formats** | PNG, JPEG | PNG, JPEG | JPG, PNG, WebP |
| **Fallback** | ❌ | ❌ | ✅ |
| **Speed** | ⚡⚡⚡ | ⚡⚡ | ⚡⚡ |
| **Quality** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Price** | 💰 | 💰💰 | 💰💰💰 |

---

## 🎯 Aspect Ratio Support

### Flux Kontext (7 Ratios):
- `1:1` - Square (1024x1024)
- `16:9` - Widescreen (1344x768)
- `9:16` - Portrait (768x1344)
- `4:3` - Standard (1024x768)
- `3:4` - Portrait (768x1024)
- `21:9` - Ultra-Wide (1344x576)
- `16:21` - Ultra-Tall (576x1344)

### 4O Image (3 Ratios):
- `1:1` - Square
- `3:2` - Landscape
- `2:3` - Portrait

---

## 🔧 Advanced Features

### 1. **Prompt Enhancement**
**Flux**: `promptUpsampling: true`
**4O**: `isEnhance: true`

**Beispiel**:
- Input: "sunset"
- Enhanced: "A breathtaking sunset over the ocean with vibrant orange and pink hues reflecting on calm waters, photorealistic, high detail"

**Kosten**: Keine Extra-Credits

---

### 2. **Image Variants** (nur 4O)
```typescript
{
  nVariants: 2, // 1-4 variants
  prompt: "Modern office interior"
}
```
**Output**: 2 verschiedene Varianten
**Kosten**: Credits × Anzahl Variants

---

### 3. **Mask Editing** (nur 4O)
```typescript
{
  filesUrl: ["image.jpg"],
  maskUrl: "mask.png", // Weiß = bearbeiten, Schwarz = behalten
  prompt: "Add flowers"
}
```
**Use Case**: Präzise Bearbeitung bestimmter Bereiche

---

### 4. **Fallback Mechanism** (nur 4O)
```typescript
{
  enableFallback: true
}
```
**Funktion**: Automatischer Retry bei Fehler
**Vorteil**: Höhere Success Rate

---

### 5. **Safety Tolerance** (nur Flux)
```typescript
{
  safetyTolerance: 2 // 0-6
}
```
- `0-1`: Very Strict
- `2-3`: Balanced (Default)
- `4-6`: Permissive (Artistic)

---

## 📝 UI Formular - Vollständig

### **Basic Settings**
1. ✅ **Model Selection**
   - Radio/Select: Flux Pro, Flux Max, 4O Image
   - Mit Credit-Info & Speed-Indicator

2. ✅ **Prompt** (Textarea)
   - Placeholder mit Beispielen
   - Character Counter
   - Tips Button

3. ✅ **Style** (Select)
   - Realistic, Illustration, 3D, Abstract, Minimalist

4. ✅ **Aspect Ratio** (Select)
   - Dynamisch basierend auf Model
   - Mit Preview Icons

---

### **Advanced Settings** (Collapsible)

5. ✅ **Output Format** (Radio)
   - PNG (High Quality)
   - JPEG (Smaller Size)
   - WebP (4O only)

6. ✅ **Prompt Enhancement** (Toggle)
   - Label: "AI Enhance Prompt"
   - Info: "AI will improve your prompt"

7. ✅ **Safety Level** (Slider) - Flux only
   - Range: 0-6
   - Labels: Strict → Permissive

8. ✅ **Variants** (Number Input) - 4O only
   - Range: 1-4
   - Info: "Credits × Variants"

9. ✅ **Fallback** (Toggle) - 4O only
   - Label: "Enable Auto-Retry"

---

### **Expert Settings** (Hidden by default)

10. ⚠️ **Input Image** (File Upload)
    - For Editing Mode
    - Drag & Drop

11. ⚠️ **Mask Image** (File Upload) - 4O only
    - For Precise Editing
    - Preview with Overlay

---

## 💡 UI Layout Empfehlung

```
┌─────────────────────────────────────────┐
│ 🎨 AI Image Generator                   │
├─────────────────────────────────────────┤
│                                          │
│ Model Selection:                         │
│ ○ Flux Pro      ⚡⚡⚡ 💰 (~0.75 credits)│
│ ● Flux Max      ⚡⚡  💰💰 (~1.5 credits)│
│ ○ GPT-4O Image  ⚡⚡  💰💰💰 (~2 credits)│
│                                          │
│ Prompt: [Textarea with examples]         │
│                                          │
│ Style: [Select ▼]                        │
│ Aspect Ratio: [Select ▼] [Preview]      │
│                                          │
├─────────────────────────────────────────┤
│ ⚙️ Advanced Settings (Click to expand)  │
├─────────────────────────────────────────┤
│ Output Format: ○ PNG ● JPEG ○ WebP     │
│ AI Enhance Prompt: [Toggle ●]           │
│ Safety Level: [Slider ●────────]        │
│ Variants (4O): [1] [2] [3] [4]          │
│ Auto-Retry (4O): [Toggle ●]             │
│                                          │
├─────────────────────────────────────────┤
│ Estimated Cost: ~1.5 Credits            │
│ Generation Time: ~20-30 seconds         │
│                                          │
│ [Cancel] [Generate Image →]             │
└─────────────────────────────────────────┘
```

---

## 🎯 Implementierungs-Priorität

### Phase 1: ✅ Basic (Aktuell)
- [x] Flux Kontext Pro/Max
- [x] Basic Parameters
- [x] 7 Aspect Ratios

### Phase 2: 🔄 Enhanced (Nächster Schritt)
- [ ] Model Selection UI mit Credits
- [ ] Advanced Settings Accordion
- [ ] Cost Calculator
- [ ] Speed Indicator

### Phase 3: 🚀 Complete
- [ ] 4O Image API Integration
- [ ] Variants Support
- [ ] Mask Editing
- [ ] Fallback Mechanism

### Phase 4: 💎 Premium
- [ ] A/B Testing (Multiple Models)
- [ ] Batch Processing
- [ ] Cost Analytics
- [ ] Model Comparison Tool

---

## 📊 Credit Pricing (Geschätzt)

**Note**: Genaue Preise auf https://kie.ai/pricing

### Flux Kontext:
- **Pro**: 0.5-1 Credits/Image
- **Max**: 1-2 Credits/Image

### 4O Image:
- **Standard**: 1.5-2.5 Credits/Image
- **With Variants**: Credits × nVariants

### Beispiel-Pakete:
- **Starter**: 100 Credits (~$10)
- **Pro**: 500 Credits (~$40)
- **Business**: 2000 Credits (~$150)

---

## 🎨 Prompt Templates

### Realistic Photography:
```
"[Subject], photorealistic, high detail, professional photography, studio lighting, 4K quality"
```

### Illustration:
```
"[Subject], digital illustration, vibrant colors, artistic style, detailed artwork"
```

### 3D Render:
```
"[Subject], 3D render, octane render, high quality, realistic materials, dramatic lighting"
```

### Abstract:
```
"[Subject], abstract art, creative composition, bold colors, artistic interpretation"
```

### Minimalist:
```
"[Subject], minimalist design, clean lines, simple composition, modern aesthetic"
```

---

## ✅ Zusammenfassung

**Verfügbare Models**: 3
- Flux Kontext Pro (Fast & Cheap)
- Flux Kontext Max (Best Quality)
- GPT-4O Image (AI-Enhanced)

**Features**: 11+
- Text-to-Image
- Image Editing
- Variants (4O)
- Mask Editing (4O)
- Prompt Enhancement
- Safety Control (Flux)
- Fallback (4O)
- Multiple Formats
- 7-10 Aspect Ratios
- Auto Translation
- Webhooks

**Credits**: 0.5-2.5 per Image
**Speed**: 10-30 Sekunden
**Quality**: Good to Excellent

---

**Alle kie.ai Features sind jetzt vollständig dokumentiert! 🎨**
