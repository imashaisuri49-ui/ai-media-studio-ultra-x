export type LayerType = "Subject" | "Text" | "Logo" | "Background" | "Shape" | "Object" | "Product";

export interface FontInfo {
  family: string;
  weight: string;
  size: string;
  color: string;
  text?: string;
}

export interface LayerItem {
  id: string;
  type: LayerType;
  name: string;
  visible: boolean;
  opacity: number; // 0 to 100
  fontInfo?: FontInfo;
  x?: number; // relative pos %
  y?: number; // relative pos %
  blendMode?: string;
}

export interface EditingSuggestion {
  id: string;
  label: string;
  current: number; // slider % (0 to 100)
  applied: boolean;
  category: "skin" | "dslr" | "color" | "background" | "hdr" | "scale" | "restore";
}

export interface PresetLook {
  id: string;
  label: string;
  description: string;
  accents: string; // colors representation e.g. warm, cold
  adjustments: {
    contrast?: number;
    brightness?: number;
    saturation?: number;
    bokeh?: number;
    skinSmooth?: number;
    colorization?: number;
    sharpen?: number;
    denoise?: number;
  };
}

export interface ExportProfile {
  id: string;
  platform: string;
  dimensions: string;
  aspectRatio: string;
  useCase: string;
}

export interface ClientInfo {
  name: string;
  email: string;
  phone: string;
  company: string;
  notes: string;
}

export interface ProjectAsset {
  id: string;
  name: string;
  category: "Photo" | "Video" | "Design";
  status: "Draft" | "In Progress" | "In Review" | "Completed" | "Exported";
  presetId?: "portrait" | "product" | "old_photo" | "custom";
  url?: string;
  exportProfile?: string;
  createdAt: string;
}

export interface ProjectTask {
  id: string;
  title: string;
  priority: "Low" | "Medium" | "High";
  status: "To Do" | "In Progress" | "Done";
  assignee: string;
  createdAt: string;
}

export interface ProjectData {
  id: string;
  title: string;
  description: string;
  status: "Planning" | "In Progress" | "Feedback" | "Approved" | "Completed";
  client: ClientInfo;
  assets: ProjectAsset[];
  tasks: ProjectTask[];
  createdAt: string;
  updatedAt: string;
}

