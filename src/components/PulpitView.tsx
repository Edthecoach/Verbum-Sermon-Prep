import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  Maximize2,
  Minimize2,
  QrCode,
  Mic,
  Square,
  X,
  ChevronUp,
  ChevronDown,
  Smartphone,
  ArrowLeft,
  Copy,
  Check,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import Peer, { type DataConnection } from "peerjs";
import type { SermonDocument } from "../db/db";

export type RemoteCommandType =
  | "NEXT_SECTION"
  | "PREV_SECTION"
  | "TOGGLE_SCROLL"
  | "TOGGLE_TIMER"
  | "FONT_PLUS"
  | "FONT_MINUS";

export interface RemoteCommandPayload {
  type: RemoteCommandType;
  room: string;
  timestamp: number;
}

export interface PulpitStateTelemetry {
  room: string;
  activeSectionIndex: number;
  totalSections: number;
  currentSectionHeading: string;
  isAutoScrolling: boolean;
  isTimerRunning: boolean;
  elapsedSeconds: number;
  fontSize: number;
}

interface PulpitViewProps {
  sermon: SermonDocument;
  onExitPulpit: () => void;
  isRecording: boolean;
  recordingSeconds: number;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onOpenAudioAnalysis: () => void;
}

function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export const PulpitView: React.FC<PulpitViewProps> = ({
  sermon,
  onExitPulpit,
  isRecording,
  recordingSeconds,
  onStartRecording,
  onStopRecording,
  onOpenAudioAnalysis,
}) => {
  // Display settings
  const [textColorMode, setTextColorMode] = useState<"white" | "amber">("white");
  const [fontSize, setFontSize] = useState<number>(26); // 18px to 38px
  const [lineHeight, setLineHeight] = useState<number>(1.65);
  const [deliveryViewMode, setDeliveryViewMode] = useState<"sections" | "manuscript">(
    "sections"
  );

  // Auto-scroll & Section step-advancement
  const [isAutoScrolling, setIsAutoScrolling] = useState<boolean>(false);
  const [scrollSpeed, setScrollSpeed] = useState<number>(2); // 1 to 5
  const [activeSectionIndex, setActiveSectionIndex] = useState<number>(0);

  // Timer & Real-Time Clock
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(true);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [clockString, setClockString] = useState<string>("");

  // Fullscreen & Pairing Modal
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState<boolean>(false);
  const [roomCode] = useState<string>(() => {
    const saved = sessionStorage.getItem("verbum_room_code");
    if (saved && saved.length === 4) return saved;
    const fresh = generateRoomCode();
    sessionStorage.setItem("verbum_room_code", fresh);
    return fresh;
  });
  const [peerConnectedCount, setPeerConnectedCount] = useState<number>(0);
  const [lastRemoteCommand, setLastRemoteCommand] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);
  const peerRef = useRef<Peer | null>(null);
  const connectionsRef = useRef<DataConnection[]>([]);
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);

  const totalSections = Math.max(1, sermon.blocks.length);

  // Real-time clock update
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setClockString(
        now.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    };
    updateClock();
    const id = setInterval(updateClock, 1000);
    return () => clearInterval(id);
  }, []);

  // Preaching elapsed timer
  useEffect(() => {
    if (!isTimerRunning) return;
    const id = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(id);
  }, [isTimerRunning]);

  // Smooth Auto-Scroller loop
  useEffect(() => {
    if (!isAutoScrolling) return;
    let animationFrameId: number;
    let accumulator = 0;

    const step = () => {
      if (scrollerRef.current) {
        accumulator += scrollSpeed * 0.35;
        if (accumulator >= 1) {
          const pixels = Math.floor(accumulator);
          scrollerRef.current.scrollTop += pixels;
          accumulator -= pixels;
        }
      }
      animationFrameId = requestAnimationFrame(step);
    };

    animationFrameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isAutoScrolling, scrollSpeed]);

  const scrollToSection = useCallback(
    (index: number) => {
      const clamped = Math.max(0, Math.min(sermon.blocks.length - 1, index));
      setActiveSectionIndex(clamped);
      const targetEl = sectionRefs.current[clamped];
      if (targetEl && scrollerRef.current) {
        targetEl.scrollIntoView({ behavior: "smooth", block: "center" });
      } else if (scrollerRef.current) {
        const delta = index > activeSectionIndex ? 320 : -320;
        scrollerRef.current.scrollBy({ top: delta, behavior: "smooth" });
      }
    },
    [sermon.blocks.length, activeSectionIndex]
  );

  // Execute incoming command from Smartphone Remote (PeerJS or BroadcastChannel)
  const executeRemoteCommand = useCallback(
    (cmd: RemoteCommandType) => {
      setLastRemoteCommand(cmd);
      setTimeout(() => {
        setLastRemoteCommand((prev) => (prev === cmd ? null : prev));
      }, 1200);

      switch (cmd) {
        case "NEXT_SECTION":
          setActiveSectionIndex((prev) => {
            const next = Math.min(sermon.blocks.length - 1, prev + 1);
            const el = sectionRefs.current[next];
            if (el) {
              el.scrollIntoView({ behavior: "smooth", block: "center" });
            } else if (scrollerRef.current) {
              scrollerRef.current.scrollBy({ top: 340, behavior: "smooth" });
            }
            return next;
          });
          break;
        case "PREV_SECTION":
          setActiveSectionIndex((prev) => {
            const next = Math.max(0, prev - 1);
            const el = sectionRefs.current[next];
            if (el) {
              el.scrollIntoView({ behavior: "smooth", block: "center" });
            } else if (scrollerRef.current) {
              scrollerRef.current.scrollBy({ top: -340, behavior: "smooth" });
            }
            return next;
          });
          break;
        case "TOGGLE_SCROLL":
          setIsAutoScrolling((prev) => !prev);
          break;
        case "TOGGLE_TIMER":
          setIsTimerRunning((prev) => !prev);
          break;
        case "FONT_PLUS":
          setFontSize((prev) => Math.min(38, prev + 2));
          break;
        case "FONT_MINUS":
          setFontSize((prev) => Math.max(18, prev - 2));
          break;
      }
    },
    [sermon.blocks.length]
  );

  const executeCommandRef = useRef(executeRemoteCommand);
  useEffect(() => {
    executeCommandRef.current = executeRemoteCommand;
  }, [executeRemoteCommand]);

  // Setup PeerJS Host + Local BroadcastChannel for zero-latency remote control
  useEffect(() => {
    const peerId = `verbum-pulpit-${roomCode}`;
    let peer: Peer | null = null;

    try {
      peer = new Peer(peerId);
      peerRef.current = peer;

      peer.on("connection", (conn) => {
        connectionsRef.current.push(conn);
        setPeerConnectedCount(connectionsRef.current.length);

        conn.on("data", (data: any) => {
          if (data && typeof data === "object" && data.type) {
            executeCommandRef.current(data.type as RemoteCommandType);
          }
        });

        conn.on("close", () => {
          connectionsRef.current = connectionsRef.current.filter((c) => c !== conn);
          setPeerConnectedCount(connectionsRef.current.length);
        });
      });

      peer.on("error", (err) => {
        console.warn("PeerJS host notice:", err.type);
      });
    } catch (e) {
      console.warn("PeerJS initialization fallback to BroadcastChannel:", e);
    }

    // Parallel BroadcastChannel for instant cross-tab testing
    const bc = new BroadcastChannel(`verbum_remote_${roomCode}`);
    broadcastChannelRef.current = bc;
    bc.onmessage = (event) => {
      const data = event.data as RemoteCommandPayload;
      if (data && data.type && data.room === roomCode) {
        executeCommandRef.current(data.type);
      }
    };

    return () => {
      bc.close();
      if (peer) {
        peer.destroy();
      }
    };
  }, [roomCode]);

  // Broadcast live pulpit state back to connected mobile remotes
  useEffect(() => {
    const telemetry: PulpitStateTelemetry = {
      room: roomCode,
      activeSectionIndex,
      totalSections,
      currentSectionHeading:
        sermon.blocks[activeSectionIndex]?.heading || sermon.title,
      isAutoScrolling,
      isTimerRunning,
      elapsedSeconds,
      fontSize,
    };

    for (const conn of connectionsRef.current) {
      if (conn.open) {
        conn.send({ kind: "TELEMETRY", payload: telemetry });
      }
    }
    if (broadcastChannelRef.current) {
      broadcastChannelRef.current.postMessage({
        kind: "TELEMETRY",
        payload: telemetry,
      });
    }
  }, [
    roomCode,
    activeSectionIndex,
    totalSections,
    sermon.blocks,
    sermon.title,
    isAutoScrolling,
    isTimerRunning,
    elapsedSeconds,
    fontSize,
  ]);

  // Fullscreen API toggle
  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement && containerRef.current) {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else if (document.fullscreenElement) {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (e) {
      console.warn("Fullscreen API not permitted in this frame:", e);
      setIsFullscreen((prev) => !prev);
    }
  };

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const remoteUrl = `${window.location.origin}/remote?room=${roomCode}`;

  const handleCopyRemoteUrl = () => {
    navigator.clipboard.writeText(remoteUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 1800);
  };

  const mainTextColorClass =
    textColorMode === "amber" ? "text-amber-400" : "text-white";
  const mutedTextColorClass =
    textColorMode === "amber" ? "text-amber-500/70" : "text-neutral-400";

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 bg-black text-white flex flex-col select-none overflow-hidden"
    >
      {/* Top Lectern Dashboard Header */}
      <header className="px-6 py-3.5 border-b border-neutral-800 bg-black flex flex-wrap items-center justify-between gap-4 shrink-0">
        {/* Left: Exit Pulpit & Sermon Title */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onExitPulpit}
            className="h-9 px-3 text-xs font-semibold bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border border-neutral-700 rounded flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Study Desk</span>
          </button>

          <div className="hidden sm:block">
            <h1 className="text-sm font-bold tracking-tight text-white truncate max-w-[260px] lg:max-w-[400px]">
              {sermon.title}
            </h1>
            <div className="text-xs font-mono-tabular text-neutral-400">
              {sermon.primaryText} · Section {activeSectionIndex + 1} of {totalSections}
            </div>
          </div>
        </div>

        {/* Center: Preaching Elapsed Timer, Real-Time Clock & Recording Status */}
        <div className="flex items-center gap-5">
          {/* Preaching Timer */}
          <div className="flex items-center gap-2 bg-neutral-950 border border-neutral-800 px-3 py-1.5 rounded">
            <span className="text-[11px] uppercase tracking-wider text-neutral-400">
              Preach Timer
            </span>
            <span className="text-lg font-mono-tabular font-bold text-white">
              {formatDuration(elapsedSeconds)}
            </span>
            <button
              type="button"
              onClick={() => setIsTimerRunning((prev) => !prev)}
              aria-label={isTimerRunning ? "Pause Preach Timer" : "Start Preach Timer"}
              className="p-1 text-neutral-300 hover:text-white"
            >
              {isTimerRunning ? (
                <Pause className="w-3.5 h-3.5" />
              ) : (
                <Play className="w-3.5 h-3.5" />
              )}
            </button>
            <button
              type="button"
              onClick={() => setElapsedSeconds(0)}
              aria-label="Reset Preach Timer"
              className="p-1 text-neutral-400 hover:text-white"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Real-Time Clock */}
          <div className="hidden md:flex flex-col items-end">
            <span className="text-[10px] uppercase tracking-wider text-neutral-500">
              Local Clock
            </span>
            <span className="text-sm font-mono-tabular font-semibold text-neutral-200">
              {clockString}
            </span>
          </div>

          {/* Live Pulpit Audio Recorder Control */}
          {isRecording ? (
            <button
              type="button"
              onClick={onStopRecording}
              className="h-9 px-3.5 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded flex items-center gap-2 transition-colors whitespace-nowrap shrink-0"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span className="font-mono-tabular">
                REC {formatDuration(recordingSeconds)} · Stop
              </span>
            </button>
          ) : (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={onStartRecording}
                className="h-9 px-3 text-xs font-semibold bg-neutral-900 hover:bg-neutral-800 text-white border border-neutral-700 rounded flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
              >
                <Mic className="w-3.5 h-3.5 text-rose-500" />
                <span>Record Audio</span>
              </button>
              <button
                type="button"
                onClick={onOpenAudioAnalysis}
                className="h-9 px-3 text-xs font-medium bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-800 rounded transition-colors whitespace-nowrap shrink-0"
              >
                Transcribe &amp; Analyze
              </button>
            </div>
          )}
        </div>

        {/* Right: Remote Pairing Modal Trigger & Fullscreen */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsQrModalOpen(true)}
            className="h-9 px-3 text-xs font-semibold bg-amber-400 text-black hover:bg-amber-300 rounded flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
          >
            <QrCode className="w-4 h-4" />
            <span className="font-mono-tabular">Remote: {roomCode}</span>
            {peerConnectedCount > 0 && (
              <span className="ml-1 font-mono-tabular">({peerConnectedCount})</span>
            )}
          </button>

          <button
            type="button"
            onClick={toggleFullscreen}
            aria-label="Toggle Fullscreen"
            className="h-9 px-2.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border border-neutral-700 rounded transition-colors"
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </button>
        </div>
      </header>

      {/* Secondary Lectern Teleprompter Controls Bar */}
      <div className="px-6 py-2.5 border-b border-neutral-900 bg-neutral-950 flex flex-wrap items-center justify-between gap-4 text-xs shrink-0">
        {/* View Switcher & Color Contrast Mode */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 bg-neutral-900 p-0.5 rounded border border-neutral-800">
            <button
              type="button"
              onClick={() => setDeliveryViewMode("sections")}
              className={`px-2.5 py-1 rounded font-medium transition-colors whitespace-nowrap ${
                deliveryViewMode === "sections"
                  ? "bg-white text-black"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              Outline Cards
            </button>
            <button
              type="button"
              onClick={() => setDeliveryViewMode("manuscript")}
              className={`px-2.5 py-1 rounded font-medium transition-colors whitespace-nowrap ${
                deliveryViewMode === "manuscript"
                  ? "bg-white text-black"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              Full Manuscript
            </button>
          </div>

          <div className="flex items-center gap-1 bg-neutral-900 p-0.5 rounded border border-neutral-800">
            <button
              type="button"
              onClick={() => setTextColorMode("white")}
              className={`px-2.5 py-1 rounded font-medium transition-colors whitespace-nowrap ${
                textColorMode === "white"
                  ? "bg-white text-black"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              OLED Crisp White
            </button>
            <button
              type="button"
              onClick={() => setTextColorMode("amber")}
              className={`px-2.5 py-1 rounded font-medium transition-colors whitespace-nowrap ${
                textColorMode === "amber"
                  ? "bg-amber-400 text-black"
                  : "text-amber-400/70 hover:text-amber-300"
              }`}
            >
              Warm Amber
            </button>
          </div>
        </div>

        {/* Typography Sliders: Font Size (18px - 38px) & Line Height */}
        <div className="flex flex-wrap items-center gap-5">
          <div className="flex items-center gap-2">
            <span className="text-neutral-400">Font Size</span>
            <input
              type="range"
              min={18}
              max={38}
              step={1}
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              className="w-24 accent-amber-400 cursor-pointer"
            />
            <span className="font-mono-tabular text-white w-10">{fontSize}px</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-neutral-400">Line Height</span>
            <select
              aria-label="Line Height"
              value={lineHeight}
              onChange={(e) => setLineHeight(Number(e.target.value))}
              className="h-7 px-2 bg-neutral-900 border border-neutral-800 rounded text-white font-mono-tabular"
            >
              <option value={1.45}>Compact (1.45)</option>
              <option value={1.65}>Standard (1.65)</option>
              <option value={1.9}>Spacious (1.90)</option>
            </select>
          </div>
        </div>

        {/* Auto-Scroll & Step Navigation Controls */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => scrollToSection(activeSectionIndex - 1)}
              className="h-7 px-2.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded text-neutral-200 flex items-center gap-1 whitespace-nowrap"
            >
              <ChevronUp className="w-3.5 h-3.5" />
              <span>Prev</span>
            </button>
            <button
              type="button"
              onClick={() => scrollToSection(activeSectionIndex + 1)}
              className="h-7 px-2.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded text-neutral-200 flex items-center gap-1 whitespace-nowrap"
            >
              <span>Next</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsAutoScrolling((prev) => !prev)}
            className={`h-7 px-3 rounded font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              isAutoScrolling
                ? "bg-amber-400 text-black"
                : "bg-neutral-900 text-neutral-200 border border-neutral-700 hover:bg-neutral-800"
            }`}
          >
            {isAutoScrolling ? (
              <>
                <Pause className="w-3 h-3" />
                <span>Pause Auto-Scroll</span>
              </>
            ) : (
              <>
                <Play className="w-3 h-3" />
                <span>Start Auto-Scroll</span>
              </>
            )}
          </button>

          <div className="flex items-center gap-1.5">
            <span className="text-neutral-400">Speed</span>
            <input
              type="range"
              min={1}
              max={6}
              step={1}
              value={scrollSpeed}
              onChange={(e) => setScrollSpeed(Number(e.target.value))}
              className="w-16 accent-amber-400 cursor-pointer"
            />
            <span className="font-mono-tabular text-neutral-300">{scrollSpeed}x</span>
          </div>
        </div>
      </div>

      {/* Remote Command Toast Feedback */}
      {lastRemoteCommand && (
        <div className="fixed bottom-6 right-6 z-50 px-3.5 py-2 bg-neutral-900 border border-amber-400/60 text-amber-300 text-xs font-mono-tabular rounded shadow-lg">
          Remote Command: {lastRemoteCommand}
        </div>
      )}

      {/* Pure OLED Black High-Contrast Lectern Teleprompter Body */}
      <div
        ref={scrollerRef}
        className="flex-1 overflow-y-auto px-6 sm:px-12 lg:px-24 py-12 bg-black"
      >
        <div className="max-w-4xl mx-auto space-y-10 pb-48">
          {/* Sermon Header Banner */}
          <div className="pb-8 border-b border-neutral-800 space-y-3">
            <div className={`text-sm font-mono-tabular uppercase tracking-widest ${mutedTextColorClass}`}>
              {sermon.preachingMode} Sermon · Primary Text: {sermon.primaryText}
            </div>
            <h2
              style={{ fontSize: `${Math.min(44, fontSize + 8)}px`, lineHeight: 1.2 }}
              className={`font-bold tracking-tight ${mainTextColorClass}`}
            >
              {sermon.title}
            </h2>
            <p
              style={{ fontSize: `${Math.max(18, fontSize - 3)}px`, lineHeight }}
              className="text-neutral-300 pt-2"
            >
              <strong className={mainTextColorClass}>Big Idea:</strong> {sermon.bigIdea}
            </p>
          </div>

          {deliveryViewMode === "sections" ? (
            /* SECTION-BY-SECTION TELEPROMPTER CARDS */
            <div className="space-y-8">
              {sermon.blocks.map((block, index) => {
                const isActive = index === activeSectionIndex;
                const isScripture = block.type === "scripture";

                return (
                  <div
                    key={block.id}
                    ref={(el) => {
                      sectionRefs.current[index] = el;
                    }}
                    onClick={() => setActiveSectionIndex(index)}
                    className={`p-6 sm:p-8 rounded-lg border transition-all cursor-pointer ${
                      isActive
                        ? "border-amber-400 bg-neutral-950"
                        : "border-neutral-800/80 bg-black opacity-75 hover:opacity-100"
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                      <span className="text-xs font-mono-tabular uppercase tracking-wider text-neutral-400">
                        {index + 1}. {block.type.replace("_", " ")}
                      </span>
                      {block.scriptureRef && (
                        <span className="text-sm font-mono-tabular font-semibold text-amber-400">
                          {block.scriptureRef}
                        </span>
                      )}
                    </div>

                    <h3
                      style={{ fontSize: `${fontSize + 2}px`, lineHeight: 1.3 }}
                      className={`font-bold mb-4 ${mainTextColorClass}`}
                    >
                      {block.heading}
                    </h3>

                    <p
                      style={{ fontSize: `${fontSize}px`, lineHeight }}
                      className={`whitespace-pre-line ${
                        isScripture
                          ? "font-serif-kjv italic text-amber-300"
                          : mainTextColorClass
                      }`}
                    >
                      {block.content}
                    </p>
                  </div>
                );
              })}
            </div>
          ) : (
            /* CONTINUOUS MANUSCRIPT TELEPROMPTER */
            <div
              style={{ fontSize: `${fontSize}px`, lineHeight }}
              className={`whitespace-pre-wrap tracking-wide ${mainTextColorClass}`}
            >
              {sermon.manuscript}
            </div>
          )}
        </div>
      </div>

      {/* Smartphone Remote Control Pairing Modal (PeerJS / WebRTC + QR Code) */}
      {isQrModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-neutral-950 border border-neutral-800 rounded-lg max-w-md w-full p-6 space-y-5 text-white">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold">
                  Smartphone Remote Control Pairing
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsQrModalOpen(false)}
                aria-label="Close Pairing Modal"
                className="text-neutral-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-center space-y-4">
              <div className="inline-block p-4 bg-white rounded-lg">
                <QRCodeSVG value={remoteUrl} size={180} level="M" />
              </div>

              <div className="space-y-1">
                <div className="text-xs uppercase tracking-wider text-neutral-400">
                  4-Character Pulpit Room Code
                </div>
                <div className="text-3xl font-mono-tabular font-bold tracking-widest text-amber-400">
                  {roomCode}
                </div>
                <p className="text-xs text-neutral-400 pt-1">
                  Scan QR code with your phone camera or open the remote URL in a new
                  tab for zero-latency WebRTC / PeerJS lectern control.
                </p>
              </div>

              <div className="flex items-center gap-2 bg-neutral-900 border border-neutral-800 p-2 rounded text-xs">
                <input
                  type="text"
                  readOnly
                  value={remoteUrl}
                  className="flex-1 bg-transparent text-neutral-300 font-mono-tabular text-[11px] focus:outline-none truncate"
                />
                <button
                  type="button"
                  onClick={handleCopyRemoteUrl}
                  className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-white rounded flex items-center gap-1 shrink-0"
                >
                  {copiedUrl ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy URL</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-neutral-800 text-xs text-neutral-400">
              <span>
                WebRTC Peer ID: <strong className="font-mono-tabular text-neutral-200">verbum-pulpit-{roomCode}</strong>
              </span>
              <a
                href={`/remote?room=${roomCode}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-amber-400 hover:underline font-medium"
              >
                Open Remote Controller &rarr;
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
