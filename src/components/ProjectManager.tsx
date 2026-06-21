import React, { useState, useEffect } from "react";
import {
  FolderPlus,
  FolderOpen,
  Plus,
  Trash2,
  CheckSquare,
  Square,
  User,
  Mail,
  Phone,
  Calendar,
  CheckCircle2,
  Image,
  Video,
  Smartphone,
  Sliders,
  Download,
  AlertCircle,
  ArrowLeft,
  Clock,
  Briefcase,
  Tag,
  ChevronRight,
  AlertTriangle,
  Check,
  Loader2,
  X
} from "lucide-react";

import { db, isLiveFirebase, doc, setDoc } from "../lib/firebase";
import { collection, getDocs, deleteDoc, writeBatch } from "firebase/firestore";
import { ProjectData, ProjectAsset, ProjectTask, ClientInfo } from "../types";
import { EXPORT_PROFILES } from "../data/demoImages";

interface ProjectManagerProps {
  onLoadAssetInEditor: (presetId: "portrait" | "product" | "old_photo" | "custom", assetName: string) => void;
  onTriggerMockExport: (exportProfileId: string, onComplete: (profileName: string) => void) => void;
}

const DEFAULT_PROJECTS: ProjectData[] = [
  {
    id: "proj-1",
    title: "Summer Solstice Campaign",
    description: "Creating premium social media graphic kits and cinematic portrait reels for the luxury resort summer collection release.",
    status: "In Progress",
    client: {
      name: "Sophia Henderson",
      company: "The Grand Palms Resort",
      email: "sophia.h@grandpalms.com",
      phone: "+1 (555) 382-9901",
      notes: "Extremely meticulous about brand teal alignments. Prefer portrait DSLR bokeh look for highlights."
    },
    assets: [
      {
        id: "asset-1",
        name: "Cover Key Portrait Specimen",
        category: "Photo",
        status: "Draft",
        presetId: "portrait",
        createdAt: new Date().toLocaleDateString()
      },
      {
        id: "asset-2",
        name: "Promo Video Teaser Reel",
        category: "Video",
        status: "In Progress",
        createdAt: new Date().toLocaleDateString()
      },
      {
        id: "asset-3",
        name: "Flyer Banner Overlay",
        category: "Design",
        status: "Completed",
        createdAt: new Date().toLocaleDateString()
      }
    ],
    tasks: [
      {
        id: "task-1",
        title: "Smoothen skin details on primary model photo",
        priority: "High",
        status: "To Do",
        assignee: "Lead Retoucher",
        createdAt: new Date().toLocaleDateString()
      },
      {
        id: "task-2",
        title: "Inject summer branding typography styles",
        priority: "Medium",
        status: "Done",
        assignee: "Designer",
        createdAt: new Date().toLocaleDateString()
      },
      {
        id: "task-3",
        title: "Synchronize audio beats for Instagram teaser Reel",
        priority: "High",
        status: "In Progress",
        assignee: "Motion Editor",
        createdAt: new Date().toLocaleDateString()
      }
    ],
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "proj-2",
    title: "Vintage Archival Restoration",
    description: "Restoring family archival catalogs from 1942 for digital library publication.",
    status: "Planning",
    client: {
      name: "David Vance",
      company: "Historical Registry Bureau",
      email: "d.vance@registry.org",
      phone: "+1 (555) 472-1033",
      notes: "Remove sepia damage and mold spot artifacts."
    },
    assets: [
      {
        id: "asset-4",
        name: "Restored Archival Family 1942",
        category: "Photo",
        status: "Draft",
        presetId: "old_photo",
        createdAt: new Date().toLocaleDateString()
      }
    ],
    tasks: [
      {
        id: "task-4",
        title: "Heal scratch tears on foreground emulsion and adjust grey balance",
        priority: "High",
        status: "To Do",
        assignee: "Historian Retoucher",
        createdAt: new Date().toLocaleDateString()
      }
    ],
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export default function ProjectManager({ onLoadAssetInEditor, onTriggerMockExport }: ProjectManagerProps) {
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modal / Form States
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [newProjTitle, setNewProjTitle] = useState<string>("");
  const [newProjDesc, setNewProjDesc] = useState<string>("");
  const [newProjClientName, setNewProjClientName] = useState<string>("");
  const [newProjClientEmail, setNewProjClientEmail] = useState<string>("");
  const [newProjClientPhone, setNewProjClientPhone] = useState<string>("");
  const [newProjClientCompany, setNewProjClientCompany] = useState<string>("");
  const [newProjClientNotes, setNewProjClientNotes] = useState<string>("");

  // Asset Form States
  const [newAssetName, setNewAssetName] = useState<string>("");
  const [newAssetCategory, setNewAssetCategory] = useState<"Photo" | "Video" | "Design">("Photo");
  const [newAssetPresetId, setNewAssetPresetId] = useState<"portrait" | "product" | "old_photo" | "custom">("portrait");

  // Task Form States
  const [newTaskTitle, setNewTaskTitle] = useState<string>("");
  const [newTaskPriority, setNewTaskPriority] = useState<"Low" | "Medium" | "High">("Medium");
  const [newTaskAssignee, setNewTaskAssignee] = useState<string>("");

  // Export Select
  const [exportTargetAssetId, setExportTargetAssetId] = useState<string | null>(null);
  const [selectedProfileId, setSelectedProfileId] = useState<string>("ig-story");
  const [isExportingAsset, setIsExportingAsset] = useState<boolean>(false);
  const [exportCompleteMessage, setExportCompleteMessage] = useState<string | null>(null);

  // Sync state loaded indicator
  useEffect(() => {
    loadProjects();
  }, []);

  // Save changes locally and inside firestore
  const saveProjectsCollection = async (updatedList: ProjectData[]) => {
    setProjects(updatedList);
    localStorage.setItem("media_studio_projects", JSON.stringify(updatedList));

    if (isLiveFirebase && db) {
      setIsSyncing(true);
      try {
        // Safe batch write to keep database matching our local changes
        const batch = writeBatch(db);
        
        // Write each project safely conforming to validation rules
        for (const proj of updatedList) {
          const docRef = doc(db, "projects", proj.id);
          batch.set(docRef, {
            id: proj.id,
            title: proj.title,
            description: proj.description,
            status: proj.status,
            client: proj.client,
            assets: proj.assets,
            tasks: proj.tasks,
            createdAt: proj.createdAt,
            updatedAt: proj.updatedAt
          });
        }
        await batch.commit();
      } catch (err: any) {
        console.error("Firestore batch sync failed: ", err);
        setErrorMessage("Firebase Cloud Sync deferred: local replica was successfully preserved.");
        setTimeout(() => setErrorMessage(null), 4000);
      } finally {
        setIsSyncing(false);
      }
    }
  };

  const loadProjects = async () => {
    setIsLoading(true);
    let loaded: ProjectData[] = [];

    // Prioritize Cloud Sync isLiveFirebase checks
    if (isLiveFirebase && db) {
      try {
        const querySnapshot = await getDocs(collection(db, "projects"));
        querySnapshot.forEach((doc) => {
          loaded.push(doc.data() as ProjectData);
        });
      } catch (err) {
        console.warn("Firestore collection fetch error, fallback to local storage:", err);
      }
    }

    if (loaded.length === 0) {
      const cached = localStorage.getItem("media_studio_projects");
      if (cached) {
        try {
          loaded = JSON.parse(cached);
        } catch (_) {
          loaded = DEFAULT_PROJECTS;
        }
      } else {
        loaded = DEFAULT_PROJECTS;
        localStorage.setItem("media_studio_projects", JSON.stringify(loaded));
      }
    }

    setProjects(loaded);
    setIsLoading(false);
  };

  // Create Project Callback
  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjTitle.trim()) return;

    const newProject: ProjectData = {
      id: `proj-${Date.now()}`,
      title: newProjTitle.trim(),
      description: newProjDesc.trim(),
      status: "Planning",
      client: {
        name: newProjClientName.trim() || "Walk-In Client",
        company: newProjClientCompany.trim() || "N/A",
        email: newProjClientEmail.trim() || "no-email@example.com",
        phone: newProjClientPhone.trim() || "N/A",
        notes: newProjClientNotes.trim()
      },
      assets: [],
      tasks: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const nextList = [newProject, ...projects];
    await saveProjectsCollection(nextList);

    // Reset Creation Fields
    setNewProjTitle("");
    setNewProjDesc("");
    setNewProjClientName("");
    setNewProjClientEmail("");
    setNewProjClientPhone("");
    setNewProjClientCompany("");
    setNewProjClientNotes("");
    setShowCreateModal(false);
    setSelectedProjectId(newProject.id);
  };

  // Delete Project Callback
  const handleDeleteProject = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this project? This is permanent.")) return;

    const nextList = projects.filter((p) => p.id !== id);
    if (selectedProjectId === id) {
      setSelectedProjectId(null);
    }
    await saveProjectsCollection(nextList);

    if (isLiveFirebase && db) {
      try {
        await deleteDoc(doc(db, "projects", id));
      } catch (_) {}
    }
  };

  // Update overall project status
  const handleUpdateProjectStatus = async (id: string, status: ProjectData["status"]) => {
    const nextList = projects.map((p) => {
      if (p.id === id) {
        return {
          ...p,
          status,
          updatedAt: new Date().toISOString()
        };
      }
      return p;
    });
    await saveProjectsCollection(nextList);
  };

  // Add Asset inside selected project
  const handleAddAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAssetName.trim() || !selectedProjectId) return;

    const newAsset: ProjectAsset = {
      id: `asset-${Date.now()}`,
      name: newAssetName.trim(),
      category: newAssetCategory,
      status: "Draft",
      presetId: newAssetPresetId,
      createdAt: new Date().toLocaleDateString()
    };

    const nextList = projects.map((p) => {
      if (p.id === selectedProjectId) {
        return {
          ...p,
          assets: [...p.assets, newAsset],
          updatedAt: new Date().toISOString()
        };
      }
      return p;
    });

    await saveProjectsCollection(nextList);
    setNewAssetName("");
  };

  // Delete asset
  const handleDeleteAsset = async (assetId: string) => {
    if (!selectedProjectId) return;
    const nextList = projects.map((p) => {
      if (p.id === selectedProjectId) {
        return {
          ...p,
          assets: p.assets.filter((a) => a.id !== assetId),
          updatedAt: new Date().toISOString()
        };
      }
      return p;
    });
    await saveProjectsCollection(nextList);
  };

  // Update Asset Status
  const handleUpdateAssetStatus = async (assetId: string, status: ProjectAsset["status"]) => {
    if (!selectedProjectId) return;
    const nextList = projects.map((p) => {
      if (p.id === selectedProjectId) {
        return {
          ...p,
          assets: p.assets.map((a) => (a.id === assetId ? { ...a, status } : a)),
          updatedAt: new Date().toISOString()
        };
      }
      return p;
    });
    await saveProjectsCollection(nextList);
  };

  // Add Task inside selected project
  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !selectedProjectId) return;

    const newTask: ProjectTask = {
      id: `task-${Date.now()}`,
      title: newTaskTitle.trim(),
      priority: newTaskPriority,
      status: "To Do",
      assignee: newTaskAssignee.trim() || "Unassigned",
      createdAt: new Date().toLocaleDateString()
    };

    const nextList = projects.map((p) => {
      if (p.id === selectedProjectId) {
        return {
          ...p,
          tasks: [...p.tasks, newTask],
          updatedAt: new Date().toISOString()
        };
      }
      return p;
    });

    await saveProjectsCollection(nextList);
    setNewTaskTitle("");
    setNewTaskAssignee("");
  };

  // Toggle Task Checklist
  const handleToggleTaskStatus = async (taskId: string, currentStatus: ProjectTask["status"]) => {
    if (!selectedProjectId) return;
    const nextStatus: ProjectTask["status"] = currentStatus === "Done" ? "To Do" : "Done";
    
    const nextList = projects.map((p) => {
      if (p.id === selectedProjectId) {
        return {
          ...p,
          tasks: p.tasks.map((t) => (t.id === taskId ? { ...t, status: nextStatus } : t)),
          updatedAt: new Date().toISOString()
        };
      }
      return p;
    });
    await saveProjectsCollection(nextList);
  };

  // Delete task
  const handleDeleteTask = async (taskId: string) => {
    if (!selectedProjectId) return;
    const nextList = projects.map((p) => {
      if (p.id === selectedProjectId) {
        return {
          ...p,
          tasks: p.tasks.filter((t) => t.id !== taskId),
          updatedAt: new Date().toISOString()
        };
      }
      return p;
    });
    await saveProjectsCollection(nextList);
  };

  // Edit / Save Client details
  const handleSaveClientInfo = async (field: keyof ClientInfo, value: string) => {
    if (!selectedProjectId) return;
    const nextList = projects.map((p) => {
      if (p.id === selectedProjectId) {
        return {
          ...p,
          client: {
            ...p.client,
            [field]: value
          },
          updatedAt: new Date().toISOString()
        };
      }
      return p;
    });
    await saveProjectsCollection(nextList);
  };

  // Trigger export for specific asset
  const handleTriggerAssetExport = (assetId: string) => {
    setExportTargetAssetId(assetId);
    setExportCompleteMessage(null);
  };

  const handleExecuteExportProcess = () => {
    if (!exportTargetAssetId || !selectedProjectId) return;
    setIsExportingAsset(true);

    onTriggerMockExport(selectedProfileId, async (profileName) => {
      setIsExportingAsset(false);
      
      const nextList = projects.map((p) => {
        if (p.id === selectedProjectId) {
          return {
            ...p,
            assets: p.assets.map((a) => {
              if (a.id === exportTargetAssetId) {
                return {
                  ...a,
                  status: "Exported" as const,
                  exportProfile: profileName
                };
              }
              return a;
            }),
            updatedAt: new Date().toISOString()
          };
        }
        return p;
      });

      await saveProjectsCollection(nextList);
      setExportCompleteMessage(`Export successful! High-fidelity asset rendered using profile: "${profileName}".`);
      setTimeout(() => {
        setExportTargetAssetId(null);
        setExportCompleteMessage(null);
      }, 3500);
    });
  };

  // Active Context Calculations
  const selectedProject = projects.find((p) => p.id === selectedProjectId);

  // Global Project Stats
  const totalProjects = projects.length;
  const totalAssets = projects.reduce((acc, p) => acc + p.assets.length, 0);
  const totalTasksDone = projects.reduce((acc, p) => acc + p.tasks.filter((t) => t.status === "Done").length, 0);
  const totalTasks = projects.reduce((acc, p) => acc + p.tasks.length, 0);
  const completionRate = totalTasks > 0 ? Math.round((totalTasksDone / totalTasks) * 100) : 0;

  return (
    <div className="flex-1 bg-[#121217] flex flex-col p-5 overflow-y-auto font-sans text-gray-200">
      
      {/* Top action header and Sync Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
            <Briefcase className="w-5.5 h-5.5 text-[#00D2FF]" />
            PROJECT MANAGEMENT CENTER
          </h1>
          <p className="text-xs text-slate-500 font-mono mt-1">
            Associate active photo and design templates with client campaign pipeline pipelines and tasks.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {isSyncing && (
            <span className="text-[10px] font-mono text-[#00D2FF] bg-[#00D2FF]/10 px-2.5 py-1 border border-[#00D2FF]/20 rounded flex items-center gap-1.5 animate-pulse">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              FIREBASE SYNC ACTIVE
            </span>
          )}
          {errorMessage && (
            <span className="text-[10px] font-mono text-amber-400 bg-amber-950/30 px-2.5 py-1 border border-amber-500/25 rounded flex items-center gap-1.5 animate-pulse">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              {errorMessage}
            </span>
          )}
          
          <button
            onClick={() => setShowCreateModal(true)}
            className="p-2 px-4 rounded bg-gradient-to-r from-purple-600 via-[#9D50BB] to-[#00D2FF] text-white hover:opacity-90 font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-[0_0_15px_rgba(157,80,187,0.3)] hover:scale-[1.01] transition-all cursor-pointer"
          >
            <FolderPlus className="w-4 h-4" /> Create Project Campaign
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex-1 flex flex-col items-center justify-center p-12">
          <Loader2 className="w-10 h-10 text-[#00D2FF] animate-spin" />
          <p className="text-xs font-mono text-slate-500 mt-3 uppercase tracking-wider">Retrieving campaign metadata...</p>
        </div>
      ) : (
        <>
          {/* Quick Stats Grid Dashboard */}
          {!selectedProjectId && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-6">
              <div className="bg-[#181822] border border-white/5 rounded-lg p-4 flex flex-col justify-between shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-16 h-16 bg-[#00D2FF]/5 rounded-bl-full group-hover:bg-[#00D2FF]/10 transition-colors" />
                <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-slate-500">Live Campaigns</span>
                <span className="text-2xl font-black font-display text-white mt-1">{totalProjects}</span>
              </div>
              <div className="bg-[#181822] border border-white/5 rounded-lg p-4 flex flex-col justify-between shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-16 h-16 bg-[#9D50BB]/5 rounded-bl-full group-hover:bg-[#9D50BB]/10 transition-colors" />
                <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-slate-500">Tracked Assets</span>
                <span className="text-2xl font-black font-display text-white mt-1">{totalAssets}</span>
              </div>
              <div className="bg-[#181822] border border-white/5 rounded-lg p-4 flex flex-col justify-between shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/5 rounded-bl-full group-hover:bg-emerald-500/10 transition-colors" />
                <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-slate-500">Task Checklist Done</span>
                <span className="text-2xl font-black font-display text-emerald-450 mt-1">
                  {totalTasksDone} <span className="text-xs text-slate-500 font-normal">/ {totalTasks}</span>
                </span>
              </div>
              <div className="bg-[#181822] border border-white/5 rounded-lg p-4 flex flex-col justify-between shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/5 rounded-bl-full group-hover:bg-amber-500/10 transition-colors" />
                <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-slate-500">Checklist Rate</span>
                <span className="text-2xl font-black font-display text-amber-400 mt-1">
                  {completionRate}%
                </span>
              </div>
            </div>
          )}

          {/* Core Master-Detail Split Workspace */}
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
            
            {/* LEFT COLUMN: Project Pipeline Selector Card List */}
            <div className={`lg:col-span-4 space-y-4 ${selectedProjectId ? "hidden lg:block" : "block"}`}>
              <div className="bg-[#161620] border border-white/5 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <span className="text-xs font-mono font-bold uppercase tracking-widest text-slate-400">Campaign Pipelines</span>
                  <span className="text-[10px] font-mono text-[#00D2FF]">{projects.length} Total</span>
                </div>

                {projects.length === 0 ? (
                  <div className="text-center py-10 space-y-3">
                    <FolderOpen className="w-8 h-8 text-slate-600 mx-auto" />
                    <p className="text-xs text-slate-500 font-mono">No active projects found.</p>
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-[500px] overflow-y-auto">
                    {projects.map((proj) => {
                      const isSelected = proj.id === selectedProjectId;
                      const doneTasks = proj.tasks.filter((t) => t.status === "Done").length;
                      const hasWarning = proj.status === "Feedback" || proj.status === "Planning";

                      return (
                        <div
                          key={proj.id}
                          onClick={() => {
                            setSelectedProjectId(proj.id);
                            setExportTargetAssetId(null);
                          }}
                          className={`group border rounded-lg p-3 transition-all cursor-pointer text-left relative overflow-hidden ${
                            isSelected
                              ? "bg-[#1f1e2e] border-[#9D50BB]/60 shadow-[0_4px_12px_rgba(157,80,187,0.15)]"
                              : "bg-[#181822] border-white/5 hover:border-slate-700 hover:bg-[#1a1a24]"
                          }`}
                        >
                          <div className="flex justify-between items-start gap-2">
                            <h3 className="text-xs font-bold text-white group-hover:text-[#00D2FF] line-clamp-1 truncate uppercase pr-1">
                              {proj.title}
                            </h3>
                            <span
                              className={`text-[9px] font-mono font-semibold px-2 py-0.5 rounded uppercase shrink-0 ${
                                proj.status === "Completed"
                                  ? "bg-emerald-950/40 text-emerald-400 border border-emerald-500/20"
                                  : proj.status === "Approved"
                                  ? "bg-blue-950/40 text-blue-400 border border-blue-500/20"
                                  : proj.status === "In Progress"
                                  ? "bg-purple-950/40 text-purple-400 border border-[#9D50BB]/20"
                                  : "bg-amber-955/20 text-amber-400 border border-amber-500/10"
                              }`}
                            >
                              {proj.status}
                            </span>
                          </div>

                          <p className="text-[11px] text-slate-450 line-clamp-2 mt-1.5 leading-relaxed font-sans select-none">
                            {proj.description || "No project goals described yet."}
                          </p>

                          <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 border-t border-white/5 pt-2 mt-2">
                            <div className="flex items-center gap-3">
                              <span>Assets: {proj.assets.length}</span>
                              <span>Tasks: {doneTasks}/{proj.tasks.length}</span>
                            </div>
                            <span className="flex items-center gap-1">
                              Owner: {proj.client.name.split(" ")[0]}
                              <ChevronRight className="w-3 h-3 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={(e) => handleDeleteProject(proj.id, e)}
                            className="absolute top-2.5 right-2 sm:opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-all cursor-pointer"
                            title="Remove project immediately"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT COLUMN: Active Selected Project Details Workspace */}
            <div className={`lg:col-span-8 ${selectedProjectId ? "block" : "hidden lg:flex lg:flex-col lg:items-center lg:justify-center bg-[#161620]/40 border border-white/5 rounded-lg p-12 text-center"}`}>
              {selectedProject ? (
                <div className="space-y-6">
                  
                  {/* Selected Project Summary card with fields */}
                  <div className="bg-[#161620] border border-white/5 rounded-lg p-4 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/5">
                      <button
                        onClick={() => setSelectedProjectId(null)}
                        className="px-2.5 py-1 text-[11px] font-mono text-slate-400 hover:text-white bg-white/5 border border-white/10 rounded items-center gap-1.5 flex lg:hidden mr-auto"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" /> Back to pipelines
                      </button>

                      <div className="text-left">
                        <span className="text-[9px] font-mono text-purple-400 font-bold uppercase tracking-widest block pb-0.5">ACTIVE CAMPAIGN PROFILE</span>
                        <h2 className="text-sm font-extrabold text-white tracking-wide uppercase">{selectedProject.title}</h2>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-slate-500">State:</span>
                        <select
                          value={selectedProject.status}
                          onChange={(e) => handleUpdateProjectStatus(selectedProject.id, e.target.value as ProjectData["status"])}
                          className="text-xs font-mono bg-[#0f1016] border border-white/10 text-white p-1 rounded focus:outline-none focus:border-[#9D50BB]"
                        >
                          <option value="Planning">Planning</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Feedback">Feedback</option>
                          <option value="Approved">Approved</option>
                          <option value="Completed">Completed</option>
                        </select>
                      </div>
                    </div>

                    <p className="text-[11.5px] text-slate-350 leading-relaxed text-left font-sans select-none">
                      {selectedProject.description || "Provide project objectives inside editing console."}
                    </p>

                    <span className="text-[10px] font-mono text-slate-500 block text-left">
                      Created: {new Date(selectedProject.createdAt).toLocaleString()} | Last Updated: {new Date(selectedProject.updatedAt).toLocaleString()}
                    </span>
                  </div>

                  {/* Split columns for Client Information and Assets */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                    
                    {/* LEFT PART: Assets Catalog (Photos, Videos, Designs) */}
                    <div className="md:col-span-7 space-y-4 text-left">
                      <div className="bg-[#161620] border border-white/5 rounded-lg p-4 space-y-4">
                        
                        <div className="flex items-center justify-between border-b border-white/5 pb-2">
                          <h3 className="text-xs font-mono font-bold tracking-widest text-[#00D2FF] uppercase flex items-center gap-2">
                            <Tag className="w-4 h-4 text-[#00D2FF]" /> ASSET CLASSIFICATION
                          </h3>
                          <span className="text-[10px] font-mono text-slate-500">{selectedProject.assets.length} Items</span>
                        </div>

                        {/* Add Asset Form inline */}
                        <form onSubmit={handleAddAsset} className="bg-[#1d1d29] border border-white/5 p-3 rounded-lg space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono font-bold uppercase text-slate-400">Classify New Creative Asset</span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <div className="sm:col-span-2">
                              <input
                                type="text"
                                placeholder="Asset description e.g. Promo Flask Banner"
                                value={newAssetName}
                                onChange={(e) => setNewAssetName(e.target.value)}
                                className="w-full text-xs font-mono bg-[#0f1016] border border-white/10 text-white p-1.5 px-2 rounded focus:outline-none focus:border-[#00D2FF]"
                                required
                              />
                            </div>
                            <div>
                              <select
                                value={newAssetCategory}
                                onChange={(e) => setNewAssetCategory(e.target.value as any)}
                                className="w-full text-xs font-mono bg-[#0f1016] border border-white/10 text-white p-1.5 rounded focus:outline-none focus:border-[#00D2FF]"
                              >
                                <option value="Photo">📸 Photo</option>
                                <option value="Video">🎥 Video</option>
                                <option value="Design">🎨 Design</option>
                              </select>
                            </div>
                          </div>

                          {newAssetCategory === "Photo" && (
                            <div className="flex items-center gap-2 pt-1">
                              <span className="text-[9px] font-mono text-slate-500">Preset Canvas Hook:</span>
                              <select
                                value={newAssetPresetId}
                                onChange={(e) => setNewAssetPresetId(e.target.value as any)}
                                className="text-[10px] font-mono bg-slate-950 border border-white/5 text-purple-400 p-0.5 rounded focus:outline-none"
                              >
                                <option value="portrait">DSLR Fashion Portrait</option>
                                <option value="product">Commercial Product Flask</option>
                                <option value="old_photo">Archival Emulsion 1942</option>
                                <option value="custom">Blank Media Slate</option>
                              </select>
                            </div>
                          )}

                          <button
                            type="submit"
                            className="w-full py-1.5 bg-[#0e2c39] border border-[#00D2FF]/20 text-[#00D2FF] font-mono text-[10px] font-bold uppercase rounded flex items-center justify-center gap-1.5 hover:bg-[#124255] transition-all cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" /> Classify Asset
                          </button>
                        </form>

                        {/* List of current Classified Project Assets */}
                        {selectedProject.assets.length === 0 ? (
                          <div className="text-center py-8 text-slate-500 text-xs font-mono">
                            No assets classified under this pipeline yet.
                          </div>
                        ) : (
                          <div className="space-y-3 max-h-[350px] overflow-y-auto">
                            {selectedProject.assets.map((asset) => {
                              const isPhoto = asset.category === "Photo";
                              const isVideo = asset.category === "Video";

                              return (
                                <div
                                  key={asset.id}
                                  className="bg-[#121217] border border-white/5 rounded-lg p-3 space-y-2 relative"
                                >
                                  {/* Asset Title and delete button */}
                                  <div className="flex justify-between items-start gap-2">
                                    <div className="flex items-center gap-2 pr-4">
                                      {isPhoto ? (
                                        <Image className="w-3.5 h-3.5 text-cyan-400" />
                                      ) : isVideo ? (
                                        <Video className="w-3.5 h-3.5 text-purple-400" />
                                      ) : (
                                        <Smartphone className="w-3.5 h-3.5 text-amber-500" />
                                      )}
                                      <span className="text-xs font-bold text-white uppercase tracking-tight line-clamp-1 truncate">
                                        {asset.name}
                                      </span>
                                    </div>

                                    <button
                                      type="button"
                                      onClick={() => handleDeleteAsset(asset.id)}
                                      className="text-slate-500 hover:text-red-400 p-1 rounded hover:bg-slate-900 transition-colors"
                                      title="Remove classified asset"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>

                                  {/* Integration Triggers & status updates */}
                                  <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1 border-t border-white/5">
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-[10px] text-slate-500 font-mono">Status:</span>
                                      <select
                                        value={asset.status}
                                        onChange={(e) => handleUpdateAssetStatus(asset.id, e.target.value as any)}
                                        className="text-[10px] font-mono bg-[#0f1016] border border-white/10 text-white p-0.5 rounded focus:outline-none"
                                      >
                                        <option value="Draft">Draft</option>
                                        <option value="In Progress">In Progress</option>
                                        <option value="In Review">In Review</option>
                                        <option value="Completed">Completed</option>
                                        <option value="Exported">Exported</option>
                                      </select>
                                    </div>

                                    {/* Link hooks for Editor & Export Integration */}
                                    <div className="flex items-center gap-1.5">
                                      {isPhoto && asset.presetId && (
                                        <button
                                          type="button"
                                          onClick={() => onLoadAssetInEditor(asset.presetId!, asset.name)}
                                          className="p-1 px-2 text-[9px] font-mono font-bold bg-[#0f212f] border border-cyan-500/20 text-[#00D2FF] hover:bg-[#15344f] flex items-center gap-1 rounded transition-colors uppercase cursor-pointer"
                                          title="Automatically load this specific photo and workspace preset inside the Editor"
                                        >
                                          <Sliders className="w-2.5 h-2.5" /> Edit Canvas
                                        </button>
                                      )}

                                      <button
                                        type="button"
                                        onClick={() => handleTriggerAssetExport(asset.id)}
                                        className={`p-1 px-2 text-[9px] font-mono font-bold flex items-center gap-1 rounded transition-colors uppercase cursor-pointer ${
                                          asset.status === "Exported"
                                            ? "bg-[#0b241b] border border-emerald-500/20 text-emerald-400 hover:bg-[#12382b]"
                                            : "bg-[#251025] border border-purple-500/20 text-purple-400 hover:bg-[#391b39]"
                                        }`}
                                        title="Trigger an simulated export render using profiles"
                                      >
                                        <Download className="w-2.5 h-2.5" />
                                        {asset.status === "Exported" ? "Exported ✓" : "Export Layout"}
                                      </button>
                                    </div>
                                  </div>

                                  {asset.exportProfile && (
                                    <p className="text-[9.5px] font-mono text-emerald-450 text-left bg-emerald-950/15 border border-emerald-500/10 p-1.5 rounded mt-1.5 select-all leading-tight">
                                      ✓ Export Profile used: <strong>{asset.exportProfile}</strong>
                                    </p>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* RIGHT PART: Client Registry & Tasks Checklists */}
                    <div className="md:col-span-5 space-y-4 text-left">
                      
                      {/* Client Card section containing notes */}
                      <div className="bg-[#161620] border border-white/5 rounded-lg p-4 space-y-3.5">
                        <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                          <User className="w-4 h-4 text-purple-400" />
                          <h3 className="text-xs font-mono font-bold tracking-widest text-[#9D50BB] uppercase">
                            CLIENT CAMPAIGN REGISTRY
                          </h3>
                        </div>

                        <div className="space-y-3 text-xs">
                          {/* Client Interactive Fields */}
                          <div className="space-y-1">
                            <label className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block font-bold">Contact Name</label>
                            <input
                              type="text"
                              value={selectedProject.client.name}
                              onChange={(e) => handleSaveClientInfo("name", e.target.value)}
                              className="w-full bg-[#121217] border border-white/5 rounded p-1 px-2 font-medium text-white focus:outline-none focus:border-purple-500/50"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block font-bold">Company / Org</label>
                            <input
                              type="text"
                              value={selectedProject.client.company}
                              onChange={(e) => handleSaveClientInfo("company", e.target.value)}
                              className="w-full bg-[#121217] border border-white/5 rounded p-1 px-2 font-medium font-mono text-white focus:outline-none focus:border-purple-500/50"
                            />
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div className="space-y-1">
                              <label className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block font-bold">Email</label>
                              <input
                                type="email"
                                value={selectedProject.client.email}
                                onChange={(e) => handleSaveClientInfo("email", e.target.value)}
                                className="w-full bg-[#121217] border border-white/5 rounded p-1 px-2 font-mono text-white focus:outline-none focus:border-purple-500/50"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block font-bold">Phone</label>
                              <input
                                type="text"
                                value={selectedProject.client.phone}
                                onChange={(e) => handleSaveClientInfo("phone", e.target.value)}
                                className="w-full bg-[#121217] border border-white/5 rounded p-1 px-2 font-mono text-white focus:outline-none focus:border-purple-500/50"
                              />
                            </div>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block font-bold">Campaign Notes / Directives</label>
                            <textarea
                              value={selectedProject.client.notes}
                              rows={2}
                              onChange={(e) => handleSaveClientInfo("notes", e.target.value)}
                              placeholder="Directives from client for design formatting..."
                              className="w-full bg-[#121217] border border-white/5 rounded p-1.5 px-2 text-slate-300 text-[11px] focus:outline-none focus:border-purple-500/50 resize-none"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Project Tasks Checklist Tracker card */}
                      <div className="bg-[#161620] border border-white/5 rounded-lg p-4 space-y-3.5">
                        <div className="flex items-center justify-between border-b border-white/5 pb-2">
                          <h3 className="text-xs font-mono font-bold tracking-widest text-[#00D2FF] uppercase flex items-center gap-2">
                            <CheckSquare className="w-4 h-4 text-[#00D2FF]" /> GOALS CHECKLIST
                          </h3>
                          <span className="text-[10px] font-mono text-slate-500">
                            {selectedProject.tasks.filter((t) => t.status === "Done").length}/{selectedProject.tasks.length} Completed
                          </span>
                        </div>

                        {/* Quick Task Add Form */}
                        <form onSubmit={handleAddTask} className="space-y-2 pb-2">
                          <input
                            type="text"
                            placeholder="Add goal e.g. Color mask adjustments"
                            value={newTaskTitle}
                            onChange={(e) => setNewTaskTitle(e.target.value)}
                            className="w-full text-xs font-mono bg-[#121217] border border-white/5 text-white p-1.5 px-2 rounded focus:outline-none"
                            required
                          />

                          <div className="grid grid-cols-2 gap-2">
                            <select
                              value={newTaskPriority}
                              onChange={(e) => setNewTaskPriority(e.target.value as any)}
                              className="text-[10px] font-mono bg-[#121217] border border-white/5 text-white p-1 rounded focus:outline-none"
                            >
                              <option value="Low">Priority: Low</option>
                              <option value="Medium">Priority: Med</option>
                              <option value="High">Priority: High</option>
                            </select>

                            <input
                              type="text"
                              placeholder="Assignee notes"
                              value={newTaskAssignee}
                              onChange={(e) => setNewTaskAssignee(e.target.value)}
                              className="text-[10px] font-mono bg-[#121217] border border-white/5 text-white p-1 rounded focus:outline-none"
                            />
                          </div>

                          <button
                            type="submit"
                            className="w-full py-1 bg-slate-900 border border-white/5 hover:border-[#00D2FF]/40 text-slate-300 hover:text-white font-mono text-[9px] uppercase font-bold rounded cursor-pointer transition-colors"
                          >
                            Add Checklist Goal
                          </button>
                        </form>

                        {/* List of goals */}
                        {selectedProject.tasks.length === 0 ? (
                          <div className="text-center py-4 text-slate-500 text-xs font-mono">
                            No goals defined.
                          </div>
                        ) : (
                          <div className="space-y-2 max-h-[250px] overflow-y-auto">
                            {selectedProject.tasks.map((task) => {
                              const isCompleted = task.status === "Done";

                              return (
                                <div
                                  key={task.id}
                                  className="flex items-center justify-between gap-2.5 p-2 bg-[#121217]/50 border border-white/5 rounded-lg text-xs"
                                >
                                  <div className="flex items-center gap-2 pr-1 select-none">
                                    <button
                                      type="button"
                                      onClick={() => handleToggleTaskStatus(task.id, task.status)}
                                      className="text-slate-400 hover:text-[#00D2FF]"
                                    >
                                      {isCompleted ? (
                                        <CheckSquare className="w-4.5 h-4.5 text-emerald-400 shrink-0" />
                                      ) : (
                                        <Square className="w-4.5 h-4.5 text-slate-600 shrink-0" />
                                      )}
                                    </button>
                                    <div className="text-left">
                                      <p className={`font-medium ${isCompleted ? "line-through text-slate-550 italic" : "text-slate-200"}`}>
                                        {task.title}
                                      </p>
                                      <span className="text-[8.5px] font-mono text-slate-500 tracking-wider">
                                        Assigned: {task.assignee}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-1.5 shrink-0">
                                    <span
                                      className={`text-[8px] font-mono px-1 rounded ${
                                        task.priority === "High"
                                          ? "bg-red-950/20 text-red-400 border border-red-500/10"
                                          : task.priority === "Medium"
                                          ? "bg-amber-955/15 text-amber-500 border border-amber-500/10"
                                          : "bg-slate-900 text-slate-500"
                                      }`}
                                    >
                                      {task.priority[0]}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteTask(task.id)}
                                      className="text-slate-500 hover:text-red-400 p-0.5 rounded"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-20 space-y-4">
                  <Briefcase className="w-12 h-12 text-[#9D50BB]/40 mx-auto" />
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-slate-300 uppercase">NO ACTIVE PIPELINE PREVIEW</h3>
                    <p className="text-xs text-slate-500 font-mono">
                      Please select a project campaign from the pipeline sidebar or create a new campaign to begin.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* POPUP SUB-MODAL: Select export dimensions profile */}
      {exportTargetAssetId && (
        <div className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4">
          <div className="bg-[#161622] border border-[#9D50BB]/40 rounded-xl max-w-sm w-full p-6 text-left font-sans space-y-4 shadow-[0_0_30px_rgba(157,80,187,0.25)]">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <h3 className="text-xs font-mono font-bold uppercase text-[#00D2FF]">EXPORTER DIMENSIONS CONTROLLER</h3>
              <button
                onClick={() => setExportTargetAssetId(null)}
                className="text-slate-500 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              Choose the targeted publication layout. The compiler will align high-fidelity layers and downsample output automatically.
            </p>

            <div className="space-y-1 text-xs">
              <label className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block font-bold">Target Layout Profile</label>
              <select
                value={selectedProfileId}
                onChange={(e) => setSelectedProfileId(e.target.value)}
                className="w-full text-xs font-mono bg-[#0f1016] border border-white/10 text-white p-2 rounded focus:outline-none focus:border-[#9D50BB]"
              >
                {EXPORT_PROFILES.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.platform} • {p.useCase} ({p.dimensions})
                  </option>
                ))}
              </select>
            </div>

            {exportCompleteMessage && (
              <div className="bg-emerald-950/20 border border-emerald-500/25 p-2.5 rounded text-[10.5px] text-emerald-400 text-center font-bold">
                ✓ {exportCompleteMessage}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setExportTargetAssetId(null)}
                className="px-3 py-1.5 text-xs font-mono text-slate-400 hover:text-white bg-slate-900 border border-white/10 rounded"
              >
                Cancel
              </button>
              
              <button
                onClick={handleExecuteExportProcess}
                disabled={isExportingAsset}
                className="px-4 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-xs font-mono font-semibold text-white rounded flex items-center gap-1.5"
              >
                {isExportingAsset ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Compiling...
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5" /> Execute Render
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POPUP SUB-MODAL: Create Campaign form */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateProject}
            className="bg-[#161622] border border-[#9D50BB]/40 rounded-xl max-w-lg w-full p-6 text-left font-sans space-y-4 shadow-[0_0_35px_rgba(157,80,187,0.3)] max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <h3 className="text-xs font-mono font-bold uppercase text-[#00D2FF] flex items-center gap-2">
                <FolderPlus className="w-4 h-4 text-[#00D2FF]" /> CREATE NEW PIPELINE CAMPAIGN
              </h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-slate-500 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block font-bold">Campaign Project Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Summer Release Promo Kit"
                  value={newProjTitle}
                  onChange={(e) => setNewProjTitle(e.target.value)}
                  className="w-full bg-[#121217] border border-white/5 rounded p-2 text-white focus:outline-none focus:border-purple-500/50"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block font-bold">Campaign Goals & Summary</label>
                <textarea
                  placeholder="Summary of campaign objective goals..."
                  rows={2}
                  value={newProjDesc}
                  onChange={(e) => setNewProjDesc(e.target.value)}
                  className="w-full bg-[#121217] border border-white/5 rounded p-2 text-slate-250 focus:outline-none focus:border-purple-500/50 resize-none"
                />
              </div>

              {/* Client specifications form */}
              <div className="border-t border-white/5 pt-3.5 space-y-3">
                <span className="text-[10px] font-mono font-bold uppercase text-[#9D50BB] block">CLIENT CONTACT INFORMATION</span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block font-bold">Contact Name</label>
                    <input
                      type="text"
                      placeholder="Jane Doe"
                      value={newProjClientName}
                      onChange={(e) => setNewProjClientName(e.target.value)}
                      className="w-full bg-[#121217] border border-white/5 rounded p-2 text-white focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block font-bold">Organization / Company</label>
                    <input
                      type="text"
                      placeholder="e.g. Luxe Hotels LLC"
                      value={newProjClientCompany}
                      onChange={(e) => setNewProjClientCompany(e.target.value)}
                      className="w-full bg-[#121217] border border-white/5 rounded p-2 text-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block font-bold">Client Email</label>
                    <input
                      type="email"
                      placeholder="client@company.com"
                      value={newProjClientEmail}
                      onChange={(e) => setNewProjClientEmail(e.target.value)}
                      className="w-full bg-[#121217] border border-white/5 rounded p-2 text-white focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block font-bold">Client Phone</label>
                    <input
                      type="text"
                      placeholder="+1 (555) 123-4567"
                      value={newProjClientPhone}
                      onChange={(e) => setNewProjClientPhone(e.target.value)}
                      className="w-full bg-[#121217] border border-white/5 rounded p-2 text-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block font-bold">Client Brand Guidelines / Notes</label>
                  <textarea
                    placeholder="Provide notes such as specific colors or bokeh power limits..."
                    rows={1.5}
                    value={newProjClientNotes}
                    onChange={(e) => setNewProjClientNotes(e.target.value)}
                    className="w-full bg-[#121217] border border-white/5 rounded p-2 text-slate-250 focus:outline-none resize-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-white/5 pt-4">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-xs font-mono text-slate-400 hover:text-white bg-slate-900 border border-white/10 rounded"
              >
                Discard Form
              </button>
              
              <button
                type="submit"
                className="px-5 py-2 bg-gradient-to-r from-[#9D50BB] to-[#00D2FF] text-xs font-mono font-bold uppercase tracking-wide text-white rounded shadow-lg hover:opacity-90"
              >
                Bootstrap Campaign
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
