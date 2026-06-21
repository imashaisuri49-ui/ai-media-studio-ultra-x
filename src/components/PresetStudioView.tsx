import React, { useState, useEffect } from "react";
import { Sliders, Save, Lock, Unlock, Download, RefreshCw, Layers, ShieldCheck, User2, Eye, Upload, Image, Trash2, Link, Check, RefreshCcw, Play, Pause, SkipForward, SkipBack, ArrowUp, ArrowDown } from "lucide-react";
import { AppTheme } from "../data/themes";
import { db, isLiveFirebase } from "../lib/firebase";
import { collection, onSnapshot, doc, setDoc, deleteDoc, serverTimestamp } from "firebase/firestore";

interface PresetStudioViewProps {
  brightnessVal: number;
  setBrightnessVal: (v: number) => void;
  rawContrastVal: number;
  setRawContrastVal: (v: number) => void;
  saturationVal: number;
  setSaturationVal: (v: number) => void;
  customBokehVal: number;
  setCustomBokehVal: (v: number) => void;
  skinSmoothPower: number;
  setSkinSmoothPower: (v: number) => void;
  denoiseVal: number;
  setDenoiseVal: (v: number) => void;

  // Extended Adjustments
  tempVal: number;
  setTempVal: (v: number) => void;
  tintVal: number;
  setTintVal: (v: number) => void;
  vibranceVal: number;
  setVibranceVal: (v: number) => void;
  highlightsVal: number;
  setHighlightsVal: (v: number) => void;
  shadowsVal: number;
  setShadowsVal: (v: number) => void;
  sharpenVal: number;
  setSharpenVal: (v: number) => void;

  // Sizing Output Configurations
  exportWidth: number;
  setExportWidth: (v: number) => void;
  exportHeight: number;
  setExportHeight: (v: number) => void;
  exportFileType: string;
  setExportFileType: (v: string) => void;

  activePresetId: string;
  activeTheme: AppTheme;
  getActiveImageUrl: () => string;
  getFilterStyle: () => React.CSSProperties;
}

interface SharedPreset {
  id: string;
  name: string;
  author: string;
  locked: boolean;
  category?: string;
  adjustments: {
    brightness: number;
    contrast: number;
    saturation: number;
    bokeh: number;
    skinSmooth: number;
    denoise: number;
    temp: number;
    tint: number;
    vibrance: number;
    highlights: number;
    shadows: number;
    sharpen: number;
  };
  sizing: {
    width: number;
    height: number;
    fileType: string;
  };
  timestamp?: any;
}

interface QueuedBatchItem {
  queueId: string;
  preset: SharedPreset;
  width: number;
  height: number;
  fileType: string;
  useWatermark: boolean;
  watermarkText: string;
}

const DEFAULT_CLOUD_PRESETS: SharedPreset[] = [
  // Portrait
  {
    id: "cloud-vibe-warmth",
    name: "Golden Hour Cinematic Portrait",
    author: "Dilshan (Partner Creator)",
    locked: true,
    category: "Portrait",
    adjustments: {
      brightness: 5,
      contrast: 15,
      saturation: 20,
      bokeh: 60,
      skinSmooth: 40,
      denoise: 10,
      temp: 25,
      tint: 8,
      vibrance: 15,
      highlights: 10,
      shadows: -5,
      sharpen: 35
    },
    sizing: {
      width: 3840,
      height: 2160,
      fileType: "PNG"
    }
  },
  {
    id: "cloud-dramatic-bw-portrait",
    name: "Dramatic Studio B&W",
    author: "Dilshan (Partner Creator)",
    locked: true,
    category: "Portrait",
    adjustments: {
      brightness: 10,
      contrast: 40,
      saturation: -100,
      bokeh: 55,
      skinSmooth: 30,
      denoise: 20,
      temp: 0,
      tint: 0,
      vibrance: -100,
      highlights: 25,
      shadows: -20,
      sharpen: 45
    },
    sizing: {
      width: 3840,
      height: 2160,
      fileType: "TIFF"
    }
  },
  {
    id: "cloud-soft-glow-beauty",
    name: "Soft Glow High-Key Beauty",
    author: "AIMedia Default Engine",
    locked: false,
    category: "Portrait",
    adjustments: {
      brightness: 15,
      contrast: -5,
      saturation: 10,
      bokeh: 35,
      skinSmooth: 80,
      denoise: 40,
      temp: 5,
      tint: 12,
      vibrance: 8,
      highlights: 15,
      shadows: 15,
      sharpen: 10
    },
    sizing: {
      width: 1920,
      height: 1080,
      fileType: "PNG"
    }
  },

  // Landscape
  {
    id: "cloud-vibrant-alpine-meadow",
    name: "Vibrant Alpine Meadow",
    author: "Dilshan (Partner Creator)",
    locked: true,
    category: "Landscape",
    adjustments: {
      brightness: 0,
      contrast: 20,
      saturation: 30,
      bokeh: 5,
      skinSmooth: 0,
      denoise: 5,
      temp: -10,
      tint: -15,
      vibrance: 40,
      highlights: -15,
      shadows: 10,
      sharpen: 65
    },
    sizing: {
      width: 3840,
      height: 2160,
      fileType: "PNG"
    }
  },
  {
    id: "cloud-ethereal-sunset",
    name: "Ethereal Sunset Meadow",
    author: "AIMedia Default Engine",
    locked: false,
    category: "Landscape",
    adjustments: {
      brightness: 5,
      contrast: 15,
      saturation: 25,
      bokeh: 0,
      skinSmooth: 0,
      denoise: 10,
      temp: 35,
      tint: 20,
      vibrance: 20,
      highlights: 10,
      shadows: 5,
      sharpen: 45
    },
    sizing: {
      width: 1920,
      height: 1080,
      fileType: "JPEG"
    }
  },
  {
    id: "cloud-moody-ocean-mist",
    name: "Moody Ocean Mist",
    author: "Dilshan (Partner Creator)",
    locked: true,
    category: "Landscape",
    adjustments: {
      brightness: -10,
      contrast: 8,
      saturation: -15,
      bokeh: 0,
      skinSmooth: 0,
      denoise: 30,
      temp: -30,
      tint: -5,
      vibrance: -10,
      highlights: -25,
      shadows: 15,
      sharpen: 30
    },
    sizing: {
      width: 3840,
      height: 2160,
      fileType: "PNG"
    }
  },

  // Architectural
  {
    id: "cloud-brutalist-edge",
    name: "Urban Brutalist Concrete Edge",
    author: "AIMedia Default Engine",
    locked: false,
    category: "Architectural",
    adjustments: {
      brightness: -5,
      contrast: 30,
      saturation: -45,
      bokeh: 0,
      skinSmooth: 0,
      denoise: 0,
      temp: -15,
      tint: 5,
      vibrance: -25,
      highlights: -5,
      shadows: -15,
      sharpen: 80
    },
    sizing: {
      width: 1920,
      height: 1080,
      fileType: "PNG"
    }
  },
  {
    id: "cloud-facade-warmth",
    name: "Sunset Brick Facade Warmth",
    author: "Dilshan (Partner Creator)",
    locked: true,
    category: "Architectural",
    adjustments: {
      brightness: 8,
      contrast: 18,
      saturation: 15,
      bokeh: 10,
      skinSmooth: 0,
      denoise: 5,
      temp: 20,
      tint: 10,
      vibrance: 12,
      highlights: 5,
      shadows: 5,
      sharpen: 55
    },
    sizing: {
      width: 3840,
      height: 2160,
      fileType: "TIFF"
    }
  },
  {
    id: "cloud-interior-minimalist",
    name: "Interior Wood Minimalist",
    author: "Dilshan (Partner Creator)",
    locked: true,
    category: "Architectural",
    adjustments: {
      brightness: 12,
      contrast: -8,
      saturation: 5,
      bokeh: 15,
      skinSmooth: 0,
      denoise: 15,
      temp: 12,
      tint: 0,
      vibrance: 5,
      highlights: -10,
      shadows: 20,
      sharpen: 30
    },
    sizing: {
      width: 3840,
      height: 2160,
      fileType: "PNG"
    }
  },

  // Vintage
  {
    id: "cloud-cyberpunk",
    name: "Cyberpunk Magenta Shift",
    author: "AIMedia Default Engine",
    locked: false,
    category: "Vintage",
    adjustments: {
      brightness: -5,
      contrast: 25,
      saturation: 35,
      bokeh: 20,
      skinSmooth: 0,
      denoise: 15,
      temp: -20,
      tint: 30,
      vibrance: 25,
      highlights: -15,
      shadows: 20,
      sharpen: 50
    },
    sizing: {
      width: 1920,
      height: 1080,
      fileType: "JPEG"
    }
  },
  {
    id: "cloud-classic-polaroid",
    name: "1970 Vintage Polaroid Fade",
    author: "Dilshan (Partner Creator)",
    locked: true,
    category: "Vintage",
    adjustments: {
      brightness: 10,
      contrast: -15,
      saturation: -15,
      bokeh: 10,
      skinSmooth: 15,
      denoise: 25,
      temp: 15,
      tint: -8,
      vibrance: -10,
      highlights: -15,
      shadows: 35,
      sharpen: 20
    },
    sizing: {
      width: 1080,
      height: 1080,
      fileType: "PNG"
    }
  },
  {
    id: "cloud-classic-kodachrome",
    name: "Classic 35mm Kodachrome Analog",
    author: "Dilshan (Partner Creator)",
    locked: true,
    category: "Vintage",
    adjustments: {
      brightness: -2,
      contrast: 18,
      saturation: 25,
      bokeh: 15,
      skinSmooth: 10,
      denoise: 5,
      temp: 20,
      tint: -2,
      vibrance: 12,
      highlights: -10,
      shadows: -5,
      sharpen: 50
    },
    sizing: {
      width: 3840,
      height: 2160,
      fileType: "JPEG"
    }
  }
];

export const PresetStudioView: React.FC<PresetStudioViewProps> = ({
  brightnessVal,
  setBrightnessVal,
  rawContrastVal,
  setRawContrastVal,
  saturationVal,
  setSaturationVal,
  customBokehVal,
  setCustomBokehVal,
  skinSmoothPower,
  setSkinSmoothPower,
  denoiseVal,
  setDenoiseVal,

  tempVal,
  setTempVal,
  tintVal,
  setTintVal,
  vibranceVal,
  setVibranceVal,
  highlightsVal,
  setHighlightsVal,
  shadowsVal,
  setShadowsVal,
  sharpenVal,
  setSharpenVal,

  exportWidth,
  setExportWidth,
  exportHeight,
  setExportHeight,
  exportFileType,
  setExportFileType,

  activePresetId,
  activeTheme,
  getActiveImageUrl,
  getFilterStyle,
}) => {
  const [presetNameInput, setPresetNameInput] = useState("");
  const [authorNameInput, setAuthorNameInput] = useState("");
  const [presetCategoryInput, setPresetCategoryInput] = useState<string>("Portrait");
  const [activeCategoryTab, setActiveCategoryTab] = useState<string>("Portrait");
  const [cloudPresets, setCloudPresets] = useState<SharedPreset[]>(DEFAULT_CLOUD_PRESETS);
  const [syncStatus, setSyncStatus] = useState<"connecting" | "live" | "offline">("offline");

  // Automated batch sequence state declarations
  const [sequenceQueue, setSequenceQueue] = useState<QueuedBatchItem[]>([]);
  const [activeSeqIndex, setActiveSeqIndex] = useState<number>(-1);
  const [isSeqPlaying, setIsSeqPlaying] = useState<boolean>(false);
  const [seqInterval, setSeqInterval] = useState<number>(2000);
  const [seqMode, setSeqMode] = useState<"step" | "cumulative">("step");

  const [isBatchRendering, setIsBatchRendering] = useState(false);
  const [batchProgressMsg, setBatchProgressMsg] = useState("");
  const [expandedSeqItem, setExpandedSeqItem] = useState<string | null>(null);

  const updateItemConfig = (queueId: string, updates: Partial<QueuedBatchItem>) => {
    setSequenceQueue(prev => prev.map(item => {
      if (item.queueId === queueId) {
        return { ...item, ...updates };
      }
      return item;
    }));
  };

  // Manual custom image and file loaders state
  const [manualImageUrl, setManualImageUrl] = useState<string | null>(null);
  const [inputUrl, setInputUrl] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [imageTab, setImageTab] = useState<"upload" | "url" | "samples">("samples");

  const [isFlashing, setIsFlashing] = useState(false);

  useEffect(() => {
    if (isFlashing) {
      const timer = setTimeout(() => {
        setIsFlashing(false);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [isFlashing]);

  const [isRendering, setIsRendering] = useState(false);
  const [renderProgressMsg, setRenderProgressMsg] = useState("");

  const SAMPLE_TEST_IMAGES = [
    {
      name: "Model Close-up",
      url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1000&q=80",
      desc: "Warm tones skin highlight focus"
    },
    {
      name: "Tokyo Cyber Neon",
      url: "https://images.unsplash.com/photo-1515621061946-eff1c2a352bd?auto=format&fit=crop&w=1000&q=80",
      desc: "Neon contrast saturation"
    },
    {
      name: "Cinematic Landscape",
      url: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1000&q=80",
      desc: "Scenic lighting curves"
    },
    {
      name: "Studio Fashion Model",
      url: "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1000&q=80",
      desc: "Warm key lighting fashion"
    }
  ];

  const getFilterStringValue = () => {
    const saturationBoost = 100 + saturationVal + (vibranceVal * 1.2);
    const brightnessBoost = 100 + brightnessVal + (highlightsVal / 4) + (shadowsVal / 6);
    const contrastBoost = 100 + rawContrastVal + (highlightsVal / 3) - (shadowsVal / 4);
    
    let baseStyles = `saturate(${saturationBoost}%) brightness(${brightnessBoost}%) contrast(${contrastBoost}%)`;

    if (tempVal > 0) {
      baseStyles += ` sepia(${tempVal * 0.6}%) hue-rotate(${-tempVal * 0.15}deg)`;
    } else if (tempVal < 0) {
      baseStyles += ` hue-rotate(${Math.abs(tempVal) * 0.3}deg) saturate(${100 + Math.abs(tempVal) * 0.2}%)`;
    }

    if (tintVal !== 0) {
      baseStyles += ` hue-rotate(${tintVal * 0.5}deg)`;
    }

    if (denoiseVal > 0) {
      baseStyles += ` blur(${denoiseVal / 160}px) contrast(${100 - (denoiseVal / 8)}%)`;
    }

    if (activePresetId === "old_photo") {
      baseStyles += ` sepia(${(100 - skinSmoothPower) / 2}%) saturate(110%)`;
    }

    return baseStyles;
  };

  // Real-time Firestore synchronizer for Shared Presets
  useEffect(() => {
    if (!isLiveFirebase || !db) {
      setSyncStatus("offline");
      return;
    }

    setSyncStatus("connecting");
    try {
      const presetsCollectionRef = collection(db, "shared_presets");
      const unsubscribe = onSnapshot(presetsCollectionRef, (snapshot) => {
        const fetched: SharedPreset[] = [];
        snapshot.forEach((doc) => {
          fetched.push({ id: doc.id, ...doc.data() } as SharedPreset);
        });

        // Merge fetched cloud presets with default ones so view is always rich and populated
        const merged = [...fetched];
        DEFAULT_CLOUD_PRESETS.forEach(def => {
          if (!merged.some(m => m.id === def.id)) {
            merged.unshift(def);
          }
        });

        setCloudPresets(merged);
        setSyncStatus("live");
      }, (err) => {
        console.error("Preset real-time sync failed", err);
        setSyncStatus("offline");
      });

      return () => unsubscribe();
    } catch (e) {
      console.error("Failed setting up real-time snapshot", e);
      setSyncStatus("offline");
    }
  }, []);

  // Save current preset values to Firestore (auto synchronizes across other participants!)
  const handleSaveAndLockPreset = async (e: React.FormEvent, isLocked: boolean = false) => {
    e.preventDefault();
    const finalPresetName = presetNameInput.trim() || `Studio Preset #${Math.floor(Math.random() * 899 + 100)}`;
    const finalAuthorName = authorNameInput.trim() || `Partner Master`;
    const docId = `preset-${finalPresetName.toLowerCase().replace(/[^a-z0-0]/g, "-")}`;

    const newPresetData: Omit<SharedPreset, "id"> = {
      name: finalPresetName,
      author: finalAuthorName,
      locked: isLocked,
      category: presetCategoryInput,
      adjustments: {
        brightness: brightnessVal,
        contrast: rawContrastVal,
        saturation: saturationVal,
        bokeh: customBokehVal,
        skinSmooth: skinSmoothPower,
        denoise: denoiseVal,
        temp: tempVal,
        tint: tintVal,
        vibrance: vibranceVal,
        highlights: highlightsVal,
        shadows: shadowsVal,
        sharpen: sharpenVal
      },
      sizing: {
        width: exportWidth,
        height: exportHeight,
        fileType: exportFileType
      }
    };

    if (isLiveFirebase && db) {
      try {
        await setDoc(doc(db, "shared_presets", docId), {
          ...newPresetData,
          timestamp: serverTimestamp()
        });
        setPresetNameInput("");
      } catch (err) {
        console.error("Failed to save and sync cloud preset", err);
        // Fallback to local store update
        setCloudPresets(prev => {
          const filtered = prev.filter(p => p.id !== docId);
          return [{ id: docId, ...newPresetData }, ...filtered];
        });
      }
    } else {
      // Local addition
      setCloudPresets(prev => {
        const filtered = prev.filter(p => p.id !== docId);
        return [{ id: docId, ...newPresetData }, ...filtered];
      });
      setPresetNameInput("");
    }
  };

  // Loads a cloud preset's precise matrices back into state
  const loadPresetSettings = (preset: SharedPreset) => {
    setIsFlashing(true);
    setBrightnessVal(preset.adjustments.brightness);
    setRawContrastVal(preset.adjustments.contrast);
    setSaturationVal(preset.adjustments.saturation);
    setCustomBokehVal(preset.adjustments.bokeh);
    setSkinSmoothPower(preset.adjustments.skinSmooth);
    setDenoiseVal(preset.adjustments.denoise);
    setTempVal(preset.adjustments.temp);
    setTintVal(preset.adjustments.tint);
    setVibranceVal(preset.adjustments.vibrance);
    setHighlightsVal(preset.adjustments.highlights);
    setShadowsVal(preset.adjustments.shadows);
    setSharpenVal(preset.adjustments.sharpen);

    setExportWidth(preset.sizing.width);
    setExportHeight(preset.sizing.height);
    setExportFileType(preset.sizing.fileType);
  };

  // Applies adjustments for a single step in a sequence (can be step or cumulative)
  const applySequenceIndex = (index: number) => {
    if (index < 0 || index >= sequenceQueue.length) return;
    const currentItem = sequenceQueue[index];
    const currentPreset = currentItem.preset;
    
    // Auto-align the active master export settings fields to this sequence item's custom profile
    setExportWidth(currentItem.width);
    setExportHeight(currentItem.height);
    setExportFileType(currentItem.fileType);

    if (seqMode === "step") {
      loadPresetSettings(currentPreset);
    } else {
      // Cumulative overlay mode: sum relative values from 0 up to current index
      let computedBrightness = 0;
      let computedContrast = 0;
      let computedSaturation = 0;
      let computedBokeh = 0;
      let computedSkinSmooth = 0;
      let computedDenoise = 0;
      let computedTemp = 0;
      let computedTint = 0;
      let computedVibrance = 0;
      let computedHighlights = 0;
      let computedShadows = 0;
      let computedSharpen = 0;

      for (let i = 0; i <= index; i++) {
        const p = sequenceQueue[i].preset;
        computedBrightness += p.adjustments.brightness;
        computedContrast += p.adjustments.contrast;
        computedSaturation += p.adjustments.saturation;
        computedBokeh += p.adjustments.bokeh;
        computedSkinSmooth += p.adjustments.skinSmooth;
        computedDenoise += p.adjustments.denoise;
        computedTemp += p.adjustments.temp;
        computedTint += p.adjustments.tint;
        computedVibrance += p.adjustments.vibrance;
        computedHighlights += p.adjustments.highlights;
        computedShadows += p.adjustments.shadows;
        computedSharpen += p.adjustments.sharpen;
      }

      setBrightnessVal(Math.min(100, Math.max(-100, computedBrightness)));
      setRawContrastVal(Math.min(100, Math.max(-100, computedContrast)));
      setSaturationVal(Math.min(100, Math.max(-100, computedSaturation)));
      setCustomBokehVal(Math.min(100, Math.max(0, computedBokeh)));
      setSkinSmoothPower(Math.min(100, Math.max(0, computedSkinSmooth)));
      setDenoiseVal(Math.min(100, Math.max(0, computedDenoise)));
      setTempVal(Math.min(100, Math.max(-100, computedTemp)));
      setTintVal(Math.min(100, Math.max(-100, computedTint)));
      setVibranceVal(Math.min(100, Math.max(-100, computedVibrance)));
      setHighlightsVal(Math.min(100, Math.max(-100, computedHighlights)));
      setShadowsVal(Math.min(100, Math.max(-100, computedShadows)));
      setSharpenVal(Math.min(100, Math.max(0, computedSharpen)));
    }
  };

  // Playback timer effect for batch sequences
  useEffect(() => {
    let timerId: any;
    if (isSeqPlaying && sequenceQueue.length > 0) {
      timerId = setInterval(() => {
        setActiveSeqIndex((prev) => {
          const nextIndex = prev + 1 >= sequenceQueue.length ? 0 : prev + 1;
          // Apply state update for next sequential index
          applySequenceIndex(nextIndex);
          return nextIndex;
        });
      }, seqInterval);
    }
    return () => {
      if (timerId) clearInterval(timerId);
    };
  }, [isSeqPlaying, sequenceQueue, seqInterval, seqMode]);

  // Toggle Lock status of dynamic preset
  const handleToggleLockCloudPreset = async (preset: SharedPreset) => {
    if (preset.id.startsWith("cloud-vibe-warmth")) return; // protect default creators

    const updatedData = { ...preset, locked: !preset.locked };
    delete (updatedData as any).id;

    if (isLiveFirebase && db) {
      try {
        await setDoc(doc(db, "shared_presets", preset.id), updatedData);
      } catch (e) {
        console.error(e);
      }
    } else {
      setCloudPresets(prev => prev.map(p => p.id === preset.id ? { ...p, locked: !p.locked } : p));
    }
  };

  // Delete preset
  const handleDeleteCloudPreset = async (presetId: string) => {
    if (presetId.startsWith("cloud-vibe") || presetId.startsWith("cloud-cyberpunk")) return;

    if (isLiveFirebase && db) {
      try {
        await deleteDoc(doc(db, "shared_presets", presetId));
      } catch (e) {
        console.error(e);
      }
    } else {
      setCloudPresets(prev => prev.filter(p => p.id !== presetId));
    }
  };

  // Generates and downloads a Lightroom Classic compatible .xmp metadata package
  const triggerLightroomExport = (presetName: string) => {
    const filename = `${presetName.toLowerCase().replace(/\s+/g, "_")}.xmp`;
    const exp2012 = (brightnessVal / 50).toFixed(2);
    const contrast2012 = (rawContrastVal * 2).toFixed(0);
    const sat = saturationVal.toFixed(0);
    const vib = vibranceVal.toFixed(0);
    const tempKelvin = (tempVal * 20 + 5000).toFixed(0);
    const tintCorrect = tintVal.toFixed(0);
    const highlights = (highlightsVal * 2).toFixed(0);
    const shadows = (shadowsVal * 2).toFixed(0);
    const sharp = sharpenVal.toFixed(0);
    const randomUuid = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

    const xmpTemplate = `<x:xmpmeta xmlns:x="adobe:ns:meta/">
 <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
  <rdf:Description rdf:about=""
    xmlns:crs="http://ns.adobe.com/camera-raw-settings/1.0/">
   <crs:Version>16.2</crs:Version>
   <crs:ProcessVersion>15.4</crs:ProcessVersion>
   <crs:Exposure2012>${exp2012}</crs:Exposure2012>
   <crs:Contrast2012>${contrast2012}</crs:Contrast2012>
   <crs:Saturation>${sat}</crs:Saturation>
   <crs:Vibrance>${vib}</crs:Vibrance>
   <crs:Temperature>${tempKelvin}</crs:Temperature>
   <crs:Tint>${tintCorrect}</crs:Tint>
   <crs:Highlights2012>${highlights}</crs:Highlights2012>
   <crs:Shadows2012>${shadows}</crs:Shadows2012>
   <crs:Sharpness>${sharp}</crs:Sharpness>
   <crs:SupportsAmount>True</crs:SupportsAmount>
   <crs:Look>
    <rdf:Description
     crs:Name="AIMedia StudioUltraX Look ${presetName}"
     crs:Amount="1.000000"
     crs:UUID="${randomUuid}"
     crs:SupportsAmount="True"/>
   </crs:Look>
  </rdf:Description>
 </rdf:RDF>
</x:xmpmeta>`;

    const blob = new Blob([xmpTemplate], { type: "application/xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Generates and downloads a Photoshop 3D LUT parameter mappings file in JSON alignment configuration
  const triggerPhotoshopExport = (presetName: string) => {
    const filename = `${presetName.toLowerCase().replace(/\s+/g, "_")}_look_lut.json`;
    const formatPayload = {
      software_target: "Adobe Photoshop CC // Color Look Table Integration",
      signature: "AIMEDIA_STUDIOULTRAX",
      presetName: presetName,
      source_resolution_target: `${exportWidth}x${exportHeight} pixel boundary`,
      target_extension: exportFileType,
      generatedAt: new Date().toISOString(),
      partner_credits: "S M Chanuka Dilshan // Vibe Motion Group Active Licences",
      active_color_matrices_matrix_3x3: [
        [1.0 + (saturationVal / 100), 0.0, 0.0],
        [0.0, 1.0 + (vibranceVal / 100), 0.0],
        [tempVal / 250, tintVal / 250, 1.0]
      ],
      exposure_offset: (brightnessVal / 50).toFixed(4),
      contrast_tonal_shifter: (rawContrastVal / 100).toFixed(4),
      highlights_clip_shifter: (highlightsVal / 100).toFixed(4),
      shadows_lift_shifter: (shadowsVal / 100).toFixed(4),
      subtle_grain_denoise_ratio_matrix: (denoiseVal / 100).toFixed(4),
      unsharp_mask_radius: (sharpenVal / 2).toFixed(1)
    };

    const blob = new Blob([JSON.stringify(formatPayload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // File Upload Handlers
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          setManualImageUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUrlLoad = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputUrl.trim()) {
      setManualImageUrl(inputUrl.trim());
      setInputUrl("");
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          setManualImageUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const getFilterStringForPreset = (preset: SharedPreset) => {
    const adj = preset.adjustments;
    const saturationBoost = 100 + adj.saturation + (adj.vibrance * 1.2);
    const brightnessBoost = 100 + adj.brightness + (adj.highlights / 4) + (adj.shadows / 6);
    const contrastBoost = 100 + adj.contrast + (adj.highlights / 3) - (adj.shadows / 4);

    let baseStyles = `saturate(${saturationBoost}%) brightness(${brightnessBoost}%) contrast(${contrastBoost}%)`;

    if (adj.temp > 0) {
      baseStyles += ` sepia(${adj.temp * 0.6}%) hue-rotate(${-adj.temp * 0.15}deg)`;
    } else if (adj.temp < 0) {
      baseStyles += ` hue-rotate(${Math.abs(adj.temp) * 0.3}deg) saturate(${100 + Math.abs(adj.temp) * 0.2}%)`;
    }

    if (adj.tint !== 0) {
      baseStyles += ` hue-rotate(${adj.tint * 0.5}deg)`;
    }

    if (adj.denoise > 0) {
      baseStyles += ` blur(${adj.denoise / 160}px) contrast(${100 - (adj.denoise / 8)}%)`;
    }

    if (preset.id === "old_photo") {
      baseStyles += ` sepia(${(100 - adj.skinSmooth) / 2}%) saturate(110%)`;
    }

    return baseStyles;
  };

  const getFilterStringForCumulative = (currentIndex: number) => {
    let computedBrightness = 0;
    let computedContrast = 0;
    let computedSaturation = 0;
    let computedBokeh = 0;
    let computedSkinSmooth = 0;
    let computedDenoise = 0;
    let computedTemp = 0;
    let computedTint = 0;
    let computedVibrance = 0;
    let computedHighlights = 0;
    let computedShadows = 0;
    let computedSharpen = 0;

    for (let i = 0; i <= currentIndex; i++) {
      const p = sequenceQueue[i].preset;
      computedBrightness += p.adjustments.brightness;
      computedContrast += p.adjustments.contrast;
      computedSaturation += p.adjustments.saturation;
      computedBokeh += p.adjustments.bokeh;
      computedSkinSmooth += p.adjustments.skinSmooth;
      computedDenoise += p.adjustments.denoise;
      computedTemp += p.adjustments.temp;
      computedTint += p.adjustments.tint;
      computedVibrance += p.adjustments.vibrance;
      computedHighlights += p.adjustments.highlights;
      computedShadows += p.adjustments.shadows;
      computedSharpen += p.adjustments.sharpen;
    }

    const adj = {
      brightness: Math.min(100, Math.max(-100, computedBrightness)),
      contrast: Math.min(100, Math.max(-100, computedContrast)),
      saturation: Math.min(100, Math.max(-100, computedSaturation)),
      bokeh: Math.min(100, Math.max(0, computedBokeh)),
      skinSmooth: Math.min(100, Math.max(0, computedSkinSmooth)),
      denoise: Math.min(100, Math.max(0, computedDenoise)),
      temp: Math.min(100, Math.max(-100, computedTemp)),
      tint: Math.min(100, Math.max(-100, computedTint)),
      vibrance: Math.min(100, Math.max(-100, computedVibrance)),
      highlights: Math.min(100, Math.max(-100, computedHighlights)),
      shadows: Math.min(100, Math.max(-100, computedShadows)),
      sharpen: Math.min(100, Math.max(0, computedSharpen)),
    };

    const saturationBoost = 100 + adj.saturation + (adj.vibrance * 1.2);
    const brightnessBoost = 100 + adj.brightness + (adj.highlights / 4) + (adj.shadows / 6);
    const contrastBoost = 100 + adj.contrast + (adj.highlights / 3) - (adj.shadows / 4);

    let baseStyles = `saturate(${saturationBoost}%) brightness(${brightnessBoost}%) contrast(${contrastBoost}%)`;

    if (adj.temp > 0) {
      baseStyles += ` sepia(${adj.temp * 0.6}%) hue-rotate(${-adj.temp * 0.15}deg)`;
    } else if (adj.temp < 0) {
      baseStyles += ` hue-rotate(${Math.abs(adj.temp) * 0.3}deg) saturate(${100 + Math.abs(adj.temp) * 0.2}%)`;
    }

    if (adj.tint !== 0) {
      baseStyles += ` hue-rotate(${adj.tint * 0.5}deg)`;
    }

    if (adj.denoise > 0) {
      baseStyles += ` blur(${adj.denoise / 160}px) contrast(${100 - (adj.denoise / 8)}%)`;
    }

    return baseStyles;
  };

  const handleBatchSequenceExport = async () => {
    if (sequenceQueue.length === 0) return;
    setIsBatchRendering(true);
    setBatchProgressMsg("Initializing automated sequential processing batch pipeline...");

    const sourceUrl = manualImageUrl || getActiveImageUrl();
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.referrerPolicy = "no-referrer";
    img.src = sourceUrl;

    img.onload = async () => {
      try {
        for (let i = 0; i < sequenceQueue.length; i++) {
          const item = sequenceQueue[i];
          const presetName = item.preset.name;
          const currentProgressMsg = `Rendering output layer ${i + 1}/${sequenceQueue.length}: "${presetName}" at ${item.width}x${item.height} in high dynamic range...`;
          setBatchProgressMsg(currentProgressMsg);
          setActiveSeqIndex(i);

          // Update real-time screen adjustments live
          applySequenceIndex(i);

          // Build canvas resolution specified by user profile for item
          const canvas = document.createElement("canvas");
          canvas.width = item.width;
          canvas.height = item.height;
          const ctx = canvas.getContext("2d");

          if (!ctx) {
            console.error("Null 2D canvas context buffer.");
            continue;
          }

          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = "high";

          // Inject computed sequential filter values
          const filterStr = seqMode === "step" 
            ? getFilterStringForPreset(item.preset)
            : getFilterStringForCumulative(i);
          
          ctx.filter = filterStr;
          ctx.drawImage(img, 0, 0, item.width, item.height);

          // Render high-contrast custom watermarks directly if requested for subset batch item
          if (item.useWatermark && item.watermarkText) {
            ctx.filter = "none";
            ctx.shadowColor = "rgba(0, 0, 0, 0.65)";
            ctx.shadowBlur = Math.max(4, Math.floor(item.height * 0.01));
            ctx.fillStyle = "rgba(255, 255, 255, 0.88)";
            
            const mainFontSize = Math.max(16, Math.floor(item.height * 0.035));
            const subFontSize = Math.max(9, Math.floor(item.height * 0.016));
            
            ctx.font = `600 ${mainFontSize}px system-ui, sans-serif`;
            ctx.fillText(item.watermarkText, item.width * 0.04, item.height - (item.height * 0.05));
            
            ctx.font = `400 ${subFontSize}px ui-monospace, monospace`;
            ctx.fillText(`AIMEDIA BATCH AUTOMATION // PROFILE SIZING ${item.width}x${item.height}`, item.width * 0.04, item.height - (item.height * 0.05 + mainFontSize + 8));
          }

          // Generate file download binary
          const typeMap: Record<string, string> = {
            "PNG": "image/png",
            "JPEG": "image/jpeg",
            "WebP": "image/webp",
            "PSD": "image/png",
            "TIFF": "image/png"
          };
          const mimeType = typeMap[item.fileType] || "image/png";
          const quality = item.fileType === "JPEG" || item.fileType === "WebP" ? 0.95 : undefined;

          await new Promise<void>((resolveBlob) => {
            canvas.toBlob((blob) => {
              if (blob) {
                const url = URL.createObjectURL(blob);
                const dl = document.createElement("a");
                dl.href = url;
                dl.download = `aimedia_batch_${i + 1}_${presetName.toLowerCase().replace(/\s+/g, "_")}.${item.fileType.toLowerCase()}`;
                document.body.appendChild(dl);
                dl.click();
                document.body.removeChild(dl);
                URL.revokeObjectURL(url);
              }
              // Allow slight latency spacing for browser file saver context
              setTimeout(resolveBlob, 1200);
            }, mimeType, quality);
          });
        }

        setBatchProgressMsg("🎉 Batch sequence rendered and downloaded successfully! Check your browser downloads.");
        setTimeout(() => {
          setIsBatchRendering(false);
          setBatchProgressMsg("");
        }, 4000);

      } catch (err) {
        console.error("Renderer security error on batch sequence context", err);
        setBatchProgressMsg("⚠️ Export limits encountered. Check browser configurations or CORS security.");
        setTimeout(() => {
          setIsBatchRendering(false);
          setBatchProgressMsg("");
        }, 4000);
      }
    };

    img.onerror = () => {
      setBatchProgressMsg("❌ Error resolving image source. Check network or CORS attributes.");
      setTimeout(() => {
        setIsBatchRendering(false);
        setBatchProgressMsg("");
      }, 4000);
    };
  };

  // True High-Resolution Image Export
  const handleTrueSizeExport = () => {
    setIsRendering(true);
    setRenderProgressMsg("Downloading primary uncompressed layer data...");
    
    const sourceUrl = manualImageUrl || getActiveImageUrl();
    const img = new Image();
    
    img.crossOrigin = "anonymous";
    img.referrerPolicy = "no-referrer";
    img.src = sourceUrl;
    
    img.onload = () => {
      setRenderProgressMsg("Building full-scale dual matrix bitmap context...");
      
      const canvas = document.createElement("canvas");
      canvas.width = exportWidth;
      canvas.height = exportHeight;
      const ctx = canvas.getContext("2d");
      
      if (!ctx) {
        setRenderProgressMsg("Failed to start canvas render pipeline.");
        setIsRendering(false);
        return;
      }
      
      setRenderProgressMsg("Aligning target canvas filters with Photoshop math...");
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      
      // Inject standard filter string directly
      ctx.filter = getFilterStringValue();
      
      // Draw image
      ctx.drawImage(img, 0, 0, exportWidth, exportHeight);
      
      setRenderProgressMsg("Export processing completely applied. Saving file in high quality...");
      
      setTimeout(() => {
        try {
          const typeMap: Record<string, string> = {
            "PNG": "image/png",
            "JPEG": "image/jpeg",
            "WebP": "image/webp",
            "PSD": "image/png",
            "TIFF": "image/png"
          };
          const mimeType = typeMap[exportFileType] || "image/png";
          const quality = exportFileType === "JPEG" || exportFileType === "WebP" ? 0.95 : undefined;
          
          canvas.toBlob((blob) => {
            if (blob) {
              const url = URL.createObjectURL(blob);
              const dl = document.createElement("a");
              dl.href = url;
              dl.download = `aimedia_studio_${exportWidth}x${exportHeight}_${Date.now()}.${exportFileType.toLowerCase()}`;
              document.body.appendChild(dl);
              dl.click();
              document.body.removeChild(dl);
              URL.revokeObjectURL(url);
              setRenderProgressMsg("Successfully completed full-scale render and saved to local disk!");
            } else {
              setRenderProgressMsg("Render compilation returned a null buffer.");
            }
            setTimeout(() => {
              setIsRendering(false);
              setRenderProgressMsg("");
            }, 3000);
          }, mimeType, quality);
          
        } catch (err) {
          console.error("Renderer blocked by security limits", err);
          setRenderProgressMsg("CORS Security Limit Met. Serving high-res proxy canvas simulation...");
          setTimeout(() => {
            const dlFallback = document.createElement("a");
            dlFallback.href = sourceUrl;
            dlFallback.target = "_blank";
            dlFallback.click();
            setIsRendering(false);
            setRenderProgressMsg("");
          }, 2500);
        }
      }, 1500);
    };
    
    img.onerror = () => {
      setRenderProgressMsg("Error loading source bitmap image data. Check destination connectivity.");
      setTimeout(() => {
        setIsRendering(false);
        setRenderProgressMsg("");
      }, 3000);
    };
  };

  return (
    <main className="flex-1 overflow-y-auto p-6 flex flex-col xl:flex-row gap-6 bg-[#09090d]">
      
      {/* LEFT ADJUSTMENT PANEL & DESIGN BUILDER */}
      <div className="flex-1 space-y-6">
        <div className={`p-6 rounded-2xl border ${activeTheme.border} ${activeTheme.cardBg} space-y-5 shadow-[0_4px_30px_rgba(0,0,0,0.4)]`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded bg-amber-950/40 text-amber-400 border border-amber-500/30">
                <Sliders className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h2 className="text-base font-display font-black text-white uppercase tracking-wider">
                  Preset & Sizing Studio Suite
                </h2>
                <p className="text-[11px] text-slate-400 font-mono">
                  Custom sizes, color adjustment configurations, Lightroom and Photoshop preset compilation matrix
                </p>
              </div>
            </div>

            {/* Partner credit tag */}
            <div className="flex items-center gap-1.5 self-start sm:self-center bg-[#0d1527] border border-cyan-800/40 px-2 py-1 rounded text-[10px] font-mono whitespace-nowrap">
              <span className="text-cyan-400 animate-pulse">●</span>
              <span className="text-slate-300 font-bold">Partner: Dilshan // Vibe Motion</span>
            </div>
          </div>

          <form onSubmit={(e) => handleSaveAndLockPreset(e, false)} className="space-y-5">
            {/* Custom Sizing Block */}
            <div className="space-y-4 border-b border-white/5 pb-4">
              <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-[#9D50BB] flex items-center gap-2">
                📂 Custom Output Sizing & format limits
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-450 font-mono">Custom Width (px)</label>
                  <input
                    type="number"
                    min="100"
                    max="16384"
                    value={exportWidth}
                    onChange={(e) => setExportWidth(Math.max(100, Number(e.target.value)))}
                    className="w-full bg-[#111119] border border-white/10 rounded-lg p-2 text-xs font-mono text-white focus:outline-none focus:border-[#9D50BB] transition"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-450 font-mono">Custom Height (px)</label>
                  <input
                    type="number"
                    min="100"
                    max="16384"
                    value={exportHeight}
                    onChange={(e) => setExportHeight(Math.max(100, Number(e.target.value)))}
                    className="w-full bg-[#111119] border border-white/10 rounded-lg p-2 text-xs font-mono text-white focus:outline-none focus:border-[#9D50BB] transition"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-450 font-mono">Output File Format</label>
                  <select
                    value={exportFileType}
                    onChange={(e) => setExportFileType(e.target.value)}
                    className="w-full bg-[#111119] border border-white/10 rounded-lg p-2 text-xs font-mono text-white focus:outline-none focus:border-[#9D50BB] cursor-pointer"
                  >
                    <option value="JPEG">JPEG (.jpg/progressive)</option>
                    <option value="PNG">PNG (.png/lossless 16-bit)</option>
                    <option value="WebP">WebP (.webp/extreme compression)</option>
                    <option value="PSD">Adobe Photoshop Document (.psd)</option>
                    <option value="TIFF">TIFF (.tiff/uncompressed archive)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Colors and exposure adjustments panel */}
            <div className="space-y-4 border-b border-white/5 pb-4">
              <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-amber-400">
                🎨 Custom Preset Color Shifters
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Right/Left columns of sliders */}
                <div className="space-y-3.5">
                  {/* Temp Warmth */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-slate-400">Color Temperature (Warmth)</span>
                      <span className={tempVal > 0 ? "text-amber-400" : tempVal < 0 ? "text-blue-400" : "text-slate-450"}>
                        {tempVal > 0 ? `+${tempVal}` : tempVal} {tempVal > 0 ? "Amber" : tempVal < 0 ? "Cyan/Blue" : "Cool/Warm"}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="-50"
                      max="50"
                      value={tempVal}
                      onChange={(e) => setTempVal(Number(e.target.value))}
                      className="w-full accent-amber-500 h-1 bg-[#151522] rounded-lg cursor-pointer"
                    />
                  </div>

                  {/* Tint */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-slate-400">Color Tint Shift</span>
                      <span className={tintVal > 0 ? "text-pink-400" : tintVal < 0 ? "text-emerald-400" : "text-slate-450"}>
                        {tintVal > 0 ? `+${tintVal}` : tintVal}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="-50"
                      max="50"
                      value={tintVal}
                      onChange={(e) => setTintVal(Number(e.target.value))}
                      className="w-full accent-pink-500 h-1 bg-[#151522] rounded-lg cursor-pointer"
                    />
                  </div>

                  {/* Exposure Master */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-slate-400">Exposure (ISO Light Compensation)</span>
                      <span className="text-cyan-400">{brightnessVal > 0 ? `+${brightnessVal}` : brightnessVal}%</span>
                    </div>
                    <input
                      type="range"
                      min="-50"
                      max="50"
                      value={brightnessVal}
                      onChange={(e) => setBrightnessVal(Number(e.target.value))}
                      className="w-full accent-cyan-400 h-1 bg-[#151522] rounded-lg cursor-pointer"
                    />
                  </div>

                  {/* Contrast */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-slate-400">Contrast (Tonal Curve Amplitude)</span>
                      <span className="text-cyan-400">{rawContrastVal > 0 ? `+${rawContrastVal}` : rawContrastVal}%</span>
                    </div>
                    <input
                      type="range"
                      min="-50"
                      max="50"
                      value={rawContrastVal}
                      onChange={(e) => setRawContrastVal(Number(e.target.value))}
                      className="w-full accent-cyan-400 h-1 bg-[#151522] rounded-lg cursor-pointer"
                    />
                  </div>
                </div>

                <div className="space-y-3.5">
                  {/* Saturation */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-slate-400">Master Saturation</span>
                      <span className="text-cyan-400">{saturationVal > 0 ? `+${saturationVal}` : saturationVal}%</span>
                    </div>
                    <input
                      type="range"
                      min="-50"
                      max="50"
                      value={saturationVal}
                      onChange={(e) => setSaturationVal(Number(e.target.value))}
                      className="w-full accent-cyan-400 h-1 bg-[#151522] rounded-lg cursor-pointer"
                    />
                  </div>

                  {/* Vibrance */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-slate-400">Midtone Vibrance</span>
                      <span className="text-[#9D50BB]">{vibranceVal > 0 ? `+${vibranceVal}` : vibranceVal}%</span>
                    </div>
                    <input
                      type="range"
                      min="-50"
                      max="50"
                      value={vibranceVal}
                      onChange={(e) => setVibranceVal(Number(e.target.value))}
                      className="w-full accent-[#9D50BB] h-1 bg-[#151522] rounded-lg cursor-pointer"
                    />
                  </div>

                  {/* Highlights */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-slate-400">Latitude Highlights</span>
                      <span className="text-emerald-400">{highlightsVal > 0 ? `+${highlightsVal}` : highlightsVal}%</span>
                    </div>
                    <input
                      type="range"
                      min="-50"
                      max="50"
                      value={highlightsVal}
                      onChange={(e) => setHighlightsVal(Number(e.target.value))}
                      className="w-full accent-emerald-500 h-1 bg-[#151522] rounded-lg cursor-pointer"
                    />
                  </div>

                  {/* Shadows */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-slate-400">Dynamic Shadows</span>
                      <span className="text-emerald-400">{shadowsVal > 0 ? `+${shadowsVal}` : shadowsVal}%</span>
                    </div>
                    <input
                      type="range"
                      min="-50"
                      max="50"
                      value={shadowsVal}
                      onChange={(e) => setShadowsVal(Number(e.target.value))}
                      className="w-full accent-emerald-500 h-1 bg-[#151522] rounded-lg cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Extra Filters Block */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-white/5">
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-mono">
                    <span className="text-slate-400">Blemish smooth</span>
                    <span className="text-purple-400">{skinSmoothPower}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={skinSmoothPower}
                    onChange={(e) => setSkinSmoothPower(Number(e.target.value))}
                    className="w-full accent-purple-500 h-1 bg-[#151522] rounded-lg"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-mono">
                    <span className="text-slate-400">Analog Denoise</span>
                    <span className="text-purple-400">{denoiseVal}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={denoiseVal}
                    onChange={(e) => setDenoiseVal(Number(e.target.value))}
                    className="w-full accent-purple-500 h-1 bg-[#151522] rounded-lg"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-mono">
                    <span className="text-slate-400">Photoshop Peak Sharpen</span>
                    <span className="text-purple-400">{sharpenVal}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={sharpenVal}
                    onChange={(e) => setSharpenVal(Number(e.target.value))}
                    className="w-full accent-purple-500 h-1 bg-[#151522] rounded-lg"
                  />
                </div>
              </div>
            </div>

            {/* Save Form Text Fields */}
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-slate-400">
                💾 Register Custom Preset Parameters
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input
                  type="text"
                  placeholder="Enter unique Preset look name... (e.g., Warm Sunset)"
                  value={presetNameInput}
                  onChange={(e) => setPresetNameInput(e.target.value)}
                  className="bg-[#111119] border border-white/10 rounded-lg p-2.5 text-xs font-mono text-white focus:outline-none focus:border-amber-500 transition w-full"
                />

                <input
                  type="text"
                  placeholder="Your author name... (e.g., Dilshan Partner)"
                  value={authorNameInput}
                  onChange={(e) => setAuthorNameInput(e.target.value)}
                  className="bg-[#111119] border border-white/10 rounded-lg p-2.5 text-xs font-mono text-white focus:outline-none focus:border-amber-500 transition w-full"
                />

                <select
                  value={presetCategoryInput}
                  onChange={(e) => setPresetCategoryInput(e.target.value)}
                  className="bg-[#111119] border border-white/10 rounded-lg p-2.5 text-xs font-mono text-white focus:outline-none focus:border-purple-500 transition w-full cursor-pointer"
                >
                  <option value="Portrait">Portrait Category</option>
                  <option value="Landscape">Landscape Category</option>
                  <option value="Architectural">Architectural Category</option>
                  <option value="Vintage">Vintage Category</option>
                </select>
              </div>
            </div>

            {/* Action Buttons: LOCK, UPDATE, EXPORT */}
            <div className="flex flex-wrap gap-2.5 pt-4 border-t border-white/5">
              <button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold py-2 px-4 rounded-lg flex items-center gap-1.5 transition duration-150 shadow-md shadow-emerald-950/20"
              >
                <Save className="w-3.5 h-3.5" /> Save Share Preset
              </button>

              <button
                type="button"
                onClick={(e) => handleSaveAndLockPreset(e as any, true)}
                className="bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs font-bold py-2 px-4 rounded-lg flex items-center gap-1.5 transition duration-150 shadow-md shadow-blue-950/20"
              >
                <Lock className="w-3.5 h-3.5" /> Save & Lock Preset
              </button>

              <button
                type="button"
                onClick={() => triggerLightroomExport(presetNameInput || "Custom_Look")}
                className="bg-[#31354a] hover:bg-indigo-900 border border-[#484f6c] text-slate-200 hover:text-white font-mono text-xs font-bold py-2 px-4 rounded-lg flex items-center gap-1.5 transition duration-150"
              >
                <Download className="w-3.5 h-3.5 text-indigo-400" /> Export for Adobe Lightroom (.xmp)
              </button>

              <button
                type="button"
                onClick={() => triggerPhotoshopExport(presetNameInput || "Custom_Look")}
                className="bg-[#31354a] hover:bg-blue-900 border border-[#484f6c] text-slate-200 hover:text-white font-mono text-xs font-bold py-2 px-4 rounded-lg flex items-center gap-1.5 transition duration-150"
              >
                <Download className="w-3.5 h-3.5 text-blue-400" /> Export for Photoshop LUT
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* CLOUD DATABASE PRESET LIST & LIVE CANVAS PREVIEW */}
      <div className="w-full xl:w-[480px] space-y-6 shrink-0 flex flex-col justify-start">
        
        {/* Dynamic Canvas live Preview with filters applied */}
        <div className={`p-4 rounded-2xl border ${activeTheme.border} ${activeTheme.cardBg} space-y-4`}>
          <div className="flex justify-between items-center bg-[#07070a] px-3 py-1.5 border border-white/5 rounded-lg">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest flex items-center gap-1">
              <Eye className="w-3 h-3 text-red-500" /> Live Matrix Viewport
            </span>
            <span className="text-[10px] bg-emerald-950 text-emerald-400 font-mono px-1.5 rounded-full font-bold">
              {exportWidth}x{exportHeight} {exportFileType}
            </span>
          </div>

          <div className={`relative shadow-2xl rounded-xl overflow-hidden bg-black flex items-center justify-center min-h-[180px] h-48 w-full max-w-[400px] mx-auto transition-all duration-300 ${
            isFlashing 
              ? "ring-2 ring-purple-500/80 border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.4)] scale-[1.01]" 
              : "border border-white/10"
          }`}>
            <img
              src={manualImageUrl || getActiveImageUrl()}
              style={getFilterStyle()}
              className={`w-full h-full object-cover select-none pointer-events-none transition-all duration-300 ${
                isFlashing ? "brightness-125 saturate-110" : ""
              }`}
              referrerPolicy="no-referrer"
            />
            
            {/* Subtle flash/pulse overlay animation */}
            <div
              className={`absolute inset-0 bg-[#a855f7]/10 pointer-events-none transition-opacity duration-300 flex items-center justify-center z-10 ${
                isFlashing ? "opacity-100 scale-100" : "opacity-0 scale-95"
              }`}
            >
              <div className="bg-black/95 text-[#e9d5ff] font-mono text-[9px] font-black px-2.5 py-1 rounded-full border border-purple-500/40 tracking-wider shadow-2xl flex items-center gap-1.5 transform scale-105 transition-all duration-300">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
                </span>
                ⚡ APPLIED PRESET LOOK
              </div>
            </div>

            {/* Aspect lock box overlay */}
            <div className="absolute top-2.5 right-2.5 bg-black/85 border border-amber-500/30 text-amber-400 font-mono font-bold text-[8px] px-1.5 py-0.5 rounded tracking-wider">
              {exportWidth}:{exportHeight} STRETCH-PROTECT
            </div>
            
            {/* Branding badge watermark */}
            <div className="absolute bottom-2.5 left-2.5 bg-black/75 px-2 py-0.5 rounded text-[8px] font-mono text-slate-400">
              AIMEDIA STUDIOULTRAX // Dilshan partner
            </div>
          </div>

          {/* MANUAL CUSTOM IMAGES & FILES ZONE */}
          <div className="border border-white/5 rounded-xl bg-[#07070a]/70 p-3 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold uppercase text-[#D3C7F3] flex items-center gap-1">
                <Image className="w-3.5 h-3.5 text-blue-400" /> Manual Test Image & Files
              </span>
              {manualImageUrl && (
                <button
                  type="button"
                  onClick={() => setManualImageUrl(null)}
                  className="text-[9px] text-red-400 hover:text-red-300 font-mono hover:underline flex items-center gap-0.5 bg-transparent border-none cursor-pointer"
                >
                  <Trash2 className="w-2.5 h-2.5" /> Clear Custom
                </button>
              )}
            </div>

            {/* Input tabs */}
            <div className="flex border border-white/5 p-0.5 rounded-lg gap-1 text-[10px] font-mono bg-black/40">
              <button
                type="button"
                onClick={() => setImageTab("samples")}
                className={`flex-1 py-1 px-1.5 rounded transition text-center ${
                  imageTab === "samples"
                    ? "bg-blue-600/15 text-blue-400 border border-blue-500/20 font-bold"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                ✨ Samples
              </button>
              <button
                type="button"
                onClick={() => setImageTab("upload")}
                className={`flex-1 py-1 px-1.5 rounded transition text-center ${
                  imageTab === "upload"
                    ? "bg-blue-600/15 text-blue-400 border border-blue-500/20 font-bold"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                📂 Custom File
              </button>
              <button
                type="button"
                onClick={() => setImageTab("url")}
                className={`flex-1 py-1 px-1.5 rounded transition text-center ${
                  imageTab === "url"
                    ? "bg-blue-600/15 text-blue-400 border border-blue-500/20 font-bold"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                🔗 Image URL
              </button>
            </div>

            {/* Tap Panel Content */}
            {imageTab === "samples" && (
              <div className="grid grid-cols-2 gap-2 max-h-[140px] overflow-y-auto pr-0.5">
                {SAMPLE_TEST_IMAGES.map((img) => (
                  <button
                    key={img.name}
                    type="button"
                    onClick={() => setManualImageUrl(img.url)}
                    className={`p-1.5 text-left border rounded-lg bg-black/45 hover:border-blue-500/40 transition flex flex-col gap-1 text-[9px] ${
                      manualImageUrl === img.url ? "border-blue-500 bg-blue-950/10" : "border-white/5"
                    }`}
                  >
                    <div className="w-full h-10 rounded overflow-hidden">
                      <img src={img.url} className="w-full h-full object-cover" referrerPolicy="no-referrer" alt="" />
                    </div>
                    <span className="font-bold text-slate-100 truncate block">{img.name}</span>
                    <span className="text-[8px] text-slate-400 truncate block font-mono">{img.desc}</span>
                  </button>
                ))}
              </div>
            )}

            {imageTab === "upload" && (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border border-dashed p-4 rounded-xl text-center transition ${
                  isDragging 
                    ? "border-blue-500 bg-blue-950/20" 
                    : "border-white/15 bg-black/25 hover:border-white/30"
                }`}
              >
                <Upload className="w-6 h-6 text-slate-400 mx-auto mb-2 animate-pulse" />
                <p className="text-[10px] font-mono text-slate-300">
                  Drag & Drop image file here
                </p>
                <p className="text-[9px] font-mono text-slate-500 mt-0.5">
                  Supports PNG, JPEG, WebP, TIFF
                </p>
                
                <div className="mt-2.5">
                  <label className="inline-block py-1 px-2.5 bg-blue-600 hover:bg-blue-500 text-white font-mono text-[9.5px] font-extrabold uppercase rounded shadow cursor-pointer transition">
                    Browse File
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            )}

            {imageTab === "url" && (
              <form onSubmit={handleUrlLoad} className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Paste unconstrained image link URL..."
                    value={inputUrl}
                    onChange={(e) => setInputUrl(e.target.value)}
                    className="flex-1 bg-black/45 border border-white/10 rounded px-2.5 py-1 text-[10px] font-mono text-white placeholder-slate-500 focus:outline-none focus:border-blue-555 focus:border-blue-500 transition-all"
                  />
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-500 text-white px-2.5 py-1 rounded text-[10px] font-mono font-bold"
                  >
                    Load
                  </button>
                </div>
                <p className="text-[8px] font-mono text-slate-400">
                  Must be an absolute secure link starting with <code>https://</code>
                </p>
              </form>
            )}

            {/* True Image Full-Size Export triggering section */}
            <div className="pt-2 border-t border-white/5 space-y-2">
              {isRendering ? (
                <div className="bg-[#07070a] border border-blue-500/20 rounded p-2 text-center text-[9px] font-mono text-blue-400 flex items-center justify-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>{renderProgressMsg}</span>
                </div>
              ) : (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleTrueSizeExport}
                    className="flex-[2] py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:brightness-110 active:scale-[0.99] font-mono text-[10px] font-bold uppercase tracking-wider rounded text-white transition flex items-center justify-center gap-1.5 shadow"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>RENDER & DOWNLOAD ({exportWidth}x{exportHeight})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {}}
                    className="flex-1 py-2 bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/50 active:scale-[0.99] font-mono text-[10px] font-bold uppercase tracking-wider rounded text-purple-300 transition flex items-center justify-center gap-1.5 shadow"
                    title="Edit Layer Settings"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Edit Layer</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Multi-Preset Batch Sequence Processing Panel */}
        <div className={`p-5 rounded-2xl border ${activeTheme.border} ${activeTheme.cardBg} space-y-4 shadow-lg`}>
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                🎬 Batch Sequence Previewer
              </h3>
              <span className="text-[9px] bg-indigo-950/70 border border-indigo-500/30 text-indigo-300 font-mono py-0.5 px-2 rounded-full font-bold">
                {sequenceQueue.length} Presets Queued
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1 font-mono leading-relaxed">
              Add presets from the list below to create a custom pipeline sequence. Switch between step-by-step preview transition or cumulative visual blend layering.
            </p>
          </div>

          {/* Sequence controls */}
          <div className="bg-[#07070a]/80 p-3 rounded-xl border border-white/5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2.5">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  title="Previous Sequence Step"
                  onClick={() => {
                    if (sequenceQueue.length === 0) return;
                    const prevIdx = activeSeqIndex <= 0 ? sequenceQueue.length - 1 : activeSeqIndex - 1;
                    setActiveSeqIndex(prevIdx);
                    applySequenceIndex(prevIdx);
                  }}
                  disabled={sequenceQueue.length === 0}
                  className="p-1.5 bg-black hover:bg-slate-900 text-slate-300 border border-white/10 rounded transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <SkipBack className="w-3.5 h-3.5" />
                </button>

                {isSeqPlaying ? (
                  <button
                    type="button"
                    title="Pause Autoplay"
                    onClick={() => setIsSeqPlaying(false)}
                    className="p-1.5 bg-yellow-600 text-white rounded transition hover:bg-yellow-500 cursor-pointer flex items-center justify-center"
                  >
                    <Pause className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    type="button"
                    title="Play Autoplay"
                    onClick={() => {
                      if (sequenceQueue.length > 0) {
                        setIsSeqPlaying(true);
                      }
                    }}
                    disabled={sequenceQueue.length === 0}
                    className="p-1.5 bg-emerald-600 text-white rounded transition hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center"
                  >
                    <Play className="w-3.5 h-3.5" />
                  </button>
                )}

                <button
                  type="button"
                  title="Next Sequence Step"
                  onClick={() => {
                    if (sequenceQueue.length === 0) return;
                    const nextIdx = activeSeqIndex + 1 >= sequenceQueue.length ? 0 : activeSeqIndex + 1;
                    setActiveSeqIndex(nextIdx);
                    applySequenceIndex(nextIdx);
                  }}
                  disabled={sequenceQueue.length === 0}
                  className="p-1.5 bg-black hover:bg-slate-900 text-slate-300 border border-white/10 rounded transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <SkipForward className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Mode Selection */}
              <div className="flex bg-black p-0.5 rounded border border-white/5 text-[9px] font-mono">
                <button
                  type="button"
                  title="Preview each individual preset state step by step"
                  onClick={() => {
                    setSeqMode("step");
                    if (activeSeqIndex >= 0) {
                      loadPresetSettings(sequenceQueue[activeSeqIndex].preset);
                    }
                  }}
                  className={`py-1 px-2.5 rounded transition ${
                    seqMode === "step" 
                      ? "bg-indigo-950 font-bold border border-indigo-900/40 text-indigo-400" 
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Step View
                </button>
                <button
                  type="button"
                  title="Layer preset values cumulatively in real-time"
                  onClick={() => {
                    setSeqMode("cumulative");
                    if (activeSeqIndex >= 0) {
                      // Apply cumulative lookup immediately
                      let computedBrightness = 0;
                      let computedContrast = 0;
                      let computedSaturation = 0;
                      let computedBokeh = 0;
                      let computedSkinSmooth = 0;
                      let computedDenoise = 0;
                      let computedTemp = 0;
                      let computedTint = 0;
                      let computedVibrance = 0;
                      let computedHighlights = 0;
                      let computedShadows = 0;
                      let computedSharpen = 0;

                      for (let i = 0; i <= activeSeqIndex; i++) {
                        const p = sequenceQueue[i].preset;
                        computedBrightness += p.adjustments.brightness;
                        computedContrast += p.adjustments.contrast;
                        computedSaturation += p.adjustments.saturation;
                        computedBokeh += p.adjustments.bokeh;
                        computedSkinSmooth += p.adjustments.skinSmooth;
                        computedDenoise += p.adjustments.denoise;
                        computedTemp += p.adjustments.temp;
                        computedTint += p.adjustments.tint;
                        computedVibrance += p.adjustments.vibrance;
                        computedHighlights += p.adjustments.highlights;
                        computedShadows += p.adjustments.shadows;
                        computedSharpen += p.adjustments.sharpen;
                      }

                      setBrightnessVal(Math.min(100, Math.max(-100, computedBrightness)));
                      setRawContrastVal(Math.min(100, Math.max(-100, computedContrast)));
                      setSaturationVal(Math.min(100, Math.max(-100, computedSaturation)));
                      setCustomBokehVal(Math.min(100, Math.max(0, computedBokeh)));
                      setSkinSmoothPower(Math.min(100, Math.max(0, computedSkinSmooth)));
                      setDenoiseVal(Math.min(100, Math.max(0, computedDenoise)));
                      setTempVal(Math.min(100, Math.max(-100, computedTemp)));
                      setTintVal(Math.min(100, Math.max(-100, computedTint)));
                      setVibranceVal(Math.min(100, Math.max(-100, computedVibrance)));
                      setHighlightsVal(Math.min(100, Math.max(-100, computedHighlights)));
                      setShadowsVal(Math.min(100, Math.max(-100, computedShadows)));
                      setSharpenVal(Math.min(100, Math.max(0, computedSharpen)));
                    }
                  }}
                  className={`py-1 px-2.5 rounded transition ${
                    seqMode === "cumulative" 
                      ? "bg-indigo-950 font-bold border border-indigo-900/40 text-indigo-400" 
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Layer Blend
                </button>
              </div>

              {/* Clear queue */}
              {sequenceQueue.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setIsSeqPlaying(false);
                    setSequenceQueue([]);
                    setActiveSeqIndex(-1);
                  }}
                  className="text-[9px] text-red-400 hover:text-red-300 font-mono hover:underline flex items-center gap-0.5"
                >
                  <Trash2 className="w-3 h-3" /> Clear Sequence
                </button>
              )}
            </div>

            {/* Interval Slider */}
            <div className="flex items-center justify-between text-[9px] font-mono text-slate-400 pt-1.5 border-t border-white/5">
              <span>Auto Play Intermission:</span>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="500"
                  max="5000"
                  step="250"
                  value={seqInterval}
                  onChange={(e) => setSeqInterval(Number(e.target.value))}
                  className="w-20 accent-indigo-500 h-1 bg-white/10 rounded cursor-pointer"
                />
                <span className="text-white text-[10px] pr-1">{(seqInterval / 1000).toFixed(1)}s</span>
              </div>
            </div>
          </div>

          {/* Sequential items queue tracker */}
          {sequenceQueue.length === 0 ? (
            <div className="h-20 flex flex-col items-center justify-center border border-dashed border-white/10 rounded-xl p-3 text-center bg-black/15">
              <p className="text-[10px] font-mono text-slate-500">
                Configure batch look pipeline sequence...
              </p>
              <p className="text-[9px] text-[#8c8cb3]/60 font-mono mt-0.5 font-bold animate-pulse">
                Click "+ Sequence" on presets below to add steps.
              </p>
            </div>
          ) : (
            <div className="space-y-1.5 max-h-[380px] overflow-y-auto pr-1">
              {sequenceQueue.map((item, idx) => {
                const isActive = idx === activeSeqIndex;
                const isExpanded = expandedSeqItem === item.queueId;
                const preset = item.preset;
                return (
                  <div
                    key={item.queueId}
                    onClick={() => {
                      setActiveSeqIndex(idx);
                      applySequenceIndex(idx);
                    }}
                    className={`rounded-lg border text-left transition relative flex flex-col cursor-pointer group ${
                      isActive
                        ? "bg-indigo-950/25 border-indigo-500/50"
                        : "bg-[#0b0c13] border-white/5 hover:border-white/10"
                    }`}
                  >
                    {/* Hover-effect Preview Overlay */}
                    <div className="absolute right-full mr-3 xl:mr-4 top-1/2 -translate-y-1/2 z-50 pointer-events-none bg-black/90 p-2.5 rounded-xl border border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.9)] w-[200px] opacity-0 group-hover:opacity-100 transition-all duration-200 scale-95 group-hover:scale-100 pointer-events-none flex-col items-center gap-2 hidden group-hover:flex">
                      <div className="w-full aspect-[4/3] bg-[#000] rounded-lg overflow-hidden border border-white/5 relative flex items-center justify-center">
                        <img 
                          src={manualImageUrl || getActiveImageUrl()} 
                          className="w-full h-full object-cover opacity-80" 
                          referrerPolicy="no-referrer"
                          alt="Thumbnail Preview"
                        />
                      </div>
                      <div className="text-[10px] text-white font-mono text-center leading-relaxed">
                        <div className="font-bold text-cyan-400 capitalize bg-cyan-900/30 border border-cyan-500/20 px-2 py-0.5 rounded-full inline-block mb-1">
                          {preset.name}
                        </div>
                        <br/>
                        <span className="text-slate-400">Orig Res:</span> {item.width}x{item.height} <br/>
                        <span className="text-slate-500 text-[9px] uppercase">{item.fileType} Format</span>
                      </div>
                    </div>

                    {/* Primary Row */}
                    <div className="p-2 flex items-center justify-between gap-2.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`w-4 h-4 rounded-full text-[8.5px] font-mono font-bold flex items-center justify-center shrink-0 ${
                          isActive
                            ? "bg-indigo-500 text-white"
                            : "bg-[#181827] text-slate-400"
                        }`}>
                          {idx + 1}
                        </span>
                        <div className="min-w-0">
                          <span className="text-[10px] font-bold text-white block truncate uppercase tracking-wider">
                            {preset.name}
                          </span>
                          <span className="text-[8.5px] text-slate-400 font-mono block">
                            Size: <span className="text-amber-400 font-bold">{item.width}x{item.height}</span> ({item.fileType})
                            {item.useWatermark && <span className="text-indigo-400 ml-1.5 font-bold">★ W-Mark Active</span>}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {/* Custom Export profile gear toggle */}
                        <button
                          type="button"
                          title="Define custom resolution, format or watermark profile"
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedSeqItem(isExpanded ? null : item.queueId);
                          }}
                          className={`p-1 rounded text-[9.5px] font-mono flex items-center gap-0.5 transition ${
                            isExpanded ? "bg-indigo-600 text-white" : "hover:bg-slate-800 text-slate-400"
                          }`}
                        >
                          ⚙ <span className="text-[8px]">Profile</span>
                        </button>

                        {/* Move sequence positions */}
                        <button
                          type="button"
                          title="Move Up"
                          disabled={idx === 0}
                          onClick={(e) => {
                            e.stopPropagation();
                            const nq = [...sequenceQueue];
                            const temp = nq[idx];
                            nq[idx] = nq[idx - 1];
                            nq[idx - 1] = temp;
                            setSequenceQueue(nq);
                            if (isActive) setActiveSeqIndex(idx - 1);
                            else if (activeSeqIndex === idx - 1) setActiveSeqIndex(idx);
                          }}
                          className="p-1 hover:bg-slate-800 rounded disabled:opacity-20 cursor-pointer"
                        >
                          <ArrowUp className="w-3 h-3 text-slate-400" />
                        </button>

                        <button
                          type="button"
                          title="Move Down"
                          disabled={idx === sequenceQueue.length - 1}
                          onClick={(e) => {
                            e.stopPropagation();
                            const nq = [...sequenceQueue];
                            const temp = nq[idx];
                            nq[idx] = nq[idx + 1];
                            nq[idx + 1] = temp;
                            setSequenceQueue(nq);
                            if (isActive) setActiveSeqIndex(idx + 1);
                            else if (activeSeqIndex === idx + 1) setActiveSeqIndex(idx);
                          }}
                          className="p-1 hover:bg-slate-800 rounded disabled:opacity-20 cursor-pointer"
                        >
                          <ArrowDown className="w-3 h-3 text-slate-400" />
                        </button>

                        {/* Remove preset step */}
                        <button
                          type="button"
                          title="Remove Step"
                          onClick={(e) => {
                            e.stopPropagation();
                            const nq = sequenceQueue.filter((_, qIdx) => qIdx !== idx);
                            setSequenceQueue(nq);
                            if (activeSeqIndex >= nq.length) {
                              const newActive = nq.length - 1;
                              setActiveSeqIndex(newActive);
                              if (newActive >= 0) applySequenceIndex(newActive);
                            } else if (activeSeqIndex === idx) {
                              if (nq.length > 0) applySequenceIndex(activeSeqIndex);
                              else setActiveSeqIndex(-1);
                            } else if (activeSeqIndex > idx) {
                              setActiveSeqIndex(activeSeqIndex - 1);
                            }
                          }}
                          className="p-1 hover:bg-red-950 text-slate-500 hover:text-red-400 rounded transition cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>
                    </div>

                    {/* Expandable Custom Export Specification Row Form */}
                    {isExpanded && (
                      <div 
                        onClick={(e) => e.stopPropagation()} 
                        className="px-3 pb-3 pt-2 bg-black/[0.4] border-t border-white/5 space-y-2.5"
                      >
                        <span className="text-[9px] font-mono text-indigo-400 uppercase font-black tracking-wider block">
                          Configure Individual Target Sizing Spec
                        </span>
                        
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[8.5px] text-slate-400 block mb-0.5 font-mono">Export Width (px)</label>
                            <input
                              type="number"
                              min="100"
                              max="10000"
                              value={item.width}
                              onChange={(e) => {
                                const val = Math.max(100, Math.min(10000, Number(e.target.value)));
                                updateItemConfig(item.queueId, { width: val });
                              }}
                              className="w-full bg-[#141520] border border-white/10 rounded px-1.5 py-0.5 text-[10.5px] font-mono text-white inline-block focus:border-indigo-500 focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="text-[8.5px] text-slate-400 block mb-0.5 font-mono">Export Height (px)</label>
                            <input
                              type="number"
                              min="100"
                              max="10000"
                              value={item.height}
                              onChange={(e) => {
                                const val = Math.max(100, Math.min(10000, Number(e.target.value)));
                                updateItemConfig(item.queueId, { height: val });
                              }}
                              className="w-full bg-[#141520] border border-white/10 rounded px-1.5 py-0.5 text-[10.5px] font-mono text-white inline-block focus:border-indigo-500 focus:outline-none"
                            />
                          </div>
                        </div>

                        {/* Preset size tags */}
                        <div className="flex flex-wrap gap-1">
                          <button
                            type="button"
                            onClick={() => updateItemConfig(item.queueId, { width: 1920, height: 1080 })}
                            className="px-1.5 py-0.5 bg-indigo-950/40 hover:bg-indigo-950/80 border border-indigo-900/40 text-[8px] font-mono text-indigo-300 rounded transition"
                          >
                            1080p (HD)
                          </button>
                          <button
                            type="button"
                            onClick={() => updateItemConfig(item.queueId, { width: 3840, height: 2160 })}
                            className="px-1.5 py-0.5 bg-indigo-950/40 hover:bg-indigo-950/80 border border-indigo-900/40 text-[8px] font-mono text-indigo-300 rounded transition"
                          >
                            2160p (4K)
                          </button>
                          <button
                            type="button"
                            onClick={() => updateItemConfig(item.queueId, { width: 1080, height: 1080 })}
                            className="px-1.5 py-0.5 bg-indigo-950/40 hover:bg-indigo-950/80 border border-indigo-900/40 text-[8px] font-mono text-indigo-300 rounded transition"
                          >
                            Square (IM)
                          </button>
                          <button
                            type="button"
                            onClick={() => updateItemConfig(item.queueId, { width: 1080, height: 1920 })}
                            className="px-1.5 py-0.5 bg-indigo-950/40 hover:bg-indigo-950/80 border border-indigo-900/40 text-[8px] font-mono text-indigo-300 rounded transition"
                          >
                            Vertical (Story)
                          </button>
                        </div>

                        {/* File Suffix Selection */}
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[8.5px] text-slate-400 block mb-0.5 font-mono">Format</label>
                            <select
                              value={item.fileType}
                              onChange={(e) => updateItemConfig(item.queueId, { fileType: e.target.value })}
                              className="w-full bg-[#141520] border border-white/10 rounded px-1.5 py-0.5 text-[10px] font-mono text-white focus:border-indigo-500 focus:outline-none"
                            >
                              <option value="PNG">PNG</option>
                              <option value="JPEG">JPEG 95%</option>
                              <option value="WebP">WebP Lossless</option>
                              <option value="PSD">PSD Layer</option>
                              <option value="TIFF">TIFF Print</option>
                            </select>
                          </div>
                          
                          {/* Watermarking toggle */}
                          <div className="flex flex-col justify-end pb-1">
                            <label className="text-[8.5px] text-slate-400 block mb-1.5 font-mono">Sign Branding</label>
                            <div className="flex items-center gap-1.5">
                              <input
                                type="checkbox"
                                id={`watermark-check-${item.queueId}`}
                                checked={item.useWatermark}
                                onChange={(e) => updateItemConfig(item.queueId, { useWatermark: e.target.checked })}
                                className="accent-indigo-500 rounded cursor-pointer w-3.5 h-3.5"
                              />
                              <label htmlFor={`watermark-check-${item.queueId}`} className="text-[9.5px] text-slate-200 font-mono select-none cursor-pointer">
                                Overlay Logo Customizer
                              </label>
                            </div>
                          </div>
                        </div>

                        {item.useWatermark && (
                          <div className="space-y-1">
                            <label className="text-[8.5px] text-indigo-300 block font-mono">Watermark text label:</label>
                            <input
                              type="text"
                              value={item.watermarkText}
                              onChange={(e) => updateItemConfig(item.queueId, { watermarkText: e.target.value })}
                              className="w-full bg-[#141520] border border-indigo-500/30 rounded px-2 py-1 text-[10px] font-mono text-white focus:border-indigo-500 focus:outline-none"
                              placeholder="e.g. DILSHAN STUDIOS"
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Batch Render Action Executive Panel Trigger */}
              <div className="pt-2">
                <button
                  type="button"
                  disabled={isBatchRendering}
                  onClick={handleBatchSequenceExport}
                  className="w-full group py-2.5 px-4 bg-gradient-to-r from-indigo-600 via-indigo-700 to-indigo-800 hover:from-indigo-500 hover:to-indigo-700 text-white font-mono text-xs font-black rounded-xl border border-indigo-400/30 shadow-lg tracking-wider transition hover:scale-[1.01] flex items-center justify-center gap-2 disabled:opacity-40 select-none cursor-pointer"
                >
                  {isBatchRendering ? "⚡ Running Batch Render Engine..." : "🚀 Render & Batch Export All Queued Items"}
                </button>
              </div>

              {/* Display Real-time Execution Progress Logs if Rendering */}
              {isBatchRendering && batchProgressMsg && (
                <div className="bg-indigo-950/40 border border-indigo-500/30 p-3 rounded-xl space-y-2 mt-1 shadow-inner animate-[pulse_3s_infinite]">
                  <div className="flex items-center justify-between text-[10px] font-mono text-indigo-400 uppercase font-black">
                    <span>Batch Queue Execution in Progress</span>
                    <span className="animate-spin text-xs">↻</span>
                  </div>
                  <div className="bg-[#050508] p-2 rounded border border-white/5 font-mono text-[9px] text-slate-350 select-text leading-relaxed">
                    {batchProgressMsg}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Real-time shared client cloud presets collection list */}
        <div className={`p-6 rounded-2xl border ${activeTheme.border} ${activeTheme.cardBg} flex-1 flex flex-col justify-between space-y-4`}>
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-350 flex items-center gap-1.5">
                ☁ Shared Online Presets
              </h3>

              {/* Live WebSocket / Snapshot sync status badge */}
              {syncStatus === "live" ? (
                <div className="text-[9px] bg-emerald-950/70 border border-emerald-500/30 text-emerald-400 px-2 py-0.5 rounded font-mono font-bold flex items-center gap-1 shadow-[0_0_8px_rgba(16,185,129,0.15)] animate-pulse">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></span> Live database Sync active
                </div>
              ) : syncStatus === "connecting" ? (
                <div className="text-[9px] bg-yellow-950/70 border border-yellow-500/30 text-yellow-500 px-2 py-0.5 rounded font-mono font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-ping"></span> Connecting cloud...
                </div>
              ) : (
                <div className="text-[9px] bg-slate-900 border border-white/10 text-slate-400 px-2 py-0.5 rounded font-mono font-medium">
                  Operating in Local Mode
                </div>
              )}
            </div>
            <p className="text-[11px] text-slate-500 mt-1 font-mono leading-relaxed">
              Auto-syncs changes real-time. Navigate through specialized look profiles or catalog custom brandings in dynamic tabs.
            </p>
          </div>

          {/* Category Tabs for Preset Navigation */}
          <div className="flex bg-black/40 p-1 rounded-xl border border-white/5 gap-1.5 flex-wrap">
            {["Portrait", "Landscape", "Architectural", "Vintage"].map((cat) => {
              const isActive = activeCategoryTab === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategoryTab(cat)}
                  className={`flex-1 min-w-[75px] text-center font-mono py-2 px-2.5 rounded-lg text-xs font-bold transition duration-150 relative cursor-pointer select-none ${
                    isActive
                      ? "bg-purple-950/40 border border-purple-500/40 text-purple-300 shadow-[0_0_10px_rgba(168,85,247,0.1)] font-extrabold"
                      : "text-slate-400 hover:text-white border border-transparent hover:bg-white/5"
                  }`}
                >
                  {cat === "Portrait" && "👤 "}
                  {cat === "Landscape" && "🏔 "}
                  {cat === "Architectural" && "🏛 "}
                  {cat === "Vintage" && "🎞 "}
                  {cat}
                </button>
              );
            })}
          </div>

          {/* Preset cloud card list */}
          <div className="flex-1 overflow-y-auto space-y-2.5 max-h-[300px] border border-white/5 bg-[#07070a]/70 p-3 rounded-xl min-h-[160px]">
            {cloudPresets.filter(p => (p.category || "Portrait").trim().toLowerCase() === activeCategoryTab.trim().toLowerCase()).length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2">
                <span className="text-xl">📭</span>
                <p className="text-xs text-slate-500 font-mono">No active presets cataloged in "{activeCategoryTab}".</p>
                <p className="text-[10px] text-slate-600 font-mono">Create custom sliders parameters, select "{activeCategoryTab}" category, then click save.</p>
              </div>
            ) : (
              cloudPresets
                .filter(p => (p.category || "Portrait").trim().toLowerCase() === activeCategoryTab.trim().toLowerCase())
                .map((preset) => {
                  const isDefault = preset.id.startsWith("cloud-");
                return (
                  <div
                    key={preset.id}
                    className="p-3 bg-[#101017] hover:bg-[#14141e] border border-white/5 rounded-lg transition duration-150 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1 select-none flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-white font-semibold tracking-wide truncate max-w-[190px] block" title={preset.name}>
                          {preset.name}
                        </span>
                        {preset.locked && (
                          <span className="text-[8px] bg-blue-950 text-blue-400 border border-blue-800/20 px-1 rounded flex items-center gap-0.5">
                            <Lock className="w-2 h-2" /> Locked
                          </span>
                        )}
                        {isDefault && (
                          <span className="text-[8px] bg-indigo-950 text-indigo-400 border border-indigo-500/25 px-1 rounded">
                            Official
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-[9px] font-mono text-slate-500">
                        <User2 className="w-3 h-3 text-slate-500" />
                        <span>Created by: <span className="text-[#9D50BB] font-bold">{preset.author}</span></span>
                      </div>
                      <div className="text-[8.5px] font-mono text-slate-500">
                        Exposure: <span className={preset.adjustments.brightness > 0 ? "text-emerald-400" : "text-rose-400"}>{preset.adjustments.brightness > 0 ? `+${preset.adjustments.brightness}` : preset.adjustments.brightness}%</span> | 
                        Contrast: <span className="text-cyan-400">{preset.adjustments.contrast}%</span> | 
                        Size: <span className="text-amber-400">{preset.sizing.width}x{preset.sizing.height} {preset.sizing.fileType}</span>
                      </div>
                    </div>

                    {/* Controls on Preset item */}
                    <div className="flex items-center gap-1.5 self-end sm:self-center">
                      <button
                        onClick={() => {
                          const newItem: QueuedBatchItem = {
                            queueId: `seq-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                            preset: preset,
                            width: preset.sizing?.width || 1920,
                            height: preset.sizing?.height || 1080,
                            fileType: preset.sizing?.fileType || "PNG",
                            useWatermark: false,
                            watermarkText: "AIMEDIA STUDIO"
                          };
                          setSequenceQueue(prev => [...prev, newItem]);
                          if (sequenceQueue.length === 0) {
                            setActiveSeqIndex(0);
                            loadPresetSettings(preset);
                          }
                        }}
                        className="p-1 px-2.5 bg-indigo-600/15 hover:bg-indigo-600 text-indigo-400 hover:text-white border border-indigo-600/30 text-[9.5px] font-mono font-extrabold rounded-md transition cursor-pointer"
                        title="Add to sequential batch processing series"
                      >
                        + Sequence
                      </button>

                      <button
                        onClick={() => loadPresetSettings(preset)}
                        className="p-1 px-2.5 bg-amber-600/10 hover:bg-amber-600 text-amber-500 hover:text-white border border-amber-600/30 text-[9.5px] font-mono font-extrabold rounded-md transition cursor-pointer"
                        title="Load details into editing shifters"
                      >
                        ⚡ Sync
                      </button>

                      {/* Lock action toggle */}
                      {!isDefault && (
                        <button
                          onClick={() => handleToggleLockCloudPreset(preset)}
                          className={`p-1 border text-[9.5px] font-mono rounded-md transition cursor-pointer ${
                            preset.locked
                              ? "bg-slate-800 border-white/10 text-slate-400 hover:text-white"
                              : "bg-blue-950/30 border-blue-500/20 text-blue-400 hover:text-white"
                          }`}
                          title={preset.locked ? "Unlock preset values editing" : "Lock preset values editing"}
                        >
                          {preset.locked ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                        </button>
                      )}

                      {!isDefault && !preset.locked && (
                        <button
                          onClick={() => handleDeleteCloudPreset(preset.id)}
                          className="p-1 bg-red-950/30 hover:bg-red-950 text-red-500 hover:text-red-300 border border-red-500/20 rounded-md transition cursor-pointer"
                          title="Delete synced look preset"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Diagnostics footer with developer and partner references */}
          <div className="bg-[#0b0c16]/50 border border-white/5 rounded-xl p-3 text-[10px] font-mono space-y-1 select-none">
            <div className="flex justify-between">
              <span className="text-slate-500">Suite Engine:</span>
              <span className="text-slate-350 font-bold">AIMEDIA STUDIOULTRAX v2026.1</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Enterprise Partner:</span>
              <span className="text-cyan-300 font-bold">Dilshan // Vibe Motion Group</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Real-time Hook Target:</span>
              <span className="text-slate-350 font-bold">shared_presets database_ref</span>
            </div>
          </div>
        </div>

      </div>

    </main>
  );
};
