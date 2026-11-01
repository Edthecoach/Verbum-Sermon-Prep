import React from "react";
import {
  BookOpen,
  Compass,
  ListTree,
  Sparkles,
  Monitor,
  Smartphone,
  Mic,
  X,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

interface HowToUseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJumpToDesk: () => void;
  onLaunchPulpit: () => void;
  onOpenAudioModal: () => void;
  onOpenRemoteView: () => void;
}

interface WorkflowStep {
  number: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  instructions: string[];
  proTip: string;
  actionLabel: string;
  onAction: () => void;
}

export const HowToUseModal: React.FC<HowToUseModalProps> = ({
  isOpen,
  onClose,
  onJumpToDesk,
  onLaunchPulpit,
  onOpenAudioModal,
  onOpenRemoteView,
}) => {
  if (!isOpen) return null;

  const steps: WorkflowStep[] = [
    {
      number: "01",
      title: "Search & Navigate KJV Scripture",
      subtitle: "Left Column · KJV Reader & Quick Find (⌘K)",
      icon: <Compass className="w-4 h-4 text-neutral-900 dark:text-amber-400" />,
      instructions: [
        "Use the Book, Chapter, and Verse Range (v.Start – v.End) selectors to focus on your preaching pericope.",
        "Press Cmd+K (or Ctrl+K) or click 'Quick Find' to type any reference (e.g., 'John 3:16', 'Rom 8:28', 'Ps 23:1') and jump directly to that verse.",
        "Use the instant IndexedDB search bar to find KJV keywords or phrases across the entire local study corpus.",
      ],
      proTip:
        "Click '+ Card' on any search result or verse row to insert that KJV verse directly into your active sermon outline and manuscript.",
      actionLabel: "Open Scripture Study Desk",
      onAction: () => {
        onJumpToDesk();
        onClose();
      },
    },
    {
      number: "02",
      title: "Highlight Verses, Attach Margin Notes & Inspect TSK",
      subtitle: "Left Column · Exegetical Swatches & Treasury of Scripture Knowledge",
      icon: <BookOpen className="w-4 h-4 text-neutral-900 dark:text-amber-400" />,
      instructions: [
        "Click any verse in the reader to reveal the 4 Homiletic Swatches: Gold (Promise/Grace), Blue (Duty/Command), Red (Warning/Judgment), and Green (Doctrine).",
        "Inspect the bottom 'TSK Cross-References' tab to view parallel Scriptures illuminating your selected verse, and click 'Insert Scripture Card into Manuscript'.",
        "Switch to the 'Margin Notes Tray' tab to attach coordinate-anchored exegetical notes (e.g., Greek/Hebrew insights) to that specific verse.",
      ],
      proTip:
        "Use the swatch filter bar at the top of the Scripture Desk ('All | Promise | Duty | Warning | Doctrine') to isolate highlighted verses.",
      actionLabel: "Explore TSK & Highlights",
      onAction: () => {
        onJumpToDesk();
        onClose();
      },
    },
    {
      number: "03",
      title: "Initialize or Scaffold a Homiletical Structure",
      subtitle: "Right Column · Expository, Textual & Topical Templates",
      icon: <ListTree className="w-4 h-4 text-neutral-900 dark:text-amber-400" />,
      instructions: [
        "Select 'Template: Expository', 'Template: Textual', or 'Template: Topical' from the top dropdown and click 'New [Style] Sermon' to initialize a fresh sermon with pre-filled structural blocks.",
        "In Outline Mode, drag and drop block cards to reorder points, use the indent/outdent arrows to nest sub-points or illustrations, and assign KJV references to each block.",
        "Switch to Manuscript Mode at any time (or click 'Compile Outline into Manuscript') to draft your full spoken pulpit prose with live word count and delivery time estimates.",
      ],
      proTip:
        "Estimated preaching duration is calculated at a natural 130 words-per-minute pulpit cadence.",
      actionLabel: "Go to Homiletic Editor",
      onAction: () => {
        onJumpToDesk();
        onClose();
      },
    },
    {
      number: "04",
      title: "Ideate Outlines with the Gemini Homiletic Assistant",
      subtitle: "Right Sidebar · AI Sermon Outliner",
      icon: <Sparkles className="w-4 h-4 text-neutral-900 dark:text-amber-400" />,
      instructions: [
        "Open the 'AI Outliner' sidebar on the right side of the Homiletic Editor.",
        "Enter a KJV passage or doctrinal topic (e.g., 'Ephesians 2:8-10' or 'Justification by Faith'), choose Expository, Textual, or Topical mode, and add optional pastoral focus notes.",
        "Click 'Generate Outline' to produce a complete homiletical breakdown (Hook, Context, Big Idea, Divisions, Illustrations, Application, and Call to Action), then click 'Apply Outline to Editor'.",
      ],
      proTip:
        "Applying an AI outline populates both your draggable Outline Mode blocks and your compiled Manuscript Mode text simultaneously.",
      actionLabel: "Open Editor & AI Outliner",
      onAction: () => {
        onJumpToDesk();
        onClose();
      },
    },
    {
      number: "05",
      title: "Deliver from the OLED Lectern Pulpit & Pair Mobile Remote",
      subtitle: "Full-Screen Teleprompter · PeerJS / WebRTC Smartphone Controller",
      icon: <Monitor className="w-4 h-4 text-neutral-900 dark:text-amber-400" />,
      instructions: [
        "Click 'Launch Lectern Pulpit' in the top right to enter the distraction-free pure OLED black delivery view.",
        "Adjust font size (18px–38px), line spacing, Crisp White vs. Warm Amber typography, and toggle smooth Auto-Scroll or section-by-section card mode.",
        "Click 'Remote: XXXX' in the lectern header to display the 4-character Room Code and QR code. Scan the QR code with your smartphone (or open Mobile Remote) for thumb-friendly wireless control.",
      ],
      proTip:
        "Your phone acts as a zero-latency WebRTC controller to advance sections, pause/resume auto-scroll, toggle the preaching timer, and scale font size.",
      actionLabel: "Launch Lectern Pulpit",
      onAction: () => {
        onLaunchPulpit();
        onClose();
      },
    },
    {
      number: "06",
      title: "Record Pulpit Audio & Run Post-Sermon Gemini Analysis",
      subtitle: "Audio & Transcript · Multimodal KJV Transcription & Delivery Comparison",
      icon: <Mic className="w-4 h-4 text-neutral-900 dark:text-amber-400" />,
      instructions: [
        "Click 'Record Audio' in the Lectern Pulpit (or open 'Audio & Transcript' from the top bar) to capture live sermon audio via HTML5 MediaRecorder or upload an audio file.",
        "After preaching, click 'Transcribe & Analyze with Gemini'. Your prepared manuscript is automatically injected as contextual vocabulary ground truth.",
        "Review the KJV-accurate timestamped spoken transcript alongside the Homiletical Delivery Comparison (manuscript alignment score, delivered points, skipped points, spontaneous ad-libs, and pacing notes).",
      ],
      proTip:
        "All sermons, KJV highlights, margin notes, and audio recordings are persisted locally in your browser's IndexedDB via Dexie.js.",
      actionLabel: "Open Audio & Transcript Pipeline",
      onAction: () => {
        onOpenAudioModal();
        onClose();
      },
    },
  ];

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-800 rounded-lg max-w-5xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-neutral-50 dark:bg-black">
          <div>
            <h2 className="text-base font-bold tracking-tight text-neutral-900 dark:text-white">
              How to Use Verbum — Step-by-Step Homiletic &amp; Pulpit Workflow
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              Complete guide from KJV exegesis and outlining to OLED lectern delivery,
              WebRTC remote control, and post-sermon audio transcription
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close How to Use guide"
            className="p-1.5 text-neutral-400 hover:text-neutral-900 dark:hover:text-white rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Step-by-Step Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-white dark:bg-black">
          {/* 6-Step Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {steps.map((step) => (
              <div
                key={step.number}
                className="p-5 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  {/* Step Header */}
                  <div className="flex items-start justify-between gap-3 border-b border-neutral-100 dark:border-neutral-800 pb-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono-tabular font-bold text-neutral-400 dark:text-amber-400">
                          {step.number}.
                        </span>
                        <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                          {step.title}
                        </h3>
                      </div>
                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                        {step.subtitle}
                      </p>
                    </div>
                    <div className="p-2 bg-neutral-100 dark:bg-neutral-900 rounded border border-neutral-200 dark:border-neutral-800 shrink-0">
                      {step.icon}
                    </div>
                  </div>

                  {/* Step Bullet Instructions */}
                  <ul className="space-y-2 text-xs text-neutral-700 dark:text-neutral-300">
                    {step.instructions.map((inst, idx) => (
                      <li key={idx} className="flex items-start gap-2 leading-relaxed">
                        <CheckCircle2 className="w-3.5 h-3.5 text-neutral-400 dark:text-amber-400 shrink-0 mt-0.5" />
                        <span>{inst}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Pro Tip & Direct Action Button */}
                <div className="pt-3 border-t border-neutral-100 dark:border-neutral-900 space-y-3">
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-normal">
                    <strong className="text-neutral-800 dark:text-neutral-200">
                      Tip:
                    </strong>{" "}
                    {step.proTip}
                  </p>

                  <button
                    type="button"
                    onClick={step.onAction}
                    className="w-full h-8 px-3 text-xs font-semibold bg-neutral-900 dark:bg-amber-400 text-white dark:text-black rounded hover:bg-neutral-800 dark:hover:bg-amber-300 transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap"
                  >
                    <span>{step.actionLabel}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Reference Table: Keyboard Shortcuts, Homiletic Swatches & Remote Controls */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="p-4 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded space-y-2">
              <div className="text-xs font-bold text-neutral-900 dark:text-white">
                Keyboard &amp; Navigation Shortcuts
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-neutral-600 dark:text-neutral-400">
                    Open KJV Quick Find
                  </span>
                  <span className="font-mono-tabular font-semibold text-neutral-900 dark:text-amber-400">
                    ⌘K / Ctrl+K
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-600 dark:text-neutral-400">
                    Navigate Quick Find Results
                  </span>
                  <span className="font-mono-tabular font-semibold text-neutral-900 dark:text-amber-400">
                    ↑ / ↓ + Enter
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-600 dark:text-neutral-400">
                    Close Active Overlay
                  </span>
                  <span className="font-mono-tabular font-semibold text-neutral-900 dark:text-amber-400">
                    ESC
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded space-y-2">
              <div className="text-xs font-bold text-neutral-900 dark:text-white">
                Homiletic Highlighting Legend
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-amber-800 dark:text-amber-300">
                    Gold Swatch
                  </span>
                  <span className="text-neutral-600 dark:text-neutral-400">
                    Promise / Grace
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sky-800 dark:text-sky-300">
                    Blue Swatch
                  </span>
                  <span className="text-neutral-600 dark:text-neutral-400">
                    Duty / Command
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-rose-800 dark:text-rose-300">
                    Red Swatch
                  </span>
                  <span className="text-neutral-600 dark:text-neutral-400">
                    Warning / Judgment
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-emerald-800 dark:text-emerald-300">
                    Green Swatch
                  </span>
                  <span className="text-neutral-600 dark:text-neutral-400">
                    Doctrine
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded space-y-2 flex flex-col justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-900 dark:text-white">
                  <Smartphone className="w-3.5 h-3.5 text-neutral-700 dark:text-amber-400" />
                  <span>Smartphone Remote Pairing</span>
                </div>
                <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                  Test the mobile remote right now on your phone or in a second browser
                  tab using your active 4-character Room Code.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  onOpenRemoteView();
                  onClose();
                }}
                className="w-full h-8 px-3 text-xs font-medium bg-white dark:bg-black border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white rounded hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors"
              >
                Preview Mobile Remote Controller
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
