import Dexie, { type Table } from "dexie";
import { INITIAL_KJV_VERSES, type KJVerseRecord } from "../data/kjvData";

export type HomileticColor = "gold" | "blue" | "red" | "green";

export interface VerseHighlight {
  verseId: string; // Primary key, e.g., "Romans 8:28"
  color: HomileticColor;
  label: "Promise / Grace" | "Duty / Command" | "Warning / Judgment" | "Doctrine";
  updatedAt: number;
}

export interface MarginNote {
  id: string;
  verseId: string; // e.g., "Romans 8:28"
  book: string;
  chapter: number;
  verse: number;
  noteText: string;
  updatedAt: number;
}

export type PreachingMode = "Expository" | "Textual" | "Topical";

export type BlockType =
  | "hook"
  | "context"
  | "big_idea"
  | "division"
  | "subpoint"
  | "scripture"
  | "illustration"
  | "application"
  | "conclusion"
  | "closing_prayer";

export interface OutlineBlock {
  id: string;
  type: BlockType;
  heading: string;
  content: string;
  scriptureRef?: string;
  indent: 0 | 1 | 2;
}

export interface SermonDocument {
  id: string;
  title: string;
  primaryText: string;
  preachingMode: PreachingMode;
  bigIdea: string;
  roughDraft?: string;
  blocks: OutlineBlock[];
  manuscript: string;
  createdAt: number;
  updatedAt: number;
}

export interface TranscriptSegment {
  timestamp: string;
  text: string;
  matchedSection?: string;
}

export interface DeliveryComparison {
  executiveSummary: string;
  alignmentScore: number;
  deliveredPoints: string[];
  skippedPoints: string[];
  spontaneousAdLibs: string[];
  pacingAndDeliveryNotes: string;
}

export interface SermonRecording {
  id: string;
  sermonId: string;
  sermonTitle: string;
  createdAt: number;
  durationSec: number;
  mimeType: string;
  audioBase64: string;
  transcriptSegments?: TranscriptSegment[];
  comparison?: DeliveryComparison;
}

export const HOMILETIC_SWATCHES: {
  color: HomileticColor;
  label: VerseHighlight["label"];
  shortLabel: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
  dotClass: string;
}[] = [
  {
    color: "gold",
    label: "Promise / Grace",
    shortLabel: "Promise",
    bgClass: "bg-amber-50/90 dark:bg-amber-950/40",
    textClass: "text-amber-950 dark:text-amber-200",
    borderClass: "border-amber-300 dark:border-amber-700/70",
    dotClass: "bg-amber-500",
  },
  {
    color: "blue",
    label: "Duty / Command",
    shortLabel: "Duty",
    bgClass: "bg-sky-50/90 dark:bg-sky-950/40",
    textClass: "text-sky-950 dark:text-sky-200",
    borderClass: "border-sky-300 dark:border-sky-700/70",
    dotClass: "bg-sky-600",
  },
  {
    color: "red",
    label: "Warning / Judgment",
    shortLabel: "Warning",
    bgClass: "bg-rose-50/90 dark:bg-rose-950/40",
    textClass: "text-rose-950 dark:text-rose-200",
    borderClass: "border-rose-300 dark:border-rose-700/70",
    dotClass: "bg-rose-600",
  },
  {
    color: "green",
    label: "Doctrine",
    shortLabel: "Doctrine",
    bgClass: "bg-emerald-50/90 dark:bg-emerald-950/40",
    textClass: "text-emerald-950 dark:text-emerald-200",
    borderClass: "border-emerald-300 dark:border-emerald-700/70",
    dotClass: "bg-emerald-600",
  },
];

export interface MemoryVerse {
  verseId: string; // Primary key, e.g., "Romans 8:28"
  book: string;
  chapter: number;
  verse: number;
  text: string;
  masteryCount: number;
  lastReviewedAt: number;
  addedAt: number;
}

export class VerbumDatabase extends Dexie {
  verses!: Table<KJVerseRecord, string>;
  highlights!: Table<VerseHighlight, string>;
  marginNotes!: Table<MarginNote, string>;
  sermons!: Table<SermonDocument, string>;
  recordings!: Table<SermonRecording, string>;
  memoryDeck!: Table<MemoryVerse, string>;

  constructor() {
    super("VerbumHomileticDB");
    this.version(1).stores({
      verses: "id, book, [book+chapter], chapter, verse",
      highlights: "verseId, color, updatedAt",
      marginNotes: "id, verseId, [book+chapter], updatedAt",
      sermons: "id, title, preachingMode, updatedAt",
      recordings: "id, sermonId, createdAt",
    });
    this.version(2).stores({
      verses: "id, book, [book+chapter], chapter, verse",
      highlights: "verseId, color, updatedAt",
      marginNotes: "id, verseId, [book+chapter], updatedAt",
      sermons: "id, title, preachingMode, updatedAt",
      recordings: "id, sermonId, createdAt",
      memoryDeck: "verseId, book, masteryCount, lastReviewedAt, addedAt",
    });
  }
}

export const db = new VerbumDatabase();

const INITIAL_SERMON: SermonDocument = {
  id: "sermon-romans-8-sovereign-grace",
  title: "The Unbreakable Chain of Sovereign Grace",
  primaryText: "Romans 8:28–39",
  preachingMode: "Expository",
  bigIdea:
    "Because God's eternal purpose spans from foreknowledge to glorification, no earthly trial or spiritual adversary can sever the believer from the love of Christ.",
  roughDraft: `Sermon Ideas / Rough Notes:
- Text: Romans 8:28-39. Many in the congregation are walking through heavy trials, sickness, and uncertainty right now.
- Need to emphasize that "all things work together for good" is not shallow worldly optimism—it is anchored in God's sovereign purpose and foreknowledge.
- Connect with Joseph in Genesis 50:20 ("ye thought evil against me; but God meant it unto good").
- Show the 5-link golden chain in vv. 29-30: foreknew, predestinated, called, justified, glorified. Why is "glorified" already in the past tense? Because God's promise cannot fail.
- Walk through the courtroom questions in vv. 31-35: If God spared not His own Son at Calvary, how will He withhold anything we need in our trials?
- Need a strong closing pastoral prayer of comfort and assurance for weary believers.`,
  createdAt: Date.now() - 86400000,
  updatedAt: Date.now(),
  blocks: [
    {
      id: "blk-1",
      type: "hook",
      heading: "Introduction & Homiletical Hook",
      content:
        "When believers walk through the furnace of affliction, the tempter whispers that suffering is proof of divine abandonment. Paul answers that lie not with stoic optimism, but with the granite foundation of God's eternal decree.",
      scriptureRef: "Romans 8:18",
      indent: 0,
    },
    {
      id: "blk-2",
      type: "context",
      heading: "Exegetical Context — Groaning & Glory",
      content:
        "Placed at the climax of chapters 5–8, Paul moves from justification by faith (5:1) and the indwelling Spirit's intercession (8:26–27) to the believer's absolute assurance in the face of groaning creation.",
      scriptureRef: "Romans 8:26–27",
      indent: 0,
    },
    {
      id: "blk-3",
      type: "division",
      heading: "I. The Sovereign Providence of God in Every Trial (v. 28)",
      content:
        "Notice the certainty: 'And we know' (oidamen)—not a hesitant wish, but covenantal knowledge. 'All things work together for good' (synergei)—divine providence harmonizes even bitter afflictions toward our conformity to Christ.",
      scriptureRef: "Romans 8:28",
      indent: 0,
    },
    {
      id: "blk-4",
      type: "scripture",
      heading: "Scripture Card — Genesis 50:20 (TSK Parallel)",
      content:
        "\"But as for you, ye thought evil against me; but God meant it unto good, to bring to pass, as it is this day, to save much people alive.\" — Genesis 50:20 (KJV)",
      scriptureRef: "Genesis 50:20",
      indent: 1,
    },
    {
      id: "blk-5",
      type: "division",
      heading: "II. The Fivefold Golden Chain of Redemption (vv. 29–30)",
      content:
        "Five verbs in the aorist tense span eternity past to eternity future: Foreknew, Predestinated, Called, Justified, Glorified. Notice 'glorified' is spoken of in the past tense because in the decree of God, not one link can ever snap.",
      scriptureRef: "Romans 8:29–30",
      indent: 0,
    },
    {
      id: "blk-6",
      type: "illustration",
      heading: "Illustration — The Master Weaver's Tapestry",
      content:
        "From beneath a loom, a child sees only knotted dark threads and tangled crossings; when lifted to the Master Weaver's seat above, the golden crown of the pattern shines clearly.",
      indent: 1,
    },
    {
      id: "blk-7",
      type: "division",
      heading: "III. The Five Unanswerable Judicial Questions (vv. 31–35)",
      content:
        "Paul summons the universe into the courtroom: 1. If God be for us, who can be against us? 2. Shall He not with Christ freely give us all things? 3. Who shall lay any thing to the charge of God's elect? 4. Who is he that condemneth? 5. Who shall separate us from the love of Christ?",
      scriptureRef: "Romans 8:31–35",
      indent: 0,
    },
    {
      id: "blk-8",
      type: "application",
      heading: "Congregational Application — Answering Accusation with Intercession",
      content:
        "Stop measuring God's love by the temperature of your present trial. Measure your trial by the cross where the Father spared not His own Son, and by the throne where the risen Christ even now maketh intercession for you.",
      scriptureRef: "Romans 8:32–34",
      indent: 1,
    },
    {
      id: "blk-9",
      type: "conclusion",
      heading: "Conclusion & Call to Action — More Than Conquerors (vv. 37–39)",
      content:
        "We do not merely survive; we hyper-conquer (hypernikomen) through Him that loved us. Rest your weary conscience tonight upon the inseparable love of God in Christ Jesus our Lord.",
      scriptureRef: "Romans 8:37–39",
      indent: 0,
    },
  ],
  manuscript: `THE UNBREAKABLE CHAIN OF SOVEREIGN GRACE
Primary Text: Romans 8:28–39 (KJV)

BIG IDEA:
Because God's eternal purpose spans from foreknowledge to glorification, no earthly trial or spiritual adversary can sever the believer from the love of Christ.

INTRODUCTION
Beloved, when we walk through the furnace of affliction, the adversary whispers that our suffering is evidence of divine abandonment. Yet the Apostle Paul answers that accusation not with fragile human optimism, but with the granite foundation of God's eternal decree. Hear the Word of the Lord from Romans 8:28: "And we know that all things work together for good to them that love God, to them who are the called according to his purpose."

I. THE SOVEREIGN PROVIDENCE OF GOD IN EVERY TRIAL (Romans 8:28)
Paul begins with a declaration of holy certainty: "And we know." He does not say "we hope" or "we speculate." Every circumstance—whether sweet providence or bitter bereavement—is governed by the hand of Him who worketh all things after the counsel of His own will. As Joseph declared in Genesis 50:20, "But as for you, ye thought evil against me; but God meant it unto good, to bring to pass, as it is this day, to save much people alive."

II. THE FIVEFOLD GOLDEN CHAIN OF REDEMPTION (Romans 8:29–30)
Why can we be certain that all things work together for good? Because of the unbreakable golden chain in verses 29 and 30: "For whom he did foreknow, he also did predestinate to be conformed to the image of his Son, that he might be the firstborn among many brethren. Moreover whom he did predestinate, them he also called: and whom he called, them he also justified: and whom he justified, them he also glorified."
Notice that the same company whom God foreknew in eternity past is the exact company whom He glorifies in eternity future. Not one sheep is lost between calling and glory.

III. THE FIVE UNANSWERABLE JUDICIAL QUESTIONS (Romans 8:31–35)
Standing upon this summit, Paul issues five triumphant challenges to every accuser in heaven, earth, and hell:
First: "If God be for us, who can be against us?"
Second: "He that spared not his own Son, but delivered him up for us all, how shall he not with him also freely give us all things?" If the Father gave the greater gift—His only begotten Son at Calvary—will He withhold the lesser grace needed for tomorrow's trial?
Third: "Who shall lay any thing to the charge of God's elect? It is God that justifieth."
Fourth: "Who is he that condemneth? It is Christ that died, yea rather, that is risen again, who is even at the right hand of God, who also maketh intercession for us."

PASTORAL APPLICATION & CONCLUSION (Romans 8:37–39)
Do not measure the love of God by the shifting winds of your affliction; measure your affliction by the nail-pierced hands of the risen Intercessor. "Nay, in all these things we are more than conquerors through him that loved us. For I am persuaded, that neither death, nor life, nor angels, nor principalities, nor powers, nor things present, nor things to come, Nor height, nor depth, nor any other creature, shall be able to separate us from the love of God, which is in Christ Jesus our Lord." Amen.`,
};

export async function initializeDatabase(): Promise<void> {
  const verseCount = await db.verses.count();
  if (verseCount === 0) {
    await db.verses.bulkPut(INITIAL_KJV_VERSES);
  }

  const highlightCount = await db.highlights.count();
  if (highlightCount === 0) {
    await db.highlights.bulkPut([
      {
        verseId: "Romans 8:1",
        color: "gold",
        label: "Promise / Grace",
        updatedAt: Date.now(),
      },
      {
        verseId: "Romans 8:6",
        color: "red",
        label: "Warning / Judgment",
        updatedAt: Date.now(),
      },
      {
        verseId: "Romans 8:14",
        color: "blue",
        label: "Duty / Command",
        updatedAt: Date.now(),
      },
      {
        verseId: "Romans 8:28",
        color: "gold",
        label: "Promise / Grace",
        updatedAt: Date.now(),
      },
      {
        verseId: "Romans 8:29",
        color: "green",
        label: "Doctrine",
        updatedAt: Date.now(),
      },
      {
        verseId: "Romans 8:30",
        color: "green",
        label: "Doctrine",
        updatedAt: Date.now(),
      },
      {
        verseId: "Romans 8:38",
        color: "gold",
        label: "Promise / Grace",
        updatedAt: Date.now(),
      },
      {
        verseId: "Romans 8:39",
        color: "gold",
        label: "Promise / Grace",
        updatedAt: Date.now(),
      },
    ]);
  }

  const noteCount = await db.marginNotes.count();
  if (noteCount === 0) {
    await db.marginNotes.bulkPut([
      {
        id: "note-rom-8-28",
        verseId: "Romans 8:28",
        book: "Romans",
        chapter: 8,
        verse: 28,
        noteText:
          "Gk. synergei ('work together'): Providence is not blind fate; the Father actively weaves both light and dark threads for the believer's ultimate conformity to Christ.",
        updatedAt: Date.now() - 3600000,
      },
      {
        id: "note-rom-8-30",
        verseId: "Romans 8:30",
        book: "Romans",
        chapter: 8,
        verse: 30,
        noteText:
          "Prophetic past tense ('edoxasen' — glorified): So certain is the believer's final glorification in God's covenant that Paul writes it as an accomplished fact.",
        updatedAt: Date.now() - 1800000,
      },
      {
        id: "note-rom-8-32",
        verseId: "Romans 8:32",
        book: "Romans",
        chapter: 8,
        verse: 32,
        noteText:
          "Argument a maiori ad minus (from the greater to the lesser): Echoes Genesis 22:12 ('thou hast not withheld thy son'). The cross guarantees every lesser supply of sustaining grace.",
        updatedAt: Date.now() - 900000,
      },
    ]);
  }

  const sermonCount = await db.sermons.count();
  if (sermonCount === 0) {
    const textualSermon = createTemplateSermonDocument("Textual", "John 3:16");
    textualSermon.id = "sermon-john-3-16-textual";
    textualSermon.createdAt = Date.now() - 172800000;
    textualSermon.updatedAt = Date.now() - 120000;

    const topicalSermon = createTemplateSermonDocument("Topical", "Romans 3:24–26");
    topicalSermon.id = "sermon-justification-topical";
    topicalSermon.createdAt = Date.now() - 259200000;
    topicalSermon.updatedAt = Date.now() - 240000;

    await db.sermons.bulkPut([INITIAL_SERMON, textualSermon, topicalSermon]);
  } else if (sermonCount === 1) {
    const existing = await db.sermons.get("sermon-john-3-16-textual");
    if (!existing) {
      const textualSermon = createTemplateSermonDocument("Textual", "John 3:16");
      textualSermon.id = "sermon-john-3-16-textual";
      textualSermon.createdAt = Date.now() - 172800000;
      textualSermon.updatedAt = Date.now() - 120000;

      const topicalSermon = createTemplateSermonDocument("Topical", "Romans 3:24–26");
      topicalSermon.id = "sermon-justification-topical";
      topicalSermon.createdAt = Date.now() - 259200000;
      topicalSermon.updatedAt = Date.now() - 240000;

      await db.sermons.bulkPut([textualSermon, topicalSermon]);
    }
  }

  const memoryCount = await db.memoryDeck.count();
  if (memoryCount === 0) {
    const seedIds = [
      "Romans 8:28",
      "Romans 8:31",
      "John 3:16",
      "Psalms 23:1",
      "Ephesians 2:8",
    ];
    const seedRecords: MemoryVerse[] = [];
    for (const id of seedIds) {
      const found = INITIAL_KJV_VERSES.find((v) => v.id === id);
      if (found) {
        seedRecords.push({
          verseId: found.id,
          book: found.book,
          chapter: found.chapter,
          verse: found.verse,
          text: found.text,
          masteryCount: id === "Romans 8:28" ? 2 : 1,
          lastReviewedAt: Date.now() - 3600000,
          addedAt: Date.now() - 7200000,
        });
      }
    }
    if (seedRecords.length > 0) {
      await db.memoryDeck.bulkPut(seedRecords);
    }
  }
}

export function buildManuscriptFromBlocks(
  title: string,
  primaryText: string,
  bigIdea: string,
  blocks: OutlineBlock[]
): string {
  const lines: string[] = [
    title.toUpperCase(),
    `Primary Text: ${primaryText} (KJV)`,
    "",
    "BIG IDEA:",
    bigIdea,
    "",
  ];

  for (const blk of blocks) {
    const refSuffix = blk.scriptureRef ? ` (${blk.scriptureRef})` : "";
    lines.push(`${blk.heading.toUpperCase()}${refSuffix}`);
    lines.push(blk.content);
    lines.push("");
  }

  return lines.join("\n").trim();
}

export function getTemplateBlocksForMode(
  mode: PreachingMode,
  ref: string
): {
  defaultTitle: string;
  defaultPrimaryText: string;
  bigIdea: string;
  blocks: OutlineBlock[];
} {
  const now = Date.now();

  if (mode === "Expository") {
    const primaryText = ref || "Ephesians 2:1–10";
    const defaultTitle = `Expository Study on ${primaryText}`;
    const bigIdea = `Sequential exposition of ${primaryText}: God's sovereign grace rescues the spiritually dead and creates a workmanship unto good works.`;
    const blocks: OutlineBlock[] = [
      {
        id: `exp-hook-${now}-1`,
        type: "hook",
        heading: "Introduction & Human Condition Hook",
        content: `Surface the tension in the congregation's daily walk and show how ${primaryText} directly addresses our spiritual need.`,
        scriptureRef: primaryText,
        indent: 0,
      },
      {
        id: `exp-ctx-${now}-2`,
        type: "context",
        heading: "Historical-Grammatical & Redemptive Context",
        content:
          "Authorial intent, surrounding literary unit, and key KJV terms in their covenantal setting.",
        scriptureRef: primaryText,
        indent: 0,
      },
      {
        id: `exp-big-${now}-3`,
        type: "big_idea",
        heading: "Homiletical Big Idea",
        content: bigIdea,
        scriptureRef: primaryText,
        indent: 0,
      },
      {
        id: `exp-div1-${now}-4`,
        type: "division",
        heading: "I. First Sequential Passage Breakdown (vv. 1–3)",
        content:
          "Exegetical insights on the opening verses: observe the grammar, verbs, and theological foundation in the text.",
        scriptureRef: primaryText,
        indent: 0,
      },
      {
        id: `exp-ill1-${now}-5`,
        type: "illustration",
        heading: "Illustrative Window",
        content:
          "Concrete historical or biblical analogy that clarifies the first exegetical point.",
        indent: 1,
      },
      {
        id: `exp-div2-${now}-6`,
        type: "division",
        heading: "II. Second Sequential Passage Breakdown (vv. 4–7)",
        content:
          "Unfold the progression of the text's argument ('But God, who is rich in mercy...') and connect with parallel TSK cross-references.",
        scriptureRef: primaryText,
        indent: 0,
      },
      {
        id: `exp-div3-${now}-7`,
        type: "division",
        heading: "III. Third Sequential Passage Breakdown (vv. 8–10)",
        content:
          "Trace the culmination of the passage: salvation by grace through faith unto ordained good works.",
        scriptureRef: primaryText,
        indent: 0,
      },
      {
        id: `exp-app-${now}-8`,
        type: "application",
        heading: "Congregational Application",
        content:
          "Direct application to believers and unbelievers: how must our minds, affections, and daily obedience respond?",
        scriptureRef: primaryText,
        indent: 1,
      },
      {
        id: `exp-conc-${now}-9`,
        type: "conclusion",
        heading: "Conclusion & Christ-Centered Call to Action",
        content:
          "Restate the homiletical Big Idea and summon the hearers to immediate faith and grateful obedience.",
        scriptureRef: primaryText,
        indent: 0,
      },
    ];
    return { defaultTitle, defaultPrimaryText: primaryText, bigIdea, blocks };
  }

  if (mode === "Textual") {
    const primaryText = ref || "John 3:16";
    const defaultTitle = `Textual Divisions on ${primaryText}`;
    const bigIdea = `Every clause of ${primaryText} reveals a distinct facet of God's saving love, sacrificial gift, and promise of everlasting life.`;
    const blocks: OutlineBlock[] = [
      {
        id: `txt-hdr-${now}-1`,
        type: "hook",
        heading: `Anchor Verse Header — ${primaryText}`,
        content:
          "Read the anchor verse distinctly and introduce its natural grammatical clauses as the framework of the message.",
        scriptureRef: primaryText,
        indent: 0,
      },
      {
        id: `txt-div1-${now}-2`,
        type: "division",
        heading: "I. First Clause Division — The Infinite Source ('For God so loved the world')",
        content:
          "Isolate the first clause of the anchor verse and examine the magnitude and holy character of divine love.",
        scriptureRef: primaryText,
        indent: 0,
      },
      {
        id: `txt-ded1-${now}-3`,
        type: "subpoint",
        heading: "Theological Deduction from Clause I",
        content:
          "Salvation originates not in human merit, but in the free, self-moving love of the Father.",
        scriptureRef: "1 John 4:10",
        indent: 1,
      },
      {
        id: `txt-div2-${now}-4`,
        type: "division",
        heading: "II. Second Clause Division — The Unspeakable Gift ('that he gave his only begotten Son')",
        content:
          "Examine the central pivot of the verse: the incarnation and substitutionary atonement of Christ.",
        scriptureRef: primaryText,
        indent: 0,
      },
      {
        id: `txt-ded2-${now}-5`,
        type: "subpoint",
        heading: "Theological Deduction from Clause II",
        content:
          "The measure of God's love is the costliness of His gift—sparing not His own Son.",
        scriptureRef: "Romans 8:32",
        indent: 1,
      },
      {
        id: `txt-div3-${now}-6`,
        type: "division",
        heading: "III. Third Clause Division — The Saving Instrument & Promise ('that whosoever believeth in him...')",
        content:
          "Unpack the universal warrant of faith ('whosoever believeth') and the twofold promise ('not perish, but have everlasting life').",
        scriptureRef: primaryText,
        indent: 0,
      },
      {
        id: `txt-ded3-${now}-7`,
        type: "subpoint",
        heading: "Theological Deduction from Clause III",
        content:
          "Faith alone is the empty hand that receives Christ and passes from condemnation into life eternal.",
        scriptureRef: "John 3:36",
        indent: 1,
      },
      {
        id: `txt-conc-${now}-8`,
        type: "conclusion",
        heading: "Conclusion & Unified Pastoral Appeal",
        content:
          "Bind the clauses back together into one urgent call to close with Christ by faith today.",
        scriptureRef: primaryText,
        indent: 0,
      },
    ];
    return { defaultTitle, defaultPrimaryText: primaryText, bigIdea, blocks };
  }

  // Topical
  const primaryText = ref || "Romans 3:24–26";
  const defaultTitle = "Topical Study: Justification by Faith Alone";
  const bigIdea =
    "Across both Old and New Testaments, Scripture testifies that sinners are pardoned and declared righteous solely through the imputed righteousness of Christ received by faith.";
  const blocks: OutlineBlock[] = [
    {
      id: `top-prop-${now}-1`,
      type: "big_idea",
      heading: "Core Doctrinal Proposition",
      content: bigIdea,
      scriptureRef: primaryText,
      indent: 0,
    },
    {
      id: `top-div1-${now}-2`,
      type: "division",
      heading: "I. First Argument Step — Universal Guilt & Inability Under the Law",
      content:
        "Establish from Old and New Testament witness that no flesh can be justified by works of the law.",
      scriptureRef: "Romans 3:19–20; Psalms 51:1–3",
      indent: 0,
    },
    {
      id: `top-trans1-${now}-3`,
      type: "subpoint",
      heading: "Homiletical Transition — From Human Ruin to Divine Remedy",
      content:
        "If the law stops every mouth in guilt, how then can a holy God declare the ungodly righteous without compromising His justice?",
      indent: 1,
    },
    {
      id: `top-div2-${now}-4`,
      type: "division",
      heading: "II. Second Argument Step — The Substitutionary Propitiation of Christ",
      content:
        "Multi-testament Scripture citations demonstrating that Christ bore our iniquities and satisfied divine justice.",
      scriptureRef: "Isaiah 53:5–6; Romans 3:24–25; 2 Corinthians 5:21",
      indent: 0,
    },
    {
      id: `top-trans2-${now}-5`,
      type: "subpoint",
      heading: "Homiletical Transition — From Accomplished Redemption to Personal Possession",
      content:
        "Having seen the righteous ground of justification in Christ's blood, how does this righteousness become ours?",
      indent: 1,
    },
    {
      id: `top-div3-${now}-6`,
      type: "division",
      heading: "III. Third Argument Step — Peace & Assurance Through Faith Alone",
      content:
        "Demonstrate how justifying faith rests upon Christ's finished work and yields peace with God and holy living.",
      scriptureRef: "Romans 5:1–2; Ephesians 2:8–10",
      indent: 0,
    },
    {
      id: `top-app-${now}-7`,
      type: "application",
      heading: "Pastoral Application &Conclusion",
      content:
        "Renounce all self-righteousness and rest wholly upon Jesus Christ, the Lord our Righteousness.",
      scriptureRef: "Philippians 3:9",
      indent: 0,
    },
  ];
  return { defaultTitle, defaultPrimaryText: primaryText, bigIdea, blocks };
}

export function createTemplateSermonDocument(
  mode: PreachingMode,
  customRef?: string
): SermonDocument {
  const { defaultTitle, defaultPrimaryText, bigIdea, blocks } =
    getTemplateBlocksForMode(mode, customRef || "");
  const manuscript = buildManuscriptFromBlocks(
    defaultTitle,
    defaultPrimaryText,
    bigIdea,
    blocks
  );

  return {
    id: `sermon-${mode.toLowerCase()}-${Date.now()}`,
    title: defaultTitle,
    primaryText: defaultPrimaryText,
    preachingMode: mode,
    bigIdea,
    blocks,
    manuscript,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

