# 🎨 kie.ai - ALLE Image Generation Models (Vollständig)

## ✅ Verfügbare Image Generation Models

### 1. **Flux Kontext API**
**Model**: `flux-kontext-pro`, `flux-kontext-max`
**Endpoint**: `https://api.kie.ai/api/v1/flux/kontext/generate`
**Credits**: ~0.75 (Pro), ~1.5 (Max)
**Speed**: 10-15s (Pro), 20-30s (Max)
**Quality**: ⭐⭐⭐ (Pro), ⭐⭐⭐⭐⭐ (Max)

---

### 2. **GPT-4O Image API**
**Model**: `gpt-4o-image`
**Endpoint**: `https://api.kie.ai/api/v1/gpt4o-image/generate`
**Credits**: ~2
**Speed**: 15-25s
**Quality**: ⭐⭐⭐⭐
**Features**: Variants, Editing, Mask

---

### 3. **Ideogram V3** ✨ NEU
**Model**: `ideogram/v3-text-to-image`
**Endpoint**: `https://api.kie.ai/api/v1/jobs/createTask`
**Credits**: ~1-1.5 (geschätzt)
**Speed**: 15-20s
**Quality**: ⭐⭐⭐⭐
**Features**: Text rendering, Typography

---

### 4. **Google Imagen 4 Ultra** ✨ NEU
**Model**: `google/imagen4-ultra`
**Endpoint**: `https://api.kie.ai/api/v1/jobs/createTask`
**Credits**: ~2-3 (geschätzt)
**Speed**: 20-30s
**Quality**: ⭐⭐⭐⭐⭐
**Features**: Google's latest, Photorealistic

---

### 5. **Google Nano Banana** ✨ NEU
**Model**: `google/nano-banana`
**Endpoint**: `https://api.kie.ai/api/v1/jobs/createTask`
**Credits**: ~0.5-1 (geschätzt)
**Speed**: 5-10s
**Quality**: ⭐⭐⭐
**Features**: Fast, Lightweight

---

### 6. **Qwen Text-to-Image** ✨ NEU
**Model**: `qwen/text-to-image`
**Endpoint**: `https://api.kie.ai/api/v1/jobs/createTask`
**Credits**: ~1-1.5 (geschätzt)
**Speed**: 15-20s
**Quality**: ⭐⭐⭐⭐
**Features**: Chinese AI model

---

### 7. **ByteDance SeeDream** ✨ NEU
**Model**: `bytedance/seedream`
**Endpoint**: `https://api.kie.ai/api/v1/jobs/createTask`
**Credits**: ~1-2 (geschätzt)
**Speed**: 15-25s
**Quality**: ⭐⭐⭐⭐
**Features**: TikTok's AI model

---

### 8. **ByteDance SeeDream V4** ✨ NEU
**Model**: `bytedance/seedream-v4-text-to-image`
**Endpoint**: `https://api.kie.ai/api/v1/jobs/createTask`
**Credits**: ~1.5-2.5 (geschätzt)
**Speed**: 20-30s
**Quality**: ⭐⭐⭐⭐⭐
**Features**: Latest version, Enhanced

---

## 📊 Model Comparison - Complete

| Model | Speed | Quality | Credits | Best For |
|-------|-------|---------|---------|----------|
| **Flux Pro** | ⚡⚡⚡ | ⭐⭐⭐ | ~0.75 | Social Media, Fast |
| **Nano Banana** | ⚡⚡⚡⚡ | ⭐⭐⭐ | ~0.75 | Ultra Fast |
| **Flux Max** | ⚡⚡ | ⭐⭐⭐⭐⭐ | ~1.5 | Professional |
| **Ideogram V3** | ⚡⚡ | ⭐⭐⭐⭐ | ~1.25 | Typography |
| **Qwen** | ⚡⚡ | ⭐⭐⭐⭐ | ~1.25 | Chinese Text |
| **SeeDream** | ⚡⚡ | ⭐⭐⭐⭐ | ~1.5 | TikTok Style |
| **4O Image** | ⚡⚡ | ⭐⭐⭐⭐ | ~2 | Editing/Variants |
| **SeeDream V4** | ⚡ | ⭐⭐⭐⭐⭐ | ~2 | Latest Tech |
| **Imagen 4 Ultra** | ⚡ | ⭐⭐⭐⭐⭐ | ~2.5 | Photorealistic |

---

## 🎯 Empfohlene Gruppierung für UI

### **Budget** (Fast & Cheap)
- Flux Kontext Pro (~0.75 credits)
- Google Nano Banana (~0.75 credits)

### **Balanced** (Quality & Speed)
- Flux Kontext Max (~1.5 credits)
- Ideogram V3 (~1.25 credits)
- Qwen (~1.25 credits)
- ByteDance SeeDream (~1.5 credits)

### **Premium** (Best Quality)
- GPT-4O Image (~2 credits)
- ByteDance SeeDream V4 (~2 credits)
- Google Imagen 4 Ultra (~2.5 credits)

---

## 🔧 API Endpoints

### Flux & 4O (Alte API):
```
POST https://api.kie.ai/api/v1/flux/kontext/generate
POST https://api.kie.ai/api/v1/gpt4o-image/generate
```

### Neue Models (Jobs API):
```
POST https://api.kie.ai/api/v1/jobs/createTask
GET https://api.kie.ai/api/v1/jobs/queryTask?taskId=xxx
```

**Request Format**:
```json
{
  "model": "ideogram/v3-text-to-image",
  "input": {
    "prompt": "Your prompt here",
    "aspect_ratio": "1:1"
  }
}
```

---

## 💡 Besondere Features

### Ideogram V3:
- ✅ Excellent text rendering
- ✅ Typography in images
- ✅ Logo design

### Google Imagen 4 Ultra:
- ✅ Photorealistic quality
- ✅ Google's latest model
- ✅ Natural lighting

### Google Nano Banana:
- ✅ Ultra-fast generation
- ✅ Lightweight
- ✅ Good for prototyping

### ByteDance SeeDream V4:
- ✅ TikTok's AI
- ✅ Social media optimized
- ✅ Trendy aesthetics

### Qwen:
- ✅ Chinese language support
- ✅ Asian aesthetics
- ✅ Cultural context

---

## 🎨 UI Implementation Plan

### Phase 1: Add New Models ✅
```typescript
const models = [
  // Budget
  { id: 'flux-kontext-pro', name: 'Flux Pro', credits: 0.75, speed: '⚡⚡⚡' },
  { id: 'google/nano-banana', name: 'Nano Banana', credits: 0.75, speed: '⚡⚡⚡⚡' },
  
  // Balanced
  { id: 'flux-kontext-max', name: 'Flux Max', credits: 1.5, speed: '⚡⚡' },
  { id: 'ideogram/v3-text-to-image', name: 'Ideogram V3', credits: 1.25, speed: '⚡⚡' },
  { id: 'qwen/text-to-image', name: 'Qwen', credits: 1.25, speed: '⚡⚡' },
  { id: 'bytedance/seedream', name: 'SeeDream', credits: 1.5, speed: '⚡⚡' },
  
  // Premium
  { id: '4o-image', name: 'GPT-4O', credits: 2, speed: '⚡⚡' },
  { id: 'bytedance/seedream-v4-text-to-image', name: 'SeeDream V4', credits: 2, speed: '⚡' },
  { id: 'google/imagen4-ultra', name: 'Imagen 4 Ultra', credits: 2.5, speed: '⚡' },
]
```

### Phase 2: Backend Integration
- [ ] Implement Jobs API for new models
- [ ] Add polling for task status
- [ ] Handle different response formats
- [ ] Map parameters correctly

---

## ✅ Total: 9 Image Generation Models

**Aktuell implementiert**: 3
**Neu hinzufügen**: 6

**Status**: Bereit für Implementation! 🚀
