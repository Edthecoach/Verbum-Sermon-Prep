import React, { useState, useEffect } from "react";
import {
  Mic,
  Square,
  Sparkles,
  Trash2,
  X,
  Upload,
  Clock,
  CheckCircle2,
  AlertCircle,
  MessageSquareQuote,
  FileAudio,
} from "lucide-react";
import {
  db,
  type SermonDocument,
  type SermonRecording,
} from "../db/db";

interface AudioTranscriptionModalProps {
  sermon: SermonDocument;
  isOpen: boolean;
  onClose: () => void;
  isRecording: boolean;
  recordingSeconds: number;
  onStartRecording: () => void;
  onStopRecording: () => void;
  recordingsVersion: number;
}

export const AudioTranscriptionModal: React.FC<AudioTranscriptionModalProps> = ({
  sermon,
  isOpen,
  onClose,
  isRecording,
  recordingSeconds,
  onStartRecording,
  onStopRecording,
  recordingsVersion,
}) => {
  const [recordings, setRecordings] = useState<SermonRecording[]>([]);
  const [selectedRecordingId, setSelectedRecordingId] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const loadRecordings = async () => {
    const list = await db.recordings
      .where("sermonId")
      .equals(sermon.id)
      .reverse()
      .sortBy("createdAt");
    setRecordings(list);
    if (list.length > 0 && !selectedRecordingId) {
      setSelectedRecordingId(list[0].id);
    } else if (list.length > 0 && !list.some((r) => r.id === selectedRecordingId)) {
      setSelectedRecordingId(list[0].id);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadRecordings();
    }
  }, [isOpen, sermon.id, recordingsVersion]);

  if (!isOpen) return null;

  const activeRecording =
    recordings.find((r) => r.id === selectedRecordingId) || recordings[0] || null;

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const handleUploadAudioFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.includes(",") ? dataUrl.split(",")[1] : dataUrl;
      const newRec: SermonRecording = {
        id: `rec-${Date.now()}`,
        sermonId: sermon.id,
        sermonTitle: sermon.title,
        createdAt: Date.now(),
        durationSec: 45,
        mimeType: file.type || "audio/webm",
        audioBase64: base64,
      };
      await db.recordings.put(newRec);
      await loadRecordings();
      setSelectedRecordingId(newRec.id);
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteRecording = async (id: string) => {
    await db.recordings.delete(id);
    const updated = recordings.filter((r) => r.id !== id);
    setRecordings(updated);
    if (selectedRecordingId === id) {
      setSelectedRecordingId(updated[0]?.id || null);
    }
  };

  const handleTranscribeAndAnalyze = async () => {
    if (!activeRecording) return;
    setIsAnalyzing(true);
    setAnalysisError(null);

    try {
      const outlineSummary = sermon.blocks
        .map(
          (b, i) =>
            `${i + 1}. [${b.type.toUpperCase()}] ${b.heading} (${
              b.scriptureRef || ""
            }): ${b.content}`
        )
        .join("\n");

      const response = await fetch("/api/gemini/transcribe-analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          audioBase64: activeRecording.audioBase64,
          mimeType: activeRecording.mimeType,
          sermonTitle: sermon.title,
          primaryText: sermon.primaryText,
          manuscriptText: sermon.manuscript,
          outlineSummary,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to transcribe and analyze sermon audio.");
      }

      const updatedRecording: SermonRecording = {
        ...activeRecording,
        transcriptSegments: data.transcriptSegments,
        comparison: data.comparison,
      };

      await db.recordings.put(updatedRecording);
      setRecordings((prev) =>
        prev.map((r) => (r.id === updatedRecording.id ? updatedRecording : r))
      );
    } catch (err: any) {
      setAnalysisError(err.message || "Error running Gemini multimodal audio analysis.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-800 rounded-lg max-w-5xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-xl">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-neutral-50 dark:bg-black">
          <div>
            <h2 className="text-base font-bold tracking-tight text-neutral-900 dark:text-white">
              Pulpit Audio Recording &amp; Post-Sermon Homiletical Analysis
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              HTML5 MediaRecorder capture + Gemini multimodal transcription grounded in
              your KJV sermon manuscript
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 text-neutral-400 hover:text-neutral-900 dark:hover:text-white rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Capture Controls Bar */}
        <div className="px-6 py-3.5 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            {isRecording ? (
              <button
                type="button"
                onClick={onStopRecording}
                className="h-9 px-4 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded flex items-center gap-2 transition-colors whitespace-nowrap"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                <span className="font-mono-tabular">
                  Recording Pulpit Audio ({formatTime(recordingSeconds)}) — Click to Stop
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onStartRecording}
                className="h-9 px-4 text-xs font-semibold bg-neutral-900 dark:bg-amber-400 hover:bg-neutral-800 dark:hover:bg-amber-300 text-white dark:text-black rounded flex items-center gap-2 transition-colors whitespace-nowrap"
              >
                <Mic className="w-3.5 h-3.5 text-rose-400 dark:text-rose-600" />
                <span>Start In-App Pulpit Recording</span>
              </button>
            )}

            <label className="h-9 px-3 text-xs font-medium bg-white dark:bg-black border border-neutral-300 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-900 text-neutral-800 dark:text-neutral-200 rounded flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap">
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Sermon Audio</span>
              <input
                type="file"
                accept="audio/*"
                onChange={handleUploadAudioFile}
                className="hidden"
              />
            </label>
          </div>

          {activeRecording && (
            <button
              type="button"
              disabled={isAnalyzing}
              onClick={handleTranscribeAndAnalyze}
              className="h-9 px-4 text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white rounded flex items-center gap-2 transition-colors whitespace-nowrap"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>
                {isAnalyzing
                  ? "Transcribing & Comparing with Manuscript..."
                  : "Transcribe & Analyze with Gemini"}
              </span>
            </button>
          )}
        </div>

        {/* Main Content Split: Saved Recordings List + Transcript & Delivery Comparison */}
        <div className="flex-1 grid grid-cols-12 min-h-0 overflow-hidden">
          {/* Left Sidebar: Local IndexedDB Audio Recordings */}
          <div className="col-span-12 md:col-span-4 border-r border-neutral-200 dark:border-neutral-800 bg-neutral-50/60 dark:bg-neutral-950 p-4 overflow-y-auto space-y-2.5">
            <div className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 pb-1">
              IndexedDB Recordings ({recordings.length})
            </div>

            {recordings.length === 0 ? (
              <div className="p-5 bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded text-center space-y-2">
                <FileAudio className="w-6 h-6 text-neutral-400 mx-auto" />
                <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                  No pulpit recordings saved for this sermon yet. Click{" "}
                  <strong>Start In-App Pulpit Recording</strong> above and speak a few
                  sentences from your sermon, then click{" "}
                  <strong>Transcribe &amp; Analyze</strong>.
                </p>
              </div>
            ) : (
              recordings.map((rec, idx) => {
                const isSelected = rec.id === activeRecording?.id;
                return (
                  <div
                    key={rec.id}
                    onClick={() => setSelectedRecordingId(rec.id)}
                    className={`p-3 rounded border cursor-pointer transition-colors space-y-2 ${
                      isSelected
                        ? "bg-white dark:bg-black border-neutral-900 dark:border-amber-400 shadow-xs"
                        : "bg-white dark:bg-black border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-neutral-900 dark:text-white truncate">
                        Take #{recordings.length - idx} · {formatTime(rec.durationSec)}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteRecording(rec.id);
                        }}
                        aria-label="Delete recording"
                        className="text-neutral-400 hover:text-rose-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="text-[11px] font-mono-tabular text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(rec.createdAt).toLocaleString()}</span>
                    </div>

                    <audio
                      controls
                      src={`data:${rec.mimeType};base64,${rec.audioBase64}`}
                      className="w-full h-8 mt-1"
                    />

                    {rec.comparison && (
                      <div className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400 pt-1">
                        Analyzed · {rec.comparison.alignmentScore}% Manuscript Fidelity
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Right Panel: Timestamped Spoken Transcript & Homiletical Delivery Comparison */}
          <div className="col-span-12 md:col-span-8 p-6 overflow-y-auto space-y-6 bg-white dark:bg-black">
            {analysisError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 rounded text-xs text-rose-800 dark:text-rose-200">
                {analysisError}
              </div>
            )}

            {isAnalyzing ? (
              <div className="py-16 text-center space-y-3">
                <div className="w-8 h-8 border-2 border-neutral-900 dark:border-amber-400 border-t-transparent rounded-full animate-spin mx-auto" />
                <div className="text-sm font-semibold text-neutral-900 dark:text-white">
                  Running Gemini Multimodal Audio Transcription &amp; Homiletical
                  Comparison...
                </div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-md mx-auto">
                  Injecting active manuscript ({sermon.title} — {sermon.primaryText}) as
                  contextual vocabulary ground truth for KJV terminology and comparing
                  spoken delivery against planned points.
                </p>
              </div>
            ) : !activeRecording ? (
              <div className="py-16 text-center text-xs text-neutral-500 dark:text-neutral-400">
                Record or upload pulpit audio on the left to generate a timestamped
                transcript and homiletical delivery comparison.
              </div>
            ) : !activeRecording.comparison ? (
              <div className="py-12 text-center space-y-3 border border-dashed border-neutral-300 dark:border-neutral-800 rounded p-8">
                <MessageSquareQuote className="w-8 h-8 text-neutral-400 mx-auto" />
                <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                  Ready for Post-Sermon Transcription &amp; Analysis
                </h3>
                <p className="text-xs text-neutral-600 dark:text-neutral-400 max-w-md mx-auto leading-relaxed">
                  Click <strong>Transcribe &amp; Analyze with Gemini</strong> in the top
                  bar to process this recording with your active manuscript injected as
                  vocabulary ground truth.
                </p>
              </div>
            ) : (
              <>
                {/* 1. Homiletical Delivery Comparison */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-2">
                    <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                      1. Homiletical Delivery Comparison (Planned vs. Preached)
                    </h3>
                    <span className="text-xs font-mono-tabular font-bold text-neutral-900 dark:text-amber-400">
                      Manuscript Alignment: {activeRecording.comparison.alignmentScore}%
                    </span>
                  </div>

                  <div className="p-4 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded space-y-1.5">
                    <div className="text-xs font-bold text-neutral-900 dark:text-white">
                      Executive Evaluation
                    </div>
                    <p className="text-xs text-neutral-800 dark:text-neutral-200 leading-relaxed">
                      {activeRecording.comparison.executiveSummary}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Delivered Points */}
                    <div className="p-3.5 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded space-y-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-400">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span>Delivered Points</span>
                      </div>
                      <ul className="space-y-1.5 text-xs text-neutral-700 dark:text-neutral-300">
                        {activeRecording.comparison.deliveredPoints.map((pt, i) => (
                          <li key={i} className="leading-snug">
                            • {pt}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Skipped or Condensed Points */}
                    <div className="p-3.5 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded space-y-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 dark:text-amber-400">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>Skipped / Condensed</span>
                      </div>
                      <ul className="space-y-1.5 text-xs text-neutral-700 dark:text-neutral-300">
                        {activeRecording.comparison.skippedPoints.map((pt, i) => (
                          <li key={i} className="leading-snug">
                            • {pt}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Spontaneous Ad-Libs */}
                    <div className="p-3.5 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded space-y-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-sky-900 dark:text-sky-400">
                        <Sparkles className="w-4 h-4 shrink-0" />
                        <span>Spontaneous Ad-Libs</span>
                      </div>
                      <ul className="space-y-1.5 text-xs text-neutral-700 dark:text-neutral-300">
                        {activeRecording.comparison.spontaneousAdLibs.map((pt, i) => (
                          <li key={i} className="leading-snug">
                            • {pt}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="p-3.5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded space-y-1">
                    <div className="text-xs font-bold text-neutral-900 dark:text-white">
                      Pacing, Cadence &amp; Homiletical Delivery Notes
                    </div>
                    <p className="text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed">
                      {activeRecording.comparison.pacingAndDeliveryNotes}
                    </p>
                  </div>
                </div>

                {/* 2. Clean Timestamped Spoken Transcript */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-2">
                    <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                      2. Timestamped KJV-Grounded Spoken Transcript
                    </h3>
                    <span className="text-xs text-neutral-500 dark:text-neutral-400 font-mono-tabular">
                      {activeRecording.transcriptSegments?.length || 0} segments
                    </span>
                  </div>

                  <div className="space-y-2">
                    {activeRecording.transcriptSegments?.map((seg, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded flex items-start gap-3"
                      >
                        <span className="text-xs font-mono-tabular font-bold text-neutral-600 dark:text-amber-400 bg-neutral-100 dark:bg-neutral-900 px-2 py-0.5 rounded shrink-0">
                          [{seg.timestamp}]
                        </span>
                        <div className="space-y-1 flex-1">
                          <p className="text-xs font-serif-kjv text-neutral-900 dark:text-neutral-100 leading-relaxed">
                            {seg.text}
                          </p>
                          {seg.matchedSection && (
                            <div className="text-[11px] text-neutral-500 dark:text-neutral-400">
                              Matched Section: {seg.matchedSection}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
