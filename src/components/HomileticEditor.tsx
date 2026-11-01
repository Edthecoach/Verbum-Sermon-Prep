import React, { useState, useEffect } from "react";
import {
  GripVertical,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  IndentIncrease,
  IndentDecrease,
  Sparkles,
  FileText,
  ListTree,
  RefreshCw,
  Check,
  Wand2,
  ChevronRight,
  ChevronLeft,
  FolderPlus,
  Lightbulb,
  BookOpen,
  Quote,
  Flame,
  ArrowUpRight,
} from "lucide-react";
import {
  buildManuscriptFromBlocks,
  getTemplateBlocksForMode,
  type SermonDocument,
  type OutlineBlock,
  type BlockType,
  type PreachingMode,
} from "../db/db";

export type EditorSubMode = "rough_draft" | "outline" | "manuscript";

interface HomileticEditorProps {
  sermon: SermonDocument;
  allSermons: SermonDocument[];
  onSelectSermon: (id: string) => void;
  onCreateNewSermon: (templateMode?: PreachingMode) => void;
  onDeleteSermon: (id: string) => void;
  onUpdateSermon: (updated: SermonDocument) => void;
  activeEditorMode?: EditorSubMode;
  onChangeEditorMode?: (mode: EditorSubMode) => void;
  onNavigateToScriptureRef?: (ref: string) => void;
}

interface GeneratedOutlineResponse {
  title: string;
  primaryText: string;
  bigIdea: string;
  hook: string;
  context: string;
  divisions: {
    heading: string;
    scriptureRef: string;
    exposition: string;
    illustration: string;
    application: string;
    transition?: string;
  }[];
  conclusionAndCallToAction: string;
}

export interface OrganizedDraftResponse {
  titleSuggestions: {
    title: string;
    angle: string;
  }[];
  primaryTextSuggestion: string;
  organizedBigIdea: string;
  thoughtSynthesis: string;
  organizedDivisions: {
    heading: string;
    scriptureRef: string;
    exposition: string;
    application: string;
  }[];
  illustrations: {
    title: string;
    category: string;
    narrative: string;
  }[];
  additionalScriptures: {
    ref: string;
    kjvText: string;
    homileticConnection: string;
  }[];
  closingPrayers: {
    title: string;
    tone: string;
    prayerText: string;
  }[];
}

const BLOCK_TYPE_LABELS: Record<BlockType, string> = {
  hook: "Homiletical Hook",
  context: "Exegetical Context",
  big_idea: "Big Idea Proposition",
  division: "Main Division",
  subpoint: "Sub-Point / Deduction",
  scripture: "Scripture Card (KJV)",
  illustration: "Illustration",
  application: "Pastoral Application",
  conclusion: "Conclusion & Call to Action",
  closing_prayer: "Closing Pastoral Prayer",
};

const TEMPLATE_STYLE_DESCRIPTIONS: Record<PreachingMode, string> = {
  Expository:
    "Sequential passage breakdown, exegetical insights, Big Idea, verse divisions & application",
  Textual:
    "Anchor verse header, clause-by-clause divisions & theological deductions per clause",
  Topical:
    "Core doctrinal proposition, multi-testament KJV citations, argument steps & transitions",
};

const SAMPLE_ROUGH_DRAFTS: { label: string; primaryText: string; draft: string }[] = [
  {
    label: "Weary Believers in Trial (Rom 8:28)",
    primaryText: "Romans 8:28–39",
    draft: `Sermon Ideas / Rough Notes:
- Text: Romans 8:28-39. Many in the congregation are walking through heavy trials, sickness, and uncertainty right now.
- Need to emphasize that "all things work together for good" is not shallow worldly optimism—it is anchored in God's sovereign purpose and foreknowledge.
- Connect with Joseph in Genesis 50:20 ("ye thought evil against me; but God meant it unto good").
- Show the 5-link golden chain in vv. 29-30: foreknew, predestinated, called, justified, glorified. Why is "glorified" already in the past tense? Because God's promise cannot fail.
- Walk through the courtroom questions in vv. 31-35: If God spared not His own Son at Calvary, how will He withhold anything we need in our trials?
- Need a strong closing pastoral prayer of comfort and assurance for weary believers.`,
  },
  {
    label: "The Shepherd's Care (Psalm 23)",
    primaryText: "Psalms 23:1–6",
    draft: `Rough Sermon Thoughts on Psalm 23:
- People today are anxious, spiritually exhausted, and restless. David starts with "The LORD is my shepherd; I shall not want."
- If Jehovah is our Shepherd, we lack no truly good thing. He leads us beside still waters and restores the soul when we wander.
- Notice the shift in pronouns in verse 4! In verses 1-3 David talks ABOUT the Lord ("He maketh me... He leadeth me"), but in the valley of the shadow of death in verse 4, David talks TO the Lord ("for thou art with me"). Intimacy deepens in the dark valley.
- The table prepared in the presence of enemies—grace under pressure.
- Goodness and mercy following us all the days of our life, and dwelling in the house of the Lord for ever.`,
  },
  {
    label: "By Grace Through Faith (Eph 2:1-10)",
    primaryText: "Ephesians 2:1–10",
    draft: `Rough Draft Ideas on Ephesians 2:1-10:
- Before we can appreciate the height of God's grace, we have to see the depth of our spiritual ruin: "dead in trespasses and sins" (vv. 1-3), not merely sick or drowning, but spiritually dead.
- The two greatest words in the Bible in verse 4: "But God, who is rich in mercy, for his great love wherewith he loved us..."
- Quickened together with Christ, raised up, seated in heavenly places.
- Saved by grace through faith—not of works, lest any man should boast (vv. 8-9). Yet true saving faith always produces the fruit of good works because we are His workmanship (v. 10).`,
  },
];

export const HomileticEditor: React.FC<HomileticEditorProps> = ({
  sermon,
  allSermons,
  onSelectSermon,
  onCreateNewSermon,
  onDeleteSermon,
  onUpdateSermon,
  activeEditorMode,
  onChangeEditorMode,
  onNavigateToScriptureRef,
}) => {
  const [internalEditorMode, setInternalEditorMode] =
    useState<EditorSubMode>("outline");

  const editorMode = activeEditorMode || internalEditorMode;
  const setEditorMode = (nextMode: EditorSubMode) => {
    setInternalEditorMode(nextMode);
    if (onChangeEditorMode) {
      onChangeEditorMode(nextMode);
    }
  };

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [isAiSidebarOpen, setIsAiSidebarOpen] = useState<boolean>(false);
  const [selectedTemplateStyle, setSelectedTemplateStyle] =
    useState<PreachingMode>(sermon.preachingMode || "Expository");

  // Gemini Homiletic Assistant Sidebar State
  const [aiInputPassage, setAiInputPassage] = useState<string>(
    sermon.primaryText || "Ephesians 2:1–10"
  );
  const [aiPreachingMode, setAiPreachingMode] = useState<PreachingMode>(
    sermon.preachingMode || "Expository"
  );
  const [aiFocusNotes, setAiFocusNotes] = useState<string>("");
  const [isGeneratingOutline, setIsGeneratingOutline] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [generatedOutline, setGeneratedOutline] =
    useState<GeneratedOutlineResponse | null>(null);
  const [appliedSuccess, setAppliedSuccess] = useState<boolean>(false);

  // Rough Draft & Thought Organizer State
  const [isOrganizingDraft, setIsOrganizingDraft] = useState<boolean>(false);
  const [organizeError, setOrganizeError] = useState<string | null>(null);
  const [organizedResult, setOrganizedResult] =
    useState<OrganizedDraftResponse | null>(null);
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  // Keep local AI & template controls synchronized when user switches active sermon
  useEffect(() => {
    setAiInputPassage(sermon.primaryText || "Romans 8:28–39");
    setAiPreachingMode(sermon.preachingMode || "Expository");
    setSelectedTemplateStyle(sermon.preachingMode || "Expository");
    setAiError(null);
    setOrganizeError(null);
  }, [sermon.id]);

  const triggerToast = (msg: string) => {
    setFeedbackToast(msg);
    setTimeout(() => setFeedbackToast(null), 2600);
  };

  // Word count and estimated delivery duration (130 words per minute pulpit cadence)
  const wordCount = sermon.manuscript
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
  const estimatedMinutes = Math.max(1, Math.round(wordCount / 130));

  const updateField = <K extends keyof SermonDocument>(
    key: K,
    value: SermonDocument[K]
  ) => {
    onUpdateSermon({
      ...sermon,
      [key]: value,
      updatedAt: Date.now(),
    });
  };

  // Built-in Template Scaffolding Generator for current sermon
  const applyTemplateScaffold = (mode: PreachingMode) => {
    const ref = sermon.primaryText || "Romans 8:28–30";
    const { bigIdea: defaultBigIdea, blocks: templateBlocks } =
      getTemplateBlocksForMode(mode, ref);
    const nextBigIdea = sermon.bigIdea || defaultBigIdea;

    const syncedManuscript = buildManuscriptFromBlocks(
      sermon.title,
      ref,
      nextBigIdea,
      templateBlocks
    );

    onUpdateSermon({
      ...sermon,
      preachingMode: mode,
      bigIdea: nextBigIdea,
      blocks: templateBlocks,
      manuscript: syncedManuscript,
      updatedAt: Date.now(),
    });
    triggerToast(`Applied ${mode} structural blocks to sermon.`);
  };

  // Block operations
  const handleUpdateBlock = (index: number, patch: Partial<OutlineBlock>) => {
    const nextBlocks = [...sermon.blocks];
    nextBlocks[index] = { ...nextBlocks[index], ...patch };
    updateField("blocks", nextBlocks);
  };

  const handleAddBlock = (afterIndex?: number, type: BlockType = "division") => {
    const newBlock: OutlineBlock = {
      id: `blk-${Date.now()}`,
      type,
      heading: BLOCK_TYPE_LABELS[type],
      content: "",
      scriptureRef: sermon.primaryText,
      indent:
        type === "subpoint" || type === "illustration" || type === "application"
          ? 1
          : 0,
    };
    const nextBlocks = [...sermon.blocks];
    if (afterIndex !== undefined) {
      nextBlocks.splice(afterIndex + 1, 0, newBlock);
    } else {
      nextBlocks.push(newBlock);
    }
    updateField("blocks", nextBlocks);
  };

  const handleDeleteBlock = (index: number) => {
    const nextBlocks = sermon.blocks.filter((_, i) => i !== index);
    updateField("blocks", nextBlocks);
  };

  const handleMoveBlock = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= sermon.blocks.length) return;
    const nextBlocks = [...sermon.blocks];
    const [moved] = nextBlocks.splice(index, 1);
    nextBlocks.splice(target, 0, moved);
    updateField("blocks", nextBlocks);
  };

  const handleIndentBlock = (index: number, delta: -1 | 1) => {
    const current = sermon.blocks[index].indent;
    const nextIndent = Math.max(0, Math.min(2, current + delta)) as 0 | 1 | 2;
    handleUpdateBlock(index, { indent: nextIndent });
  };

  // Drag and drop handlers
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    const nextBlocks = [...sermon.blocks];
    const [draggedItem] = nextBlocks.splice(draggedIndex, 1);
    nextBlocks.splice(index, 0, draggedItem);
    setDraggedIndex(index);
    updateField("blocks", nextBlocks);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleSyncOutlineToManuscript = () => {
    const generated = buildManuscriptFromBlocks(
      sermon.title,
      sermon.primaryText,
      sermon.bigIdea,
      sermon.blocks
    );
    updateField("manuscript", generated);
    setEditorMode("manuscript");
    triggerToast("Compiled Outline blocks into full Manuscript.");
  };

  // Gemini Rough Draft & Thought Organizer API Call
  const handleOrganizeRoughDraft = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const draftText = (sermon.roughDraft || "").trim();
    if (!draftText) {
      setOrganizeError(
        "Please type or paste your sermon ideas rough draft first."
      );
      return;
    }

    setIsOrganizingDraft(true);
    setOrganizeError(null);

    try {
      const response = await fetch("/api/gemini/organize-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roughDraft: draftText,
          primaryText: sermon.primaryText,
          preachingMode: sermon.preachingMode,
          currentTitle: sermon.title,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to organize sermon draft.");
      }

      setOrganizedResult(data);
    } catch (err: any) {
      setOrganizeError(
        err.message || "Error contacting Gemini Thought Organizer."
      );
    } finally {
      setIsOrganizingDraft(false);
    }
  };

  // Granular 1-Click Actions from Organized Draft
  const handleApplyTitleSuggestion = (title: string) => {
    const nextPrimaryText =
      organizedResult?.primaryTextSuggestion || sermon.primaryText;
    const nextManuscript = buildManuscriptFromBlocks(
      title,
      nextPrimaryText,
      sermon.bigIdea,
      sermon.blocks
    );
    onUpdateSermon({
      ...sermon,
      title,
      primaryText: nextPrimaryText,
      manuscript: nextManuscript,
      updatedAt: Date.now(),
    });
    triggerToast(`Applied sermon title: "${title}"`);
  };

  const handleApplyBigIdeaSuggestion = (bigIdea: string) => {
    const nextManuscript = buildManuscriptFromBlocks(
      sermon.title,
      sermon.primaryText,
      bigIdea,
      sermon.blocks
    );
    onUpdateSermon({
      ...sermon,
      bigIdea,
      manuscript: nextManuscript,
      updatedAt: Date.now(),
    });
    triggerToast("Updated Homiletical Big Idea!");
  };

  const handleInsertSingleIllustration = (ill: {
    title: string;
    category: string;
    narrative: string;
  }) => {
    const newBlock: OutlineBlock = {
      id: `org-ill-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type: "illustration",
      heading: `Illustration — ${ill.title} (${ill.category})`,
      content: ill.narrative,
      indent: 1,
    };
    const nextBlocks = [...sermon.blocks, newBlock];
    const nextManuscript =
      sermon.manuscript.trim() +
      `\n\nILLUSTRATION: ${ill.title.toUpperCase()} (${ill.category})\n${ill.narrative}\n`;
    onUpdateSermon({
      ...sermon,
      blocks: nextBlocks,
      manuscript: nextManuscript,
      updatedAt: Date.now(),
    });
    triggerToast(`Inserted illustration: "${ill.title}"`);
  };

  const handleInsertAdditionalScripture = (scr: {
    ref: string;
    kjvText: string;
    homileticConnection: string;
  }) => {
    const newBlock: OutlineBlock = {
      id: `org-scr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type: "scripture",
      heading: `Scripture Card — ${scr.ref} (KJV)`,
      content: `"${scr.kjvText}" — ${scr.ref} (KJV)\nConnection: ${scr.homileticConnection}`,
      scriptureRef: scr.ref,
      indent: 1,
    };
    const nextBlocks = [...sermon.blocks, newBlock];
    const nextManuscript =
      sermon.manuscript.trim() +
      `\n\n[${scr.ref} — KJV]\n"${scr.kjvText}"\n(${scr.homileticConnection})\n`;
    onUpdateSermon({
      ...sermon,
      blocks: nextBlocks,
      manuscript: nextManuscript,
      updatedAt: Date.now(),
    });
    triggerToast(`Inserted KJV Scripture Card: ${scr.ref}`);
  };

  const handleInsertClosingPrayer = (prayer: {
    title: string;
    tone: string;
    prayerText: string;
  }) => {
    const newBlock: OutlineBlock = {
      id: `org-prayer-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type: "closing_prayer",
      heading: `Closing Pastoral Prayer — ${prayer.title}`,
      content: prayer.prayerText,
      scriptureRef: sermon.primaryText,
      indent: 0,
    };
    const nextBlocks = [...sermon.blocks, newBlock];
    const nextManuscript =
      sermon.manuscript.trim() +
      `\n\nCLOSING PASTORAL PRAYER: ${prayer.title.toUpperCase()} (${prayer.tone})\n${prayer.prayerText}\n`;
    onUpdateSermon({
      ...sermon,
      blocks: nextBlocks,
      manuscript: nextManuscript,
      updatedAt: Date.now(),
    });
    triggerToast(`Added Closing Prayer: "${prayer.title}"`);
  };

  const handleApplyFullOrganizedPackage = () => {
    if (!organizedResult) return;
    const now = Date.now();
    const chosenTitle =
      organizedResult.titleSuggestions[0]?.title || sermon.title;
    const chosenPrimaryText =
      organizedResult.primaryTextSuggestion || sermon.primaryText;
    const chosenBigIdea =
      organizedResult.organizedBigIdea || sermon.bigIdea;

    const newBlocks: OutlineBlock[] = [
      {
        id: `pkg-ctx-${now}`,
        type: "context",
        heading: "Homiletical Synthesis & Movement",
        content: organizedResult.thoughtSynthesis,
        scriptureRef: chosenPrimaryText,
        indent: 0,
      },
      {
        id: `pkg-big-${now + 1}`,
        type: "big_idea",
        heading: "Central Homiletical Proposition",
        content: chosenBigIdea,
        scriptureRef: chosenPrimaryText,
        indent: 0,
      },
    ];

    organizedResult.organizedDivisions.forEach((div, idx) => {
      newBlocks.push({
        id: `pkg-div-${now}-${idx}`,
        type: "division",
        heading: div.heading,
        content: div.exposition,
        scriptureRef: div.scriptureRef,
        indent: 0,
      });

      if (organizedResult.illustrations[idx]) {
        const ill = organizedResult.illustrations[idx];
        newBlocks.push({
          id: `pkg-ill-${now}-${idx}`,
          type: "illustration",
          heading: `Illustration — ${ill.title} (${ill.category})`,
          content: ill.narrative,
          indent: 1,
        });
      }

      if (organizedResult.additionalScriptures[idx]) {
        const scr = organizedResult.additionalScriptures[idx];
        newBlocks.push({
          id: `pkg-scr-${now}-${idx}`,
          type: "scripture",
          heading: `Supporting KJV Reference — ${scr.ref}`,
          content: `"${scr.kjvText}" — ${scr.ref} (KJV)\n${scr.homileticConnection}`,
          scriptureRef: scr.ref,
          indent: 1,
        });
      }

      if (div.application) {
        newBlocks.push({
          id: `pkg-app-${now}-${idx}`,
          type: "application",
          heading: `Congregational Application (${div.heading})`,
          content: div.application,
          scriptureRef: div.scriptureRef,
          indent: 1,
        });
      }
    });

    if (
      organizedResult.additionalScriptures.length >
      organizedResult.organizedDivisions.length
    ) {
      organizedResult.additionalScriptures
        .slice(organizedResult.organizedDivisions.length)
        .forEach((scr, extraIdx) => {
          newBlocks.push({
            id: `pkg-scr-extra-${now}-${extraIdx}`,
            type: "scripture",
            heading: `Supporting KJV Reference — ${scr.ref}`,
            content: `"${scr.kjvText}" — ${scr.ref} (KJV)\n${scr.homileticConnection}`,
            scriptureRef: scr.ref,
            indent: 1,
          });
        });
    }

    if (organizedResult.closingPrayers[0]) {
      const prayer = organizedResult.closingPrayers[0];
      newBlocks.push({
        id: `pkg-prayer-${now + 99}`,
        type: "closing_prayer",
        heading: `Closing Pastoral Prayer — ${prayer.title}`,
        content: prayer.prayerText,
        scriptureRef: chosenPrimaryText,
        indent: 0,
      });
    }

    const nextManuscript = buildManuscriptFromBlocks(
      chosenTitle,
      chosenPrimaryText,
      chosenBigIdea,
      newBlocks
    );

    onUpdateSermon({
      ...sermon,
      title: chosenTitle,
      primaryText: chosenPrimaryText,
      bigIdea: chosenBigIdea,
      blocks: newBlocks,
      manuscript: nextManuscript,
      updatedAt: Date.now(),
    });

    triggerToast(
      "Complete organized sermon (Title, Divisions, Illustrations, Scriptures & Closing Prayer) applied!"
    );
    setEditorMode("outline");
  };

  // Gemini Homiletic Assistant API Call
  const handleGenerateAiOutline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiInputPassage.trim()) return;

    setIsGeneratingOutline(true);
    setAiError(null);
    setAppliedSuccess(false);

    try {
      const response = await fetch("/api/gemini/outline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          passageOrTopic: aiInputPassage.trim(),
          mode: aiPreachingMode,
          additionalNotes: aiFocusNotes.trim(),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to generate outline.");
      }

      setGeneratedOutline(data);
    } catch (err: any) {
      setAiError(err.message || "Error contacting Gemini Homiletic Assistant.");
    } finally {
      setIsGeneratingOutline(false);
    }
  };

  const handleApplyAiOutlineToEditor = () => {
    if (!generatedOutline) return;

    const newBlocks: OutlineBlock[] = [
      {
        id: `ai-hook-${Date.now()}`,
        type: "hook",
        heading: "Introduction & Homiletical Hook",
        content: generatedOutline.hook,
        scriptureRef: generatedOutline.primaryText,
        indent: 0,
      },
      {
        id: `ai-ctx-${Date.now() + 1}`,
        type: "context",
        heading: "Exegetical & Historical Context",
        content: generatedOutline.context,
        scriptureRef: generatedOutline.primaryText,
        indent: 0,
      },
    ];

    generatedOutline.divisions.forEach((div, idx) => {
      newBlocks.push({
        id: `ai-div-${Date.now()}-${idx}`,
        type: "division",
        heading: div.heading,
        content:
          div.exposition +
          (div.transition ? `\n\nTransition: ${div.transition}` : ""),
        scriptureRef: div.scriptureRef,
        indent: 0,
      });

      if (div.illustration) {
        newBlocks.push({
          id: `ai-ill-${Date.now()}-${idx}`,
          type: "illustration",
          heading: `Illustration (${div.heading})`,
          content: div.illustration,
          indent: 1,
        });
      }

      if (div.application) {
        newBlocks.push({
          id: `ai-app-${Date.now()}-${idx}`,
          type: "application",
          heading: `Congregational Application (${div.heading})`,
          content: div.application,
          scriptureRef: div.scriptureRef,
          indent: 1,
        });
      }
    });

    newBlocks.push({
      id: `ai-conc-${Date.now() + 99}`,
      type: "conclusion",
      heading: "Conclusion & Call to Action",
      content: generatedOutline.conclusionAndCallToAction,
      scriptureRef: generatedOutline.primaryText,
      indent: 0,
    });

    const nextTitle = generatedOutline.title || sermon.title;
    const nextPrimaryText = generatedOutline.primaryText || aiInputPassage;
    const nextBigIdea = generatedOutline.bigIdea || sermon.bigIdea;
    const nextManuscript = buildManuscriptFromBlocks(
      nextTitle,
      nextPrimaryText,
      nextBigIdea,
      newBlocks
    );

    onUpdateSermon({
      ...sermon,
      title: nextTitle,
      primaryText: nextPrimaryText,
      preachingMode: aiPreachingMode,
      bigIdea: nextBigIdea,
      blocks: newBlocks,
      manuscript: nextManuscript,
      updatedAt: Date.now(),
    });

    setAppliedSuccess(true);
    triggerToast("Applied AI Outline to Editor & Manuscript!");
    setTimeout(() => setAppliedSuccess(false), 2500);
  };

  return (
    <section
      aria-label="Homiletic Editor & Gemini Assistant"
      className="flex flex-col h-full bg-white dark:bg-black overflow-hidden transition-colors"
    >
      {/* Top Sermon Document Bar & Mode Switcher */}
      <div className="p-3.5 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/60 dark:bg-neutral-950 space-y-2.5">
        {/* Row 1: Sermon Switcher, New Template Sermon, Mode Tabs & AI Outliner Toggle */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <select
              aria-label="Select Active Sermon"
              value={sermon.id}
              onChange={(e) => onSelectSermon(e.target.value)}
              className="h-8 px-2.5 text-xs font-semibold bg-white dark:bg-black border border-neutral-300 dark:border-neutral-800 rounded text-neutral-900 dark:text-white focus:outline-none focus:border-neutral-900 dark:focus:border-amber-400 max-w-[200px] truncate"
            >
              {allSermons.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title || "Untitled Sermon"} ({s.primaryText})
                </option>
              ))}
            </select>

            {/* Template Selection Dropdown + Quick Initialize New Sermon */}
            <div className="flex items-center bg-white dark:bg-black border border-neutral-300 dark:border-neutral-800 rounded overflow-hidden">
              <select
                aria-label="Select Sermon Template Style"
                value={selectedTemplateStyle}
                onChange={(e) => {
                  const chosen = e.target.value as PreachingMode;
                  setSelectedTemplateStyle(chosen);
                }}
                title={TEMPLATE_STYLE_DESCRIPTIONS[selectedTemplateStyle]}
                className="h-8 px-2 text-xs font-medium bg-white dark:bg-black text-neutral-800 dark:text-neutral-200 border-r border-neutral-300 dark:border-neutral-800 focus:outline-none cursor-pointer"
              >
                <option value="Expository">Expository</option>
                <option value="Textual">Textual</option>
                <option value="Topical">Topical</option>
              </select>

              <button
                type="button"
                onClick={() => onCreateNewSermon(selectedTemplateStyle)}
                title={`Initialize a new ${selectedTemplateStyle} sermon with pre-filled structural blocks`}
                className="h-8 px-2.5 text-xs font-semibold bg-neutral-900 dark:bg-amber-400 text-white dark:text-black hover:bg-neutral-800 dark:hover:bg-amber-300 transition-colors flex items-center gap-1 whitespace-nowrap shrink-0"
              >
                <FolderPlus className="w-3.5 h-3.5" />
                <span>+ New</span>
              </button>
            </div>

            {allSermons.length > 1 && (
              <button
                type="button"
                onClick={() => onDeleteSermon(sermon.id)}
                title="Delete current sermon"
                className="h-8 px-2 text-xs text-neutral-500 dark:text-neutral-400 hover:text-rose-600 border border-transparent hover:border-neutral-200 dark:hover:border-neutral-800 rounded transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Step-by-Step Editor Mode Switcher: 1. Rough Draft -> 2. Outline -> 3. Manuscript */}
            <div className="flex items-center gap-0.5 bg-neutral-200/80 dark:bg-neutral-900 p-0.5 rounded border border-neutral-300 dark:border-neutral-800">
              <button
                type="button"
                onClick={() => setEditorMode("rough_draft")}
                className={`px-2.5 py-1 text-xs font-medium rounded transition-colors flex items-center gap-1 whitespace-nowrap shrink-0 ${
                  editorMode === "rough_draft"
                    ? "bg-white dark:bg-neutral-800 text-neutral-900 dark:text-amber-400 shadow-xs font-semibold"
                    : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                }`}
              >
                <Lightbulb className="w-3.5 h-3.5" />
                <span>1. Rough Draft Organizer</span>
              </button>
              <button
                type="button"
                onClick={() => setEditorMode("outline")}
                className={`px-2.5 py-1 text-xs font-medium rounded transition-colors flex items-center gap-1 whitespace-nowrap shrink-0 ${
                  editorMode === "outline"
                    ? "bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-xs font-semibold"
                    : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                }`}
              >
                <ListTree className="w-3.5 h-3.5" />
                <span>2. Outline ({sermon.blocks.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setEditorMode("manuscript")}
                className={`px-2.5 py-1 text-xs font-medium rounded transition-colors flex items-center gap-1 whitespace-nowrap shrink-0 ${
                  editorMode === "manuscript"
                    ? "bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-xs font-semibold"
                    : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>3. Manuscript ({wordCount}w)</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setIsAiSidebarOpen((prev) => !prev)}
              className={`h-8 px-2.5 text-xs font-medium rounded border transition-colors flex items-center gap-1 whitespace-nowrap shrink-0 ${
                isAiSidebarOpen
                  ? "bg-neutral-900 dark:bg-amber-400 text-white dark:text-black border-neutral-900 dark:border-amber-400"
                  : "bg-white dark:bg-black text-neutral-800 dark:text-neutral-200 border-neutral-300 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-900"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Outliner</span>
              {isAiSidebarOpen ? (
                <ChevronRight className="w-3.5 h-3.5" />
              ) : (
                <ChevronLeft className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>

        {/* Row 2: Sermon Title & Primary Text Inputs (+ Quick Jump to KJV Reader) */}
        <div className="grid grid-cols-12 gap-2">
          <div className="col-span-7 sm:col-span-8">
            <input
              type="text"
              value={sermon.title}
              onChange={(e) => updateField("title", e.target.value)}
              placeholder="Sermon Title..."
              className="w-full h-8 px-3 text-xs sm:text-sm font-bold bg-white dark:bg-black border border-neutral-300 dark:border-neutral-800 rounded text-neutral-900 dark:text-white focus:outline-none focus:border-neutral-900 dark:focus:border-amber-400"
            />
          </div>
          <div className="col-span-5 sm:col-span-4 flex items-center gap-1">
            <input
              type="text"
              value={sermon.primaryText}
              onChange={(e) => updateField("primaryText", e.target.value)}
              placeholder="Primary Text (e.g. Romans 8:28-39)"
              className="w-full h-8 px-2.5 text-xs font-mono-tabular font-semibold bg-white dark:bg-black border border-neutral-300 dark:border-neutral-800 rounded text-neutral-900 dark:text-amber-400 focus:outline-none focus:border-neutral-900 dark:focus:border-amber-400"
            />
            {onNavigateToScriptureRef && sermon.primaryText && (
              <button
                type="button"
                onClick={() => onNavigateToScriptureRef(sermon.primaryText)}
                title={`Jump KJV Reader to ${sermon.primaryText}`}
                className="h-8 px-2 text-[11px] font-medium bg-white dark:bg-black border border-neutral-300 dark:border-neutral-800 rounded text-neutral-700 dark:text-amber-400 hover:bg-neutral-100 dark:hover:bg-neutral-900 shrink-0 flex items-center gap-0.5"
              >
                <span>Read</span>
                <ArrowUpRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Row 3: Active Sermon Scaffolding Controls & Delivery Metrics */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1 flex-wrap">
            <span className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400 mr-1">
              Scaffold Blocks:
            </span>
            {(["Expository", "Textual", "Topical"] as PreachingMode[]).map(
              (mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => applyTemplateScaffold(mode)}
                  title={TEMPLATE_STYLE_DESCRIPTIONS[mode]}
                  className={`px-2 py-0.5 text-[11px] font-medium rounded border transition-colors whitespace-nowrap shrink-0 ${
                    sermon.preachingMode === mode
                      ? "bg-neutral-900 dark:bg-white text-white dark:text-black border-neutral-900 dark:border-white"
                      : "bg-white dark:bg-black text-neutral-700 dark:text-neutral-300 border-neutral-300 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-900"
                  }`}
                >
                  {mode}
                </button>
              )
            )}
          </div>

          <div className="flex items-center gap-2 text-[11px] text-neutral-500 dark:text-neutral-400 font-mono-tabular">
            <span>{sermon.preachingMode}</span>
            <span aria-hidden="true">·</span>
            <span>{wordCount} words</span>
            <span aria-hidden="true">·</span>
            <span>~{estimatedMinutes} min pulpit delivery</span>
          </div>
        </div>
      </div>

      {/* Toast Notification Banner */}
      {feedbackToast && (
        <div className="px-4 py-2 bg-emerald-700 text-white text-xs font-medium flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Check className="w-3.5 h-3.5 shrink-0" />
            <span>{feedbackToast}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackToast(null)}
            className="text-[11px] underline opacity-90 hover:opacity-100"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Split Workspace: Editor Area + Toggleable Gemini Homiletic Assistant Sidebar */}
      <div className="flex-1 flex min-h-0 overflow-hidden bg-white dark:bg-black">
        {/* Main Editor Column */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto p-5 space-y-4">
          {/* Homiletical Big Idea Banner */}
          <div className="p-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold text-neutral-600 dark:text-amber-400">
                Homiletical &ldquo;Big Idea&rdquo; / Central Doctrinal Proposition (
                {sermon.preachingMode})
              </label>
              {editorMode === "outline" && (
                <button
                  type="button"
                  onClick={handleSyncOutlineToManuscript}
                  className="text-[11px] font-medium text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white flex items-center gap-1 underline whitespace-nowrap shrink-0"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Compile Outline into Manuscript →</span>
                </button>
              )}
            </div>
            <textarea
              rows={2}
              value={sermon.bigIdea}
              onChange={(e) => updateField("bigIdea", e.target.value)}
              placeholder="State the central homiletical proposition in one clear, memorable sentence..."
              className="w-full text-xs leading-relaxed bg-white dark:bg-black border border-neutral-300 dark:border-neutral-800 rounded p-2 text-neutral-900 dark:text-white focus:outline-none focus:border-neutral-900 dark:focus:border-amber-400 resize-none"
            />
          </div>

          {editorMode === "rough_draft" ? (
            /* 1. ROUGH DRAFT & THOUGHT ORGANIZER MODE */
            <div className="space-y-5">
              {/* Scratchpad Input Card */}
              <div className="p-4 bg-neutral-50/70 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-xs font-bold text-neutral-900 dark:text-white flex items-center gap-1.5">
                      <Lightbulb className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      <span>
                        Step 1: Sermon Ideas Rough Draft &amp; Thought Organizer
                      </span>
                    </h3>
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                      Type your unstructured sermon ideas, themes, or verse
                      notes below. Gemini will organize your thoughts into{" "}
                      <strong className="text-neutral-800 dark:text-neutral-200">
                        title suggestions, structured divisions, illustrations,
                        additional KJV scriptures, and closing prayers
                      </strong>
                      .
                    </p>
                  </div>

                  {/* Quick Sample Draft Loaders */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
                      Sample Notes:
                    </span>
                    {SAMPLE_ROUGH_DRAFTS.map((sample) => (
                      <button
                        key={sample.label}
                        type="button"
                        onClick={() => {
                          onUpdateSermon({
                            ...sermon,
                            primaryText: sample.primaryText,
                            roughDraft: sample.draft,
                            updatedAt: Date.now(),
                          });
                        }}
                        className="px-2 py-1 text-[11px] font-medium bg-white dark:bg-black border border-neutral-300 dark:border-neutral-800 rounded text-neutral-700 dark:text-neutral-300 hover:border-neutral-900 dark:hover:border-amber-400 transition-colors"
                      >
                        {sample.label}
                      </button>
                    ))}
                  </div>
                </div>

                <textarea
                  rows={7}
                  value={sermon.roughDraft || ""}
                  onChange={(e) => updateField("roughDraft", e.target.value)}
                  placeholder="Type your raw sermon ideas, burdens for the congregation, key verses, fragments, or rough points here..."
                  className="w-full p-3 text-xs leading-relaxed bg-white dark:bg-black border border-neutral-300 dark:border-neutral-800 rounded text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-neutral-900 dark:focus:border-amber-400 resize-y"
                />

                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-[11px] text-neutral-500 dark:text-neutral-400">
                    <span>Auto-saved to local sermon notebook</span>
                    <span aria-hidden="true">·</span>
                    <span>
                      {(sermon.roughDraft || "")
                        .trim()
                        .split(/\s+/)
                        .filter(Boolean).length}{" "}
                      words in rough draft
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {sermon.roughDraft && (
                      <button
                        type="button"
                        onClick={() => updateField("roughDraft", "")}
                        className="h-9 px-3 text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white border border-neutral-300 dark:border-neutral-800 rounded transition-colors"
                      >
                        Clear Notes
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleOrganizeRoughDraft()}
                      disabled={isOrganizingDraft}
                      className="h-9 px-4 text-xs font-semibold bg-neutral-900 dark:bg-amber-400 text-white dark:text-black rounded hover:bg-neutral-800 dark:hover:bg-amber-300 disabled:opacity-50 transition-colors flex items-center gap-2 whitespace-nowrap"
                    >
                      <Wand2 className="w-3.5 h-3.5" />
                      <span>
                        {isOrganizingDraft
                          ? "Organizing Thoughts, Titles, Scriptures & Prayers..."
                          : "Organize My Thoughts (Titles, Illustrations, Scriptures & Prayers)"}
                      </span>
                    </button>
                  </div>
                </div>

                {organizeError && (
                  <div className="p-2.5 text-xs bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 rounded">
                    {organizeError}
                  </div>
                )}
              </div>

              {/* Loading Skeleton */}
              {isOrganizingDraft && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border border-neutral-200 dark:border-neutral-800 rounded space-y-2 animate-pulse">
                    <div className="h-4 bg-neutral-200 dark:bg-neutral-800 rounded w-1/2" />
                    <div className="h-16 bg-neutral-200 dark:bg-neutral-800 rounded w-full" />
                    <div className="h-16 bg-neutral-200 dark:bg-neutral-800 rounded w-full" />
                  </div>
                  <div className="p-4 border border-neutral-200 dark:border-neutral-800 rounded space-y-2 animate-pulse">
                    <div className="h-4 bg-neutral-200 dark:bg-neutral-800 rounded w-1/2" />
                    <div className="h-16 bg-neutral-200 dark:bg-neutral-800 rounded w-full" />
                    <div className="h-16 bg-neutral-200 dark:bg-neutral-800 rounded w-full" />
                  </div>
                </div>
              )}

              {/* Organized Output Workspace */}
              {organizedResult && (
                <div className="space-y-5">
                  {/* Master Apply Banner */}
                  <div className="p-4 bg-neutral-900 dark:bg-neutral-900 text-white border border-neutral-900 dark:border-amber-400/50 rounded flex flex-wrap items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <div className="text-xs font-bold text-amber-400">
                        Organized Homiletic Package Ready
                      </div>
                      <p className="text-xs text-neutral-300">
                        Click individual items below to insert them selectively,
                        or apply the entire organized package to your sermon
                        outline and manuscript at once.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleApplyFullOrganizedPackage}
                      className="h-9 px-4 text-xs font-semibold bg-amber-400 text-black hover:bg-amber-300 rounded transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
                    >
                      <Check className="w-4 h-4" />
                      <span>Apply Complete Package to Sermon</span>
                    </button>
                  </div>

                  {/* 1. Title Suggestions & Thought Synthesis */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                    {/* Title Suggestions */}
                    <div className="lg:col-span-6 p-4 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-neutral-900 dark:text-white">
                          1. Sermon Title Suggestions
                        </h4>
                        <span className="text-[11px] font-mono-tabular text-neutral-500 dark:text-amber-400">
                          Anchor: {organizedResult.primaryTextSuggestion}
                        </span>
                      </div>
                      <div className="space-y-2">
                        {organizedResult.titleSuggestions.map((item, idx) => (
                          <div
                            key={idx}
                            className="p-2.5 bg-neutral-50 dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded flex items-center justify-between gap-2"
                          >
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-neutral-900 dark:text-white">
                                {item.title}
                              </div>
                              <div className="text-[11px] text-neutral-500 dark:text-neutral-400">
                                {item.angle}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                handleApplyTitleSuggestion(item.title)
                              }
                              className="px-2.5 py-1 text-[11px] font-semibold bg-neutral-900 dark:bg-amber-400 text-white dark:text-black rounded hover:bg-neutral-800 dark:hover:bg-amber-300 transition-colors whitespace-nowrap shrink-0"
                            >
                              Use Title
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Thought Synthesis & Distilled Big Idea */}
                    <div className="lg:col-span-6 p-4 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded space-y-3 flex flex-col justify-between">
                      <div className="space-y-3">
                        <h4 className="text-xs font-bold text-neutral-900 dark:text-white">
                          2. Organized Thought Flow &amp; Central Big Idea
                        </h4>
                        <div className="p-3 bg-neutral-50 dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded space-y-1">
                          <div className="text-[11px] font-semibold text-neutral-500 dark:text-amber-400">
                            How Your Rough Notes Cohere:
                          </div>
                          <p className="text-xs text-neutral-800 dark:text-neutral-200 leading-relaxed">
                            {organizedResult.thoughtSynthesis}
                          </p>
                        </div>

                        <div className="p-3 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-700/60 rounded space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[11px] font-semibold text-amber-950 dark:text-amber-300">
                              Distilled Homiletical Big Idea
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                handleApplyBigIdeaSuggestion(
                                  organizedResult.organizedBigIdea
                                )
                              }
                              className="px-2.5 py-1 text-[11px] font-semibold bg-neutral-900 dark:bg-amber-400 text-white dark:text-black rounded hover:bg-neutral-800 dark:hover:bg-amber-300 transition-colors whitespace-nowrap shrink-0"
                            >
                              Set as Big Idea
                            </button>
                          </div>
                          <p className="text-xs font-medium text-neutral-900 dark:text-white leading-relaxed">
                            {organizedResult.organizedBigIdea}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 3. Organized Main Outline Divisions */}
                  <div className="p-4 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-neutral-900 dark:text-white">
                        3. Organized Sermon Outline Divisions (Synthesized from
                        Your Draft)
                      </h4>
                      <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
                        {organizedResult.organizedDivisions.length} structured
                        movements
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {organizedResult.organizedDivisions.map((div, idx) => (
                        <div
                          key={idx}
                          className="p-3 bg-neutral-50 dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded flex flex-col justify-between space-y-2.5"
                        >
                          <div className="space-y-1.5">
                            <div className="flex items-start justify-between gap-2">
                              <span className="text-xs font-bold text-neutral-900 dark:text-white">
                                {div.heading}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  onNavigateToScriptureRef &&
                                  onNavigateToScriptureRef(div.scriptureRef)
                                }
                                className="text-[11px] font-mono-tabular text-neutral-600 dark:text-amber-400 hover:underline shrink-0"
                              >
                                {div.scriptureRef}
                              </button>
                            </div>
                            <p className="text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed">
                              {div.exposition}
                            </p>
                            <p className="text-[11px] text-neutral-600 dark:text-neutral-400 pt-1 border-t border-neutral-200 dark:border-neutral-800">
                              <strong className="text-neutral-900 dark:text-white">
                                Application:
                              </strong>{" "}
                              {div.application}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              const divBlock: OutlineBlock = {
                                id: `org-div-${Date.now()}-${idx}`,
                                type: "division",
                                heading: div.heading,
                                content: `${div.exposition}\n\nApplication: ${div.application}`,
                                scriptureRef: div.scriptureRef,
                                indent: 0,
                              };
                              updateField("blocks", [
                                ...sermon.blocks,
                                divBlock,
                              ]);
                              triggerToast(`Added division: "${div.heading}"`);
                            }}
                            className="w-full py-1.5 px-2.5 text-[11px] font-semibold bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                          >
                            + Add Division to Outline
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 4. Suggested Illustrations & 5. Additional KJV Reference Scriptures */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                    {/* Illustrations */}
                    <div className="lg:col-span-6 p-4 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded space-y-3">
                      <div className="flex items-center gap-1.5">
                        <Flame className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                        <h4 className="text-xs font-bold text-neutral-900 dark:text-white">
                          4. Suggested Sermon Illustrations
                        </h4>
                      </div>

                      <div className="space-y-2.5">
                        {organizedResult.illustrations.map((ill, idx) => (
                          <div
                            key={idx}
                            className="p-3 bg-neutral-50 dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded space-y-2"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div>
                                <span className="text-xs font-bold text-neutral-900 dark:text-white">
                                  {ill.title}
                                </span>
                                <span className="text-[11px] text-neutral-500 dark:text-amber-400 ml-2">
                                  · {ill.category}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() =>
                                  handleInsertSingleIllustration(ill)
                                }
                                className="px-2.5 py-1 text-[11px] font-semibold bg-neutral-900 dark:bg-amber-400 text-white dark:text-black rounded hover:bg-neutral-800 dark:hover:bg-amber-300 transition-colors whitespace-nowrap shrink-0"
                              >
                                + Insert Illustration
                              </button>
                            </div>
                            <p className="text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed">
                              {ill.narrative}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Additional Reference Scriptures (KJV) */}
                    <div className="lg:col-span-6 p-4 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded space-y-3">
                      <div className="flex items-center gap-1.5">
                        <BookOpen className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                        <h4 className="text-xs font-bold text-neutral-900 dark:text-white">
                          5. Additional Reference Scriptures (KJV)
                        </h4>
                      </div>

                      <div className="space-y-2.5">
                        {organizedResult.additionalScriptures.map(
                          (scr, idx) => (
                            <div
                              key={idx}
                              className="p-3 bg-amber-50/40 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-700/60 rounded space-y-1.5"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    onNavigateToScriptureRef &&
                                    onNavigateToScriptureRef(scr.ref)
                                  }
                                  className="text-xs font-mono-tabular font-bold text-neutral-900 dark:text-amber-400 hover:underline flex items-center gap-1"
                                >
                                  <span>{scr.ref} (KJV)</span>
                                  <ArrowUpRight className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleInsertAdditionalScripture(scr)
                                  }
                                  className="px-2.5 py-1 text-[11px] font-semibold bg-neutral-900 dark:bg-amber-400 text-white dark:text-black rounded hover:bg-neutral-800 dark:hover:bg-amber-300 transition-colors whitespace-nowrap shrink-0"
                                >
                                  + Insert Scripture Card
                                </button>
                              </div>
                              <p className="text-xs font-serif-kjv italic text-neutral-900 dark:text-neutral-100 leading-relaxed">
                                &ldquo;{scr.kjvText}&rdquo;
                              </p>
                              <p className="text-[11px] text-neutral-600 dark:text-neutral-400">
                                <strong>Homiletic Fit:</strong>{" "}
                                {scr.homileticConnection}
                              </p>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 6. Closing Pastoral Prayers */}
                  <div className="p-4 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Quote className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                        <h4 className="text-xs font-bold text-neutral-900 dark:text-white">
                          6. Closing Pastoral Prayers
                        </h4>
                      </div>
                      <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
                        Appends to Outline &amp; Pulpit Manuscript
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {organizedResult.closingPrayers.map((prayer, idx) => (
                        <div
                          key={idx}
                          className="p-3.5 bg-neutral-50 dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded flex flex-col justify-between space-y-3"
                        >
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-bold text-neutral-900 dark:text-white">
                                {prayer.title}
                              </span>
                              <span className="text-[11px] text-neutral-500 dark:text-amber-400">
                                {prayer.tone}
                              </span>
                            </div>
                            <p className="text-xs font-serif-kjv leading-relaxed text-neutral-800 dark:text-neutral-200 italic">
                              &ldquo;{prayer.prayerText}&rdquo;
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleInsertClosingPrayer(prayer)}
                            className="w-full py-1.5 px-3 text-xs font-semibold bg-neutral-900 dark:bg-amber-400 text-white dark:text-black rounded hover:bg-neutral-800 dark:hover:bg-amber-300 transition-colors"
                          >
                            + Add Closing Prayer to Sermon
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : editorMode === "outline" ? (
            /* 2. OUTLINE MODE: Hierarchical Drag-and-Drop Block Cards */
            <div className="space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  Step 2: Hierarchical Sermon Blocks (Drag to reorder or indent)
                </span>
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleAddBlock(undefined, "division")}
                    className="px-2.5 py-1 text-xs font-medium bg-neutral-900 dark:bg-amber-400 text-white dark:text-black rounded hover:bg-neutral-800 dark:hover:bg-amber-300 transition-colors flex items-center gap-1 whitespace-nowrap shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Division</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddBlock(undefined, "illustration")}
                    className="px-2.5 py-1 text-xs font-medium bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors whitespace-nowrap shrink-0"
                  >
                    + Illustration
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddBlock(undefined, "application")}
                    className="px-2.5 py-1 text-xs font-medium bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors whitespace-nowrap shrink-0"
                  >
                    + Application
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddBlock(undefined, "closing_prayer")}
                    className="px-2.5 py-1 text-xs font-medium bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors whitespace-nowrap shrink-0"
                  >
                    + Closing Prayer
                  </button>
                </div>
              </div>

              {sermon.blocks.map((block, index) => {
                const indentPadding =
                  block.indent === 1
                    ? "ml-6"
                    : block.indent === 2
                    ? "ml-12"
                    : "";
                const isScriptureCard = block.type === "scripture";
                const isPrayerCard = block.type === "closing_prayer";

                return (
                  <div
                    key={block.id}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                    className={`${indentPadding} p-3.5 rounded border transition-all ${
                      draggedIndex === index
                        ? "opacity-50 border-neutral-900 dark:border-amber-400 bg-neutral-100 dark:bg-neutral-900"
                        : isScriptureCard
                        ? "bg-amber-50/40 dark:bg-amber-950/20 border-amber-200 dark:border-amber-700/60"
                        : isPrayerCard
                        ? "bg-emerald-50/30 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60"
                        : "bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span
                          className="cursor-grab active:cursor-grabbing text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
                          title="Drag to reorder block"
                        >
                          <GripVertical className="w-4 h-4" />
                        </span>

                        <select
                          aria-label="Block Type"
                          value={block.type}
                          onChange={(e) =>
                            handleUpdateBlock(index, {
                              type: e.target.value as BlockType,
                            })
                          }
                          className="h-7 px-2 text-[11px] font-medium bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded text-neutral-700 dark:text-neutral-300 focus:outline-none focus:border-neutral-900 dark:focus:border-amber-400 shrink-0"
                        >
                          {Object.entries(BLOCK_TYPE_LABELS).map(
                            ([val, label]) => (
                              <option key={val} value={val}>
                                {label}
                              </option>
                            )
                          )}
                        </select>

                        <input
                          type="text"
                          value={block.heading}
                          onChange={(e) =>
                            handleUpdateBlock(index, {
                              heading: e.target.value,
                            })
                          }
                          placeholder="Section Heading..."
                          className="flex-1 text-xs font-bold text-neutral-900 dark:text-white bg-transparent border-b border-transparent focus:border-neutral-400 dark:focus:border-amber-400 focus:outline-none px-1 py-0.5"
                        />
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <input
                          type="text"
                          value={block.scriptureRef || ""}
                          onChange={(e) =>
                            handleUpdateBlock(index, {
                              scriptureRef: e.target.value,
                            })
                          }
                          placeholder="Ref (e.g. Rom 8:28)"
                          className="w-28 h-7 px-2 text-[11px] font-mono-tabular bg-neutral-50 dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded text-neutral-700 dark:text-amber-400 focus:outline-none focus:border-neutral-900 dark:focus:border-amber-400"
                        />
                        {onNavigateToScriptureRef && block.scriptureRef && (
                          <button
                            type="button"
                            onClick={() =>
                              onNavigateToScriptureRef(block.scriptureRef!)
                            }
                            title={`Open ${block.scriptureRef} in KJV Reader`}
                            className="p-1 text-neutral-400 hover:text-neutral-900 dark:hover:text-amber-400"
                          >
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleIndentBlock(index, -1)}
                          disabled={block.indent === 0}
                          title="Outdent"
                          className="p-1 text-neutral-400 hover:text-neutral-900 dark:hover:text-white disabled:opacity-30"
                        >
                          <IndentDecrease className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleIndentBlock(index, 1)}
                          disabled={block.indent === 2}
                          title="Indent"
                          className="p-1 text-neutral-400 hover:text-neutral-900 dark:hover:text-white disabled:opacity-30"
                        >
                          <IndentIncrease className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveBlock(index, -1)}
                          disabled={index === 0}
                          title="Move Up"
                          className="p-1 text-neutral-400 hover:text-neutral-900 dark:hover:text-white disabled:opacity-30"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveBlock(index, 1)}
                          disabled={index === sermon.blocks.length - 1}
                          title="Move Down"
                          className="p-1 text-neutral-400 hover:text-neutral-900 dark:hover:text-white disabled:opacity-30"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteBlock(index)}
                          title="Delete Block"
                          className="p-1 text-neutral-400 hover:text-rose-600"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <textarea
                      rows={isScriptureCard ? 2 : 3}
                      value={block.content}
                      onChange={(e) =>
                        handleUpdateBlock(index, { content: e.target.value })
                      }
                      placeholder="Write homiletical exposition, clause deductions, pastoral application, or closing prayer..."
                      className={`w-full text-xs leading-relaxed p-2 rounded border border-neutral-200 dark:border-neutral-800 focus:outline-none focus:border-neutral-900 dark:focus:border-amber-400 resize-y ${
                        isScriptureCard || isPrayerCard
                          ? "font-serif-kjv bg-white dark:bg-black text-neutral-900 dark:text-amber-300 italic"
                          : "bg-neutral-50/40 dark:bg-black text-neutral-800 dark:text-neutral-200"
                      }`}
                    />
                  </div>
                );
              })}
            </div>
          ) : (
            /* 3. MANUSCRIPT MODE: Full Pulpit Prose Editor */
            <div className="flex-1 flex flex-col space-y-2 min-h-[420px]">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-neutral-200 dark:border-neutral-800">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() =>
                      updateField(
                        "manuscript",
                        sermon.manuscript +
                          "\n\nIV. NEW HOMILETICAL DIVISION\nExposition and pastoral application..."
                      )
                    }
                    className="px-2.5 py-1 text-xs font-medium bg-neutral-100 dark:bg-neutral-900 hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200 rounded transition-colors whitespace-nowrap shrink-0"
                  >
                    + Section Heading
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      updateField(
                        "manuscript",
                        sermon.manuscript +
                          "\n\n[PASTORAL APPLICATION]: Beloved, consider how this truth confronts our hearts today..."
                      )
                    }
                    className="px-2.5 py-1 text-xs font-medium bg-neutral-100 dark:bg-neutral-900 hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200 rounded transition-colors whitespace-nowrap shrink-0"
                  >
                    + Pastoral Callout
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      updateField(
                        "manuscript",
                        sermon.manuscript +
                          "\n\nCLOSING PASTORAL PRAYER\nAlmighty and most merciful Father, seal Thy holy Word upon our hearts through Jesus Christ our Lord. Amen."
                      )
                    }
                    className="px-2.5 py-1 text-xs font-medium bg-neutral-100 dark:bg-neutral-900 hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200 rounded transition-colors whitespace-nowrap shrink-0"
                  >
                    + Closing Prayer
                  </button>
                  <button
                    type="button"
                    onClick={handleSyncOutlineToManuscript}
                    className="px-2.5 py-1 text-xs font-medium bg-neutral-900 dark:bg-amber-400 text-white dark:text-black hover:bg-neutral-800 dark:hover:bg-amber-300 rounded transition-colors flex items-center gap-1 whitespace-nowrap shrink-0"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Rebuild from Outline Blocks</span>
                  </button>
                </div>

                <span className="text-xs text-neutral-500 dark:text-neutral-400">
                  Ground truth for Pulpit Teleprompter &amp; Gemini Audio Analysis
                </span>
              </div>

              <textarea
                value={sermon.manuscript}
                onChange={(e) => updateField("manuscript", e.target.value)}
                placeholder="Draft your full pulpit sermon manuscript here..."
                className="flex-1 w-full p-4 text-[15px] font-serif-kjv leading-relaxed bg-neutral-50/30 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-800 rounded text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-neutral-900 dark:focus:border-amber-400 resize-none min-h-[380px]"
              />
            </div>
          )}
        </div>

        {/* Gemini Homiletic Assistant Sidebar */}
        {isAiSidebarOpen && (
          <aside
            aria-label="Gemini Homiletic Assistant"
            className="w-[330px] xl:w-[360px] border-l border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-950 flex flex-col shrink-0 overflow-y-auto"
          >
            <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-black">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-neutral-900 dark:text-amber-400" />
                  <h3 className="text-xs font-bold tracking-tight text-neutral-900 dark:text-white">
                    Gemini Homiletic Assistant
                  </h3>
                </div>
                <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
                  KJV Outliner
                </span>
              </div>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1 leading-normal">
                Generate a structured Expository, Textual, or Topical sermon
                outline from a passage, or use{" "}
                <button
                  type="button"
                  onClick={() => setEditorMode("rough_draft")}
                  className="underline font-semibold text-neutral-900 dark:text-amber-400"
                >
                  1. Rough Draft Organizer
                </button>{" "}
                to organize your own sermon notes.
              </p>
            </div>

            <form
              onSubmit={handleGenerateAiOutline}
              className="p-4 space-y-3 border-b border-neutral-200 dark:border-neutral-800"
            >
              <div>
                <label className="block text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Passage or Doctrinal Topic
                </label>
                <input
                  type="text"
                  value={aiInputPassage}
                  onChange={(e) => setAiInputPassage(e.target.value)}
                  placeholder="e.g. Romans 8:28-39, Psalm 23, Justification by Faith"
                  className="w-full h-8 px-2.5 text-xs bg-white dark:bg-black border border-neutral-300 dark:border-neutral-800 rounded text-neutral-900 dark:text-white focus:outline-none focus:border-neutral-900 dark:focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Preaching Mode
                </label>
                <div className="grid grid-cols-3 gap-1 bg-neutral-200/70 dark:bg-neutral-900 p-0.5 rounded border border-neutral-300 dark:border-neutral-800">
                  {(
                    ["Expository", "Textual", "Topical"] as PreachingMode[]
                  ).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setAiPreachingMode(mode)}
                      className={`py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 ${
                        aiPreachingMode === mode
                          ? "bg-neutral-900 dark:bg-amber-400 text-white dark:text-black"
                          : "text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white"
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Pastoral Focus / Context (Optional)
                </label>
                <input
                  type="text"
                  value={aiFocusNotes}
                  onChange={(e) => setAiFocusNotes(e.target.value)}
                  placeholder="e.g. Comfort for grieving believers, Lord's Supper..."
                  className="w-full h-8 px-2.5 text-xs bg-white dark:bg-black border border-neutral-300 dark:border-neutral-800 rounded text-neutral-900 dark:text-white focus:outline-none focus:border-neutral-900 dark:focus:border-amber-400"
                />
              </div>

              <button
                type="submit"
                disabled={isGeneratingOutline}
                className="w-full h-9 px-4 text-xs font-semibold bg-neutral-900 dark:bg-amber-400 text-white dark:text-black rounded hover:bg-neutral-800 dark:hover:bg-amber-300 disabled:opacity-50 transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
              >
                <Wand2 className="w-3.5 h-3.5" />
                <span>
                  {isGeneratingOutline
                    ? "Structuring Homiletical Outline..."
                    : `Generate ${aiPreachingMode} Outline`}
                </span>
              </button>

              {aiError && (
                <div className="p-2.5 text-xs bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 rounded">
                  {aiError}
                </div>
              )}
            </form>

            {/* Generated Outline Preview & One-Click Apply */}
            <div className="flex-1 p-4 space-y-3 overflow-y-auto">
              {!generatedOutline && !isGeneratingOutline && (
                <div className="py-8 text-center space-y-2">
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    Enter a Scripture passage or doctrinal theme above and click{" "}
                    <strong className="text-neutral-800 dark:text-neutral-200">
                      Generate Outline
                    </strong>
                    .
                  </p>
                  <div className="flex flex-wrap justify-center gap-1.5 pt-2">
                    {[
                      "Psalms 23:1-6",
                      "Isaiah 53:4-6",
                      "Ephesians 2:8-10",
                      "Hebrews 4:14-16",
                    ].map((sample) => (
                      <button
                        key={sample}
                        type="button"
                        onClick={() => setAiInputPassage(sample)}
                        className="px-2 py-1 text-[11px] font-mono-tabular bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded text-neutral-700 dark:text-neutral-300 hover:border-neutral-900 dark:hover:border-amber-400"
                      >
                        {sample}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {isGeneratingOutline && (
                <div className="space-y-2.5 py-4">
                  <div className="h-4 bg-neutral-200 dark:bg-neutral-800 rounded w-3/4 animate-pulse" />
                  <div className="h-12 bg-neutral-200 dark:bg-neutral-800 rounded w-full animate-pulse" />
                  <div className="h-20 bg-neutral-200 dark:bg-neutral-800 rounded w-full animate-pulse" />
                  <div className="h-20 bg-neutral-200 dark:bg-neutral-800 rounded w-full animate-pulse" />
                </div>
              )}

              {generatedOutline && (
                <div className="space-y-3">
                  <div className="sticky top-0 z-10 pb-2 bg-neutral-50/95 dark:bg-neutral-950/95 backdrop-blur-xs">
                    <button
                      type="button"
                      onClick={handleApplyAiOutlineToEditor}
                      className="w-full h-9 px-3 text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white rounded transition-colors flex items-center justify-center gap-1.5 shadow-xs whitespace-nowrap"
                    >
                      <Check className="w-4 h-4" />
                      <span>
                        {appliedSuccess
                          ? "Applied to Outline & Manuscript!"
                          : "Apply Outline to Editor"}
                      </span>
                    </button>
                  </div>

                  <div className="p-3 bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded space-y-1">
                    <div className="text-xs font-bold text-neutral-900 dark:text-white">
                      {generatedOutline.title}
                    </div>
                    <div className="text-[11px] font-mono-tabular text-neutral-500 dark:text-amber-400">
                      Text: {generatedOutline.primaryText}
                    </div>
                    <p className="text-xs text-neutral-800 dark:text-neutral-200 pt-1">
                      <strong>Big Idea:</strong> {generatedOutline.bigIdea}
                    </p>
                  </div>

                  <div className="p-3 bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded space-y-1.5 text-xs">
                    <div>
                      <strong className="text-neutral-900 dark:text-white">
                        Hook:
                      </strong>{" "}
                      <span className="text-neutral-700 dark:text-neutral-300">
                        {generatedOutline.hook}
                      </span>
                    </div>
                    <div>
                      <strong className="text-neutral-900 dark:text-white">
                        Context:
                      </strong>{" "}
                      <span className="text-neutral-700 dark:text-neutral-300">
                        {generatedOutline.context}
                      </span>
                    </div>
                  </div>

                  {generatedOutline.divisions.map((div, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded space-y-1.5 text-xs"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-neutral-900 dark:text-white">
                          {div.heading}
                        </span>
                        <span className="font-mono-tabular text-[11px] text-neutral-500 dark:text-amber-400 shrink-0">
                          {div.scriptureRef}
                        </span>
                      </div>
                      <p className="text-neutral-800 dark:text-neutral-200 leading-relaxed">
                        {div.exposition}
                      </p>
                      <p className="text-neutral-600 dark:text-neutral-400 italic">
                        <strong>Illustration:</strong> {div.illustration}
                      </p>
                      <p className="text-neutral-800 dark:text-neutral-200">
                        <strong>Application:</strong> {div.application}
                      </p>
                    </div>
                  ))}

                  <div className="p-3 bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded space-y-1 text-xs">
                    <strong className="text-neutral-900 dark:text-white">
                      Conclusion &amp; Call to Action:
                    </strong>
                    <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed">
                      {generatedOutline.conclusionAndCallToAction}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </aside>
        )}
      </div>
    </section>
  );
};
