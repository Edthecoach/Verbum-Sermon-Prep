import React, { useState, useEffect, useRef } from "react";
import {
  ChevronUp,
  ChevronDown,
  Play,
  Pause,
  Timer,
  ZoomIn,
  ZoomOut,
  Smartphone,
  ArrowLeft,
  RefreshCw,
} from "lucide-react";
import Peer, { type DataConnection } from "peerjs";
import type {
  RemoteCommandType,
  RemoteCommandPayload,
  PulpitStateTelemetry,
} from "./PulpitView";

interface MobileRemoteViewProps {
  initialRoomCode: string;
  onExitRemote?: () => void;
}

export const MobileRemoteView: React.FC<MobileRemoteViewProps> = ({
  initialRoomCode,
  onExitRemote,
}) => {
  const [roomCode, setRoomCode] = useState<string>(
    (initialRoomCode || sessionStorage.getItem("verbum_room_code") || "KJV1")
      .toUpperCase()
      .slice(0, 4)
  );
  const [connectionState, setConnectionState] = useState<
    "connecting" | "connected" | "local-ready"
  >("connecting");
  const [telemetry, setTelemetry] = useState<PulpitStateTelemetry | null>(null);
  const [lastSentAction, setLastSentAction] = useState<string | null>(null);

  const peerRef = useRef<Peer | null>(null);
  const connRef = useRef<DataConnection | null>(null);
  const bcRef = useRef<BroadcastChannel | null>(null);

  const connectToPulpit = (targetRoom: string) => {
    const cleanRoom = targetRoom.trim().toUpperCase();
    if (!cleanRoom) return;

    setConnectionState("connecting");

    // 1. Setup BroadcastChannel for same-device / multi-tab instant messaging
    if (bcRef.current) {
      bcRef.current.close();
    }
    const bc = new BroadcastChannel(`verbum_remote_${cleanRoom}`);
    bcRef.current = bc;
    bc.onmessage = (ev) => {
      if (ev.data && ev.data.kind === "TELEMETRY") {
        setTelemetry(ev.data.payload as PulpitStateTelemetry);
        setConnectionState("connected");
      }
    };

    // 2. Setup PeerJS WebRTC DataChannel for cross-device smartphone control
    if (peerRef.current) {
      peerRef.current.destroy();
    }

    try {
      const peer = new Peer();
      peerRef.current = peer;

      peer.on("open", () => {
        const hostPeerId = `verbum-pulpit-${cleanRoom}`;
        const conn = peer.connect(hostPeerId, { reliable: true });
        connRef.current = conn;

        conn.on("open", () => {
          setConnectionState("connected");
        });

        conn.on("data", (data: any) => {
          if (data && data.kind === "TELEMETRY") {
            setTelemetry(data.payload as PulpitStateTelemetry);
            setConnectionState("connected");
          }
        });

        conn.on("close", () => {
          setConnectionState("local-ready");
        });

        conn.on("error", () => {
          setConnectionState("local-ready");
        });
      });

      peer.on("error", () => {
        setConnectionState("local-ready");
      });
    } catch {
      setConnectionState("local-ready");
    }
  };

  useEffect(() => {
    connectToPulpit(roomCode);
    return () => {
      if (bcRef.current) bcRef.current.close();
      if (peerRef.current) peerRef.current.destroy();
    };
  }, [roomCode]);

  const sendCommand = (type: RemoteCommandType, label: string) => {
    const payload: RemoteCommandPayload = {
      type,
      room: roomCode,
      timestamp: Date.now(),
    };

    // Send over WebRTC PeerJS DataChannel if open
    if (connRef.current && connRef.current.open) {
      connRef.current.send(payload);
    }

    // Also broadcast on local channel
    if (bcRef.current) {
      bcRef.current.postMessage(payload);
    }

    setLastSentAction(label);
    setTimeout(() => {
      setLastSentAction((prev) => (prev === label ? null : prev));
    }, 900);
  };

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col justify-between p-4 sm:p-6 max-w-md mx-auto select-none">
      {/* Top Header & Room Code Pairing Bar */}
      <header className="space-y-3 border-b border-neutral-800 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-amber-400" />
            <h1 className="text-base font-bold tracking-tight">
              Verbum Pulpit Remote
            </h1>
          </div>

          {onExitRemote && (
            <button
              type="button"
              onClick={onExitRemote}
              className="px-2.5 py-1 text-xs font-medium bg-neutral-900 border border-neutral-700 rounded text-neutral-200 hover:bg-neutral-800 flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Desk</span>
            </button>
          )}
        </div>

        {/* Room Code Selector */}
        <div className="flex items-center justify-between gap-2 bg-neutral-950 border border-neutral-800 p-2.5 rounded">
          <div className="flex items-center gap-2">
            <span className="text-xs text-neutral-400">Room Code:</span>
            <input
              type="text"
              maxLength={4}
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              className="w-20 h-8 px-2 text-center font-mono-tabular font-bold text-sm bg-black border border-neutral-700 rounded text-amber-400 focus:outline-none focus:border-amber-400"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono-tabular text-neutral-300">
              {connectionState === "connected"
                ? "WebRTC Linked"
                : connectionState === "connecting"
                ? "Linking..."
                : "Ready (Channel Active)"}
            </span>
            <button
              type="button"
              onClick={() => connectToPulpit(roomCode)}
              aria-label="Reconnect to Room"
              className="p-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 rounded text-neutral-200"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Live Telemetry Readout from Lectern */}
        <div className="p-3 bg-neutral-950 border border-neutral-800 rounded space-y-1">
          <div className="flex items-center justify-between text-xs text-neutral-400 font-mono-tabular">
            <span>
              {telemetry
                ? `Section ${telemetry.activeSectionIndex + 1} / ${telemetry.totalSections}`
                : `Room ${roomCode} Controller`}
            </span>
            <span>
              Timer: {telemetry ? formatTimer(telemetry.elapsedSeconds) : "00:00"}
            </span>
          </div>
          <div className="text-sm font-semibold text-white truncate">
            {telemetry?.currentSectionHeading ||
              "Tap controls below to drive the Lectern Display"}
          </div>
        </div>
      </header>

      {/* Primary Thumb-Friendly Tap Targets */}
      <main className="my-auto py-4 space-y-3">
        {/* Next Section / Down (Largest Primary Target) */}
        <button
          type="button"
          onClick={() => sendCommand("NEXT_SECTION", "Next Section / Down")}
          className="w-full min-h-[96px] bg-amber-400 active:bg-amber-500 text-black rounded-lg font-bold text-lg flex flex-col items-center justify-center gap-1 transition-transform active:scale-[0.99]"
        >
          <ChevronDown className="w-7 h-7 stroke-[2.5]" />
          <span>[ Next Section / Down ]</span>
        </button>

        {/* Previous Section / Up */}
        <button
          type="button"
          onClick={() => sendCommand("PREV_SECTION", "Previous Section / Up")}
          className="w-full min-h-[76px] bg-neutral-900 active:bg-neutral-800 border border-neutral-700 text-white rounded-lg font-bold text-base flex items-center justify-center gap-2 transition-transform active:scale-[0.99]"
        >
          <ChevronUp className="w-6 h-6" />
          <span>[ Previous Section / Up ]</span>
        </button>

        {/* Start / Pause Auto-Scroll & Toggle Preach Timer */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <button
            type="button"
            onClick={() =>
              sendCommand("TOGGLE_SCROLL", "Start / Pause Auto-Scroll")
            }
            className={`min-h-[72px] p-3 rounded-lg border font-semibold text-xs sm:text-sm flex flex-col items-center justify-center gap-1.5 transition-colors ${
              telemetry?.isAutoScrolling
                ? "bg-emerald-600 border-emerald-500 text-white"
                : "bg-neutral-900 border-neutral-700 text-white active:bg-neutral-800"
            }`}
          >
            {telemetry?.isAutoScrolling ? (
              <Pause className="w-5 h-5" />
            ) : (
              <Play className="w-5 h-5" />
            )}
            <span>[ Start / Pause Auto-Scroll ]</span>
          </button>

          <button
            type="button"
            onClick={() => sendCommand("TOGGLE_TIMER", "Toggle Preach Timer")}
            className="min-h-[72px] p-3 bg-neutral-900 active:bg-neutral-800 border border-neutral-700 text-white rounded-lg font-semibold text-xs sm:text-sm flex flex-col items-center justify-center gap-1.5"
          >
            <Timer className="w-5 h-5 text-amber-400" />
            <span>[ Toggle Preach Timer ]</span>
          </button>
        </div>

        {/* Font Size +/- */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => sendCommand("FONT_MINUS", "Font Size -")}
            className="min-h-[60px] bg-neutral-950 active:bg-neutral-800 border border-neutral-800 text-neutral-200 rounded-lg font-semibold text-sm flex items-center justify-center gap-2"
          >
            <ZoomOut className="w-4 h-4" />
            <span>[ Font Size - ]</span>
          </button>

          <button
            type="button"
            onClick={() => sendCommand("FONT_PLUS", "Font Size +")}
            className="min-h-[60px] bg-neutral-950 active:bg-neutral-800 border border-neutral-800 text-neutral-200 rounded-lg font-semibold text-sm flex items-center justify-center gap-2"
          >
            <ZoomIn className="w-4 h-4" />
            <span>[ Font Size + ]</span>
          </button>
        </div>
      </main>

      {/* Footer Action Confirmation */}
      <footer className="pt-3 border-t border-neutral-900 text-center text-xs font-mono-tabular text-neutral-400 h-8">
        {lastSentAction ? (
          <span className="text-amber-400">Sent: {lastSentAction}</span>
        ) : (
          <span>Zero-latency PeerJS / WebRTC Pulpit Controller</span>
        )}
      </footer>
    </div>
  );
};
