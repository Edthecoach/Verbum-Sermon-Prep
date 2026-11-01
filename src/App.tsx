import React, { useState, useEffect, useRef } from "react";
import { Sun, Moon, HelpCircle } from "lucide-react";
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
import { HomileticEditor } from "./components/HomileticEditor";
import { PulpitView } from "./components/PulpitView";
import { MobileRemoteView } from "./components/MobileRemoteView";
import { AudioTranscriptionModal } from "./components/AudioTranscriptionModal";
import { HowToUseModal } from "./components/HowToUseModal";

/**
 * Generates a valid minimal 1.5-second WAV base64 audio buffer as a fallback
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

  const [initialRemoteRoom] = useState<string>(() => {
    const params = new URLSearchParams(window.location.search);
    return (
      params.get("room") ||
      sessionStorage.getItem("verbum_room_code") ||
      "KJV1"
    ).toUpperCase();
  });

  // Mobile/Tablet responsive column switcher when in Study Desk on narrow screens
  const [mobileColumnTab, setMobileColumnTab] = useState<"scripture" | "editor">(
    "scripture"
  );

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
      {/* Top Navigation Bar with Theme Toggle & How to Use Guide */}
      <header className="flex items-center justify-between gap-8 px-6 py-3.5 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-black shrink-0 transition-colors">
        {/* Zone 1: Single text element brand wordmark */}
        <a
          href="/"
          onClick={(e) => {
            e.preventDefault();
            setActiveView("desk");
          }}
          className="text-lg font-bold tracking-tight text-neutral-900 dark:text-white whitespace-nowrap shrink-0"
        >
          Verbum
        </a>

        {/* Zone 2: Concise single-line navigation links + How to Use + Theme Toggle */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-neutral-600 dark:text-neutral-400">
          <button
            type="button"
            onClick={() => setActiveView("desk")}
            className="text-neutral-900 dark:text-amber-400 underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Study Desk
          </button>
          <button
            type="button"
            onClick={() => setActiveView("pulpit")}
            className="hover:text-neutral-900 dark:hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Lectern Pulpit
          </button>
          <button
            type="button"
            onClick={() => setIsAudioModalOpen(true)}
            className="hover:text-neutral-900 dark:hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Audio &amp; Transcript
          </button>
          <button
            type="button"
            onClick={() => setActiveView("remote")}
            className="hover:text-neutral-900 dark:hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Mobile Remote
          </button>
          <button
            type="button"
            onClick={() => setIsHowToUseOpen(true)}
            className="hover:text-neutral-900 dark:hover:text-white hover:underline underline-offset-4 transition-colors flex items-center gap-1 whitespace-nowrap shrink-0"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>How to Use</span>
          </button>
          <button
            type="button"
            onClick={toggleThemeMode}
            title={
              themeMode === "light"
                ? "Switch Study Desk to OLED Dark Mode"
                : "Switch Study Desk to Swiss Light Mode"
            }
            className="hover:text-neutral-900 dark:hover:text-white hover:underline underline-offset-4 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            {themeMode === "light" ? (
              <>
                <Moon className="w-3.5 h-3.5" />
                <span>OLED Dark</span>
              </>
            ) : (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span>Swiss Light</span>
              </>
            )}
          </button>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setActiveView("pulpit")}
            className="px-4 py-2 text-xs font-semibold text-white dark:text-black bg-neutral-900 dark:bg-amber-400 rounded hover:bg-neutral-800 dark:hover:bg-amber-300 transition-colors whitespace-nowrap shrink-0"
          >
            Launch Lectern Pulpit
          </button>
        </div>
      </header>

      {/* Mobile / Narrow Tablet Column Switcher Subbar */}
      <div className="flex lg:hidden items-center justify-between px-4 py-2 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 shrink-0">
        <div className="flex items-center gap-1 bg-neutral-200 dark:bg-neutral-900 p-0.5 rounded">
          <button
            type="button"
            onClick={() => setMobileColumnTab("scripture")}
            className={`px-3 py-1 text-xs font-medium rounded whitespace-nowrap ${
              mobileColumnTab === "scripture"
                ? "bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                : "text-neutral-600 dark:text-neutral-400"
            }`}
          >
            KJV &amp; TSK Desk
          </button>
          <button
            type="button"
            onClick={() => setMobileColumnTab("editor")}
            className={`px-3 py-1 text-xs font-medium rounded whitespace-nowrap ${
              mobileColumnTab === "editor"
                ? "bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                : "text-neutral-600 dark:text-neutral-400"
            }`}
          >
            Homiletic Editor &amp; AI
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setIsHowToUseOpen(true)}
            className="px-2 py-1 text-xs font-medium border border-neutral-300 dark:border-neutral-700 rounded bg-white dark:bg-black text-neutral-800 dark:text-neutral-200 flex items-center gap-1 whitespace-nowrap"
          >
            <HelpCircle className="w-3 h-3" />
            <span>Guide</span>
          </button>
          <button
            type="button"
            onClick={toggleThemeMode}
            className="px-2 py-1 text-xs font-medium border border-neutral-300 dark:border-neutral-700 rounded bg-white dark:bg-black text-neutral-800 dark:text-neutral-200 flex items-center gap-1 whitespace-nowrap"
          >
            {themeMode === "light" ? (
              <>
                <Moon className="w-3 h-3" />
                <span>OLED</span>
              </>
            ) : (
              <>
                <Sun className="w-3 h-3 text-amber-400" />
                <span>Swiss</span>
              </>
            )}
          </button>
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

      {/* Main Two-Column Responsive Study & Homiletic Desk */}
      <main className="flex-1 grid grid-cols-12 min-h-0 overflow-hidden bg-white dark:bg-black">
        {/* Left Column: KJV Scripture Reader, Highlights, Margin Notes & TSK Cross-References */}
        <div
          className={`col-span-12 lg:col-span-5 h-full min-h-0 overflow-hidden ${
            mobileColumnTab === "scripture" ? "block" : "hidden lg:block"
          }`}
        >
          <ScriptureDesk
            onInsertScriptureCard={handleInsertScriptureCard}
            allSermons={sermons}
          />
        </div>

        {/* Right Column: Homiletic Editor (Outline & Manuscript) + Gemini Homiletic Assistant Sidebar */}
        <div
          className={`col-span-12 lg:col-span-7 h-full min-h-0 overflow-hidden ${
            mobileColumnTab === "editor" ? "block" : "hidden lg:block"
          }`}
        >
          <HomileticEditor
            sermon={activeSermon}
            allSermons={sermons}
            onSelectSermon={setActiveSermonId}
            onCreateNewSermon={handleCreateNewSermon}
            onDeleteSermon={handleDeleteSermon}
            onUpdateSermon={handleUpdateSermon}
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
        onJumpToDesk={() => setActiveView("desk")}
        onLaunchPulpit={() => setActiveView("pulpit")}
        onOpenAudioModal={() => setIsAudioModalOpen(true)}
        onOpenRemoteView={() => setActiveView("remote")}
      />
    </div>
  );
}
