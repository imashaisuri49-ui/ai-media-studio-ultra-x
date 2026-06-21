import React, { useState, useEffect, useRef } from "react";
import {
  Layers,
  Sparkles,
  Camera,
  Eye,
  EyeOff,
  Scissors,
  Crop,
  Video,
  Smartphone,
  Download,
  Maximize2,
  FileText,
  RefreshCw,
  Sliders,
  Shield,
  Send,
  Upload,
  X,
  Check,
  RotateCcw,
  SlidersHorizontal,
  DollarSign,
  Palette,
  Layers3,
  HelpCircle,
  FileImage,
  VideoIcon,
  Smile,
  Zap,
  Lock,
  Unlock,
  AlertTriangle,
  Type as TypeIcon,
  Briefcase,
  Moon,
  Sun
} from "lucide-react";

import { useTheme } from "next-themes";

import { DEMO_PRESETS, PRESET_LOOKS, EXPORT_PROFILES } from "./data/demoImages";
import { LayerItem, EditingSuggestion, PresetLook, ExportProfile } from "./types";
import GpuPerformance from "./components/GpuPerformance";
import LicenseHandler from "./components/LicenseHandler";
import ProjectManager from "./components/ProjectManager";

export default function App() {
  const { theme, setTheme } = useTheme();

  // Preset state
  const [activePresetId, setActivePresetId] = useState<"portrait" | "product" | "old_photo" | "custom">("portrait");
  const [customImage, setCustomImage] = useState<string | null>(null);
  const [customImageName, setCustomImageName] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Active Workspace State (Filled by API)
  const [workspaceData, setWorkspaceData] = useState<{
    subject: string;
    faces: { detected: number; confidence: string; beautyScore: string; skinTexture: string };
    cameraStyle: { lens: string; aperture: string; shutter: string; iso: string };
    composition: string;
    exposure: string;
    layers: LayerItem[];
    editingSuggestions: EditingSuggestion[];
    aiRecommendationMarkdown: string;
  }>({
    subject: "DSLR Soft Portrait (Feminine / Soft Lighting)",
    faces: { detected: 1, confidence: "99.8%", beautyScore: "Exquisite", skinTexture: "Subtle (Preserved)" },
    cameraStyle: { lens: "85mm Prime lens", aperture: "f/1.4 Art Boost", shutter: "1/250s", iso: "100 (Clean)" },
    composition: "Rule of Thirds (Facial grid focus, soft background falloff / bokeh)",
    exposure: "Optimal (Slight peak in highlights, clean shadow lines)",
    layers: [
      { id: "layer-1", type: "Subject", name: "Model Foreground Silhouette", visible: true, opacity: 100, x: 25, y: 15 },
      { id: "layer-2", type: "Text", name: "Headline Text Layer", visible: true, opacity: 100, x: 10, y: 70, fontInfo: { family: "Outfit", weight: "700", size: "38px", color: "#F3F4F6", text: "ELEGANT SILHOUETTES" } },
      { id: "layer-3", type: "Text", name: "Sub-Header Label", visible: true, opacity: 80, x: 12, y: 64, fontInfo: { family: "Space Grotesk", weight: "400", size: "14px", color: "#00D2FF", text: "SUMMER EDITORIAL SERIES" } },
      { id: "layer-4", type: "Logo", name: "Signature Studio Stamp", visible: true, opacity: 90, x: 75, y: 80 },
      { id: "layer-5", type: "Background", name: "Atmospheric Bokeh Depth Back", visible: true, opacity: 100, x: 0, y: 0 }
    ],
    editingSuggestions: [
      { id: "skin-smoothing", label: "Skin Smoother (Natural)", current: 40, applied: false, category: "skin" },
      { id: "bokeh-boost", label: "DSLR Portrait Bokeh Boost", current: 50, applied: false, category: "dslr" },
      { id: "highlights-recovery", label: "Specular Highlight Recovery", current: 20, applied: false, category: "color" },
      { id: "warmth-tint", label: "Editorial Cinematic Warmth", current: 15, applied: false, category: "color" }
    ],
    aiRecommendationMarkdown: `### 📸 Professional Portrait Assessment
The image displays an extremely clean focus on the foreground model with a vintage editorial tone.
* **Lighting Style**: Soft natural key light from the upper-left, providing a delicate shadow wrap.
* **Creative Recommendation**: Enhance depth-of-field with our **Cinematic DSLR Engine** portrait look. Add slightly cooler tones to the bokeh to create color separation.
* **Suggested Action**: Use the **Acne & Skin Smooth** utility at 45% power to preserve raw skin pores while blending micro-distractions.`
  });

  // UI state
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>("layer-2");
  const [viewMode, setViewMode] = useState<"original" | "enhanced" | "split">("enhanced");
  const [splitSliderPos, setSplitSliderPos] = useState(50); // percentage for split view slider
  const [activeTab, setActiveTab] = useState<"editor" | "assistant" | "batch" | "pro-features" | "projects">("editor");
  const [isDraggingSplit, setIsDraggingSplit] = useState(false);
  const splitContainerRef = useRef<HTMLDivElement>(null);

  // Creative AI Assistant state
  const [chatMessage, setChatMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<Array<{ role: "user" | "assistant"; text: string }>>([
    {
      role: "assistant",
      text: "👋 Welcome to **AI Media Studio Ultra X**. I can auto-generate highly engaging marketing scripts, suggest design layers sizing, or produce high-converting captions for this photo. Ask me any creative task!"
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);

  // Generative Fill Input
  const [generativeFillPrompt, setGenerativeFillPrompt] = useState("");
  const [generativeFillCategory, setGenerativeFillCategory] = useState<"background" | "object" | "text">("background");
  const [isGeneratingFill, setIsGeneratingFill] = useState(false);

  // Module 11 Profile & Security State
  const [localProcessingFirst, setLocalProcessingFirst] = useState(true);
  const [encryptedCache, setEncryptedCache] = useState(true);
  const [permissionsSigned, setPermissionsSigned] = useState(true);

  // Live API status check (Handles Quota and high load gracefully)
  const [liveApiStatus, setLiveApiStatus] = useState<"healthy" | "quota_exceeded" | "high_demand" | "offline">("healthy");

  // Module 12 Billing and License Key State
  const [licenseKey, setLicenseKey] = useState("");
  const [isLicenseActivated, setIsLicenseActivated] = useState(false);
  const [isPremiumPlan, setIsPremiumPlan] = useState(false);
  const [showBillingModal, setShowBillingModal] = useState(false);
  const [licenseError, setLicenseError] = useState("");
  const [generatedInvoice, setGeneratedInvoice] = useState<any>(null);

  // Video Assist state (Module 9)
  const [sceneAnalysisMsg, setSceneAnalysisMsg] = useState("");
  const [generatedCaption, setGeneratedCaption] = useState("");
  const [thumbnailTemplate, setThumbnailTemplate] = useState("");
  const [videoFeaturesLoading, setVideoFeaturesLoading] = useState(false);

  // Export State
  const [selectedExportProfile, setSelectedExportProfile] = useState<string>("ig-story");
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccessMessage, setExportSuccessMessage] = useState("");

  // Filter & Retouch Sliders overrides
  const [brightnessVal, setBrightnessVal] = useState(0); // -50 to 50
  const [rawContrastVal, setRawContrastVal] = useState(0); // -50 to 50
  const [saturationVal, setSaturationVal] = useState(0); // -50 to 50
  const [customBokehVal, setCustomBokehVal] = useState(0); // 0 to 100
  const [skinSmoothPower, setSkinSmoothPower] = useState(0); // 0 to 100
  const [blemishReduction, setBlemishReduction] = useState(0); // 0 to 100
  const [eyeEnhancePower, setEyeEnhancePower] = useState(0); // 0 to 100

  // Drag of bounding-box simulation
  const [draggedLayerId, setDraggedLayerId] = useState<string | null>(null);

  // Current preset image URL fallback
  const getActiveImageUrl = () => {
    if (activePresetId === "custom") {
      return customImage || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=1200";
    }
    const current = DEMO_PRESETS.find(p => p.id === activePresetId);
    return current ? current.url : DEMO_PRESETS[0].url;
  };

  // Fetch AI analysis for the selected preset or input
  const loadPresetAnalysis = async (presetId: "portrait" | "product" | "old_photo" | "custom", customImgB64?: string) => {
    setIsAnalyzing(true);
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          presetName: presetId,
          userDescription: presetId === "custom" ? "Custom workspace uploaded image spec." : undefined,
          customImageBase64: customImgB64
        })
      });

      const data = await response.json();
      if (data && !data.error) {
        setWorkspaceData(data);
        if (data.liveApiStatus) {
          setLiveApiStatus(data.liveApiStatus);
        } else {
          setLiveApiStatus("healthy");
        }
        // Reset Custom sliders
        setBrightnessVal(0);
        setRawContrastVal(0);
        setSaturationVal(0);
        // Look up corresponding editing suggestion defaults
        const bokehSugg = data.editingSuggestions?.find((s: any) => s.id === "bokeh-boost" || s.id === "vignette-focus");
        setCustomBokehVal(bokehSugg ? bokehSugg.current : 0);
        const smoothSugg = data.editingSuggestions?.find((s: any) => s.id === "skin-smoothing" || s.id === "face-recovery" || s.id === "dust-scratch-removal");
        setSkinSmoothPower(smoothSugg ? smoothSugg.current : 15);
        setBlemishReduction(20);
        setEyeEnhancePower(10);
      }
    } catch (e) {
      console.log("Offline backup loaded safely.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Run on first render or active preset change
  useEffect(() => {
    if (activePresetId !== "custom") {
      loadPresetAnalysis(activePresetId);
    }
  }, [activePresetId]);

  // Handle custom file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCustomImageName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setCustomImage(base64String);
        setActivePresetId("custom");
        loadPresetAnalysis("custom", base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  // Send message to Creative Assistant (Module 7)
  const handleSendMessage = async (prefilledMsg?: string) => {
    const msgToSend = prefilledMsg || chatMessage;
    if (!msgToSend.trim()) return;

    // Add user message
    const updatedHistory = [...chatHistory, { role: "user" as const, text: msgToSend }];
    setChatHistory(updatedHistory);
    if (!prefilledMsg) setChatMessage("");
    setIsTyping(true);

    try {
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: msgToSend,
          activeImageDetails: {
            subject: workspaceData.subject,
            composition: workspaceData.composition,
            exposure: workspaceData.exposure
          }
        })
      });
      const data = await response.json();
      if (data.liveApiStatus) {
        setLiveApiStatus(data.liveApiStatus);
      }
      setChatHistory(prev => [...prev, { role: "assistant", text: data.response || "Server response unavailable." }]);
    } catch (e) {
      setLiveApiStatus("offline");
      setChatHistory(prev => [
        ...prev,
        { role: "assistant", text: "⚠️ Network interrupted. Run in offline simulated workspace mode instead." }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  // Handle Generative Fill Background (Module 1)
  const triggerGenerativeFill = async () => {
    if (!generativeFillPrompt.trim()) return;
    setIsGeneratingFill(true);
    setTimeout(() => {
      // Simulate generative backdrop modification or object addition
      setIsGeneratingFill(false);
      // Append generated layer
      const newLayerId = `genfill-${Date.now()}`;
      const newLayer: LayerItem = {
        id: newLayerId,
        type: generativeFillCategory === "background" ? "Background" : "Object",
        name: `AI Generative: ${generativeFillPrompt}`,
        visible: true,
        opacity: 100,
        x: generativeFillCategory === "background" ? 0 : 45,
        y: generativeFillCategory === "background" ? 0 : 40
      };
      setWorkspaceData(prev => ({
        ...prev,
        layers: [newLayer, ...prev.layers.filter(l => generativeFillCategory === "background" ? l.type !== "Background" : true)],
        aiRecommendationMarkdown: prev.aiRecommendationMarkdown + `\n\n* **Generative Fill Active**: Generated "${generativeFillPrompt}" matching seamless contour weights.`
      }));
      setGenerativeFillPrompt("");
    }, 2200);
  };

  // Handle layer click editing
  const selectLayer = (layerId: string) => {
    setSelectedLayerId(layerId);
  };

  // Update text layer value (Module 4 Font Recognition)
  const handleUpdateLayerText = (text: string) => {
    setWorkspaceData(prev => ({
      ...prev,
      layers: prev.layers.map(l => {
        if (l.id === selectedLayerId && l.fontInfo) {
          return { ...l, fontInfo: { ...l.fontInfo, text } };
        }
        return l;
      })
    }));
  };

  const handleUpdateLayerColor = (color: string) => {
    setWorkspaceData(prev => ({
      ...prev,
      layers: prev.layers.map(l => {
        if (l.id === selectedLayerId && l.fontInfo) {
          return { ...l, fontInfo: { ...l.fontInfo, color } };
        }
        return l;
      })
    }));
  };

  const handleUpdateLayerSize = (size: string) => {
    setWorkspaceData(prev => ({
      ...prev,
      layers: prev.layers.map(l => {
        if (l.id === selectedLayerId && l.fontInfo) {
          return { ...l, fontInfo: { ...l.fontInfo, size } };
        }
        return l;
      })
    }));
  };

  // Toggle Layer visibility
  const toggleLayerVisibility = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setWorkspaceData(prev => ({
      ...prev,
      layers: prev.layers.map(l => {
        if (l.id === id) {
          return { ...l, visible: !l.visible };
        }
        return l;
      })
    }));
  };

  // Toggle Slider Suggestion toggles
  const toggleSuggestionApplied = (id: string) => {
    setWorkspaceData(prev => ({
      ...prev,
      editingSuggestions: prev.editingSuggestions.map(s => {
        if (s.id === id) {
          return { ...s, applied: !s.applied };
        }
        return s;
      })
    }));
  };

  // Handle Preset Look clicks (Module 5)
  const applyPresetLook = (look: PresetLook) => {
    setBrightnessVal(look.adjustments.brightness || 0);
    setRawContrastVal(look.adjustments.contrast || 0);
    setSaturationVal(look.adjustments.saturation || 0);
    if (look.adjustments.bokeh !== undefined) setCustomBokehVal(look.adjustments.bokeh);
    if (look.adjustments.skinSmooth !== undefined) setSkinSmoothPower(look.adjustments.skinSmooth);
  };

  // Run Split View dragging calculations
  const handleSplitDown = (e: React.MouseEvent) => {
    setIsDraggingSplit(true);
  };

  const handleSplitMove = (e: any) => {
    if (!isDraggingSplit || !splitContainerRef.current) return;
    const rect = splitContainerRef.current.getBoundingClientRect();
    const x = (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left;
    let percentage = (x / rect.width) * 100;
    if (percentage < 0) percentage = 0;
    if (percentage > 100) percentage = 100;
    setSplitSliderPos(percentage);
  };

  const handleSplitUp = () => {
    setIsDraggingSplit(false);
  };

  useEffect(() => {
    const handleMouseUp = () => setIsDraggingSplit(false);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("touchend", handleMouseUp);
    return () => {
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchend", handleMouseUp);
    };
  }, []);

  // Video Assist Generator (Module 9)
  const handleVideoAction = (actionType: "scenes" | "caption" | "thumbnail") => {
    setVideoFeaturesLoading(true);
    setTimeout(() => {
      setVideoFeaturesLoading(false);
      if (actionType === "scenes") {
        setSceneAnalysisMsg(`* **Optimal Frame Crop**: detected 16:9 Landscape contour with center balance.\n* **Key Visual Anchor**: High luminosity reflections from metallic/glossy zones.\n* **Video Recommendations**: A slow 5-second pan-in with 20% zoom expansion will double engagement metrics on modern short platforms.`);
      } else if (actionType === "caption") {
        setGeneratedCaption(`"Precision meets aesthetics. ✨ Automated with AI Media Studio Ultra. #photography #designworkflow #desklife"`);
      } else if (actionType === "thumbnail") {
        setThumbnailTemplate(`YouTube Overlay Layer generated: Gradient dark border, 22% brightness drop on secondary regions, bold central outline highlights.`);
      }
    }, 1100);
  };

  // License Key Activation (Module 12)
  const handleActivateLicense = () => {
    if (!licenseKey.trim()) {
      setLicenseError("License key cannot be empty.");
      return;
    }
    if (licenseKey.toLowerCase().includes("ultra") || licenseKey.length >= 8) {
      setIsLicenseActivated(true);
      setIsPremiumPlan(true);
      setLicenseError("");
      // Add Premium Pro badges dynamically
    } else {
      setLicenseError("Invalid serial format. Try using key 'ULTRA-X-PRO-2026'");
    }
  };

  // Premium Billing Generation
  const handleGenerateInvoice = () => {
    const invoiceNum = `INV-${Math.floor(Math.random() * 90000) + 10000}`;
    setGeneratedInvoice({
      number: invoiceNum,
      date: "June 14, 2026",
      paidBy: "imashaisuri49@gmail.com",
      product: "AI Media Studio Ultra X - Business Enterprise License",
      price: "$199.00 USD",
      status: "PAID via CryptoSecure Stripe x64 Gateway"
    });
  };

  // Export File logic (Module 8)
  const triggerExport = () => {
    setIsExporting(true);
    const activeProfile = EXPORT_PROFILES.find(p => p.id === selectedExportProfile);
    setTimeout(() => {
      setIsExporting(false);
      setExportSuccessMessage(`Successfully compiled high-fidelity layout to system directory. Dimensions parsed: ${activeProfile?.dimensions} (${activeProfile?.aspectRatio}) using advanced smart AI anchor alignment.`);
      setTimeout(() => setExportSuccessMessage(""), 5000);
    }, 1800);
  };

  // Calculate dynamic filter classes for original vs enhanced viewport preview
  const getFilterStyle = (): React.CSSProperties => {
    if (viewMode === "original") {
      // Dull raw unretouched look
      return {
        filter: activePresetId === "old_photo" ? "sepia(0.8) contrast(0.6) brightness(0.8) grayscale(1)" : "contrast(0.7) brightness(0.9) saturate(0.6)",
        transition: "filter 0.3s ease"
      };
    }
    // Fully adjusted simulated live style
    const saturationBoost = 100 + saturationVal;
    const brightnessBoost = 100 + brightnessVal;
    const contrastBoost = 100 + rawContrastVal;
    // Layer effects
    let baseStyles = `saturate(${saturationBoost}%) brightness(${brightnessBoost}%) contrast(${contrastBoost}%)`;

    if (activePresetId === "old_photo") {
      // In enhanced mode, restore old photo color!
      baseStyles += ` sepia(${(100 - skinSmoothPower) / 2}%) saturate(110%)`;
    }

    return {
      filter: baseStyles,
      transition: "filter 0.1s ease"
    };
  };

  const activeLayer = workspaceData.layers.find(l => l.id === selectedLayerId);

  return (
    <div className="w-full min-h-screen bg-[#0A0A0C] text-gray-200 font-sans flex flex-col select-none overflow-x-hidden">
      
      {/* HEADER SECTION --- Top level layout navigation --- */}
      <header className="h-14 border-b border-white/10 flex items-center justify-between px-4 bg-[#0E0E12] relative z-20">
        <div className="flex items-center space-x-4">
          <div className="flex space-x-3 items-center">
            {/* Professional Studio Logo Icon */}
            <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 via-[#9D50BB] to-cyan-400 p-[1px] shadow-[0_0_12px_rgba(157,80,187,0.45)] group overflow-hidden shrink-0">
              <div className="absolute inset-0 bg-[#0E0E12] opacity-95 rounded-[7px]" />
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-cyan-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
              </div>
            </div>

            <span className="font-display font-extrabold tracking-tight text-sm uppercase text-white bg-gradient-to-r from-white via-slate-100 to-cyan-300 bg-clip-text">
              AI Media Studio Ultra X
            </span>
            <span className="text-[10px] font-mono bg-purple-950/80 border border-purple-500/30 text-purple-400 px-1.5 py-0.5 rounded uppercase font-semibold">
              v2026.1 Win64
            </span>
          </div>

          <nav className="flex space-x-1 text-[11px] font-bold uppercase tracking-wider text-gray-400 pl-6 h-full">
            <button
              onClick={() => setActiveTab("editor")}
              className={`px-3 py-1.5 rounded transition ${
                activeTab === "editor"
                  ? "text-white bg-white/5 border-b-2 border-[#9D50BB]"
                  : "hover:text-white hover:bg-white/5"
              }`}
            >
              Ultimate Editor
            </button>
            <button
              onClick={() => setActiveTab("assistant")}
              className={`px-3 py-1.5 rounded transition ${
                activeTab === "assistant"
                  ? "text-white bg-white/5 border-b-2 border-[#9D50BB]"
                  : "hover:text-white hover:bg-white/5"
              }`}
            >
              Creative AI Assistant
            </button>
            <button
              onClick={() => setActiveTab("batch")}
              className={`px-3 py-1.5 rounded transition ${
                activeTab === "batch"
                  ? "text-white bg-white/5 border-b-2 border-[#9D50BB]"
                  : "hover:text-white hover:bg-white/5"
              }`}
            >
              Batch Automation
            </button>
            <button
              onClick={() => setActiveTab("projects")}
              className={`px-3 py-1.5 rounded transition ${
                activeTab === "projects"
                  ? "text-white bg-white/5 border-b-2 border-[#9D50BB]"
                  : "hover:text-white hover:bg-white/5"
              }`}
            >
              Project Workspace
            </button>
            <button
              onClick={() => setActiveTab("pro-features")}
              className={`px-3 py-1.5 rounded transition ${
                activeTab === "pro-features"
                  ? "text-white bg-white/5 border-b-2 border-[#9D50BB]"
                  : "hover:text-white hover:bg-white/5"
              }`}
            >
              License & Upgrades {isPremiumPlan ? "👑" : "★"}
            </button>
          </nav>
        </div>

        <div className="flex items-center space-x-3">
          <div className="hidden lg:flex items-center px-3 py-1 rounded bg-white/5 border border-white/10 space-x-2">
            <span className="text-[10px] text-emerald-400 font-bold tracking-widest animate-pulse flex items-center gap-1">
              ⚡ GPU ACTIVE
            </span>
            <span className="text-[10px] font-mono text-gray-500">RTX 4096 Cores • 0.6ms</span>
          </div>

          {isPremiumPlan ? (
            <div className="flex items-center gap-1 bg-amber-950/40 border border-amber-500/40 px-2 py-1 rounded text-[11px] font-medium text-amber-300">
              <span>UNLIMITED LICENSE</span>
            </div>
          ) : (
            <button
              onClick={() => {
                setActiveTab("pro-features");
                setShowBillingModal(true);
              }}
              className="bg-amber-550 hover:bg-amber-600 text-[10px] font-mono font-bold tracking-widest uppercase border border-amber-400 bg-gradient-to-r from-amber-600 to-yellow-600 text-white px-3 py-1 rounded shadow-[0_0_10px_rgba(217,119,6,0.3)] transition"
            >
              Upgrade Free Trial
            </button>
          )}

          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-1.5 px-2 rounded bg-[#1a1c2a] hover:bg-[#25283d] text-white border border-white/10 flex items-center justify-center transition"
            title="Toggle Light/Dark Theme"
          >
            {theme === "dark" ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
          </button>

          <button
            onClick={() => {
              const fileInput = document.getElementById("local-img-uploader");
              if (fileInput) fileInput.click();
            }}
            className="p-1 px-2.5 rounded bg-[#1a1c2a] hover:bg-[#25283d] text-white border border-white/10 flex items-center gap-1.5 text-xs font-mono"
            title="Upload custom image to replace canvas preset"
          >
            <Upload className="w-3.5 h-3.5 text-cyan-400" />
            Import File
          </button>
          <input
            id="local-img-uploader"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileUpload}
          />
        </div>
      </header>

      {/* CORE FRAMEWORK WORKSPACE */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* SIDE BAR BUTTONS (LEFT) --- Module navigation indicator --- */}
        <aside className="w-14 border-r border-white/10 flex flex-col items-center py-4 bg-[#0E0E12] space-y-5 justify-between select-none">
          <div className="flex flex-col items-center space-y-4 w-full">
            <div 
              onClick={() => setActiveTab("editor")}
              className={`p-2.5 rounded-lg cursor-pointer transition ${activeTab === 'editor' ? 'text-white bg-[#00D2FF]/20 border border-[#00D2FF]/40 shadow-[0_0_8px_rgba(0,210,255,0.2)]' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'}`}
              title="Creative Image Workspace"
            >
              <Palette className="w-5 h-5" />
            </div>

            <div 
              onClick={() => setActiveTab("assistant")}
              className={`p-2.5 rounded-lg cursor-pointer transition ${activeTab === 'assistant' ? 'text-white bg-[#9D50BB]/20 border border-[#9D50BB]/40 shadow-[0_0_8px_rgba(157,80,187,0.3)]' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'}`}
              title="Creative AI Scriptor & Copilot"
            >
              <Sparkles className="w-5 h-5 text-purple-400" />
            </div>

            <div 
              onClick={() => setActiveTab("batch")}
              className={`p-2.5 rounded-lg cursor-pointer transition ${activeTab === 'batch' ? 'text-white bg-emerald-950/40 border border-emerald-500/40' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'}`}
              title="Batch Automation Engine"
            >
              <Layers3 className="w-5 h-5 text-emerald-400" />
            </div>

            <div 
              onClick={() => setActiveTab("projects")}
              className={`p-2.5 rounded-lg cursor-pointer transition ${activeTab === 'projects' ? 'text-white bg-[#00D2FF]/20 border border-[#00D2FF]/40 shadow-[0_0_8px_rgba(0,210,255,0.2)]' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'}`}
              title="Project Workspace Hub"
            >
              <Briefcase className="w-5 h-5 text-cyan-400" />
            </div>

            <div className="w-8 h-[1px] bg-white/10 my-1"></div>

            {/* Editing Tools selection cues */}
            <div 
              onClick={() => {
                setViewMode(viewMode === "split" ? "enhanced" : "split");
              }}
              className={`p-2 rounded cursor-pointer transition ${viewMode === "split" ? "text-cyan-400 bg-white/5" : "text-gray-500 hover:text-white"}`}
              title="Compare Split Preview"
            >
              <SlidersHorizontal className="w-4.5 h-4.5" />
            </div>

            <div 
              onClick={() => {
                // Focus on Text layer automatically
                const textL = workspaceData.layers.find(l => l.type === "Text");
                if (textL) setSelectedLayerId(textL.id);
              }}
              className={`p-2 rounded cursor-pointer transition ${activeLayer?.type === "Text" ? "text-cyan-400 bg-white/5" : "text-gray-500"}`}
              title="Select Font / Typography Layer"
            >
              <TypeIcon className="w-4.5 h-4.5" />
            </div>

            <div 
              onClick={() => {
                // Toggle first background layer to show backdrop removal
                const bgL = workspaceData.layers.find(l => l.type === "Background");
                if (bgL) {
                  setWorkspaceData(prev => ({
                    ...prev,
                    layers: prev.layers.map(l => l.id === bgL.id ? { ...l, visible: !l.visible } : l)
                  }));
                }
              }}
              className="p-2 text-gray-500 hover:text-white rounded cursor-pointer transition"
              title="Toggle AI Isolated Background Layer"
            >
              <Scissors className="w-4.5 h-4.5 text-red-400" />
            </div>

            <div 
              onClick={() => {
                const subL = workspaceData.layers.find(l => l.type === "Subject" || l.type === "Product");
                if (subL) setSelectedLayerId(subL.id);
              }}
              className="p-2 text-gray-500 hover:text-white rounded cursor-pointer transition"
              title="Select Core Foreground Subject"
            >
              <Crop className="w-4.5 h-4.5 text-amber-500" />
            </div>
          </div>

          <div className="flex flex-col items-center space-y-3">
            <button
              onClick={() => {
                // Reset all custom overrides
                setBrightnessVal(0);
                setRawContrastVal(0);
                setSaturationVal(0);
                setCustomBokehVal(0);
                setSkinSmoothPower(40);
                setBlemishReduction(40);
              }}
              className="p-2 text-gray-500 hover:text-white rounded transition"
              title="Restore Raw Presets Defaults"
            >
              <RotateCcw className="w-4 h-4 text-orange-400" />
            </button>

            <div className="w-8 h-[1px] bg-white/10"></div>

            <div className="text-[9px] font-mono font-bold tracking-tight text-slate-500 text-center">
              SEC
            </div>
            {/* Safe cloud lock toggle */}
            <div 
              onClick={() => setLocalProcessingFirst(!localProcessingFirst)}
              className={`p-2 rounded-full cursor-pointer transition ${localProcessingFirst ? "bg-emerald-950/40 text-emerald-400 border border-emerald-500/30" : "bg-red-950/20 text-red-400"}`}
              title={localProcessingFirst ? "Local Processing First: Verified Active" : "Cloud Sandbox Activated"}
            >
              {localProcessingFirst ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
            </div>
          </div>
        </aside>

        {/* WORKSPACE CENTRAL SCREEN */}
        {activeTab === "editor" && (
          <main className="flex-1 bg-[#121217] relative flex flex-col p-4 overflow-hidden min-w-0">
            {/* Info bar of current Workspace image */}
            <div className="flex items-center justify-between bg-[#191924]/60 border border-white/5 rounded-t-lg p-2.5 px-4 z-10">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-r from-blue-700 to-indigo-700 p-1.5 rounded text-white">
                  <Camera className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-mono font-medium text-slate-400">active project frame:</span>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-display font-semibold text-white tracking-wide">
                      {activePresetId === "custom" ? customImageName || "Uploaded Workspace Target" : DEMO_PRESETS.find(p => p.id === activePresetId)?.name}
                    </h2>
                    <span className="text-[10px] text-cyan-400 bg-cyan-950/40 border border-cyan-800/30 px-1.5 rounded-full font-mono font-medium">
                      {workspaceData.subject}
                    </span>

                    {/* Highly-reflective dynamic live SDK check badge */}
                    {liveApiStatus === "healthy" ? (
                      <span className="text-[9px] text-[#10b981] bg-[#061c16]/80 border border-[#10b981]/30 px-2 py-0.5 rounded font-mono font-bold flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]" />
                        SDK LIVE
                      </span>
                    ) : liveApiStatus === "quota_exceeded" ? (
                      <span className="text-[9px] text-amber-400 bg-amber-950/50 border border-amber-500/40 px-2 py-0.5 rounded font-mono font-bold flex items-center gap-1.5 animate-pulse" title="Vibe local hardware sandboxes have booted as a high-fidelity backup core to cover temporary live backend quota limits.">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                        LOCAL BACKUP ACTIVE (QUOTA EXCEEDED)
                      </span>
                    ) : liveApiStatus === "high_demand" ? (
                      <span className="text-[9px] text-orange-400 bg-orange-950/50 border border-orange-500/40 px-2 py-0.5 rounded font-mono font-bold flex items-center gap-1.5 animate-pulse" title="Vibe local hardware sandboxes have booted as a high-fidelity backup core to handle temporary live backend server load spikes.">
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                        LOCAL BACKUP ACTIVE (MODEL OVERLOAD)
                      </span>
                    ) : (
                      <span className="text-[9px] text-slate-400 bg-slate-950 border border-slate-800 px-2 py-0.5 rounded font-mono font-bold flex items-center gap-1.5" title="Operating under fully isolation local processing sandbox mode.">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                        LOCAL SIMULATION ACTIVE
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-slate-500">Viewport Render:</span>
                <div className="flex bg-[#0f1016] border border-white/10 rounded overflow-hidden p-0.5">
                  <button
                    onClick={() => setViewMode("original")}
                    className={`px-2.5 py-1 text-[11px] font-medium rounded transition ${viewMode === "original" ? "bg-white/10 text-white font-bold" : "text-gray-400 hover:text-white"}`}
                  >
                    Original
                  </button>
                  <button
                    onClick={() => setViewMode("enhanced")}
                    className={`px-2.5 py-1 text-[11px] font-medium rounded transition ${viewMode === "enhanced" ? "bg-[#00D2FF]/20 text-[#00D2FF] font-bold" : "text-gray-400 hover:text-white"}`}
                  >
                    Enhanced Auto
                  </button>
                  <button
                    onClick={() => setViewMode("split")}
                    className={`px-2.5 py-1 text-[11px] font-medium rounded transition ${viewMode === "split" ? "bg-purple-950 text-purple-400 font-bold" : "text-gray-400 hover:text-white"}`}
                  >
                    Interactive Slider
                  </button>
                </div>
              </div>
            </div>

            {/* Master Photo view canvas platform */}
            <div 
              ref={splitContainerRef}
              onMouseMove={handleSplitMove}
              onTouchMove={handleSplitMove}
              id="editor-canvas-workspace" 
              className="flex-1 border-x border-[#272a3e] bg-[#0c0d12] flex items-center justify-center p-4 relative overflow-hidden min-h-[300px]"
            >
              {isAnalyzing && (
                <div className="absolute inset-0 bg-[#0A0A0C]/80 z-20 flex flex-col items-center justify-center space-y-3">
                  <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
                  <p className="text-sm font-space font-semibold text-slate-300">GPU Seg-Net & Depth Estimator Running...</p>
                  <span className="text-xs text-slate-500 font-mono">Parsing color histograms, faces nodes, and text boundaries</span>
                </div>
              )}

              {/* Real Responsive Image Viewport Block */}
              <div className="relative max-w-full max-h-full aspect-[4/3] rounded-lg shadow-2xl border border-white/10 overflow-hidden flex items-center justify-center bg-black">
                {viewMode === "split" ? (
                  // Interactive manual split screen slider view
                  <div className="relative w-full h-full select-none cursor-ew-resize overflow-hidden">
                    {/* Before Image (Left Layer container) */}
                    <img 
                      src={getActiveImageUrl()} 
                      alt="Raw unenhanced source" 
                      className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none"
                      style={{ 
                        filter: activePresetId === "old_photo" ? "sepia(0.8) contrast(0.6) brightness(0.8) grayscale(1)" : "contrast(0.7) brightness(0.9) saturate(0.6)",
                      }}
                    />

                    {/* After Image (Right Layer with Clip Path) */}
                    <div 
                      className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden" 
                      style={{ 
                        clipPath: `polygon(${splitSliderPos}% 0, 100% 0, 100% 100%, ${splitSliderPos}% 100%)` 
                      }}
                    >
                      <img 
                        src={getActiveImageUrl()} 
                        alt="AI enhanced focus" 
                        style={getFilterStyle()} 
                        className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none"
                      />
                    </div>

                    {/* Divider Handle */}
                    <div 
                      className="absolute top-0 bottom-0 w-1 bg-gradient-to-b from-[#00D2FF] to-[#9D50BB] cursor-ew-resize z-10 flex items-center justify-center" 
                      style={{ left: `${splitSliderPos}%` }}
                      onMouseDown={handleSplitDown}
                      onTouchStart={handleSplitDown}
                    >
                      <div className="w-6 h-6 rounded-full bg-white text-black shadow-xl flex items-center justify-center text-[10px] font-bold select-none border border-cyan-400">
                        ↔
                      </div>
                    </div>
                  </div>
                ) : (
                  // Standard View (Original or Enhanced modes toggled cleanly)
                  <div className="relative w-full h-full overflow-hidden">
                    {/* Background Layer underlay */}
                    {workspaceData.layers.find(l => l.type === "Background")?.visible && (
                      <div className="absolute inset-0 bg-slate-900 overflow-hidden z-0">
                        <img 
                          src={getActiveImageUrl()} 
                          alt="Main Active Canvas Asset" 
                          style={getFilterStyle()} 
                          className="w-full h-full object-cover select-none"
                        />
                      </div>
                    )}

                    {/* Simulating background transparency / Removal if background layer is hidden */}
                    {!workspaceData.layers.find(l => l.type === "Background")?.visible && (
                      <div className="absolute inset-0 z-0 bg-[radial-gradient(#1b1c2b_1px,transparent_1px)] [background-size:16px_16px] bg-[#0c0d12] flex items-center justify-center">
                        <span className="text-[11px] text-[#00D2FF]/40 font-mono tracking-wider items-center uppercase">
                          AI ALPHA BACKDROP BYPASSED
                        </span>
                      </div>
                    )}

                    {/* Transparent foreground isolated container representation */}
                    <img 
                      src={getActiveImageUrl()} 
                      alt="Isolated Foreground Subject Layer" 
                      style={{
                        ...getFilterStyle(),
                        clipPath: !workspaceData.layers.find(l => l.type === "Background")?.visible 
                          ? "circle(38% at 50% 45%)" // simple simulation of extracted subject contour geometry
                          : undefined
                      }} 
                      className={`absolute inset-0 w-full h-full object-cover select-none transition-all duration-300 pointer-events-none ${
                        !workspaceData.layers.find(l => l.type === "Background")?.visible ? "drop-shadow-[0_20px_50px_rgba(0,210,255,0.3)] animate-pulse" : ""
                      }`}
                    />

                    {/* Smart simulated Gaussian blur on background if bokeh boost is raised */}
                    {customBokehVal > 15 && workspaceData.layers.find(l => l.type === "Background")?.visible && (
                      <div 
                        className="absolute inset-0 pointer-events-none transition-all duration-500" 
                        style={{
                          backdropFilter: `blur(${customBokehVal / 8}px)`,
                          clipPath: "polygon(0 0, 100% 0, 100% 12%, 0 12%, 0 88%, 100% 88%, 100% 100%, 0 100%)" // focus on central window
                        }} 
                      />
                    )}

                    {/* Visual Overlays for AI Layers & Font Recognition (Module 3 & Module 4) */}
                    {workspaceData.layers.map((layer) => {
                      if (!layer.visible) return null;

                      // Display bounding boxes conditionally
                      const isSelected = selectedLayerId === layer.id;
                      const hasFont = layer.fontInfo !== undefined;

                      return (
                        <div
                          key={layer.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            selectLayer(layer.id);
                          }}
                          className={`absolute p-1 cursor-pointer transition-all duration-200 ${
                            isSelected 
                              ? "border-2 border-[#00D2FF] shadow-[0_0_12px_#00D2FF]/40 bg-[#00D2FF]/5" 
                              : "border border-white/20 hover:border-cyan-400 bg-white/5"
                          }`}
                          style={{
                            left: layer.x !== undefined ? `${layer.x}%` : "30%",
                            top: layer.y !== undefined ? `${layer.y}%` : "40%",
                            maxWidth: "80%",
                            opacity: layer.opacity / 100,
                            zIndex: isSelected ? 10 : 5
                          }}
                        >
                          <span className="absolute -top-5 left-0 px-1 py-0.5 text-[8px] font-bold uppercase tracking-widest leading-none bg-[#0a0a0d] border border-white/10 rounded">
                            {layer.type}: {layer.name.substring(0, 18)}...
                            {isSelected && " (Selected)"}
                          </span>

                          {hasFont && layer.fontInfo ? (
                            <div 
                              style={{ 
                                fontFamily: layer.fontInfo.family, 
                                fontWeight: layer.fontInfo.weight,
                                fontSize: layer.fontInfo.size,
                                color: layer.fontInfo.color,
                                textShadow: "0 2px 4px rgba(0,0,0,0.8)"
                              }}
                              className="px-2 py-1 leading-snug whitespace-nowrap text-left font-space"
                            >
                              {layer.fontInfo.text || "AI TYPOGRAPHY"}
                            </div>
                          ) : (
                            // Render simple generic icon bounding box for non-text layers
                            <div className="w-24 h-16 flex items-center justify-center text-[10px] text-slate-400 font-mono italic">
                              [ isolated motif ]
                            </div>
                          )}

                          {isSelected && (
                            <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-[#00D2FF] cursor-se-resize"></div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Interactive Generative Fill Command Center (Module 1) */}
            <div className="mt-2 bg-[#141523] border border-white/10 rounded-b-lg p-3">
              <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
                  <span className="text-xs font-mono font-bold uppercase text-slate-400">
                    Gen Fill & Ersatz replaced contour:
                  </span>
                  
                  <div className="flex bg-[#0a0a0c] p-0.5 rounded border border-white/10">
                    <button
                      onClick={() => setGenerativeFillCategory("background")}
                      className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded ${generativeFillCategory === "background" ? "bg-purple-904 text-white bg-purple-650" : "text-gray-500 hover:text-gray-300"}`}
                    >
                      Swap Backdrop
                    </button>
                    <button
                      onClick={() => setGenerativeFillCategory("object")}
                      className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded ${generativeFillCategory === "object" ? "bg-cyan-904 text-white bg-cyan-650" : "text-gray-500 hover:text-gray-300"}`}
                    >
                      Insert Object
                    </button>
                  </div>
                </div>

                <div className="flex-1 flex gap-2">
                  <input
                    type="text"
                    value={generativeFillPrompt}
                    onChange={(e) => setGenerativeFillPrompt(e.target.value)}
                    placeholder={
                      generativeFillCategory === "background" 
                        ? "e.g., 'Warm sunset over volcanic beaches, cinematic bokeh, highly detailed'..."
                        : "e.g., 'Glowing glass neon sphere inside the cylinder'..."
                    }
                    className="flex-1 bg-[#0a0a0d] border border-white/10 rounded px-2.5 py-1 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-400 text-left font-mono"
                  />
                  <button
                    onClick={triggerGenerativeFill}
                    disabled={isGeneratingFill || !generativeFillPrompt}
                    className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white text-[11px] font-bold uppercase tracking-wider px-3.5 rounded hover:brightness-110 transition shrink-0 disabled:opacity-40"
                  >
                    {isGeneratingFill ? "Synthesizing..." : "Generate Fill"}
                  </button>
                </div>
              </div>
            </div>
          </main>
        )}

        {activeTab === "assistant" && (
          <main className="flex-1 bg-[#121217] relative flex flex-col p-5 overflow-y-auto">
            <div className="max-w-3xl mx-auto w-full flex-1 flex flex-col justify-between space-y-4">
              
              <div className="bg-[#151624]/60 border border-white/10 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-[#9D50BB]/25 border border-[#9D50BB]/40 p-2 rounded-lg">
                    <Sparkles className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <h2 className="text-base font-display font-bold text-white uppercase tracking-wider">
                      Module 7: Creative AI Assistant & Copywriter
                    </h2>
                    <p className="text-xs text-slate-400">
                      Generate viral short campaign outlines, visual asset taglines, or custom Photoshop instruction macros.
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  {liveApiStatus === "healthy" ? (
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/20 uppercase">
                      GEMINI ENGINE GRIPPED
                    </span>
                  ) : liveApiStatus === "quota_exceeded" ? (
                    <span className="text-[10px] font-mono text-amber-400 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-500/20 uppercase animate-pulse">
                      SANDBOX FAILSAFE (RESOURCES LIMITED)
                    </span>
                  ) : liveApiStatus === "high_demand" ? (
                    <span className="text-[10px] font-mono text-orange-400 bg-orange-950/40 px-2 py-0.5 rounded border border-orange-500/20 uppercase animate-pulse">
                      SANDBOX FAILSAFE (MODEL OVERLAID)
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800 uppercase">
                      LOCAL CORES NATIVE ACTIVE
                    </span>
                  )}
                </div>
              </div>

              {/* Chat Timeline representation */}
              <div className="flex-1 bg-[#0c0d12] border border-white/10 rounded-xl p-4 overflow-y-auto min-h-[300px] flex flex-col space-y-3">
                {chatHistory.map((item, idx) => (
                  <div 
                    key={idx} 
                    className={`flex ${item.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div 
                      className={`max-w-[85%] rounded-lg p-3 text-xs leading-relaxed ${
                        item.role === 'user' 
                          ? 'bg-[#9D50BB]/20 border border-[#9D50BB]/40 text-slate-100 font-mono text-right' 
                          : 'bg-[#151722] border border-white/5 text-slate-350 text-left'
                      }`}
                    >
                      <div className="font-bold text-[10px] uppercase text-slate-500 mb-1">
                        {item.role === 'user' ? 'You (Visual Director)' : 'Ultra Creative Brain'}
                      </div>
                      <div className="whitespace-pre-line font-space">
                        {item.text}
                      </div>
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="text-xs text-purple-400 animate-pulse font-mono pl-2">
                    typing generative creative recommendation details...
                  </div>
                )}
              </div>

              {/* Quick AI Presets Prompt Suggestion Builders */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  onClick={() => handleSendMessage("Generate a commercial advertising copy poster layout with Outfit Bold headlines for this product.")}
                  className="p-2 border border-white/5 bg-[#141521] hover:bg-[#1a1c2d] rounded text-[10px] font-semibold text-slate-300 text-center"
                >
                  📣 Ad Poster Layout
                </button>
                <button
                  onClick={() => handleSendMessage("Draft high-latitude color correction guidelines to make this DSLR portrait look stunning.")}
                  className="p-2 border border-white/5 bg-[#141521] hover:bg-[#1a1c2d] rounded text-[10px] font-semibold text-slate-300 text-center"
                >
                  🎨 DSLR Palette Blueprint
                </button>
                <button
                  onClick={() => handleSendMessage("Provide a 15-second viral TikTok hook sequence using this image as the thumbnail.")}
                  className="p-2 border border-white/5 bg-[#141521] hover:bg-[#1a1c2d] rounded text-[10px] font-semibold text-slate-300 text-center"
                >
                  🚀 TikTok / Reels Outline
                </button>
                <button
                  onClick={() => handleSendMessage("Create a step-by-step restoration action list to heal dust scratches and colors in old archival photos.")}
                  className="p-2 border border-white/5 bg-[#141521] hover:bg-[#1a1c2d] rounded text-[10px] font-semibold text-slate-300 text-center"
                >
                  🕰️ Family Memoir Heal
                </button>
              </div>

              {/* Message box prompt input */}
              <div className="flex gap-2 bg-[#0E0E12] border border-white/10 p-2 rounded-lg">
                <input
                  type="text"
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                  placeholder="Ask creative questions (e.g. 'Generate a product slogan for social stories resizing', 'Write visual grading CSS')..."
                  className="flex-1 bg-[#0a0a0d] border border-transparent rounded px-3 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-400"
                />
                <button
                  onClick={() => handleSendMessage()}
                  className="p-2 rounded bg-gradient-to-r from-[#00D2FF] to-[#9D50BB] text-white hover:brightness-110 transition"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>

            </div>
          </main>
        )}

        {activeTab === "batch" && (
          <main className="flex-1 bg-[#121217] relative flex flex-col p-5 overflow-y-auto">
            <div className="max-w-4xl mx-auto w-full space-y-6">
              
              <div className="bg-[#151624]/60 border border-white/10 rounded-xl p-4 flex items-center justify-between">
                <div className="flex gap-3 items-center">
                  <div className="bg-emerald-950/50 border border-emerald-500/40 p-2 rounded-lg">
                    <Layers3 className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <h2 className="text-base font-display font-bold text-white uppercase tracking-wider">
                      Module 10: Multi-threaded Batch Automation System
                    </h2>
                    <p className="text-xs text-slate-400">
                      Apply chosen Neural edits and custom resolutions upscaling across up to 10,000 files in parallel.
                    </p>
                  </div>
                </div>

                <span className="text-[10px] font-mono font-semibold bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 px-2 py-0.5 rounded">
                  LATENCY CORE: 12ms / thread
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Queue Settings */}
                <div className="bg-[#0c0d12] border border-white/10 rounded-xl p-4 space-y-3">
                  <h3 className="text-xs font-mono font-bold uppercase text-slate-400 pb-2 border-b border-white/5">
                    1. Pipeline Target Filter
                  </h3>

                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-semibold text-slate-500 block">AI Operations Set</label>
                    <div className="space-y-1 text-xs">
                      {[
                        "Remove All Backgrounds (Isolated Contour Alpha)",
                        "Autofit Crop to Aspect Ratio",
                        "Sub-pixel Portrait Face Recovery Boost",
                        "Equalize Exposure & Lighting Curves",
                        "Cinematic Gold Film Tint Preset"
                      ].map((task, index) => (
                        <label key={index} className="flex items-center gap-2 p-1.5 rounded hover:bg-white/5 cursor-pointer">
                          <input type="checkbox" defaultChecked={index < 2} className="accent-cyan-400" />
                          <span className="text-slate-300 text-[11px]">{task}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Queue Simulation */}
                <div className="bg-[#0c0d12] border border-white/10 rounded-xl p-4 col-span-2 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-mono font-bold uppercase text-slate-400">
                      2. Real-time Batch Automation Queue Simulation
                    </h3>
                    <span className="text-[10px] font-mono text-slate-500">6 tasks active • 1.2 GB / s writing bandwidth</span>
                  </div>

                  <div className="space-y-2 font-mono text-xs max-h-[300px] overflow-y-auto pr-1">
                    {[
                      { file: "DSC_8901_ModelPortrait_Raw.CR3", size: "84.2 MB", progress: 100, state: "COMPLETE", label: "Skin smooth & background alpha isolated." },
                      { file: "DSC_8902_ModelPortrait_Raw.CR3", size: "90.1 MB", progress: 100, state: "COMPLETE", label: "Skin smooth & background alpha isolated." },
                      { file: "DSC_8903_ModelPortrait_Raw.CR3", size: "86.4 MB", progress: 65, state: "RENDERING", label: "Extracting rule-of-thirds facial layers..." },
                      { file: "ProductFlask_Catalog_01.PNG", size: "12.8 MB", progress: 0, state: "QUEUED", label: "Awaiting volumetric shadow matrix overlay..." },
                      { file: "ProductFlask_Catalog_02.PNG", size: "14.5 MB", progress: 0, state: "QUEUED", label: "Awaiting volumetric shadow matrix overlay..." },
                      { file: "HeritageArchivalSepia_1932.TIFF", size: "235 MB", progress: 0, state: "QUEUED", label: "Awaiting neural microscratch fusion rendering..." }
                    ].map((row, i) => (
                      <div key={i} className="bg-[#141622] rounded border border-white/5 p-2 flex items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 justify-between">
                            <span className="font-bold truncate text-[11px] text-slate-200">{row.file}</span>
                            <span className="text-slate-500 text-[9px] shrink-0">{row.size}</span>
                          </div>
                          <p className="text-[10px] text-[#00D2FF]/80 italic mt-0.5">{row.label}</p>
                          <div className="w-full bg-[#0a0a0c] h-1 rounded mt-1.5 overflow-hidden">
                            <div className="bg-[#00D2FF] h-full" style={{ width: `${row.progress}%` }} />
                          </div>
                        </div>

                        <div className="shrink-0 text-right">
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            row.state === "COMPLETE" ? "text-emerald-400 bg-emerald-950/40" :
                            row.state === "RENDERING" ? "text-amber-400 bg-amber-950/40 animate-pulse" :
                            "text-slate-400 bg-slate-900"
                          }`}>
                            {row.state} ({row.progress}%)
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button className="px-3 py-1.5 text-xs font-mono font-bold bg-[#1d1f30] hover:bg-[#2c2f4a] text-slate-300 rounded border border-white/10">
                      Configure FTP Output
                    </button>
                    <button className="px-4 py-1.5 text-xs font-mono font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded">
                      Trigger Parallel GPU Thread
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </main>
        )}

        {activeTab === "pro-features" && (
          <main className="flex-1 bg-[#121217] relative flex flex-col p-5 overflow-y-auto">
            <div className="max-w-3xl mx-auto w-full space-y-6">
              
              <div className="bg-gradient-to-r from-amber-950/60 to-[#0E0E12] border border-amber-500/30 rounded-xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h2 className="text-lg font-display font-extrabold text-amber-300 uppercase tracking-wider flex items-center gap-2">
                    👑 Unlock Unlimited Processing License
                  </h2>
                  <p className="text-xs text-slate-300 max-w-xl">
                    Get full unlimited CUDA thread operations, premium 70s-90s film grain templates, and vector font replacement tools. Use serial key activation or process via our invoice generator.
                  </p>
                </div>

                <div className="shrink-0">
                  <span className="text-[11px] font-mono font-bold text-amber-400 bg-amber-950/60 border border-amber-500/40 p-2 rounded">
                    Current Plane: {isPremiumPlan ? "LIMITED ENTERPRISE PRO" : "FREE TRIAL CONTEXT"}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Activate Box using rich single-PC custom LicenseHandler */}
                <LicenseHandler
                  licenseKey={licenseKey}
                  setLicenseKey={setLicenseKey}
                  isLicenseActivated={isLicenseActivated}
                  setIsLicenseActivated={setIsLicenseActivated}
                  setIsPremiumPlan={setIsPremiumPlan}
                  licenseError={licenseError}
                  setLicenseError={setLicenseError}
                />

                {/* Simulated Invoicing Box */}
                <div className="bg-[#0c0d12] border border-white/10 rounded-xl p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-mono font-bold uppercase text-slate-400">
                      Module 12: Pro Upgrade Invoice Generator
                    </h3>
                    <button
                      onClick={handleGenerateInvoice}
                      className="px-2.5 py-1 bg-[#1c1d2e] border border-white/10 hover:border-cyan-400 rounded text-[10px] font-mono text-slate-300"
                    >
                      Generate Mock invoice
                    </button>
                  </div>

                  {generatedInvoice ? (
                    <div className="bg-[#141521] border border-white/5 rounded-lg p-3 text-xs space-y-2 leading-relaxed font-mono">
                      <div className="flex justify-between border-b border-white/5 pb-1">
                        <span className="text-[10px] text-slate-500">INVOICE NO:</span>
                        <span className="text-slate-300 font-bold">{generatedInvoice.number}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[10px] text-slate-500">DATE PRINTED:</span>
                        <span className="text-slate-300">{generatedInvoice.date}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[10px] text-slate-500">BILLED TO:</span>
                        <span className="text-slate-300 font-bold">{generatedInvoice.paidBy}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[10px] text-slate-500">ITEM VALUE:</span>
                        <span className="text-slate-300">{generatedInvoice.price}</span>
                      </div>
                      <div className="flex justify-between border-t border-white/5 pt-1 text-[11px] font-bold">
                        <span className="text-slate-500">PAYMENT STATUS:</span>
                        <span className="text-emerald-400">{generatedInvoice.status}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="border border-dashed border-white/10 rounded-lg p-8 text-center text-xs text-slate-500 font-mono">
                      No invoices currently registered. Click above to print transaction details instantly.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </main>
        )}

        {activeTab === "projects" && (
          <ProjectManager
            onLoadAssetInEditor={(presetId, assetName) => {
              setActivePresetId(presetId);
              setCustomImageName(assetName);
              // Auto apply relative view modes for high contrast comparison
              if (presetId === "old_photo") {
                setViewMode("split");
              } else {
                setViewMode("enhanced");
              }
              setActiveTab("editor");
            }}
            onTriggerMockExport={(exportProfileId, onComplete) => {
              const matchedProfile = EXPORT_PROFILES.find(p => p.id === exportProfileId);
              const formattedName = matchedProfile 
                ? `${matchedProfile.platform} - ${matchedProfile.useCase} (${matchedProfile.dimensions})` 
                : "Standard Platform Social Grid Layout";
              
              // Emulate native CUDA downsampling thread compiler delay
              setTimeout(() => {
                onComplete(formattedName);
              }, 1200);
            }}
          />
        )}

        {/* INSPECTOR PANEL: DETAILED SLIDERS & ANALYSIS (RIGHT) --- */}
        {activeTab !== "projects" && (
          <aside className="w-80 border-l border-white/10 flex flex-col bg-[#0E0E12] divide-y divide-white/10 overflow-y-auto shrink-0 select-none">
          
          {/* Preset look Selectors (Module 5 Cinematic DSLR Look) */}
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-mono uppercase tracking-widest text-slate-500 font-bold flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-purple-400" />
                Cinematic DSLR Presets
              </h3>
              <span className="text-[9px] font-mono text-cyan-400 bg-cyan-950 px-1.5 rounded-full font-bold">
                AUTO-ESTIMATE
              </span>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              {PRESET_LOOKS.map((look) => (
                <button
                  key={look.id}
                  onClick={() => applyPresetLook(look)}
                  className={`text-[10px] p-2 rounded text-left border font-space transition ${look.accents} hover:brightness-125`}
                >
                  <span className="font-bold block tracking-wide">{look.label}</span>
                  <span className="text-[8px] text-slate-400 line-clamp-1 mt-0.5">{look.description}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Module 2: Smart Image Analytics */}
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-mono uppercase tracking-widest text-[#00D2FF] font-black">
                Diagnostics Node
              </h3>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                <span className="text-[9px] text-slate-400 uppercase font-mono">Synced</span>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Detected Subject:</span>
                <span className="text-slate-350 font-bold text-right truncate max-w-[140px]" title={workspaceData.subject}>
                  {workspaceData.subject}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-500">Camera Optic estimate:</span>
                <span className="text-slate-350 font-mono text-right truncate max-w-[130px]">
                  {workspaceData.cameraStyle.lens}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-500">Composition grid:</span>
                <span className="text-slate-350 text-right truncate max-w-[140px]" title={workspaceData.composition}>
                  {workspaceData.composition}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-500">Exposure level:</span>
                <span className="text-slate-350 font-semibold">{workspaceData.exposure}</span>
              </div>

              {workspaceData.faces.detected > 0 && (
                <div className="bg-[#141521] border border-white/5 p-2 rounded text-[11px] space-y-1">
                  <p className="font-bold text-cyan-400 flex items-center gap-1">
                    <Smile className="w-3 h-3" /> Face Retina Detected
                  </p>
                  <div className="grid grid-cols-2 gap-1 text-[10px] text-slate-400 font-mono">
                    <div>Conf: <span className="text-white">{workspaceData.faces.confidence}</span></div>
                    <div>Skin: <span className="text-white">{workspaceData.faces.skinTexture}</span></div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Module 6: Auto Skin Retouch & DSLR parameters */}
          <div className="p-4 space-y-4">
            <h3 className="text-[10px] font-mono uppercase tracking-widest text-slate-500 font-bold">
              Volumetric Adjustments
            </h3>

            <div className="space-y-3">
              {/* Exposure Slider */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Master Level Exposure</span>
                  <span className="font-mono text-cyan-400">{brightnessVal > 0 ? `+${brightnessVal}` : brightnessVal}%</span>
                </div>
                <input
                  type="range"
                  min="-50"
                  max="50"
                  value={brightnessVal}
                  onChange={(e) => setBrightnessVal(Number(e.target.value))}
                  className="w-full accent-cyan-400 h-1 bg-[#1a1b2d] rounded-lg cursor-pointer"
                />
              </div>

              {/* Contrast */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Tonal Gamma Contrast</span>
                  <span className="font-mono text-cyan-400">{rawContrastVal > 0 ? `+${rawContrastVal}` : rawContrastVal}%</span>
                </div>
                <input
                  type="range"
                  min="-50"
                  max="50"
                  value={rawContrastVal}
                  onChange={(e) => setRawContrastVal(Number(e.target.value))}
                  className="w-full accent-cyan-400 h-1 bg-[#1a1b2d] rounded-lg cursor-pointer"
                />
              </div>

              {/* Saturation */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Chroma Color Saturation</span>
                  <span className="font-mono text-cyan-400">{saturationVal > 0 ? `+${saturationVal}` : saturationVal}%</span>
                </div>
                <input
                  type="range"
                  min="-50"
                  max="50"
                  value={saturationVal}
                  onChange={(e) => setSaturationVal(Number(e.target.value))}
                  className="w-full accent-cyan-400 h-1 bg-[#1a1b2d] rounded-lg cursor-pointer"
                />
              </div>

              {/* Bokeh Size slider */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-450 text-[11px]">DSLR Radial Bokeh Falloff</span>
                  <span className="font-mono text-purple-400">{customBokehVal}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={customBokehVal}
                  onChange={(e) => setCustomBokehVal(Number(e.target.value))}
                  className="w-full accent-purple-500 h-1 bg-[#1a1b2d] rounded-lg cursor-pointer"
                />
              </div>

              {/* Face Retouch (Smooth) slider */}
              <div className="space-y-2 border-t border-white/5 pt-2">
                <span className="text-[9px] text-[#9D50BB] font-mono font-bold uppercase block">
                  Natural Retouch Engine
                </span>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-450 text-[11px]">Organic Skin Smooth</span>
                    <span className="font-mono text-slate-300">{skinSmoothPower}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={skinSmoothPower}
                    onChange={(e) => setSkinSmoothPower(Number(e.target.value))}
                    className="w-full accent-purple-500 h-1 bg-[#1a1b2d] rounded-lg cursor-pointer"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <button
                    onClick={() => setBlemishReduction(prev => prev === 70 ? 0 : 70)}
                    className={`p-1.5 rounded transition font-mono border ${blemishReduction > 0 ? 'bg-purple-950/20 border-purple-500/30 text-purple-300' : 'bg-[#181a29] border-white/10 text-slate-400'}`}
                  >
                    Acne Heal: {blemishReduction > 0 ? "ON (70%)" : "OFF"}
                  </button>
                  <button
                    onClick={() => setEyeEnhancePower(prev => prev === 80 ? 0 : 80)}
                    className={`p-1.5 rounded transition font-mono border ${eyeEnhancePower > 0 ? 'bg-cyan-950/20 border-cyan-500/30 text-cyan-300' : 'bg-[#181a29] border-white/10 text-slate-400'}`}
                  >
                    Eye Refract: {eyeEnhancePower > 0 ? "ON (80%)" : "OFF"}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Module 3 & 4: Integrated Layer Hierarchy & Font Recognition */}
          <div className="p-4 space-y-3">
            <h3 className="text-[10px] font-mono uppercase tracking-widest text-[#00D2FF] font-black">
              Seg-Net Layout Hierarchy
            </h3>

            <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
              {workspaceData.layers.map((layer) => {
                const isSelected = selectedLayerId === layer.id;
                const isFont = layer.fontInfo !== undefined;

                return (
                  <div
                    key={layer.id}
                    onClick={() => selectLayer(layer.id)}
                    className={`group flex items-center p-2 rounded transition cursor-pointer border ${
                      isSelected 
                        ? 'bg-[#1c1d2e] border-cyan-400/60 shadow-[0_0_8px_rgba(0,210,255,0.15)]' 
                        : 'bg-[#131422]/70 hover:bg-white/5 border-transparent'
                    }`}
                  >
                    <div className="mr-2">
                      <button
                        onClick={(e) => toggleLayerVisibility(layer.id, e)}
                        className="text-slate-500 hover:text-white"
                        title="Toggle Layer Render State"
                      >
                        {layer.visible ? <Eye className="w-3.5 h-3.5 text-cyan-400" /> : <EyeOff className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    <div className="flex-1 flex flex-col min-w-0">
                      <span className="text-[11px] font-bold truncate text-slate-200">
                        {layer.name}
                      </span>
                      <span className="text-[9px] text-slate-500 font-mono uppercase">
                        {layer.type} • Opacity: {layer.opacity}%
                      </span>
                    </div>

                    {isFont && (
                      <span className="text-[8px] font-mono text-purple-400 bg-purple-950/80 px-1 border border-purple-800/30 rounded shrink-0">
                        FONT MATCHED
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* If currently selected layer has custom Matched fonts (Module 4) */}
            {activeLayer && activeLayer.fontInfo && (
              <div className="bg-[#141521] border border-[#a855f7]/20 rounded p-3 space-y-2 mt-2">
                <div className="flex items-center gap-1">
                  <TypeIcon className="w-3.5 h-3.5 text-purple-400" />
                  <span className="text-xs font-mono font-bold text-purple-300">
                    Live Typography Modifier
                  </span>
                </div>

                <div className="text-[11px] space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Estimated Face:</span>
                    <span className="text-slate-200 font-sans italic font-bold">{activeLayer.fontInfo.family}</span>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] text-slate-500 uppercase block">Layer String</label>
                    <input
                      type="text"
                      value={activeLayer.fontInfo.text || ""}
                      onChange={(e) => handleUpdateLayerText(e.target.value)}
                      className="w-full bg-[#0a0a0d] border border-white/10 rounded px-2 py-1 text-xs text-white placeholder-slate-650 text-left focus:border-cyan-400"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-1.5">
                    <div>
                      <label className="text-[8px] text-slate-500 block">WEIGHT</label>
                      <span className="text-[11px] font-mono font-bold text-slate-350">{activeLayer.fontInfo.weight}</span>
                    </div>
                    <div>
                      <label className="text-[8px] text-slate-500 block font-mono">COLOR CODE</label>
                      <input
                        type="color"
                        value={activeLayer.fontInfo.color}
                        onChange={(e) => handleUpdateLayerColor(e.target.value)}
                        className="w-7 h-5 border-none p-0 bg-transparent block"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Module 9: Video Assist Utilities */}
          <div className="p-4 space-y-3">
            <h3 className="text-[10px] font-mono uppercase tracking-widest text-slate-500 font-bold flex items-center gap-1">
              <Video className="w-3.5 h-3.5 text-amber-500" />
              Video Campaign Assist
            </h3>

            <div className="grid grid-cols-3 gap-1.5">
              <button
                onClick={() => handleVideoAction("scenes")}
                className="p-1 px-2 text-[9px] font-bold uppercase tracking-wider bg-[#10121d] hover:bg-[#1a1d30] hover:border-cyan-400 transition rounded border border-white/5 text-slate-300"
              >
                Scene Crop
              </button>
              <button
                onClick={() => handleVideoAction("caption")}
                className="p-1 px-2 text-[9px] font-bold uppercase tracking-wider bg-[#10121d] hover:bg-[#1a1d30] hover:border-cyan-400 transition rounded border border-white/5 text-slate-300"
              >
                AI Caption
              </button>
              <button
                onClick={() => handleVideoAction("thumbnail")}
                className="p-1 px-2 text-[9px] font-bold uppercase tracking-wider bg-[#10121d] hover:bg-[#1a1d30] hover:border-cyan-400 transition rounded border border-white/5 text-slate-300"
              >
                Cover Art
              </button>
            </div>

            {videoFeaturesLoading && (
              <div className="text-[10px] font-mono text-cyan-400 animate-pulse text-center">
                Computing telemetry frames...
              </div>
            )}

            {sceneAnalysisMsg && (
              <div className="bg-[#141521] border border-[#272a3e] p-2.5 rounded text-[11px] text-slate-350 font-sans leading-relaxed whitespace-pre-wrap">
                {sceneAnalysisMsg}
              </div>
            )}

            {generatedCaption && (
              <div className="bg-[#141521] border border-[#272a3e] p-2.5 rounded text-[11px] text-cyan-300 font-mono italic">
                {generatedCaption}
              </div>
            )}

            {thumbnailTemplate && (
              <div className="bg-[#141521] border border-[#272a3e] p-2 rounded text-[10px] text-purple-300 font-mono">
                {thumbnailTemplate}
              </div>
            )}
          </div>

          {/* Module 8: Smart Multi-format Export & Resizer Engine */}
          <div className="p-4 space-y-3">
            <h3 className="text-[10px] font-mono uppercase tracking-widest text-[#00D2FF] font-black">
              Output Resizer Hub
            </h3>

            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-1.5">
                {EXPORT_PROFILES.map((profile) => (
                  <button
                    key={profile.id}
                    onClick={() => setSelectedExportProfile(profile.id)}
                    className={`text-[9px] p-1.5 rounded transition text-left border ${
                      selectedExportProfile === profile.id
                        ? "bg-slate-900 border-[#00D2FF] text-white font-bold"
                        : "bg-[#141624] border-white/5 text-slate-400"
                    }`}
                  >
                    <span className="block font-sans text-slate-200 uppercase">{profile.platform}</span>
                    <span className="block text-slate-450 italic mt-0.5">{profile.dimensions}</span>
                  </button>
                ))}
              </div>

              <button
                onClick={triggerExport}
                disabled={isExporting}
                className="w-full py-2 cursor-pointer bg-gradient-to-r from-[#00D2FF] to-[#9D50BB] text-black hover:brightness-110 active:scale-[0.98] rounded text-xs font-black uppercase tracking-widest block text-center"
              >
                {isExporting ? "Compiling Output Frames..." : "Compile High Fidelity Vector Copy"}
              </button>

              {exportSuccessMessage && (
                <div className="bg-emerald-950/50 border border-emerald-500/40 rounded p-2 text-[10px] text-emerald-300 leading-snug font-mono whitespace-pre-wrap">
                  {exportSuccessMessage}
                </div>
              )}
            </div>
          </div>
        </aside>
      )}
      </div>

      {/* FOOTER FILMSTRIP RECONSTRUCTION: PRESETS & DIRECT STORAGE OPTIONS */}
      {activeTab !== "projects" && (
        <footer className="h-28 border-t border-white/10 bg-[#0E0E12] flex items-stretch overflow-hidden select-none">
        
        {/* Preset selector filmstrip column 1 */}
        <div className="p-3 border-r border-white/10 w-64 shrink-0 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <h4 className="text-[10px] font-bold uppercase text-slate-500">Image specimens</h4>
            <span className="text-[9px] text-[#9D50BB] font-bold uppercase">Source file selector</span>
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            {DEMO_PRESETS.map((dp) => (
              <button
                key={dp.id}
                onClick={() => {
                  setActivePresetId(dp.id);
                  // Auto apply relative look
                  if (dp.id === "portrait") setViewMode("enhanced");
                  else if (dp.id === "product") setViewMode("enhanced");
                  else if (dp.id === "old_photo") setViewMode("enhanced");
                }}
                className={`relative h-12 rounded overflow-hidden border ${activePresetId === dp.id ? "border-[#00D2FF]" : "border-white/10 opacity-60 hover:opacity-100"} transition`}
                title={dp.description}
              >
                <img src={dp.url} className="w-full h-full object-cover" />
                <span className="absolute bottom-0 inset-x-0 bg-black/80 text-[8px] font-mono text-center block truncate px-1 text-slate-300">
                  {dp.id === "old_photo" ? "Archival" : dp.id === "portrait" ? "Portrait" : "Flask"}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic preview filmstrip of calculated outputs */}
        <div className="flex-1 flex items-center px-4 space-x-3 overflow-x-auto">
          <div className="text-[10px] font-mono uppercase text-slate-500 tracking-wider shrink-0 mr-2">
            Active Layer Matrices:
          </div>

          <div className="h-16 w-28 shrink-0 rounded bg-black/40 border border-[#00D2FF]/60 flex items-center justify-center relative overflow-hidden">
            <img src={getActiveImageUrl()} className="opacity-40 grayscale blur-[1px] w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/60 flex flex-col justify-center items-center text-center p-1 font-mono">
              <span className="text-[8px] font-bold uppercase text-[#00D2FF]">Subject layer</span>
              <span className="text-[7px] text-slate-400">Isolated</span>
            </div>
          </div>

          <div className="h-16 w-28 shrink-0 rounded bg-black/40 border border-purple-500/50 flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 flex flex-col justify-center items-center text-center p-1 font-mono bg-purple-950/30">
              <span className="text-[8px] font-bold uppercase text-purple-400">Typography layer</span>
              <span className="text-[7px] text-slate-400">Matched font</span>
            </div>
          </div>

          <div className="h-16 w-28 shrink-0 rounded bg-black/45 border border-slate-700 flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 flex flex-col justify-center items-center text-center p-1 font-mono bg-slate-900/30">
              <span className="text-[8px] font-bold uppercase text-slate-500">Backdrop CYCLO</span>
              <span className="text-[7px] text-slate-400">Lock alpha</span>
            </div>
          </div>

          <div className="h-16 w-28 shrink-0 rounded bg-slate-900 border border-dashed border-white/10 flex items-center justify-center relative overflow-hidden flex-col">
            <span className="text-[8px] font-mono text-slate-500 text-center uppercase px-1">
              Add Vector layer
            </span>
          </div>
        </div>

        {/* Performance Engine Widget */}
        <div className="w-80 shrink-0 p-2.5">
          <GpuPerformance />
        </div>

        {/* Data Privacy Status panel (Module 11) */}
        <div className="w-56 p-3 bg-[#0A0A0C] border-l border-white/10 flex flex-col justify-between shrink-0">
          <div className="flex items-center justify-between">
            <span className="text-[9px] text-slate-500 uppercase font-mono tracking-widest flex items-center gap-1">
              <Shield className="w-3 h-3 text-emerald-450" />
              Privacy Shield
            </span>
            <span className="text-[8px] font-mono text-emerald-400 font-bold uppercase">
              SANDBOX SECURE
            </span>
          </div>

          <div className="text-[10px] space-y-1 font-mono text-slate-400">
            <div className="flex justify-between items-center">
              <span>Local Isolation:</span>
              <button 
                onClick={() => setLocalProcessingFirst(!localProcessingFirst)}
                className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${localProcessingFirst ? "text-emerald-400 bg-emerald-950/40" : "text-slate-500"}`}
              >
                {localProcessingFirst ? "ACTIVE" : "OFFLINE"}
              </button>
            </div>
            <div className="flex justify-between items-center">
              <span>Encrypted Storage:</span>
              <button 
                onClick={() => setEncryptedCache(!encryptedCache)}
                className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${encryptedCache ? "text-emerald-400 bg-emerald-950/40" : "text-slate-500"}`}
              >
                {encryptedCache ? "ACTIVE" : "OFFLINE"}
              </button>
            </div>
            <div className="flex justify-between items-center">
              <span>GDPR/ISO 27001:</span>
              <span className="text-emerald-400">COMPLIANT</span>
            </div>
          </div>
        </div>
      </footer>
      )}

      {/* RENDER MODAL IN CASE BILLING ACTIONS TRIGGERED */}
      {showBillingModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0e0f17] border border-white/10 rounded-xl p-6 max-w-md w-full relative space-y-4">
            <button
              onClick={() => setShowBillingModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-2">
              <span className="text-2xl">👑</span>
              <h2 className="text-lg font-display font-extrabold text-white uppercase tracking-wider">
                Upgrade to AI Studio Ultra X Pro
              </h2>
              <p className="text-xs text-slate-400">
                Unlock multi-threaded CUDA pipelines, batch rendering of infinite specs, and raw neural restorative models.
              </p>
            </div>

            <div className="bg-[#151724] border border-white/5 rounded-lg p-4 space-y-3">
              <div className="grid grid-cols-2 gap-2 text-center text-xs">
                <div className="border border-white/10 rounded p-2.5 bg-black/35">
                  <span className="text-[10px] text-slate-500 block uppercase font-mono">Trial Version</span>
                  <span className="font-bold text-white">Free Plan</span>
                  <span className="text-[9px] text-slate-400 block mt-1">20 Process / Day</span>
                </div>
                <div className="border border-amber-500/40 rounded p-2.5 bg-amber-950/10">
                  <span className="text-[10px] text-amber-500 block uppercase font-mono">Premium Core</span>
                  <span className="font-bold text-amber-300">Pro Enterprise</span>
                  <span className="text-[9px] text-amber-400 block mt-1">Unlimited pipelines</span>
                </div>
              </div>

              <div className="text-center font-display font-black text-white text-xl">
                $19.00 <span className="text-xs font-mono font-medium text-slate-400">/ user monthly</span>
              </div>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => {
                  setIsPremiumPlan(true);
                  setIsLicenseActivated(true);
                  setShowBillingModal(false);
                }}
                className="w-full py-2.5 bg-gradient-to-r from-amber-600 to-yellow-600 text-black text-semibold text-xs font-mono font-bold uppercase tracking-wider rounded hover:brightness-110"
              >
                Trigger Instant Stripe upgrade
              </button>
              <button
                onClick={() => setShowBillingModal(false)}
                className="w-full py-2 bg-gradient-to-r from-cyan-600 to-blue-600 text-white text-semibold text-xs font-mono font-bold uppercase tracking-wider rounded hover:brightness-110"
              >
                Activate via Serial License key Instead
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
