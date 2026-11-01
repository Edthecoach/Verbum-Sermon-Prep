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
  onOpenEditorStep?: (mode: "rough_draft" | "outline" | "manuscript") => void;
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
  onOpenEditorStep,
  onLaunchPulpit,
  onOpenAudioModal,
  onOpenRemoteView,
}) => {
  if (!isOpen) return null;

  const steps: WorkflowStep[] = [
    {
      number: "01",
      title: "Search & Navigate KJV Scripture",
      subtitle: "Left Column · KJV Reader, Prev/Next Chapter & Quick Find (⌘K)",
      icon: <Compass className="w-4 h-4 text-neutral-900 dark:text-amber-400" />,
      instructions: [
        "Use the Book, Chapter, and ‹ Prev / Next › buttons—or Verse Range (v.Start – v.End)—to focus on your preaching pericope.",
        "Press Cmd+K (or Ctrl+K) or click 'Quick Find' to type any reference (e.g., 'John 3:16', 'Rom 8:28', 'Ps 23:1') and jump directly to that verse.",
        "Click any 'Read ↗' Scripture badge inside the Sermon Editor to automatically jump the KJV Reader to that exact passage.",
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
      title: "Highlights, TSK, Reference Density & Memory Deck",
      subtitle: "Left Column · Swatches, Cross-References, Density Map & Cloze Recall",
      icon: <BookOpen className="w-4 h-4 text-neutral-900 dark:text-amber-400" />,
      instructions: [
        "Click any verse in the reader to apply 4 Homiletic Swatches: Gold (Promise/Grace), Blue (Duty/Command), Red (Warning/Judgment), and Green (Doctrine).",
        "Click 'Memory Deck' or '+ Memorize' on any verse to practice pulpit recall with Light, Standard, or Mastery missing-word cloze cards.",
        "Toggle the 'Density Map' sidebar graph to inspect which passages and Bible books are most frequently cited across all your saved sermons.",
      ],
      proTip:
        "Inspect the bottom 'TSK Cross-References' and 'Margin Notes' tabs to attach coordinate-anchored exegetical insights to any verse.",
      actionLabel: "Explore TSK, Density & Memory Deck",
      onAction: () => {
        onJumpToDesk();
        onClose();
      },
    },
    {
      number: "03",
      title: "Brainstorm in the Rough Draft & Thought Organizer",
      subtitle: "Step 1 · Turn Unstructured Notes into Titles, Illustrations & Prayers",
      icon: <Sparkles className="w-4 h-4 text-neutral-900 dark:text-amber-400" />,
      instructions: [
        "Click '1. Rough Draft' in the top bar or editor tabs to type raw sermon ideas, burdens, stories, and verse fragments.",
        "Click 'Organize My Thoughts' to generate 4 homiletic title suggestions, a distilled Big Idea, structured outline divisions, vivid illustrations, KJV cross-references, and closing pastoral prayers.",
        "Click 'Use Title', '+ Add Illustration', '+ Insert KJV Card', '+ Append Prayer', or 'Apply Full Organized Structure' with one click.",
      ],
      proTip:
        "You can click any suggested KJV reference in the organizer to read it in context in the left KJV column before inserting.",
      actionLabel: "Open 1. Rough Draft Organizer",
      onAction: () => {
        if (onOpenEditorStep) {
          onOpenEditorStep("rough_draft");
        } else {
          onJumpToDesk();
        }
        onClose();
      },
    },
    {
      number: "04",
      title: "Structure Outline Blocks & Draft Full Manuscript",
      subtitle: "Steps 2 & 3 · Templates, Drag-and-Drop Outline & Manuscript Prose",
      icon: <ListTree className="w-4 h-4 text-neutral-900 dark:text-amber-400" />,
      instructions: [
        "Select 'Template: Expository', 'Textual', or 'Topical' to scaffold a new sermon or reset structural blocks.",
        "In '2. Outline', drag and drop cards to reorder points, indent/outdent sub-points, or open the 'AI Outliner' drawer for passage-based homiletic generation.",
        "Switch to '3. Manuscript' (or click 'Sync Outline → Manuscript') to write your spoken pulpit prose with live word count and 130 WPM time estimates.",
      ],
      proTip:
        "Use the top 'Split Desk | KJV Focus | Editor Focus' layout toggle to expand the editor to 100% screen width while writing.",
      actionLabel: "Open 2. Outline Editor",
      onAction: () => {
        if (onOpenEditorStep) {
          onOpenEditorStep("outline");
        } else {
          onJumpToDesk();
        }
        onClose();
      },
    },
    {
      number: "05",
      title: "Deliver from the OLED Lectern Pulpit & Pair Mobile Remote",
      subtitle: "Step 4 · Full-Screen Teleprompter & PeerJS / WebRTC Smartphone Controller",
      icon: <Monitor className="w-4 h-4 text-neutral-900 dark:text-amber-400" />,
      instructions: [
        "Click '4. Pulpit' in the top bar to enter the distraction-free pure OLED black delivery view.",
        "Adjust font size (18px–38px), line spacing, Crisp White vs. Warm Amber typography, and toggle smooth Auto-Scroll or section-by-section card mode.",
        "Click 'Remote: XXXX' in the lectern header to scan the QR code with your smartphone for thumb-friendly wireless WebRTC control.",
      ],
      proTip:
        "Your phone acts as a zero-latency controller to advance sections, pause/resume auto-scroll, toggle the preaching timer, and scale font size.",
      actionLabel: "Launch Lectern Pulpit",
      onAction: () => {
        onLaunchPulpit();
        onClose();
      },
    },
    {
      number: "06",
      title: "Record Pulpit Audio & Run Post-Sermon Gemini Analysis",
      subtitle: "Step 5 · Multimodal KJV Transcription & Delivery Comparison",
      icon: <Mic className="w-4 h-4 text-neutral-900 dark:text-amber-400" />,
      instructions: [
        "Click 'Record Audio' in the Lectern Pulpit (or open '5. Audio' from the top bar) to capture live sermon audio via HTML5 MediaRecorder or upload an audio file.",
        "After preaching, click 'Transcribe & Analyze with Gemini'. Your prepared manuscript is automatically injected as contextual vocabulary ground truth.",
        "Review the KJV-accurate timestamped spoken transcript alongside the Homiletical Delivery Comparison (alignment score, delivered points, skipped points, spontaneous ad-libs, and pacing notes).",
      ],
      proTip:
        "All sermons, KJV highlights, margin notes, memory verses, and audio recordings are persisted 100% locally in IndexedDB.",
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
              Complete guide from KJV exegesis and rough-draft organization to OLED lectern
              delivery, WebRTC remote control, and post-sermon audio transcription
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
