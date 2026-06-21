import { PresetLook, ExportProfile } from "../types";

export interface DemoPreset {
  id: "portrait" | "product" | "old_photo";
  name: string;
  tagline: string;
  url: string;
  description: string;
  engineMode: string;
}

export const DEMO_PRESETS: DemoPreset[] = [
  {
    id: "portrait",
    name: "DSLR Portrait Specimen",
    tagline: "Subject No. 8921 // Editorial Fashion",
    url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=1200",
    description: "An ultra-sharp fashion portrait with shallow depth of field. Ideal for skin smoothing, blemish correction, eye highlight boosts, and natural DSLR bokeh amplification.",
    engineMode: "AUTOMATED SKIN & PORTRAIT HARMONIZER"
  },
  {
    id: "product",
    name: "Aesthetic Product Flask",
    tagline: "Commercial Catalog // Matte Chrome",
    url: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&q=80&w=1200",
    description: "A studio commercial flask on custom textured concrete backdrop. Prime for real-time laser outline segmentation, alpha background replacement, and product contrast mastering.",
    engineMode: "GENERATIVE TRANSPLANT & PATH ESTIMATOR"
  },
  {
    id: "old_photo",
    name: "Archival Vintage Family (1942)",
    tagline: "Family Memoir // Silver Gelatin Print",
    url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=1200",
    description: "A vintage portrait with severe sepia fading, dirt scratches, crease failures, and emulsion cracks. Perfect for test-driving neural colorization, scratch healing, and high-contrast de-noising.",
    engineMode: "NEURAL CORE ARCHIVAL EMULSION HEALER"
  }
];

export const PRESET_LOOKS: PresetLook[] = [
  {
    id: "dslr-portrait",
    label: "DSLR Soft Portrait",
    description: "Accentuates center sharpness, creates standard f/1.2 radial bokeh falloff, and softens skin tones.",
    accents: "border-emerald-500 text-emerald-400 bg-emerald-950/20",
    adjustments: { contrast: 10, brightness: 5, bokeh: 65, skinSmooth: 60 }
  },
  {
    id: "cine-gold",
    label: "Cinematic Gold",
    description: "Warm golden-hour amber tones with high-latitude film contrast curves.",
    accents: "border-amber-500 text-amber-400 bg-amber-950/20",
    adjustments: { contrast: 25, brightness: -5, saturation: 15, sharpen: 12 }
  },
  {
    id: "luxury-comm",
    label: "Luxury Commercial",
    description: "Ultra-cool highlights, chrome contrast boost, and extreme color balance synchronization.",
    accents: "border-blue-500 text-blue-400 bg-blue-950/20",
    adjustments: { contrast: 40, brightness: 10, saturation: -5, sharpen: 30 }
  },
  {
    id: "vintage-film",
    label: "1970s Film Look",
    description: "Nostalgic organic halation, chromatic shift, faded velvet blacks, and soft grains.",
    accents: "border-purple-500 text-purple-400 bg-purple-950/20",
    adjustments: { contrast: -10, brightness: -2, saturation: -8, colorization: 40 }
  },
  {
    id: "social-viral",
    label: "Social Media Viral",
    description: "Pop-vibrant colors, exposure lift, sharp contrast edges, and face recovery mapping.",
    accents: "border-cyan-500 text-cyan-400 bg-cyan-950/20",
    adjustments: { contrast: 15, brightness: 15, saturation: 20, sharpen: 15, skinSmooth: 30 }
  }
];

export const EXPORT_PROFILES: ExportProfile[] = [
  { id: "ig-story", platform: "Instagram", dimensions: "1080x1920 px", aspectRatio: "9:16", useCase: "Stories / Reels" },
  { id: "ig-grid", platform: "Instagram / FB", dimensions: "1080x1350 px", aspectRatio: "4:5", useCase: "Portrait Feed" },
  { id: "yt-thumb", platform: "YouTube", dimensions: "1920x1080 px", aspectRatio: "16:9", useCase: "Video Cover Art" },
  { id: "wa-status", platform: "WhatsApp", dimensions: "1080x1920 px", aspectRatio: "9:16", useCase: "Status Video/Photo" },
  { id: "web-hero", platform: "Website", dimensions: "2560x1440 px", aspectRatio: "16:9", useCase: "Ultra HD Web Banner" },
  { id: "print-hq", platform: "Commercial Print", dimensions: "2400x3600 px (300 DPI)", aspectRatio: "2:3", useCase: "Posters / Pamphlets" },
  { id: "billboard", platform: "Ultra-Format Billboard", dimensions: "7680x4320 px (8K)", aspectRatio: "16:9", useCase: "Out of Home Display" }
];
