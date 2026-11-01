import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Search,
  BookOpen,
  FilePlus2,
  Bookmark,
  MessageSquarePlus,
  Trash2,
  X,
  ArrowUpRight,
  Highlighter,
  Compass,
  CornerDownLeft,
  BarChart3,
  ChevronRight,
  ChevronLeft,
  Brain,
  Eye,
  EyeOff,
  Check,
  RotateCcw,
  Clock,
} from "lucide-react";
import {
  KJV_BOOKS_METADATA,
  getTSKForVerse,
  type KJVerseRecord,
  type TSKReference,
} from "../data/kjvData";
import {
  db,
  HOMILETIC_SWATCHES,
  type HomileticColor,
  type VerseHighlight,
  type MarginNote,
  type SermonDocument,
  type MemoryVerse,
} from "../db/db";

interface ScriptureDeskProps {
  onInsertScriptureCard: (ref: string, text: string, noteContext?: string) => void;
  allSermons?: SermonDocument[];
}

interface PassageDensityItem {
  ref: string;
  book: string;
  chapter: number;
  verse: number;
  count: number;
  sermonIds: Set<string>;
  sermonTitles: string[];
}

interface BookDensityItem {
  book: string;
  testament: "OT" | "NT";
  count: number;
  sermonCount: number;
}

type ClozeDifficulty = "light" | "standard" | "mastery";

interface ClozeToken {
  index: number;
  raw: string;
  prefixPunct: string;
  cleanWord: string;
  suffixPunct: string;
  isBlank: boolean;
}

const BOOK_ALIASES: Record<string, string> = {
  gen: "Genesis",
  genesis: "Genesis",
  ps: "Psalms",
  psa: "Psalms",
  psalm: "Psalms",
  psalms: "Psalms",
  isa: "Isaiah",
  isaiah: "Isaiah",
  mat: "Matthew",
  matt: "Matthew",
  matthew: "Matthew",
  jn: "John",
  jhn: "John",
  john: "John",
  rom: "Romans",
  romans: "Romans",
  "1cor": "1 Corinthians",
  "1 cor": "1 Corinthians",
  "1 corinthians": "1 Corinthians",
  "2cor": "2 Corinthians",
  "2 cor": "2 Corinthians",
  "2 corinthians": "2 Corinthians",
  eph: "Ephesians",
  ephesians: "Ephesians",
  phil: "Philippians",
  philippians: "Philippians",
  col: "Colossians",
  colossians: "Colossians",
  "2tim": "2 Timothy",
  "2 tim": "2 Timothy",
  "2 timothy": "2 Timothy",
  heb: "Hebrews",
  hebrews: "Hebrews",
  jas: "James",
  jam: "James",
  james: "James",
  "1pet": "1 Peter",
  "1 pet": "1 Peter",
  "1 peter": "1 Peter",
  "1jn": "1 John",
  "1 john": "1 John",
  rev: "Revelation",
  revelation: "Revelation",
};

/**
 * Extracts normalized Scripture reference tokens from a string (e.g. "Romans 8:28–30; Genesis 50:20")
 */
function extractReferencesFromText(rawText: string): {
  canonicalRef: string;
  book: string;
  chapter: number;
  verse: number;
}[] {
  if (!rawText) return [];
  const results: {
    canonicalRef: string;
    book: string;
    chapter: number;
    verse: number;
  }[] = [];

  const regex =
    /\b([1-3]?\s*[A-Za-z]+)\s+(\d+):(\d+)(?:[\u2013\u2014\-](\d+))?/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(rawText)) !== null) {
    const rawBook = match[1].trim().toLowerCase().replace(/\s+/g, " ");
    const resolvedBook =
      BOOK_ALIASES[rawBook] ||
      KJV_BOOKS_METADATA.find((b) => b.book.toLowerCase() === rawBook)?.book;

    if (!resolvedBook) continue;

    const chapter = Number(match[2]);
    const startVerse = Number(match[3]);
    const endVerse = match[4] ? Number(match[4]) : null;

    if (Number.isNaN(chapter) || Number.isNaN(startVerse)) continue;

    const canonicalRef = endVerse
      ? `${resolvedBook} ${chapter}:${startVerse}–${endVerse}`
      : `${resolvedBook} ${chapter}:${startVerse}`;

    results.push({
      canonicalRef,
      book: resolvedBook,
      chapter,
      verse: startVerse,
    });
  }

  return results;
}

/**
 * Builds cloze-deletion tokens for a KJV verse so key theological and substantive words are masked for pulpit recall.
 */
function buildClozeTokens(text: string, difficulty: ClozeDifficulty): ClozeToken[] {
  const words = text.trim().split(/\s+/);
  let substantiveCounter = 0;

  return words.map((raw, index) => {
    const match = raw.match(/^([^A-Za-z0-9]*)([A-Za-z0-9'-]+)([^A-Za-z0-9]*)$/);
    if (!match) {
      return {
        index,
        raw,
        prefixPunct: "",
        cleanWord: raw,
        suffixPunct: "",
        isBlank: false,
      };
    }

    const [, prefixPunct, cleanWord, suffixPunct] = match;
    const minLen = difficulty === "mastery" ? 3 : 4;
    const isSubstantive = cleanWord.length >= minLen;

    let isBlank = false;
    if (isSubstantive) {
      substantiveCounter += 1;
      if (difficulty === "light") {
        isBlank = substantiveCounter % 3 === 0;
      } else if (difficulty === "standard") {
        isBlank = substantiveCounter % 2 === 1;
      } else {
        // mastery: blank ~75% of substantive words
        isBlank = substantiveCounter % 4 !== 0;
      }
    }

    return {
      index,
      raw,
      prefixPunct,
      cleanWord,
      suffixPunct,
      isBlank,
    };
  });
}

export const ScriptureDesk: React.FC<ScriptureDeskProps> = ({
  onInsertScriptureCard,
  allSermons,
}) => {
  const [allVerses, setAllVerses] = useState<KJVerseRecord[]>([]);
  const [localSermons, setLocalSermons] = useState<SermonDocument[]>([]);
  const [selectedBook, setSelectedBook] = useState<string>("Romans");
  const [selectedChapter, setSelectedChapter] = useState<number>(8);
  const [verseRangeStart, setVerseRangeStart] = useState<number>(1);
  const [verseRangeEnd, setVerseRangeEnd] = useState<number>(99);

  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<KJVerseRecord[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [filterSwatch, setFilterSwatch] = useState<HomileticColor | "all">("all");

  // Visual Reference Density Map Sidebar State
  const [isDensitySidebarOpen, setIsDensitySidebarOpen] = useState<boolean>(true);
  const [densityMode, setDensityMode] = useState<"passages" | "books">("passages");

  // Quick Find Overlay State
  const [isQuickFindOpen, setIsQuickFindOpen] = useState<boolean>(false);
  const [quickFindInput, setQuickFindInput] = useState<string>("");
  const [quickFindIndex, setQuickFindIndex] = useState<number>(0);
  const quickFindInputRef = useRef<HTMLInputElement | null>(null);
  const pendingScrollVerseIdRef = useRef<string | null>(null);

  const [selectedVerse, setSelectedVerse] = useState<KJVerseRecord | null>(null);
  const [highlightsMap, setHighlightsMap] = useState<Record<string, VerseHighlight>>({});
  const [marginNotes, setMarginNotes] = useState<MarginNote[]>([]);
  const [newNoteText, setNewNoteText] = useState<string>("");
  const [activeBottomTab, setActiveBottomTab] = useState<"tsk" | "notes" | "memory">(
    "tsk"
  );
  const [insertedFeedbackId, setInsertedFeedbackId] = useState<string | null>(null);

  // Memory Deck & Periodic Pulpit Recall State
  const [memoryDeck, setMemoryDeck] = useState<MemoryVerse[]>([]);
  const [activeMemoryIndex, setActiveMemoryIndex] = useState<number>(0);
  const [clozeDifficulty, setClozeDifficulty] = useState<ClozeDifficulty>("standard");
  const [showFirstLetterHint, setShowFirstLetterHint] = useState<boolean>(true);
  const [revealedWordIndices, setRevealedWordIndices] = useState<Set<number>>(
    new Set()
  );
  const [isAllWordsRevealed, setIsAllWordsRevealed] = useState<boolean>(false);
  const [periodicIntervalSec, setPeriodicIntervalSec] = useState<number>(60); // 0 = paused, 45 = 45s, 60 = 1m, 120 = 2m
  const [isPeriodicRecallPopupOpen, setIsPeriodicRecallPopupOpen] =
    useState<boolean>(false);
  const [secondsUntilNextRecall, setSecondsUntilNextRecall] = useState<number>(60);

  const loadStudyData = async () => {
    const verses = await db.verses.toArray();
    setAllVerses(verses);

    const hlList = await db.highlights.toArray();
    const map: Record<string, VerseHighlight> = {};
    for (const h of hlList) {
      map[h.verseId] = h;
    }
    setHighlightsMap(map);

    const notes = await db.marginNotes.orderBy("updatedAt").reverse().toArray();
    setMarginNotes(notes);

    const storedSermons = await db.sermons.toArray();
    setLocalSermons(storedSermons);

    const deck = await db.memoryDeck.orderBy("addedAt").reverse().toArray();
    setMemoryDeck(deck);

    if (!selectedVerse) {
      const defaultV = verses.find((v) => v.id === "Romans 8:28") || verses[0];
      if (defaultV) setSelectedVerse(defaultV);
    }
  };

  useEffect(() => {
    loadStudyData();
  }, []);

  // Reset revealed words whenever active memory card or difficulty changes
  useEffect(() => {
    setRevealedWordIndices(new Set());
    setIsAllWordsRevealed(false);
  }, [activeMemoryIndex, clozeDifficulty, memoryDeck.length]);

  // Periodic Pulpit Recall Countdown Timer
  useEffect(() => {
    if (periodicIntervalSec <= 0 || memoryDeck.length === 0) {
      return;
    }
    setSecondsUntilNextRecall(periodicIntervalSec);

    const timer = setInterval(() => {
      setSecondsUntilNextRecall((prev) => {
        if (prev <= 1) {
          // Pick least-recently reviewed or next verse in deck and display the periodic recall card
          setActiveMemoryIndex((curr) => (curr + 1) % memoryDeck.length);
          setRevealedWordIndices(new Set());
          setIsAllWordsRevealed(false);
          setIsPeriodicRecallPopupOpen(true);
          return periodicIntervalSec;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [periodicIntervalSec, memoryDeck.length]);

  const memoryMap = useMemo(() => {
    const map: Record<string, MemoryVerse> = {};
    for (const m of memoryDeck) {
      map[m.verseId] = m;
    }
    return map;
  }, [memoryDeck]);

  const activeMemoryVerse: MemoryVerse | null =
    memoryDeck[activeMemoryIndex] || memoryDeck[0] || null;

  const activeClozeTokens: ClozeToken[] = useMemo(() => {
    if (!activeMemoryVerse) return [];
    return buildClozeTokens(activeMemoryVerse.text, clozeDifficulty);
  }, [activeMemoryVerse, clozeDifficulty]);

  const handleToggleMemoryVerse = async (verse: KJVerseRecord) => {
    const existing = memoryMap[verse.id];
    if (existing) {
      await db.memoryDeck.delete(verse.id);
      setMemoryDeck((prev) => prev.filter((m) => m.verseId !== verse.id));
      if (activeMemoryIndex >= memoryDeck.length - 1) {
        setActiveMemoryIndex(0);
      }
    } else {
      const newEntry: MemoryVerse = {
        verseId: verse.id,
        book: verse.book,
        chapter: verse.chapter,
        verse: verse.verse,
        text: verse.text,
        masteryCount: 0,
        lastReviewedAt: Date.now(),
        addedAt: Date.now(),
      };
      await db.memoryDeck.put(newEntry);
      setMemoryDeck((prev) => [newEntry, ...prev]);
      setActiveMemoryIndex(0);
    }
  };

  const handleMarkMemoryRecalled = async (entry: MemoryVerse) => {
    const updated: MemoryVerse = {
      ...entry,
      masteryCount: entry.masteryCount + 1,
      lastReviewedAt: Date.now(),
    };
    await db.memoryDeck.put(updated);
    setMemoryDeck((prev) =>
      prev.map((m) => (m.verseId === updated.verseId ? updated : m))
    );
    setRevealedWordIndices(new Set());
    setIsAllWordsRevealed(false);
    if (memoryDeck.length > 1) {
      setActiveMemoryIndex((prev) => (prev + 1) % memoryDeck.length);
    }
  };

  const toggleRevealSingleWord = (idx: number) => {
    setRevealedWordIndices((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) {
        next.delete(idx);
      } else {
        next.add(idx);
      }
      return next;
    });
  };

  const sermonsForDensity =
    allSermons && allSermons.length > 0 ? allSermons : localSermons;

  // Compute Visual Reference Density across all saved sermons in IndexedDB
  const { passageDensity, bookDensity, totalReferencesCount, otCount, ntCount } =
    useMemo(() => {
      const passageMap = new Map<string, PassageDensityItem>();
      const bookMap = new Map<
        string,
        { book: string; testament: "OT" | "NT"; count: number; sermonIds: Set<string> }
      >();

      let totalRefs = 0;
      let otTotal = 0;
      let ntTotal = 0;

      for (const sermon of sermonsForDensity) {
        const collectedRefs: {
          canonicalRef: string;
          book: string;
          chapter: number;
          verse: number;
          weight: number;
        }[] = [];

        for (const r of extractReferencesFromText(sermon.primaryText)) {
          collectedRefs.push({ ...r, weight: 2 });
        }

        for (const blk of sermon.blocks || []) {
          if (blk.scriptureRef) {
            for (const r of extractReferencesFromText(blk.scriptureRef)) {
              collectedRefs.push({ ...r, weight: 1 });
            }
          }
          if (blk.content) {
            for (const r of extractReferencesFromText(blk.content)) {
              collectedRefs.push({ ...r, weight: 1 });
            }
          }
        }

        if (sermon.manuscript) {
          for (const r of extractReferencesFromText(sermon.manuscript)) {
            collectedRefs.push({ ...r, weight: 1 });
          }
        }

        if (sermon.roughDraft) {
          for (const r of extractReferencesFromText(sermon.roughDraft)) {
            collectedRefs.push({ ...r, weight: 1 });
          }
        }

        for (const item of collectedRefs) {
          totalRefs += item.weight;
          const existingPassage = passageMap.get(item.canonicalRef);
          if (existingPassage) {
            existingPassage.count += item.weight;
            if (!existingPassage.sermonIds.has(sermon.id)) {
              existingPassage.sermonIds.add(sermon.id);
              existingPassage.sermonTitles.push(sermon.title || "Untitled");
            }
          } else {
            passageMap.set(item.canonicalRef, {
              ref: item.canonicalRef,
              book: item.book,
              chapter: item.chapter,
              verse: item.verse,
              count: item.weight,
              sermonIds: new Set([sermon.id]),
              sermonTitles: [sermon.title || "Untitled"],
            });
          }

          const meta = KJV_BOOKS_METADATA.find((b) => b.book === item.book);
          const testament: "OT" | "NT" = meta?.testament || "NT";
          if (testament === "OT") otTotal += item.weight;
          else ntTotal += item.weight;

          const existingBook = bookMap.get(item.book);
          if (existingBook) {
            existingBook.count += item.weight;
            existingBook.sermonIds.add(sermon.id);
          } else {
            bookMap.set(item.book, {
              book: item.book,
              testament,
              count: item.weight,
              sermonIds: new Set([sermon.id]),
            });
          }
        }
      }

      const sortedPassages = Array.from(passageMap.values())
        .sort((a, b) => {
          if (b.count !== a.count) return b.count - a.count;
          return b.sermonIds.size - a.sermonIds.size;
        })
        .slice(0, 12);

      const sortedBooks: BookDensityItem[] = Array.from(bookMap.values())
        .map((b) => ({
          book: b.book,
          testament: b.testament,
          count: b.count,
          sermonCount: b.sermonIds.size,
        }))
        .sort((a, b) => b.count - a.count);

      return {
        passageDensity: sortedPassages,
        bookDensity: sortedBooks,
        totalReferencesCount: totalRefs,
        otCount: otTotal,
        ntCount: ntTotal,
      };
    }, [sermonsForDensity]);

  // Global keyboard shortcut (Cmd/Ctrl + K) to open Quick Find Overlay
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsQuickFindOpen((prev) => !prev);
      } else if (e.key === "Escape" && isQuickFindOpen) {
        setIsQuickFindOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isQuickFindOpen]);

  useEffect(() => {
    if (isQuickFindOpen) {
      setQuickFindIndex(0);
      setTimeout(() => {
        quickFindInputRef.current?.focus();
        quickFindInputRef.current?.select();
      }, 20);
    }
  }, [isQuickFindOpen]);

  // Available chapters for selected book
  const availableChapters = useMemo(() => {
    const meta = KJV_BOOKS_METADATA.find((b) => b.book === selectedBook);
    return meta ? meta.chapters : [1];
  }, [selectedBook]);

  // Verses in current book + chapter
  const chapterVerses = useMemo(() => {
    return allVerses
      .filter((v) => v.book === selectedBook && v.chapter === selectedChapter)
      .sort((a, b) => a.verse - b.verse);
  }, [allVerses, selectedBook, selectedChapter]);

  // Reset verse range when book/chapter changes and scroll to any pending Quick Find target
  useEffect(() => {
    if (chapterVerses.length > 0) {
      const minV = chapterVerses[0].verse;
      const maxV = chapterVerses[chapterVerses.length - 1].verse;
      setVerseRangeStart(minV);
      setVerseRangeEnd(maxV);
      if (!chapterVerses.some((v) => v.id === selectedVerse?.id)) {
        setSelectedVerse(
          chapterVerses.find((v) => v.id === "Romans 8:28") || chapterVerses[0]
        );
      }
    }
  }, [selectedBook, selectedChapter, chapterVerses.length]);

  useEffect(() => {
    if (pendingScrollVerseIdRef.current) {
      const targetId = pendingScrollVerseIdRef.current;
      const timer = setTimeout(() => {
        const el = document.getElementById(`kjv-verse-${targetId}`);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
          pendingScrollVerseIdRef.current = null;
        }
      }, 60);
      return () => clearTimeout(timer);
    }
  }, [selectedBook, selectedChapter, selectedVerse, chapterVerses.length]);

  // Filtered verses by range and optional highlight swatch
  const visibleVerses = useMemo(() => {
    return chapterVerses.filter((v) => {
      const inRange = v.verse >= verseRangeStart && v.verse <= verseRangeEnd;
      if (!inRange) return false;
      if (filterSwatch !== "all") {
        const hl = highlightsMap[v.id];
        return hl?.color === filterSwatch;
      }
      return true;
    });
  }, [chapterVerses, verseRangeStart, verseRangeEnd, filterSwatch, highlightsMap]);

  // Quick Find Coordinate & Reference Matcher
  const quickFindMatches = useMemo(() => {
    const raw = quickFindInput.trim();
    if (!raw) {
      const defaults = [
        "John 3:16",
        "Romans 8:28",
        "Psalms 23:1",
        "Isaiah 53:5",
        "Ephesians 2:8",
        "2 Timothy 3:16",
        "Hebrews 4:12",
        "Romans 8:1",
      ];
      return defaults
        .map((id) => allVerses.find((v) => v.id === id))
        .filter((v): v is KJVerseRecord => Boolean(v));
    }

    const lower = raw.toLowerCase().replace(/\s+/g, " ");
    const refRegex = /^([1-3]?\s*[a-z]+)\s*(\d+)?(?:[:.\s](\d+))?$/i;
    const match = lower.match(refRegex);

    if (match) {
      const bookQuery = match[1].trim().toLowerCase();
      const chapterNum = match[2] ? Number(match[2]) : null;
      const verseNum = match[3] ? Number(match[3]) : null;

      const resolvedBook = BOOK_ALIASES[bookQuery];

      const coordinateFiltered = allVerses.filter((v) => {
        const vBookLower = v.book.toLowerCase();
        const bookMatches = resolvedBook
          ? v.book === resolvedBook
          : vBookLower.startsWith(bookQuery) ||
            vBookLower.replace(/\s+/g, "").startsWith(bookQuery.replace(/\s+/g, ""));

        if (!bookMatches) return false;
        if (chapterNum !== null && v.chapter !== chapterNum) return false;
        if (verseNum !== null && v.verse !== verseNum) {
          return String(v.verse).startsWith(String(verseNum));
        }
        return true;
      });

      coordinateFiltered.sort((a, b) => {
        if (verseNum !== null) {
          if (a.verse === verseNum && b.verse !== verseNum) return -1;
          if (b.verse === verseNum && a.verse !== verseNum) return 1;
        }
        if (a.book !== b.book) return a.book.localeCompare(b.book);
        if (a.chapter !== b.chapter) return a.chapter - b.chapter;
        return a.verse - b.verse;
      });

      if (coordinateFiltered.length > 0) {
        return coordinateFiltered.slice(0, 15);
      }
    }

    return allVerses
      .filter(
        (v) =>
          v.id.toLowerCase().includes(lower) ||
          v.text.toLowerCase().includes(lower)
      )
      .slice(0, 15);
  }, [quickFindInput, allVerses]);

  // Local IndexedDB keyword & phrase search via Dexie
  useEffect(() => {
    const trimmed = searchQuery.trim().toLowerCase();
    if (!trimmed) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    let cancelled = false;
    setIsSearching(true);

    db.verses
      .filter((v) => {
        const haystack = `${v.id} ${v.text}`.toLowerCase();
        return haystack.includes(trimmed);
      })
      .limit(40)
      .toArray()
      .then((results) => {
        if (!cancelled) {
          setSearchResults(results);
          setIsSearching(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [searchQuery]);

  // TSK Cross-References for currently selected verse
  const tskReferences: TSKReference[] = useMemo(() => {
    if (!selectedVerse) return [];
    return getTSKForVerse(selectedVerse, allVerses);
  }, [selectedVerse, allVerses]);

  // Margin notes for selected verse vs current chapter
  const selectedVerseNotes = useMemo(() => {
    if (!selectedVerse) return [];
    return marginNotes.filter((n) => n.verseId === selectedVerse.id);
  }, [marginNotes, selectedVerse]);

  const chapterNotes = useMemo(() => {
    return marginNotes.filter(
      (n) => n.book === selectedBook && n.chapter === selectedChapter
    );
  }, [marginNotes, selectedBook, selectedChapter]);

  const handleSetHighlight = async (verse: KJVerseRecord, color: HomileticColor | null) => {
    if (!color) {
      await db.highlights.delete(verse.id);
      setHighlightsMap((prev) => {
        const next = { ...prev };
        delete next[verse.id];
        return next;
      });
      return;
    }

    const swatch = HOMILETIC_SWATCHES.find((s) => s.color === color)!;
    const record: VerseHighlight = {
      verseId: verse.id,
      color: swatch.color,
      label: swatch.label,
      updatedAt: Date.now(),
    };
    await db.highlights.put(record);
    setHighlightsMap((prev) => ({ ...prev, [verse.id]: record }));
  };

  const handleAddMarginNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVerse || !newNoteText.trim()) return;

    const note: MarginNote = {
      id: `note-${Date.now()}`,
      verseId: selectedVerse.id,
      book: selectedVerse.book,
      chapter: selectedVerse.chapter,
      verse: selectedVerse.verse,
      noteText: newNoteText.trim(),
      updatedAt: Date.now(),
    };

    await db.marginNotes.put(note);
    setMarginNotes((prev) => [note, ...prev]);
    setNewNoteText("");
  };

  const handleDeleteMarginNote = async (id: string) => {
    await db.marginNotes.delete(id);
    setMarginNotes((prev) => prev.filter((n) => n.id !== id));
  };

  const triggerInsertCard = (ref: string, text: string, context?: string) => {
    onInsertScriptureCard(ref, text, context);
    setInsertedFeedbackId(ref);
    setTimeout(() => {
      setInsertedFeedbackId((prev) => (prev === ref ? null : prev));
    }, 1600);
  };

  const handleJumpToVerse = (v: KJVerseRecord) => {
    pendingScrollVerseIdRef.current = v.id;
    setFilterSwatch("all");
    setSelectedBook(v.book);
    setSelectedChapter(v.chapter);
    setSelectedVerse(v);
    setSearchQuery("");
    setIsQuickFindOpen(false);
    setQuickFindInput("");
  };

  const handleJumpToDensityPassage = (item: PassageDensityItem) => {
    const exactMatch =
      allVerses.find(
        (v) =>
          v.book === item.book &&
          v.chapter === item.chapter &&
          v.verse === item.verse
      ) ||
      allVerses.find(
        (v) => v.book === item.book && v.chapter === item.chapter
      ) ||
      allVerses.find((v) => v.book === item.book);

    if (exactMatch) {
      handleJumpToVerse(exactMatch);
    } else {
      const meta = KJV_BOOKS_METADATA.find((b) => b.book === item.book);
      if (meta) {
        setFilterSwatch("all");
        setSelectedBook(meta.book);
        setSelectedChapter(
          meta.chapters.includes(item.chapter) ? item.chapter : meta.chapters[0]
        );
        setSearchQuery("");
      }
    }
  };

  const handleJumpToDensityBook = (bookName: string) => {
    const meta = KJV_BOOKS_METADATA.find((b) => b.book === bookName);
    if (!meta) return;
    setFilterSwatch("all");
    setSelectedBook(meta.book);
    setSelectedChapter(meta.chapters[0]);
    setSearchQuery("");
  };

  const maxPassageCount =
    passageDensity.length > 0 ? Math.max(...passageDensity.map((p) => p.count), 1) : 1;
  const maxBookCount =
    bookDensity.length > 0 ? Math.max(...bookDensity.map((b) => b.count), 1) : 1;

  // Helper to render interactive missing-word Cloze tokens
  const renderClozeVerseInteractive = () => {
    if (!activeMemoryVerse) return null;

    return (
      <p className="text-sm font-serif-kjv leading-relaxed text-neutral-900 dark:text-neutral-100">
        {activeClozeTokens.map((tok) => {
          if (!tok.isBlank) {
            return <span key={tok.index}>{tok.raw} </span>;
          }

          const isRevealed = isAllWordsRevealed || revealedWordIndices.has(tok.index);
          const hintText = showFirstLetterHint
            ? `${tok.cleanWord[0]}${"_".repeat(Math.max(3, tok.cleanWord.length - 1))}`
            : "_".repeat(Math.max(4, tok.cleanWord.length));

          return (
            <span key={tok.index}>
              {tok.prefixPunct}
              <button
                type="button"
                onClick={() => toggleRevealSingleWord(tok.index)}
                title={
                  isRevealed
                    ? "Click to hide word again"
                    : "Click to reveal missing word"
                }
                className={`inline-block px-1.5 py-0.5 mx-0.5 rounded font-mono-tabular text-xs font-semibold transition-colors ${
                  isRevealed
                    ? "bg-emerald-100 dark:bg-emerald-950/70 text-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700"
                    : "bg-amber-100/90 dark:bg-amber-950/60 text-amber-950 dark:text-amber-300 border border-dashed border-amber-400 dark:border-amber-600 hover:bg-amber-200 dark:hover:bg-amber-900/60"
                }`}
              >
                {isRevealed ? tok.cleanWord : hintText}
              </button>
              {tok.suffixPunct}{" "}
            </span>
          );
        })}
      </p>
    );
  };

  return (
    <section
      aria-label="KJV Scripture & Cross-Reference Study Desk"
      className="relative flex flex-col h-full bg-white dark:bg-black border-r border-neutral-200 dark:border-neutral-800 select-none sm:select-text transition-colors"
    >
      {/* Top Study Control Bar: Book, Chapter, Verse Range, Quick Find, Memory Recall, Density Map & Search */}
      <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 space-y-3 bg-neutral-50/60 dark:bg-neutral-950">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <BookOpen className="w-4 h-4 text-neutral-700 dark:text-amber-400 shrink-0" />
            <span className="text-xs font-semibold tracking-tight text-neutral-900 dark:text-white">
              KJV Study Desk
            </span>
            <span aria-hidden="true" className="text-neutral-300 dark:text-neutral-700">
              ·
            </span>
            <button
              type="button"
              onClick={() => setIsQuickFindOpen(true)}
              title="Quick Find any KJV verse by book and chapter:verse (Ctrl/Cmd + K)"
              className="px-2 py-1 text-[11px] font-semibold bg-neutral-900 dark:bg-amber-400 text-white dark:text-black rounded hover:bg-neutral-800 dark:hover:bg-amber-300 transition-colors flex items-center gap-1 whitespace-nowrap shrink-0"
            >
              <Compass className="w-3 h-3" />
              <span>Quick Find</span>
              <span className="font-mono-tabular text-[10px] text-neutral-300 dark:text-neutral-900">
                ⌘K
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsPeriodicRecallPopupOpen((prev) => !prev);
                setActiveBottomTab("memory");
              }}
              title="Open Memory Deck Pulpit Recall Flashcard (missing-word drill)"
              className={`px-2 py-1 text-[11px] font-medium rounded border transition-colors flex items-center gap-1 whitespace-nowrap shrink-0 ${
                isPeriodicRecallPopupOpen
                  ? "bg-amber-500 text-black border-amber-500 font-semibold"
                  : "bg-white dark:bg-black text-neutral-700 dark:text-neutral-300 border-neutral-300 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-900"
              }`}
            >
              <Brain className="w-3 h-3" />
              <span>Memory Deck ({memoryDeck.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setIsDensitySidebarOpen((prev) => !prev)}
              title="Toggle Visual Reference Density Map across all saved sermons in IndexedDB"
              className={`px-2 py-1 text-[11px] font-medium rounded border transition-colors flex items-center gap-1 whitespace-nowrap shrink-0 ${
                isDensitySidebarOpen
                  ? "bg-neutral-900 dark:bg-white text-white dark:text-black border-neutral-900 dark:border-white"
                  : "bg-white dark:bg-black text-neutral-700 dark:text-neutral-300 border-neutral-300 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-900"
              }`}
            >
              <BarChart3 className="w-3 h-3" />
              <span>Density Map</span>
              {isDensitySidebarOpen ? (
                <ChevronRight className="w-3 h-3" />
              ) : (
                <ChevronLeft className="w-3 h-3" />
              )}
            </button>
          </div>

          {/* Swatch Filter Buttons */}
          <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-900 p-0.5 rounded border border-neutral-200 dark:border-neutral-800">
            <button
              type="button"
              onClick={() => setFilterSwatch("all")}
              className={`px-2 py-1 text-[11px] font-medium rounded transition-colors whitespace-nowrap shrink-0 ${
                filterSwatch === "all"
                  ? "bg-neutral-900 dark:bg-white text-white dark:text-black"
                  : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
              }`}
            >
              All
            </button>
            {HOMILETIC_SWATCHES.map((sw) => (
              <button
                key={sw.color}
                type="button"
                onClick={() =>
                  setFilterSwatch((prev) => (prev === sw.color ? "all" : sw.color))
                }
                title={`Filter by ${sw.label}`}
                className={`px-2 py-1 text-[11px] font-medium rounded transition-colors whitespace-nowrap shrink-0 ${
                  filterSwatch === sw.color
                    ? "bg-neutral-900 dark:bg-white text-white dark:text-black"
                    : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                }`}
              >
                {sw.shortLabel}
              </button>
            ))}
          </div>
        </div>

        {/* Selectors Row: Book, Chapter, Verse Range */}
        <div className="grid grid-cols-12 gap-2 items-center">
          <div className="col-span-5">
            <label className="block text-[11px] font-medium text-neutral-500 dark:text-neutral-400 mb-1">
              Book
            </label>
            <select
              aria-label="Select Bible Book"
              value={selectedBook}
              onChange={(e) => {
                const newBook = e.target.value;
                setSelectedBook(newBook);
                const meta = KJV_BOOKS_METADATA.find((b) => b.book === newBook);
                if (meta && meta.chapters.length > 0) {
                  setSelectedChapter(meta.chapters[0]);
                }
              }}
              className="w-full h-9 px-2.5 text-xs font-medium bg-white dark:bg-black border border-neutral-300 dark:border-neutral-800 rounded text-neutral-900 dark:text-white focus:outline-none focus:border-neutral-900 dark:focus:border-amber-400"
            >
              {KJV_BOOKS_METADATA.map((b) => (
                <option key={b.book} value={b.book}>
                  {b.book} ({b.testament})
                </option>
              ))}
            </select>
          </div>

          <div className="col-span-3">
            <label className="block text-[11px] font-medium text-neutral-500 dark:text-neutral-400 mb-1">
              Chapter
            </label>
            <select
              aria-label="Select Chapter"
              value={selectedChapter}
              onChange={(e) => setSelectedChapter(Number(e.target.value))}
              className="w-full h-9 px-2.5 text-xs font-mono-tabular font-medium bg-white dark:bg-black border border-neutral-300 dark:border-neutral-800 rounded text-neutral-900 dark:text-white focus:outline-none focus:border-neutral-900 dark:focus:border-amber-400"
            >
              {availableChapters.map((ch) => (
                <option key={ch} value={ch}>
                  Ch. {ch}
                </option>
              ))}
            </select>
          </div>

          <div className="col-span-4">
            <label className="block text-[11px] font-medium text-neutral-500 dark:text-neutral-400 mb-1">
              Verse Range
            </label>
            <div className="flex items-center gap-1">
              <select
                aria-label="Start Verse"
                value={verseRangeStart}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setVerseRangeStart(val);
                  if (val > verseRangeEnd) setVerseRangeEnd(val);
                }}
                className="w-full h-9 px-1.5 text-xs font-mono-tabular bg-white dark:bg-black border border-neutral-300 dark:border-neutral-800 rounded text-neutral-900 dark:text-white focus:outline-none focus:border-neutral-900 dark:focus:border-amber-400"
              >
                {chapterVerses.map((v) => (
                  <option key={v.verse} value={v.verse}>
                    v.{v.verse}
                  </option>
                ))}
              </select>
              <span className="text-xs text-neutral-400 dark:text-neutral-600">–</span>
              <select
                aria-label="End Verse"
                value={verseRangeEnd}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setVerseRangeEnd(val);
                  if (val < verseRangeStart) setVerseRangeStart(val);
                }}
                className="w-full h-9 px-1.5 text-xs font-mono-tabular bg-white dark:bg-black border border-neutral-300 dark:border-neutral-800 rounded text-neutral-900 dark:text-white focus:outline-none focus:border-neutral-900 dark:focus:border-amber-400"
              >
                {chapterVerses.map((v) => (
                  <option key={v.verse} value={v.verse}>
                    v.{v.verse}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Instant Local IndexedDB Keyword & Phrase Search */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-neutral-400 dark:text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Instant KJV keyword or phrase search (e.g. 'propitiation', 'conquerors', 'shepherd')..."
            className="w-full h-9 pl-8 pr-8 text-xs bg-white dark:bg-black border border-neutral-300 dark:border-neutral-800 rounded text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-none focus:border-neutral-900 dark:focus:border-amber-400"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              aria-label="Clear search"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-800 dark:hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Periodic Pulpit Recall Banner (Displays Periodically with Missing Words) */}
      {isPeriodicRecallPopupOpen && activeMemoryVerse && (
        <div className="mx-4 mt-3 p-3.5 bg-neutral-900 dark:bg-neutral-950 text-white border border-neutral-800 dark:border-amber-400/70 rounded shadow-lg space-y-2.5 shrink-0">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="text-xs font-bold tracking-tight text-amber-400">
                Pulpit Memory Recall — {activeMemoryVerse.verseId} (KJV)
              </span>
              <span className="text-[11px] font-mono-tabular text-neutral-400">
                · Mastery {activeMemoryVerse.masteryCount}x
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              {(["light", "standard", "mastery"] as ClozeDifficulty[]).map(
                (diff) => (
                  <button
                    key={diff}
                    type="button"
                    onClick={() => setClozeDifficulty(diff)}
                    className={`px-2 py-0.5 text-[10px] font-semibold rounded capitalize transition-colors ${
                      clozeDifficulty === diff
                        ? "bg-amber-400 text-black"
                        : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
                    }`}
                  >
                    {diff}
                  </button>
                )
              )}
              <button
                type="button"
                onClick={() => setIsPeriodicRecallPopupOpen(false)}
                aria-label="Dismiss recall prompt"
                className="p-1 text-neutral-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="p-3 bg-white dark:bg-black rounded border border-neutral-200 dark:border-neutral-800">
            {renderClozeVerseInteractive()}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsAllWordsRevealed((prev) => !prev)}
                className="px-2.5 py-1 text-[11px] font-medium bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded flex items-center gap-1"
              >
                {isAllWordsRevealed ? (
                  <>
                    <EyeOff className="w-3 h-3" />
                    <span>Hide Blanks</span>
                  </>
                ) : (
                  <>
                    <Eye className="w-3 h-3" />
                    <span>Reveal All Words</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => setShowFirstLetterHint((prev) => !prev)}
                className="px-2.5 py-1 text-[11px] font-medium bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded"
              >
                {showFirstLetterHint ? "First-Letter Hints: ON" : "Hints: OFF"}
              </button>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() =>
                  setActiveMemoryIndex((prev) => (prev + 1) % memoryDeck.length)
                }
                className="px-2.5 py-1 text-[11px] font-medium bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded"
              >
                Next Verse →
              </button>
              <button
                type="button"
                onClick={() => {
                  handleMarkMemoryRecalled(activeMemoryVerse);
                  setIsPeriodicRecallPopupOpen(false);
                }}
                className="px-3 py-1 text-[11px] font-semibold bg-amber-400 hover:bg-amber-300 text-black rounded flex items-center gap-1"
              >
                <Check className="w-3 h-3" />
                <span>Recalled Clearly (+1)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Middle Split Region: KJV Reader Viewport + Visual Reference Density Map Sidebar */}
      <div className="flex-1 flex min-h-0 overflow-hidden bg-white dark:bg-black">
        {/* Main Reader Viewport OR Instant IndexedDB Search Results */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2.5 min-h-[220px]">
          {searchQuery.trim() ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between pb-2 border-b border-neutral-200 dark:border-neutral-800">
                <span className="text-xs font-semibold text-neutral-900 dark:text-white">
                  IndexedDB Search Results for &ldquo;{searchQuery}&rdquo;
                </span>
                <span className="text-xs font-mono-tabular text-neutral-500 dark:text-neutral-400">
                  {isSearching ? "Searching..." : `${searchResults.length} matches`}
                </span>
              </div>
              {searchResults.length === 0 && !isSearching ? (
                <div className="py-8 text-center text-xs text-neutral-500 dark:text-neutral-400">
                  No KJV verses matched &ldquo;{searchQuery}&rdquo;. Try another keyword such as
                  &ldquo;grace&rdquo;, &ldquo;spirit&rdquo;, or &ldquo;predestinate&rdquo;.
                </div>
              ) : (
                searchResults.map((v) => {
                  const isMemorized = Boolean(memoryMap[v.id]);
                  return (
                    <div
                      key={v.id}
                      className="p-3 border border-neutral-200 dark:border-neutral-800 rounded bg-neutral-50/50 dark:bg-neutral-950 hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors space-y-1.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => handleJumpToVerse(v)}
                          className="text-xs font-mono-tabular font-semibold text-neutral-900 dark:text-amber-400 hover:underline flex items-center gap-1"
                        >
                          <span>{v.id}</span>
                          <ArrowUpRight className="w-3 h-3 text-neutral-500 dark:text-neutral-400" />
                        </button>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleToggleMemoryVerse(v)}
                            className={`px-2 py-1 text-[11px] font-medium rounded border transition-colors flex items-center gap-1 whitespace-nowrap shrink-0 ${
                              isMemorized
                                ? "bg-amber-500 text-black border-amber-500 font-semibold"
                                : "bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                            }`}
                          >
                            <Brain className="w-3 h-3" />
                            <span>{isMemorized ? "In Memory Deck" : "+ Memorize"}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => triggerInsertCard(v.id, v.text, "KJV Search Result")}
                            className="px-2.5 py-1 text-[11px] font-medium bg-neutral-900 dark:bg-amber-400 text-white dark:text-black rounded hover:bg-neutral-800 dark:hover:bg-amber-300 transition-colors flex items-center gap-1 whitespace-nowrap shrink-0"
                          >
                            <FilePlus2 className="w-3 h-3" />
                            <span>
                              {insertedFeedbackId === v.id
                                ? "Inserted into Manuscript"
                                : "Insert Scripture Card"}
                            </span>
                          </button>
                        </div>
                      </div>
                      <p className="text-sm font-serif-kjv text-neutral-800 dark:text-neutral-200 leading-relaxed">
                        {v.text}
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            <>
              {/* Active Chapter Header */}
              <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-neutral-800">
                <h2 className="text-base font-bold tracking-tight text-neutral-900 dark:text-white">
                  {selectedBook} {selectedChapter}
                </h2>
                <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
                  <span className="font-mono-tabular">{visibleVerses.length} verses</span>
                  <span aria-hidden="true">·</span>
                  <span>Click verse for TSK, Highlights &amp; Memory Deck</span>
                </div>
              </div>

              {visibleVerses.length === 0 ? (
                <div className="py-8 text-center text-xs text-neutral-500 dark:text-neutral-400">
                  No verses match the active highlight filter in this chapter.
                  <button
                    type="button"
                    onClick={() => setFilterSwatch("all")}
                    className="ml-2 underline font-medium text-neutral-900 dark:text-amber-400"
                  >
                    Show All Verses
                  </button>
                </div>
              ) : (
                visibleVerses.map((v) => {
                  const isSelected = selectedVerse?.id === v.id;
                  const hl = highlightsMap[v.id];
                  const swatchConfig = hl
                    ? HOMILETIC_SWATCHES.find((s) => s.color === hl.color)
                    : null;
                  const vNotes = marginNotes.filter((n) => n.verseId === v.id);
                  const memoryEntry = memoryMap[v.id];

                  return (
                    <div
                      key={v.id}
                      id={`kjv-verse-${v.id}`}
                      onClick={() => setSelectedVerse(v)}
                      className={`group rounded p-3 transition-colors cursor-pointer border ${
                        isSelected
                          ? "border-neutral-900 dark:border-amber-400 bg-neutral-50/80 dark:bg-neutral-950"
                          : swatchConfig
                          ? `${swatchConfig.bgClass} ${swatchConfig.borderClass}`
                          : "border-transparent hover:border-neutral-200 dark:hover:border-neutral-800 hover:bg-neutral-50/50 dark:hover:bg-neutral-950/60"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <p
                          className={`text-[15px] font-serif-kjv leading-relaxed ${
                            swatchConfig
                              ? swatchConfig.textClass
                              : "text-neutral-900 dark:text-neutral-100"
                          }`}
                        >
                          <span className="font-mono-tabular text-xs font-semibold text-neutral-500 dark:text-amber-400/80 mr-2 select-none">
                            {v.chapter}:{v.verse}
                          </span>
                          {v.text}
                        </p>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleMemoryVerse(v);
                            }}
                            title={
                              memoryEntry
                                ? "Flagged in Memory Deck (click to remove)"
                                : "Flag verse for Memorization in Memory Deck"
                            }
                            className={`px-2 py-1 text-[11px] font-medium border rounded transition-colors flex items-center gap-1 whitespace-nowrap shrink-0 ${
                              memoryEntry
                                ? "bg-amber-500 text-black border-amber-500 font-semibold"
                                : "opacity-80 group-hover:opacity-100 border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 hover:border-neutral-900 dark:hover:border-amber-400"
                            }`}
                          >
                            <Brain className="w-3 h-3" />
                            <span>{memoryEntry ? "Memorize ✓" : "Memorize"}</span>
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              triggerInsertCard(v.id, v.text, "Primary Scripture Selection");
                            }}
                            title="Insert Scripture Card into Manuscript"
                            className="opacity-85 group-hover:opacity-100 px-2 py-1 text-[11px] font-medium border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 rounded hover:bg-neutral-900 dark:hover:bg-amber-400 hover:text-white dark:hover:text-black hover:border-neutral-900 dark:hover:border-amber-400 transition-colors whitespace-nowrap shrink-0"
                          >
                            {insertedFeedbackId === v.id ? "Inserted" : "+ Card"}
                          </button>
                        </div>
                      </div>

                      {/* Metadata Line: Active Homiletic Swatch Label, Memory Deck Status & Margin Note Preview */}
                      {(swatchConfig || memoryEntry || vNotes.length > 0) && (
                        <div className="mt-2 pt-1.5 border-t border-neutral-200/60 dark:border-neutral-800 flex flex-wrap items-center gap-2 text-[11px] text-neutral-600 dark:text-neutral-400">
                          {swatchConfig && (
                            <span className="font-medium text-neutral-800 dark:text-amber-300">
                              [{swatchConfig.label}]
                            </span>
                          )}
                          {swatchConfig && (memoryEntry || vNotes.length > 0) && (
                            <span aria-hidden="true">·</span>
                          )}
                          {memoryEntry && (
                            <span className="font-mono-tabular font-semibold text-amber-800 dark:text-amber-400">
                              Memory Deck (Mastery {memoryEntry.masteryCount}x)
                            </span>
                          )}
                          {memoryEntry && vNotes.length > 0 && (
                            <span aria-hidden="true">·</span>
                          )}
                          {vNotes.length > 0 && (
                            <span className="italic text-neutral-700 dark:text-neutral-300 truncate max-w-md">
                              Note: {vNotes[0].noteText}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Inline Homiletic Highlighting Bar when Selected */}
                      {isSelected && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="mt-3 pt-2.5 border-t border-neutral-200 dark:border-neutral-800 flex flex-wrap items-center justify-between gap-2"
                        >
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400 flex items-center gap-1 mr-1">
                              <Highlighter className="w-3 h-3" />
                              <span>Homiletic Swatch:</span>
                            </span>
                            {HOMILETIC_SWATCHES.map((sw) => {
                              const active = hl?.color === sw.color;
                              return (
                                <button
                                  key={sw.color}
                                  type="button"
                                  onClick={() =>
                                    handleSetHighlight(v, active ? null : sw.color)
                                  }
                                  className={`px-2 py-1 text-[11px] font-medium rounded border transition-colors whitespace-nowrap shrink-0 ${
                                    active
                                      ? "bg-neutral-900 dark:bg-amber-400 text-white dark:text-black border-neutral-900 dark:border-amber-400"
                                      : `${sw.bgClass} ${sw.textClass} ${sw.borderClass} hover:opacity-90`
                                  }`}
                                >
                                  {sw.label}
                                </button>
                              );
                            })}
                            {hl && (
                              <button
                                type="button"
                                onClick={() => handleSetHighlight(v, null)}
                                className="px-2 py-1 text-[11px] text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white underline whitespace-nowrap shrink-0"
                              >
                                Clear
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </>
          )}
        </div>

        {/* Visual Reference Density Map Sidebar Graph */}
        {isDensitySidebarOpen && (
          <aside
            aria-label="Visual Reference Density Map"
            className="w-[205px] xl:w-[225px] border-l border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-950 flex flex-col shrink-0 overflow-hidden"
          >
            {/* Sidebar Header */}
            <div className="p-3 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-black space-y-2">
              <div className="flex items-center justify-between gap-1">
                <div className="flex items-center gap-1.5">
                  <BarChart3 className="w-3.5 h-3.5 text-neutral-900 dark:text-amber-400 shrink-0" />
                  <h3 className="text-[11px] font-bold tracking-tight text-neutral-900 dark:text-white">
                    Reference Density
                  </h3>
                </div>
                <span className="text-[10px] font-mono-tabular text-neutral-500 dark:text-neutral-400">
                  {sermonsForDensity.length} sermons
                </span>
              </div>

              {/* Passages vs Books Switcher */}
              <div className="grid grid-cols-2 gap-1 bg-neutral-100 dark:bg-neutral-900 p-0.5 rounded border border-neutral-200 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => setDensityMode("passages")}
                  className={`py-1 text-[10px] font-semibold rounded transition-colors ${
                    densityMode === "passages"
                      ? "bg-white dark:bg-neutral-800 text-neutral-900 dark:text-amber-400 shadow-xs"
                      : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                  }`}
                >
                  Top Passages
                </button>
                <button
                  type="button"
                  onClick={() => setDensityMode("books")}
                  className={`py-1 text-[10px] font-semibold rounded transition-colors ${
                    densityMode === "books"
                      ? "bg-white dark:bg-neutral-800 text-neutral-900 dark:text-amber-400 shadow-xs"
                      : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                  }`}
                >
                  By Book ({bookDensity.length})
                </button>
              </div>

              {/* OT vs NT Proportion Bar */}
              {totalReferencesCount > 0 && (
                <div className="space-y-1 pt-0.5">
                  <div className="flex items-center justify-between text-[10px] font-mono-tabular text-neutral-500 dark:text-neutral-400">
                    <span>
                      OT {Math.round((otCount / totalReferencesCount) * 100)}%
                    </span>
                    <span>{totalReferencesCount} refs</span>
                    <span>
                      NT {Math.round((ntCount / totalReferencesCount) * 100)}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden flex">
                    <div
                      style={{
                        width: `${Math.round(
                          (otCount / totalReferencesCount) * 100
                        )}%`,
                      }}
                      className="h-full bg-amber-600 dark:bg-amber-500 transition-all"
                      title={`Old Testament citations: ${otCount}`}
                    />
                    <div
                      style={{
                        width: `${
                          100 -
                          Math.round((otCount / totalReferencesCount) * 100)
                        }%`,
                      }}
                      className="h-full bg-neutral-900 dark:bg-amber-300 transition-all"
                      title={`New Testament citations: ${ntCount}`}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Density Bar Graph List */}
            <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5">
              {densityMode === "passages" ? (
                passageDensity.length === 0 ? (
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 py-6 text-center">
                    No Scripture citations indexed yet.
                  </p>
                ) : (
                  passageDensity.map((item) => {
                    const widthPct = Math.max(
                      12,
                      Math.round((item.count / maxPassageCount) * 100)
                    );
                    const isCurrentActive =
                      selectedBook === item.book &&
                      selectedChapter === item.chapter;

                    return (
                      <button
                        key={item.ref}
                        type="button"
                        onClick={() => handleJumpToDensityPassage(item)}
                        title={`Cited ${item.count}x across ${
                          item.sermonIds.size
                        } sermon(s): ${item.sermonTitles.join(", ")}. Click to open in KJV reader.`}
                        className={`w-full text-left p-2 rounded border transition-colors space-y-1.5 group ${
                          isCurrentActive
                            ? "bg-white dark:bg-black border-neutral-900 dark:border-amber-400"
                            : "bg-white/80 dark:bg-black/70 border-neutral-200/80 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-700"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[11px] font-mono-tabular font-bold text-neutral-900 dark:text-white truncate group-hover:underline">
                            {item.ref}
                          </span>
                          <span className="text-[10px] font-mono-tabular font-semibold text-neutral-600 dark:text-amber-400 shrink-0">
                            {item.count}x
                          </span>
                        </div>

                        <div className="h-2 w-full bg-neutral-100 dark:bg-neutral-900 rounded-xs overflow-hidden">
                          <div
                            style={{ width: `${widthPct}%` }}
                            className={`h-full transition-all ${
                              isCurrentActive
                                ? "bg-amber-500 dark:bg-amber-400"
                                : "bg-neutral-800 dark:bg-amber-500/80 group-hover:bg-neutral-900 dark:group-hover:bg-amber-400"
                            }`}
                          />
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-neutral-500 dark:text-neutral-400">
                          <span className="truncate">
                            {item.sermonIds.size}{" "}
                            {item.sermonIds.size === 1 ? "sermon" : "sermons"}
                          </span>
                          <span className="font-mono-tabular opacity-0 group-hover:opacity-100 text-neutral-900 dark:text-amber-400 transition-opacity">
                            Jump →
                          </span>
                        </div>
                      </button>
                    );
                  })
                )
              ) : (
                bookDensity.map((b) => {
                  const widthPct = Math.max(
                    12,
                    Math.round((b.count / maxBookCount) * 100)
                  );
                  const isBookSelected = selectedBook === b.book;

                  return (
                    <button
                      key={b.book}
                      type="button"
                      onClick={() => handleJumpToDensityBook(b.book)}
                      className={`w-full text-left p-2 rounded border transition-colors space-y-1.5 group ${
                        isBookSelected
                          ? "bg-white dark:bg-black border-neutral-900 dark:border-amber-400"
                          : "bg-white/80 dark:bg-black/70 border-neutral-200/80 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-700"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[11px] font-bold text-neutral-900 dark:text-white truncate">
                          {b.book}
                        </span>
                        <span className="text-[10px] font-mono-tabular text-neutral-500 dark:text-amber-400 shrink-0">
                          {b.count} refs
                        </span>
                      </div>

                      <div className="h-2 w-full bg-neutral-100 dark:bg-neutral-900 rounded-xs overflow-hidden">
                        <div
                          style={{ width: `${widthPct}%` }}
                          className={`h-full transition-all ${
                            b.testament === "OT"
                              ? "bg-amber-600 dark:bg-amber-500"
                              : "bg-neutral-900 dark:bg-amber-400"
                          }`}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-neutral-500 dark:text-neutral-400">
                        <span>{b.testament} Canon</span>
                        <span>
                          {b.sermonCount}{" "}
                          {b.sermonCount === 1 ? "sermon" : "sermons"}
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            <div className="px-3 py-2 border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-black text-[10px] text-neutral-500 dark:text-neutral-400 leading-tight">
              Live IndexedDB density map across saved sermons. Click any bar to jump.
            </div>
          </aside>
        )}
      </div>

      {/* Bottom Study Drawer: TSK Cross-References, Margin Notes Tray & Memory Deck */}
      <div className="h-[290px] border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-950 flex flex-col shrink-0">
        {/* Drawer Header Tabs */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-black gap-2">
          <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-900 p-0.5 rounded border border-neutral-200 dark:border-neutral-800">
            <button
              type="button"
              onClick={() => setActiveBottomTab("tsk")}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 ${
                activeBottomTab === "tsk"
                  ? "bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-xs"
                  : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
              }`}
            >
              TSK Cross-Refs ({tskReferences.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveBottomTab("notes")}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 ${
                activeBottomTab === "notes"
                  ? "bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-xs"
                  : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
              }`}
            >
              Margin Notes ({chapterNotes.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveBottomTab("memory")}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-colors flex items-center gap-1 whitespace-nowrap shrink-0 ${
                activeBottomTab === "memory"
                  ? "bg-white dark:bg-neutral-800 text-neutral-900 dark:text-amber-400 shadow-xs"
                  : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
              }`}
            >
              <Brain className="w-3 h-3" />
              <span>Memory Deck ({memoryDeck.length})</span>
            </button>
          </div>

          {activeBottomTab === "memory" ? (
            <div className="flex items-center gap-1.5 text-[11px] font-mono-tabular text-neutral-600 dark:text-neutral-400">
              <Clock className="w-3 h-3 text-amber-600 dark:text-amber-400" />
              <span>Periodic Recall:</span>
              <select
                aria-label="Periodic Recall Interval"
                value={periodicIntervalSec}
                onChange={(e) => setPeriodicIntervalSec(Number(e.target.value))}
                className="h-6 px-1.5 text-[11px] bg-neutral-100 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded text-neutral-900 dark:text-white"
              >
                <option value={45}>Every 45s ({secondsUntilNextRecall}s)</option>
                <option value={60}>Every 1m ({secondsUntilNextRecall}s)</option>
                <option value={120}>Every 2m ({secondsUntilNextRecall}s)</option>
                <option value={0}>Paused</option>
              </select>
            </div>
          ) : (
            selectedVerse && (
              <div className="text-xs font-mono-tabular font-semibold text-neutral-700 dark:text-amber-400 truncate">
                Coordinate: {selectedVerse.id}
              </div>
            )
          )}
        </div>

        {/* Tab 1: Treasury of Scripture Knowledge (TSK) Cross-Reference Panel */}
        {activeBottomTab === "tsk" ? (
          <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
            {!selectedVerse ? (
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Select any verse above to inspect Treasury of Scripture Knowledge (TSK)
                parallel cross-references.
              </p>
            ) : (
              <>
                <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400 pb-1">
                  <span>
                    Parallel Scriptures illuminating{" "}
                    <strong className="text-neutral-900 dark:text-white font-mono-tabular">
                      {selectedVerse.id}
                    </strong>
                  </span>
                  <span>One-click manuscript insertion</span>
                </div>
                {tskReferences.map((tsk) => (
                  <div
                    key={`${selectedVerse.id}-${tsk.ref}`}
                    className="p-3 bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-xs">
                        <Bookmark className="w-3.5 h-3.5 text-neutral-600 dark:text-amber-400 shrink-0" />
                        <span className="font-mono-tabular font-semibold text-neutral-900 dark:text-white">
                          {tsk.ref}
                        </span>
                        <span aria-hidden="true" className="text-neutral-300 dark:text-neutral-700">
                          ·
                        </span>
                        <span className="text-neutral-600 dark:text-neutral-400">{tsk.theme}</span>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          triggerInsertCard(
                            tsk.ref,
                            tsk.text,
                            `TSK Cross-Reference on ${selectedVerse.id} (${tsk.theme})`
                          )
                        }
                        className="px-2.5 py-1 text-[11px] font-medium bg-neutral-900 dark:bg-amber-400 text-white dark:text-black rounded hover:bg-neutral-800 dark:hover:bg-amber-300 transition-colors flex items-center gap-1 whitespace-nowrap shrink-0"
                      >
                        <FilePlus2 className="w-3 h-3" />
                        <span>
                          {insertedFeedbackId === tsk.ref
                            ? "Inserted!"
                            : "Insert Scripture Card into Manuscript"}
                        </span>
                      </button>
                    </div>
                    <p className="text-xs font-serif-kjv text-neutral-800 dark:text-neutral-200 leading-relaxed">
                      &ldquo;{tsk.text}&rdquo;
                    </p>
                  </div>
                ))}
              </>
            )}
          </div>
        ) : activeBottomTab === "notes" ? (
          /* Tab 2: Margin Notes Tray Attached to Specific Verse Coordinates */
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {selectedVerse && (
              <form onSubmit={handleAddMarginNote} className="flex items-center gap-2">
                <input
                  type="text"
                  value={newNoteText}
                  onChange={(e) => setNewNoteText(e.target.value)}
                  placeholder={`Attach exegetical margin note to ${selectedVerse.id}...`}
                  className="flex-1 h-8 px-3 text-xs bg-white dark:bg-black border border-neutral-300 dark:border-neutral-800 rounded text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-none focus:border-neutral-900 dark:focus:border-amber-400"
                />
                <button
                  type="submit"
                  className="h-8 px-3 text-xs font-medium bg-neutral-900 dark:bg-amber-400 text-white dark:text-black rounded hover:bg-neutral-800 dark:hover:bg-amber-300 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
                >
                  <MessageSquarePlus className="w-3.5 h-3.5" />
                  <span>Attach Note</span>
                </button>
              </form>
            )}

            <div className="space-y-2">
              {selectedVerseNotes.length === 0 && chapterNotes.length === 0 ? (
                <p className="text-xs text-neutral-500 dark:text-neutral-400 py-4 text-center">
                  No margin notes attached to {selectedBook} {selectedChapter} yet. Select a
                  verse and add an exegetical note above.
                </p>
              ) : (
                (selectedVerseNotes.length > 0 ? selectedVerseNotes : chapterNotes).map(
                  (note) => (
                    <div
                      key={note.id}
                      className="p-2.5 bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded flex items-start justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-[11px] text-neutral-500 dark:text-neutral-400">
                          <span className="font-mono-tabular font-semibold text-neutral-900 dark:text-amber-400">
                            {note.verseId}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>Margin Exegesis</span>
                        </div>
                        <p className="text-xs text-neutral-800 dark:text-neutral-200 leading-relaxed">
                          {note.noteText}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() =>
                            triggerInsertCard(
                              note.verseId,
                              note.noteText,
                              `Margin Note (${note.verseId})`
                            )
                          }
                          title="Insert Margin Note into Manuscript"
                          className="px-2 py-1 text-[11px] font-medium border border-neutral-200 dark:border-neutral-700 rounded text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-900 whitespace-nowrap"
                        >
                          + To Sermon
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteMarginNote(note.id)}
                          aria-label="Delete margin note"
                          className="p-1 text-neutral-400 hover:text-rose-600 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )
                )
              )}
            </div>
          </div>
        ) : (
          /* Tab 3: Memory Deck (Pulpit Recall Drill with Missing Words) */
          <div className="flex-1 overflow-y-auto p-3.5 space-y-3">
            {memoryDeck.length === 0 ? (
              <div className="py-6 text-center space-y-2">
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Your Memory Deck is empty. Click{" "}
                  <strong className="text-neutral-900 dark:text-white">Memorize</strong> on
                  any verse in the KJV reader above to flag it for pulpit recall.
                </p>
              </div>
            ) : (
              activeMemoryVerse && (
                <div className="space-y-3">
                  {/* Active Flashcard with Missing Words */}
                  <div className="p-3 bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded space-y-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono-tabular font-bold text-neutral-900 dark:text-amber-400">
                          {activeMemoryVerse.verseId} (KJV)
                        </span>
                        <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
                          · Card {activeMemoryIndex + 1} of {memoryDeck.length} · Mastery{" "}
                          {activeMemoryVerse.masteryCount}x
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        {(["light", "standard", "mastery"] as ClozeDifficulty[]).map(
                          (diff) => (
                            <button
                              key={diff}
                              type="button"
                              onClick={() => setClozeDifficulty(diff)}
                              className={`px-2 py-0.5 text-[10px] font-semibold rounded capitalize border transition-colors ${
                                clozeDifficulty === diff
                                  ? "bg-neutral-900 dark:bg-amber-400 text-white dark:text-black border-neutral-900 dark:border-amber-400"
                                  : "bg-neutral-100 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-800"
                              }`}
                            >
                              {diff}
                            </button>
                          )
                        )}
                      </div>
                    </div>

                    {/* Interactive Missing-Word Verse */}
                    <div className="p-2.5 bg-neutral-50/70 dark:bg-neutral-950 rounded border border-neutral-200/80 dark:border-neutral-800">
                      {renderClozeVerseInteractive()}
                    </div>

                    {/* Recall Controls */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setIsAllWordsRevealed((prev) => !prev)}
                          className="px-2.5 py-1 text-[11px] font-medium bg-neutral-100 dark:bg-neutral-900 hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200 rounded flex items-center gap-1"
                        >
                          {isAllWordsRevealed ? (
                            <>
                              <EyeOff className="w-3 h-3" />
                              <span>Mask Words</span>
                            </>
                          ) : (
                            <>
                              <Eye className="w-3 h-3" />
                              <span>Reveal All</span>
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setRevealedWordIndices(new Set());
                            setIsAllWordsRevealed(false);
                          }}
                          title="Reset blanks"
                          className="px-2 py-1 text-[11px] font-medium bg-neutral-100 dark:bg-neutral-900 hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded flex items-center gap-1"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Reset</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowFirstLetterHint((prev) => !prev)}
                          className="px-2 py-1 text-[11px] font-medium bg-neutral-100 dark:bg-neutral-900 hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded"
                        >
                          {showFirstLetterHint ? "1st Letter: ON" : "1st Letter: OFF"}
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            setActiveMemoryIndex(
                              (prev) =>
                                (prev - 1 + memoryDeck.length) % memoryDeck.length
                            )
                          }
                          className="px-2 py-1 text-[11px] font-medium border border-neutral-300 dark:border-neutral-700 rounded text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-900"
                        >
                          ← Prev
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setActiveMemoryIndex(
                              (prev) => (prev + 1) % memoryDeck.length
                            )
                          }
                          className="px-2 py-1 text-[11px] font-medium border border-neutral-300 dark:border-neutral-700 rounded text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-900"
                        >
                          Next →
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMarkMemoryRecalled(activeMemoryVerse)}
                          className="px-2.5 py-1 text-[11px] font-semibold bg-neutral-900 dark:bg-amber-400 text-white dark:text-black rounded hover:bg-neutral-800 dark:hover:bg-amber-300 flex items-center gap-1"
                        >
                          <Check className="w-3 h-3" />
                          <span>Recalled (+1)</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Quick Deck Strip of All Flagged Verses */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                    {memoryDeck.map((item, idx) => (
                      <button
                        key={item.verseId}
                        type="button"
                        onClick={() => setActiveMemoryIndex(idx)}
                        className={`px-2 py-1 text-[11px] font-mono-tabular rounded border whitespace-nowrap shrink-0 transition-colors ${
                          idx === activeMemoryIndex
                            ? "bg-neutral-900 dark:bg-amber-400 text-white dark:text-black border-neutral-900 dark:border-amber-400 font-semibold"
                            : "bg-white dark:bg-black text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-800 hover:border-neutral-400"
                        }`}
                      >
                        {item.verseId} ({item.masteryCount}x)
                      </button>
                    ))}
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </div>

      {/* Quick Find Overlay Modal (Jump to any KJV Book Chapter:Verse coordinate) */}
      {isQuickFindOpen && (
        <div
          onClick={() => setIsQuickFindOpen(false)}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-start justify-center pt-16 px-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-800 rounded-lg max-w-lg w-full shadow-2xl overflow-hidden"
          >
            {/* Input Bar */}
            <div className="p-3.5 border-b border-neutral-200 dark:border-neutral-800 flex items-center gap-2.5 bg-neutral-50 dark:bg-black">
              <Compass className="w-4 h-4 text-neutral-700 dark:text-amber-400 shrink-0" />
              <input
                ref={quickFindInputRef}
                type="text"
                value={quickFindInput}
                onChange={(e) => {
                  setQuickFindInput(e.target.value);
                  setQuickFindIndex(0);
                }}
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setQuickFindIndex((prev) =>
                      Math.min(quickFindMatches.length - 1, prev + 1)
                    );
                  } else if (e.key === "ArrowUp") {
                    e.preventDefault();
                    setQuickFindIndex((prev) => Math.max(0, prev - 1));
                  } else if (e.key === "Enter" && quickFindMatches[quickFindIndex]) {
                    e.preventDefault();
                    handleJumpToVerse(quickFindMatches[quickFindIndex]);
                  } else if (e.key === "Escape") {
                    setIsQuickFindOpen(false);
                  }
                }}
                placeholder="Type book & chapter:verse (e.g. 'John 3:16', 'Rom 8:28', 'Ps 23:1')..."
                className="flex-1 text-sm font-medium bg-transparent text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-none"
              />
              {quickFindInput && (
                <button
                  type="button"
                  onClick={() => {
                    setQuickFindInput("");
                    setQuickFindIndex(0);
                    quickFindInputRef.current?.focus();
                  }}
                  aria-label="Clear Quick Find input"
                  className="text-neutral-400 hover:text-neutral-800 dark:hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsQuickFindOpen(false)}
                className="px-2 py-0.5 text-[11px] font-mono-tabular bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded hover:bg-neutral-300 dark:hover:bg-neutral-700"
              >
                ESC
              </button>
            </div>

            {/* Quick-Jump Reference Suggestions */}
            <div className="px-3.5 py-2 border-b border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-950 flex items-center gap-1.5 overflow-x-auto">
              <span className="text-[11px] text-neutral-400 shrink-0">Examples:</span>
              {["John 3:16", "Romans 8:28", "Psalms 23:1", "Isaiah 53:5", "Ephesians 2:8"].map(
                (refSample) => (
                  <button
                    key={refSample}
                    type="button"
                    onClick={() => {
                      setQuickFindInput(refSample);
                      setQuickFindIndex(0);
                      quickFindInputRef.current?.focus();
                    }}
                    className="px-2 py-0.5 text-[11px] font-mono-tabular bg-neutral-100 dark:bg-neutral-900 hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded whitespace-nowrap shrink-0"
                  >
                    {refSample}
                  </button>
                )
              )}
            </div>

            {/* Matching KJV Coordinates List */}
            <div className="max-h-[340px] overflow-y-auto divide-y divide-neutral-100 dark:divide-neutral-800">
              {quickFindMatches.length === 0 ? (
                <div className="p-6 text-center text-xs text-neutral-500 dark:text-neutral-400">
                  No matching KJV coordinates found for &ldquo;{quickFindInput}&rdquo;. Try typing a
                  book and verse like <strong>John 3:16</strong> or <strong>Romans 8:28</strong>.
                </div>
              ) : (
                quickFindMatches.map((v, idx) => {
                  const isHighlighted = idx === quickFindIndex;
                  return (
                    <div
                      key={v.id}
                      onMouseEnter={() => setQuickFindIndex(idx)}
                      onClick={() => handleJumpToVerse(v)}
                      className={`p-3 cursor-pointer transition-colors flex items-start justify-between gap-3 ${
                        isHighlighted
                          ? "bg-neutral-900 dark:bg-amber-400 text-white dark:text-black"
                          : "bg-white dark:bg-neutral-950 hover:bg-neutral-50 dark:hover:bg-neutral-900"
                      }`}
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-xs font-mono-tabular font-bold ${
                              isHighlighted
                                ? "text-amber-300 dark:text-black"
                                : "text-neutral-900 dark:text-amber-400"
                            }`}
                          >
                            {v.id}
                          </span>
                          <span
                            className={`text-[11px] ${
                              isHighlighted
                                ? "text-neutral-300 dark:text-neutral-800"
                                : "text-neutral-400 dark:text-neutral-500"
                            }`}
                          >
                            Jump to Reader
                          </span>
                        </div>
                        <p
                          className={`text-xs font-serif-kjv line-clamp-2 leading-relaxed ${
                            isHighlighted
                              ? "text-neutral-100 dark:text-black"
                              : "text-neutral-700 dark:text-neutral-300"
                          }`}
                        >
                          {v.text}
                        </p>
                      </div>

                      <div className="flex items-center gap-1 shrink-0 pt-0.5">
                        <span
                          className={`text-[11px] font-mono-tabular flex items-center gap-1 ${
                            isHighlighted
                              ? "text-amber-300 dark:text-black"
                              : "text-neutral-400 dark:text-neutral-500"
                          }`}
                        >
                          <span>Go</span>
                          <CornerDownLeft className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
