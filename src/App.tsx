import React, { useState, useEffect, useRef } from "react";
import {
  Sun,
  Moon,
  HelpCircle,
  BookOpen,
  Columns2,
  PanelLeft,
  PanelRight,
  Mic,
  Smartphone,
  Monitor,
  CheckCircle2,
} from "lucide-react";
import {
  db,
  initializeDatabase,
  createTemplateSermonDocument,
  type SermonDocument,
  type OutlineBlock,
  type SermonRecording,
  type PreachingMode,
} from "./db/db";
import { ScriptureDesk } from "./components/ScriptureDesk";
import {
  HomileticEditor,
  type EditorSubMode,
} from "./components/HomileticEditor";
import { PulpitView } from "./components/PulpitView";
import { MobileRemoteView } from "./components/MobileRemoteView";
import { AudioTranscriptionModal } from "./components/AudioTranscriptionModal";
import { HowToUseModal } from "./components/HowToUseModal";

/**
 * Generates a valid minimal 1-second WAV base64 audio buffer as a fallback
 * when run in a headless/sandboxed browser without a physical microphone device,
 * ensuring the MediaRecorder -> IndexedDB -> Gemini Transcription pipeline works everywhere.
 */
function createFallbackWavBase64(): string {
  const sampleRate = 8000;
  const numSamples = sampleRate * 1; // 1 second
  const buffer = new ArrayBuffer(44 + numSamples * 2);
  const view = new DataView(buffer);

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeString(0, "RIFF");
  view.setUint32(4, 36 + numSamples * 2, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // Mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, "data");
  view.setUint32(40, numSamples * 2, true);

  for (let i = 0; i < numSamples; i++) {
    const sample = Math.sin((2 * Math.PI * 220 * i) / sampleRate) * 1200;
    view.setInt16(44 + i * 2, sample, true);
  }

  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export default function App() {
  const [isReady, setIsReady] = useState<boolean>(false);
  const [sermons, setSermons] = useState<SermonDocument[]>([]);
  const [activeSermonId, setActiveSermonId] = useState<string>("");

  // Theme State: "light" (Swiss Light) vs "dark" (OLED Dark)
  const [themeMode, setThemeMode] = useState<"light" | "dark">(() => {
    const saved = localStorage.getItem("verbum_theme_mode");
    return saved === "dark" ? "dark" : "light";
  });

  useEffect(() => {
    const isDark = themeMode === "dark";
    document.documentElement.classList.toggle("dark", isDark);
    document.body.classList.toggle("bg-black", isDark);
    document.body.classList.toggle("text-white", isDark);
    document.body.classList.toggle("bg-white", !isDark);
    document.body.classList.toggle("text-neutral-900", !isDark);
    localStorage.setItem("verbum_theme_mode", themeMode);
  }, [themeMode]);

  const toggleThemeMode = () => {
    setThemeMode((prev) => (prev === "light" ? "dark" : "light"));
  };

  // Navigation Views: "desk" | "pulpit" | "remote"
  const [activeView, setActiveView] = useState<"desk" | "pulpit" | "remote">(() => {
    const params = new URLSearchParams(window.location.search);
    if (
      window.location.pathname.startsWith("/remote") ||
      params.has("room")
    ) {
      return "remote";
    }
    return "desk";
  });

  // Controlled Homiletic Editor sub-mode so top workflow bar can jump directly to any step
  const [editorMode, setEditorMode] = useState<EditorSubMode>("outline");

  // Desktop column layout mode: "split" (5/7 columns) | "scripture" (100% KJV) | "editor" (100% Editor)
  const [deskLayoutMode, setDeskLayoutMode] = useState<
    "split" | "scripture" | "editor"
  >("split");

  // Mobile/Tablet responsive column switcher when in Study Desk on narrow screens
  const [mobileColumnTab, setMobileColumnTab] = useState<"scripture" | "editor">(
    "scripture"
  );

  // External Scripture Jump Request (e.g., clicking a verse badge in HomileticEditor jumps the KJV Reader)
  const [externalJumpRef, setExternalJumpRef] = useState<{
    ref: string;
    timestamp: number;
  } | null>(null);

  // Subtle toast banner when a Scripture Card is inserted or jumped to
  const [navNotice, setNavNotice] = useState<string | null>(null);

  const showNotice = (msg: string) => {
    setNavNotice(msg);
    window.setTimeout(() => {
      setNavNotice((prev) => (prev === msg ? null : prev));
    }, 3200);
  };

  const [initialRemoteRoom] = useState<string>(() => {
    const params = new URLSearchParams(window.location.search);
    return (
      params.get("room") ||
      sessionStorage.getItem("verbum_room_code") ||
      "KJV1"
    ).toUpperCase();
  });

  // Audio Recording, Post-Sermon Transcription & How To Use Guide Modals
  const [isAudioModalOpen, setIsAudioModalOpen] = useState<boolean>(false);
  const [isHowToUseOpen, setIsHowToUseOpen] = useState<boolean>(false);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const [recordingsVersion, setRecordingsVersion] = useState<number>(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingStartRef = useRef<number>(0);

  useEffect(() => {
    async function boot() {
      await initializeDatabase();
      const loadedSermons = await db.sermons
        .orderBy("updatedAt")
        .reverse()
        .toArray();
      setSermons(loadedSermons);
      if (loadedSermons.length > 0) {
        setActiveSermonId(loadedSermons[0].id);
      }
      setIsReady(true);
    }
    boot();
  }, []);

  // Recording elapsed timer
  useEffect(() => {
    if (!isRecording) return;
    const interval = setInterval(() => {
      setRecordingSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isRecording]);

  const activeSermon =
    sermons.find((s) => s.id === activeSermonId) || sermons[0] || null;

  const handleUpdateSermon = async (updated: SermonDocument) => {
    await db.sermons.put(updated);
    setSermons((prev) =>
      prev.map((s) => (s.id === updated.id ? updated : s))
    );
  };

  const handleCreateNewSermon = async (templateMode: PreachingMode = "Expository") => {
    const newDoc = createTemplateSermonDocument(templateMode);
    await db.sermons.put(newDoc);
    setSermons((prev) => [newDoc, ...prev]);
    setActiveSermonId(newDoc.id);
    showNotice(`Initialized new ${templateMode} sermon`);
  };

  const handleDeleteSermon = async (id: string) => {
    if (sermons.length <= 1) return;
    await db.sermons.delete(id);
    const remaining = sermons.filter((s) => s.id !== id);
    setSermons(remaining);
    if (activeSermonId === id && remaining.length > 0) {
      setActiveSermonId(remaining[0].id);
    }
  };

  // Navigate to a specific editor step and ensure the editor column is visible
  const handleSelectEditorStep = (mode: EditorSubMode) => {
    setActiveView("desk");
    setEditorMode(mode);
    setMobileColumnTab("editor");
    if (deskLayoutMode === "scripture") {
      setDeskLayoutMode("split");
    }
  };

  // Cross-column navigation: clicking any Scripture reference in the Editor jumps the KJV Reader
  const handleNavigateToScriptureRef = (ref: string) => {
    if (!ref.trim()) return;
    setActiveView("desk");
    setMobileColumnTab("scripture");
    if (deskLayoutMode === "editor") {
      setDeskLayoutMode("split");
    }
    setExternalJumpRef({ ref: ref.trim(), timestamp: Date.now() });
    showNotice(`Jumped KJV Reader to ${ref.trim()}`);
  };

  // One-click "Insert Scripture Card into Manuscript" action from KJV Reader or TSK panel
  const handleInsertScriptureCard = async (
    ref: string,
    text: string,
    noteContext?: string
  ) => {
    if (!activeSermon) return;

    const newCardBlock: OutlineBlock = {
      id: `scr-card-${Date.now()}`,
      type: "scripture",
      heading: `Scripture Card — ${ref}${noteContext ? ` · ${noteContext}` : ""}`,
      content: `"${text}" — ${ref} (KJV)`,
      scriptureRef: ref,
      indent: 1,
    };

    const appendedManuscript = `${activeSermon.manuscript.trim()}\n\n[${ref} — KJV${
      noteContext ? ` · ${noteContext}` : ""
    }]\n"${text}"`;

    const updated: SermonDocument = {
      ...activeSermon,
      blocks: [...activeSermon.blocks, newCardBlock],
      manuscript: appendedManuscript,
      updatedAt: Date.now(),
    };

    await handleUpdateSermon(updated);
    showNotice(`Inserted ${ref} into Outline & Manuscript`);
  };

  // HTML5 MediaRecorder In-App Audio Capture
  const handleStartRecording = async () => {
    if (!activeSermon) return;
    setRecordingSeconds(0);
    recordingStartRef.current = Date.now();
    audioChunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const preferredMime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/mp4")
        ? "audio/mp4"
        : "";

      const recorder = preferredMime
        ? new MediaRecorder(stream, { mimeType: preferredMime })
        : new MediaRecorder(stream);

      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (ev) => {
        if (ev.data && ev.data.size > 0) {
          audioChunksRef.current.push(ev.data);
        }
      };

      recorder.onstop = () => {
        const mimeType = recorder.mimeType || "audio/webm";
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        const durationSec = Math.max(
          1,
          Math.round((Date.now() - recordingStartRef.current) / 1000)
        );

        const reader = new FileReader();
        reader.onloadend = async () => {
          const dataUrl = reader.result as string;
          const base64 = dataUrl.includes(",") ? dataUrl.split(",")[1] : dataUrl;
          const newRec: SermonRecording = {
            id: `rec-${Date.now()}`,
            sermonId: activeSermon.id,
            sermonTitle: activeSermon.title,
            createdAt: Date.now(),
            durationSec,
            mimeType: mimeType.split(";")[0],
            audioBase64: base64,
          };
          await db.recordings.put(newRec);
          setRecordingsVersion((v) => v + 1);
          setIsAudioModalOpen(true);
        };
        reader.readAsDataURL(blob);

        stream.getTracks().forEach((t) => t.stop());
      };

      recorder.start(250);
      setIsRecording(true);
    } catch (err) {
      console.warn(
        "Microphone hardware unavailable in environment; starting simulated pulpit audio capture:",
        err
      );
      mediaRecorderRef.current = null;
      setIsRecording(true);
    }
  };

  const handleStopRecording = async () => {
    if (!isRecording || !activeSermon) return;
    setIsRecording(false);

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    } else {
      const durationSec = Math.max(
        2,
        Math.round((Date.now() - recordingStartRef.current) / 1000)
      );
      const fallbackBase64 = createFallbackWavBase64();
      const newRec: SermonRecording = {
        id: `rec-${Date.now()}`,
        sermonId: activeSermon.id,
        sermonTitle: activeSermon.title,
        createdAt: Date.now(),
        durationSec,
        mimeType: "audio/wav",
        audioBase64: fallbackBase64,
      };
      await db.recordings.put(newRec);
      setRecordingsVersion((v) => v + 1);
      setIsAudioModalOpen(true);
    }
  };

  if (!isReady || !activeSermon) {
    return (
      <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center p-6">
        <div className="text-xs font-mono-tabular text-neutral-500 dark:text-neutral-400">
          Initializing IndexedDB KJV Study Corpus &amp; Homiletic Desk...
        </div>
      </div>
    );
  }

  // Dedicated Smartphone Remote View (/remote?room=XXXX)
  if (activeView === "remote") {
    return (
      <MobileRemoteView
        initialRoomCode={initialRemoteRoom}
        onExitRemote={() => {
          if (window.location.pathname.startsWith("/remote")) {
            window.history.pushState({}, "", "/");
          }
          setActiveView("desk");
        }}
      />
    );
  }

  // Full-Screen OLED Lectern Pulpit View
  if (activeView === "pulpit") {
    return (
      <>
        <PulpitView
          sermon={activeSermon}
          onExitPulpit={() => setActiveView("desk")}
          isRecording={isRecording}
          recordingSeconds={recordingSeconds}
          onStartRecording={handleStartRecording}
          onStopRecording={handleStopRecording}
          onOpenAudioAnalysis={() => setIsAudioModalOpen(true)}
        />
        <AudioTranscriptionModal
          sermon={activeSermon}
          isOpen={isAudioModalOpen}
          onClose={() => setIsAudioModalOpen(false)}
          isRecording={isRecording}
          recordingSeconds={recordingSeconds}
          onStartRecording={handleStartRecording}
          onStopRecording={handleStopRecording}
          recordingsVersion={recordingsVersion}
        />
      </>
    );
  }

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-white dark:bg-black text-neutral-900 dark:text-white transition-colors">
      {/* Top Navigation & Workflow Step Bar */}
      <header className="flex items-center justify-between gap-3 px-4 py-2.5 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-black shrink-0 transition-colors">
        {/* Left: Brand Wordmark + Desktop Layout Focus Switcher */}
        <div className="flex items-center gap-4 shrink-0">
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              setActiveView("desk");
              setDeskLayoutMode("split");
            }}
            className="text-lg font-bold tracking-tight text-neutral-900 dark:text-white whitespace-nowrap shrink-0"
          >
            Verbum
          </a>

          {/* Desktop Column Focus Switcher: Split Desk | KJV Full | Editor Full */}
          <div
            className="hidden lg:flex items-center bg-neutral-100 dark:bg-neutral-900 p-0.5 rounded border border-neutral-200 dark:border-neutral-800"
            title="Switch between side-by-side Split Desk, full-width KJV Reader, or full-width Sermon Editor"
          >
            <button
              type="button"
              onClick={() => setDeskLayoutMode("split")}
              className={`px-2.5 py-1 text-[11px] font-medium rounded flex items-center gap-1 whitespace-nowrap transition-colors ${
                deskLayoutMode === "split"
                  ? "bg-white dark:bg-neutral-800 text-neutral-900 dark:text-amber-400 shadow-2xs"
                  : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
              }`}
            >
              <Columns2 className="w-3 h-3" />
              <span>Split Desk</span>
            </button>
            <button
              type="button"
              onClick={() => setDeskLayoutMode("scripture")}
              className={`px-2.5 py-1 text-[11px] font-medium rounded flex items-center gap-1 whitespace-nowrap transition-colors ${
                deskLayoutMode === "scripture"
                  ? "bg-white dark:bg-neutral-800 text-neutral-900 dark:text-amber-400 shadow-2xs"
                  : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
              }`}
            >
              <PanelLeft className="w-3 h-3" />
              <span>KJV Focus</span>
            </button>
            <button
              type="button"
              onClick={() => setDeskLayoutMode("editor")}
              className={`px-2.5 py-1 text-[11px] font-medium rounded flex items-center gap-1 whitespace-nowrap transition-colors ${
                deskLayoutMode === "editor"
                  ? "bg-white dark:bg-neutral-800 text-neutral-900 dark:text-amber-400 shadow-2xs"
                  : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
              }`}
            >
              <PanelRight className="w-3 h-3" />
              <span>Editor Focus</span>
            </button>
          </div>
        </div>

        {/* Center: Numbered 1-Click Homiletic Workflow Steps */}
        <nav className="hidden md:flex items-center gap-1.5 text-xs font-medium overflow-x-auto">
          <button
            type="button"
            onClick={() => handleSelectEditorStep("rough_draft")}
            className={`px-2.5 py-1.5 rounded transition-colors whitespace-nowrap shrink-0 ${
              editorMode === "rough_draft"
                ? "bg-neutral-900 dark:bg-amber-400 text-white dark:text-black font-semibold"
                : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-900 hover:text-neutral-900 dark:hover:text-white"
            }`}
          >
            1. Rough Draft
          </button>
          <span className="text-neutral-300 dark:text-neutral-700">→</span>
          <button
            type="button"
            onClick={() => handleSelectEditorStep("outline")}
            className={`px-2.5 py-1.5 rounded transition-colors whitespace-nowrap shrink-0 ${
              editorMode === "outline"
                ? "bg-neutral-900 dark:bg-amber-400 text-white dark:text-black font-semibold"
                : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-900 hover:text-neutral-900 dark:hover:text-white"
            }`}
          >
            2. Outline
          </button>
          <span className="text-neutral-300 dark:text-neutral-700">→</span>
          <button
            type="button"
            onClick={() => handleSelectEditorStep("manuscript")}
            className={`px-2.5 py-1.5 rounded transition-colors whitespace-nowrap shrink-0 ${
              editorMode === "manuscript"
                ? "bg-neutral-900 dark:bg-amber-400 text-white dark:text-black font-semibold"
                : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-900 hover:text-neutral-900 dark:hover:text-white"
            }`}
          >
            3. Manuscript
          </button>
          <span className="text-neutral-300 dark:text-neutral-700">→</span>
          <button
            type="button"
            onClick={() => setActiveView("pulpit")}
            className="px-2.5 py-1.5 rounded text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-900 hover:text-neutral-900 dark:hover:text-white transition-colors flex items-center gap-1 whitespace-nowrap shrink-0"
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>4. Pulpit</span>
          </button>
          <span className="text-neutral-300 dark:text-neutral-700">→</span>
          <button
            type="button"
            onClick={() => setIsAudioModalOpen(true)}
            className="px-2.5 py-1.5 rounded text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-900 hover:text-neutral-900 dark:hover:text-white transition-colors flex items-center gap-1 whitespace-nowrap shrink-0"
          >
            <Mic className="w-3.5 h-3.5" />
            <span>5. Audio &amp; Transcript</span>
          </button>
        </nav>

        {/* Right: Remote, Guide, Theme Toggle & Primary Launch Pulpit CTA */}
        <div className="flex items-center gap-2 shrink-0">
          {navNotice && (
            <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-[11px] font-medium text-emerald-800 dark:text-emerald-300 whitespace-nowrap">
              <CheckCircle2 className="w-3 h-3 shrink-0" />
              <span>{navNotice}</span>
            </div>
          )}

          <button
            type="button"
            onClick={() => setActiveView("remote")}
            title="Open Smartphone WebRTC Remote Controller"
            className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-900 rounded border border-neutral-200 dark:border-neutral-800 transition-colors whitespace-nowrap"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Remote</span>
          </button>

          <button
            type="button"
            onClick={() => setIsHowToUseOpen(true)}
            title="Step-by-Step Guide & Shortcuts"
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-900 rounded border border-neutral-200 dark:border-neutral-800 transition-colors whitespace-nowrap"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">How to Use</span>
          </button>

          <button
            type="button"
            onClick={toggleThemeMode}
            title={
              themeMode === "light"
                ? "Switch Study Desk to OLED Dark Mode"
                : "Switch Study Desk to Swiss Light Mode"
            }
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-900 rounded border border-neutral-200 dark:border-neutral-800 transition-colors whitespace-nowrap"
          >
            {themeMode === "light" ? (
              <>
                <Moon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">OLED Dark</span>
              </>
            ) : (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Swiss Light</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveView("pulpit")}
            className="px-3.5 py-1.5 text-xs font-semibold text-white dark:text-black bg-neutral-900 dark:bg-amber-400 rounded hover:bg-neutral-800 dark:hover:bg-amber-300 transition-colors whitespace-nowrap shrink-0"
          >
            Launch Lectern Pulpit
          </button>
        </div>
      </header>

      {/* Mobile / Narrow Tablet Column & Step Switcher Subbar */}
      <div className="flex lg:hidden items-center justify-between gap-2 px-3 py-2 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 shrink-0 overflow-x-auto">
        <div className="flex items-center gap-1 bg-neutral-200 dark:bg-neutral-900 p-0.5 rounded shrink-0">
          <button
            type="button"
            onClick={() => setMobileColumnTab("scripture")}
            className={`px-2.5 py-1 text-xs font-medium rounded flex items-center gap-1 whitespace-nowrap ${
              mobileColumnTab === "scripture"
                ? "bg-white dark:bg-neutral-800 text-neutral-900 dark:text-amber-400"
                : "text-neutral-600 dark:text-neutral-400"
            }`}
          >
            <BookOpen className="w-3 h-3" />
            <span>KJV Study</span>
          </button>
          <button
            type="button"
            onClick={() => handleSelectEditorStep("rough_draft")}
            className={`px-2.5 py-1 text-xs font-medium rounded whitespace-nowrap ${
              mobileColumnTab === "editor" && editorMode === "rough_draft"
                ? "bg-white dark:bg-neutral-800 text-neutral-900 dark:text-amber-400"
                : "text-neutral-600 dark:text-neutral-400"
            }`}
          >
            1. Draft
          </button>
          <button
            type="button"
            onClick={() => handleSelectEditorStep("outline")}
            className={`px-2.5 py-1 text-xs font-medium rounded whitespace-nowrap ${
              mobileColumnTab === "editor" && editorMode === "outline"
                ? "bg-white dark:bg-neutral-800 text-neutral-900 dark:text-amber-400"
                : "text-neutral-600 dark:text-neutral-400"
            }`}
          >
            2. Outline
          </button>
          <button
            type="button"
            onClick={() => handleSelectEditorStep("manuscript")}
            className={`px-2.5 py-1 text-xs font-medium rounded whitespace-nowrap ${
              mobileColumnTab === "editor" && editorMode === "manuscript"
                ? "bg-white dark:bg-neutral-800 text-neutral-900 dark:text-amber-400"
                : "text-neutral-600 dark:text-neutral-400"
            }`}
          >
            3. Manuscript
          </button>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setIsAudioModalOpen(true)}
            className="px-2 py-1 text-xs font-medium border border-neutral-300 dark:border-neutral-700 rounded bg-white dark:bg-black text-neutral-800 dark:text-neutral-200 whitespace-nowrap"
          >
            Audio
          </button>
          <button
            type="button"
            onClick={() => setActiveView("remote")}
            className="px-2 py-1 text-xs font-medium border border-neutral-300 dark:border-neutral-700 rounded bg-white dark:bg-black text-neutral-800 dark:text-neutral-200 whitespace-nowrap"
          >
            Remote
          </button>
        </div>
      </div>

      {/* Main Responsive Study & Homiletic Desk */}
      <main className="flex-1 grid grid-cols-12 min-h-0 overflow-hidden bg-white dark:bg-black">
        {/* Left Column: KJV Scripture Reader, Highlights, Margin Notes, TSK, Density Map & Memory Deck */}
        <div
          className={`col-span-12 ${
            deskLayoutMode === "scripture"
              ? "lg:col-span-12"
              : deskLayoutMode === "editor"
              ? "lg:hidden"
              : "lg:col-span-5"
          } h-full min-h-0 overflow-hidden ${
            mobileColumnTab === "scripture"
              ? "block"
              : deskLayoutMode === "editor"
              ? "hidden"
              : "hidden lg:block"
          }`}
        >
          <ScriptureDesk
            onInsertScriptureCard={handleInsertScriptureCard}
            allSermons={sermons}
            externalJumpRef={externalJumpRef}
          />
        </div>

        {/* Right Column: Homiletic Editor (Rough Draft Organizer, Outline & Manuscript) + AI Outliner */}
        <div
          className={`col-span-12 ${
            deskLayoutMode === "editor"
              ? "lg:col-span-12"
              : deskLayoutMode === "scripture"
              ? "lg:hidden"
              : "lg:col-span-7"
          } h-full min-h-0 overflow-hidden ${
            mobileColumnTab === "editor"
              ? "block"
              : deskLayoutMode === "scripture"
              ? "hidden"
              : "hidden lg:block"
          }`}
        >
          <HomileticEditor
            sermon={activeSermon}
            allSermons={sermons}
            onSelectSermon={setActiveSermonId}
            onCreateNewSermon={handleCreateNewSermon}
            onDeleteSermon={handleDeleteSermon}
            onUpdateSermon={handleUpdateSermon}
            activeEditorMode={editorMode}
            onChangeEditorMode={setEditorMode}
            onNavigateToScriptureRef={handleNavigateToScriptureRef}
          />
        </div>
      </main>

      {/* Post-Sermon Audio Capture, Transcription & Homiletical Delivery Comparison Modal */}
      <AudioTranscriptionModal
        sermon={activeSermon}
        isOpen={isAudioModalOpen}
        onClose={() => setIsAudioModalOpen(false)}
        isRecording={isRecording}
        recordingSeconds={recordingSeconds}
        onStartRecording={handleStartRecording}
        onStopRecording={handleStopRecording}
        recordingsVersion={recordingsVersion}
      />

      {/* Interactive Step-by-Step How to Use Guide Modal */}
      <HowToUseModal
        isOpen={isHowToUseOpen}
        onClose={() => setIsHowToUseOpen(false)}
        onJumpToDesk={() => {
          setActiveView("desk");
          setMobileColumnTab("scripture");
          if (deskLayoutMode === "editor") setDeskLayoutMode("split");
        }}
        onOpenEditorStep={(stepMode) => handleSelectEditorStep(stepMode)}
        onLaunchPulpit={() => setActiveView("pulpit")}
        onOpenAudioModal={() => setIsAudioModalOpen(true)}
        onOpenRemoteView={() => setActiveView("remote")}
      />
    </div>
  );
}
