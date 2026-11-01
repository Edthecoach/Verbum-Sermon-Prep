import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

// Increase payload limit to support base64-encoded sermon audio blobs
app.use(express.json({ limit: "50mb" }));

function getGeminiClient() {
  const candidates = [
    process.env.GEMINI_API_KEY,
    process.env.API_KEY,
    process.env.GOOGLE_API_KEY,
  ];
  const apiKey = candidates.find(
    (k) => k && k.trim() !== "" && k.trim() !== "MY_GEMINI_API_KEY"
  );
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY is not configured. Add your Gemini API key in the AI Studio Secrets / Environment Variables panel (or in .env if running locally)."
    );
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

/**
 * Safely parses JSON from Gemini responses, stripping any accidental markdown code fences.
 */
function parseGeminiJson<T = any>(rawText: string | undefined): T {
  const cleaned = (rawText ?? "{}")
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  return JSON.parse(cleaned || "{}");
}

/**
 * Calls generateContent with primary model and falls back to gemini-flash-latest if needed.
 */
async function generateContentWithFallback(
  ai: GoogleGenAI,
  params: {
    contents: any;
    config: any;
  }
) {
  try {
    return await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: params.contents,
      config: params.config,
    });
  } catch (primaryErr) {
    console.warn(
      "Primary model gemini-3.8-flash failed, retrying with gemini-flash-latest:",
      primaryErr
    );
    return await ai.models.generateContent({
      model: "gemini-flash-latest",
      contents: params.contents,
      config: params.config,
    });
  }
}

// 1. Homiletic Outline Generator Endpoint
app.post("/api/gemini/outline", async (req, res) => {
  try {
    const { passageOrTopic, mode, preachingMode, additionalNotes } = req.body;
    const resolvedMode = mode || preachingMode || "Expository";

    if (!passageOrTopic || ! String(passageOrTopic).trim()) {
      res
        .status(400)
        .json({ error: "Please enter a KJV Scripture passage or doctrinal topic." });
      return;
    }

    const ai = getGeminiClient();

    const modeInstructions: Record<string, string> = {
      Expository:
        "Structure as a rigorous Expository sermon: provide a sequential verse-by-verse breakdown of the passage, original historical-grammatical exegetical insights, a clear homiletical 'Big Idea' (central proposition), distinct verse-anchored divisions, concrete illustrations, and targeted congregational application.",
      Textual:
        "Structure as a classical Textual sermon: anchor on the primary text, divide the outline directly by the natural clauses or phrases of the verse(s), and draw sound theological deductions and pastoral applications from each clause.",
      Topical:
        "Structure as a systematic Topical sermon: formulate a clear core doctrinal proposition, support each division with multi-testament King James Version (KJV) Scripture citations, build logical argument steps, and write smooth homiletical transitions between points.",
    };

    const prompt = `Create a comprehensive, deeply researched homiletical sermon outline for: "${String(
      passageOrTopic
    ).trim()}".
Preaching Mode: ${resolvedMode}
Mode Methodology: ${modeInstructions[resolvedMode] || modeInstructions.Expository}
${additionalNotes ? `Preacher's Additional Focus / Notes: ${additionalNotes}` : ""}

Use King James Version (KJV) phrasing and references. Ensure every division includes specific KJV verse coordinates, clear exposition, illustrative imagery, and direct pastoral application.`;

    const response = await generateContentWithFallback(ai, {
      contents: prompt,
      config: {
        systemInstruction:
          "You are a master homiletician, biblical scholar, and seasoned expositor well-versed in the King James Version (KJV) and the Treasury of Scripture Knowledge (TSK). Produce clear, doctrinally sound, pastorally warm, and structurally precise sermon outlines.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: {
              type: Type.STRING,
              description: "Compelling, memorable homiletical sermon title.",
            },
            primaryText: {
              type: Type.STRING,
              description: "Primary KJV Scripture reference (e.g., Romans 8:28-30).",
            },
            bigIdea: {
              type: Type.STRING,
              description:
                "Single-sentence homiletical Big Idea / Central Doctrinal Proposition.",
            },
            hook: {
              type: Type.STRING,
              description:
                "Opening homiletical hook or introduction that arrests attention and surfaces the human need.",
            },
            context: {
              type: Type.STRING,
              description:
                "Historical, redemptive, and literary context of the passage or doctrine.",
            },
            divisions: {
              type: Type.ARRAY,
              description:
                "Main homiletical divisions / points of the sermon (typically 3 to 4 main points).",
              items: {
                type: Type.OBJECT,
                properties: {
                  heading: {
                    type: Type.STRING,
                    description:
                      "Main point heading (e.g., I. The Sovereign Purpose of Grace).",
                  },
                  scriptureRef: {
                    type: Type.STRING,
                    description: "Supporting KJV verse reference(s) for this division.",
                  },
                  exposition: {
                    type: Type.STRING,
                    description:
                      "Exegetical explanation, clause analysis, or doctrinal argument.",
                  },
                  illustration: {
                    type: Type.STRING,
                    description:
                      "Vivid historical, biblical, or everyday metaphor/illustration for this point.",
                  },
                  application: {
                    type: Type.STRING,
                    description:
                      "Direct pastoral application to the hearer's conscience and life.",
                  },
                  transition: {
                    type: Type.STRING,
                    description: "Smooth homiletical bridge leading to the next point.",
                  },
                },
                required: [
                  "heading",
                  "scriptureRef",
                  "exposition",
                  "illustration",
                  "application",
                ],
              },
            },
            conclusionAndCallToAction: {
              type: Type.STRING,
              description:
                "Climactic summary and urgent pastoral call to action / response.",
            },
          },
          required: [
            "title",
            "primaryText",
            "bigIdea",
            "hook",
            "context",
            "divisions",
            "conclusionAndCallToAction",
          ],
        },
      },
    });

    const parsed = parseGeminiJson(response.text);
    res.json(parsed);
  } catch (error: any) {
    console.error("Error in /api/gemini/outline:", error);
    res.status(500).json({
      error: error?.message || "Failed to generate sermon outline with Gemini.",
    });
  }
});

// 1b. Sermon Rough Draft & Thought Organizer Endpoint
app.post("/api/gemini/organize-draft", async (req, res) => {
  try {
    const { roughDraft, preachingMode, mode, primaryText, currentTitle } = req.body;
    const resolvedMode = preachingMode || mode || "Expository";

    if (!roughDraft || !String(roughDraft).trim()) {
      res
        .status(400)
        .json({ error: "Please enter your rough draft or sermon ideas first." });
      return;
    }

    const ai = getGeminiClient();

    const prompt = `A preacher has written the following raw sermon ideas / rough draft notes and wants help organizing their thoughts into a cohesive, powerful King James Version (KJV) sermon:

PREACHER'S ROUGH DRAFT & RAW THOUGHTS:
"""
${String(roughDraft).trim()}
"""

Preferred Preaching Style: ${resolvedMode}
${primaryText ? `Current Primary Scripture Anchor: ${primaryText}` : ""}
${currentTitle ? `Working Title: ${currentTitle}` : ""}

Please organize these raw thoughts and return a complete homiletical study package containing:
1. 4 distinct, compelling sermon title suggestions (with their homiletical angle).
2. A suggested primary KJV Scripture anchor text and a single-sentence Homiletical "Big Idea" that unifies the preacher's thoughts.
3. A brief synthesis explaining how their raw ideas were structured into a logical progression.
4. 3 to 4 organized main sermon divisions (with Roman numerals, KJV verse coordinates, clear exposition of the preacher's ideas, and pastoral application).
5. 3 vivid sermon illustrations (e.g., Historical/Biographical, Biblical/Redemptive analogy, Everyday/Pastoral metaphor) tailored directly to the themes in their rough draft.
6. 4 to 5 additional supporting King James Version (KJV) reference scriptures (including the exact KJV verse text and why it reinforces the sermon).
7. 2 reverent, Scripture-saturated closing pastoral prayers (e.g., a Prayer of Application & Consecration and a Covenantal Benediction Prayer) using classic, warm devotional language.`;

    const response = await generateContentWithFallback(ai, {
      contents: prompt,
      config: {
        systemInstruction:
          "You are a master homiletician, pastoral theologian, and King James Version (KJV) Bible scholar. Take a preacher's raw, unpolished sermon notes or stream-of-consciousness ideas and organize them with clarity, doctrinal depth, vivid illustrations, accurate KJV cross-references, and reverent closing prayers.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            titleSuggestions: {
              type: Type.ARRAY,
              description: "4 distinct sermon title suggestions.",
              items: {
                type: Type.OBJECT,
                properties: {
                  title: {
                    type: Type.STRING,
                    description: "Suggested sermon title.",
                  },
                  angle: {
                    type: Type.STRING,
                    description:
                      "Homiletical angle (e.g., Doctrinal, Pastoral, Expository, KJV Phrase).",
                  },
                },
                required: ["title", "angle"],
              },
            },
            primaryTextSuggestion: {
              type: Type.STRING,
              description:
                "Primary KJV Scripture passage reference (e.g., Psalms 23:1-6 or Romans 8:28-39).",
            },
            organizedBigIdea: {
              type: Type.STRING,
              description:
                "Single-sentence central homiletical Big Idea distilled from the rough draft.",
            },
            thoughtSynthesis: {
              type: Type.STRING,
              description:
                "2-3 sentence editorial summary of how the preacher's scattered notes were organized into a unified message.",
            },
            organizedDivisions: {
              type: Type.ARRAY,
              description:
                "Logical homiletical outline divisions organizing the preacher's ideas.",
              items: {
                type: Type.OBJECT,
                properties: {
                  heading: {
                    type: Type.STRING,
                    description:
                      "Main point heading (e.g., I. The Shepherd's Provision in the Wilderness).",
                  },
                  scriptureRef: {
                    type: Type.STRING,
                    description: "Supporting KJV reference for this division.",
                  },
                  exposition: {
                    type: Type.STRING,
                    description:
                      "Developed exposition organizing the preacher's raw thoughts for this point.",
                  },
                  application: {
                    type: Type.STRING,
                    description: "Direct pastoral application to the congregation.",
                  },
                },
                required: ["heading", "scriptureRef", "exposition", "application"],
              },
            },
            illustrations: {
              type: Type.ARRAY,
              description:
                "3 vivid illustrations that illuminate the preacher's core themes.",
              items: {
                type: Type.OBJECT,
                properties: {
                  title: {
                    type: Type.STRING,
                    description: "Short title for the illustration.",
                  },
                  category: {
                    type: Type.STRING,
                    description:
                      "Type of illustration (e.g., Historical, Biblical Parallel, Everyday Metaphor).",
                  },
                  narrative: {
                    type: Type.STRING,
                    description:
                      "Full ready-to-preach narrative of the illustration and its moral pivot.",
                  },
                },
                required: ["title", "category", "narrative"],
              },
            },
            additionalScriptures: {
              type: Type.ARRAY,
              description:
                "4-5 supporting KJV cross-reference scriptures with full KJV text.",
              items: {
                type: Type.OBJECT,
                properties: {
                  ref: {
                    type: Type.STRING,
                    description: "KJV book, chapter, and verse (e.g., Isaiah 43:2).",
                  },
                  kjvText: {
                    type: Type.STRING,
                    description: "Verbatim King James Version (KJV) text of the verse.",
                  },
                  homileticConnection: {
                    type: Type.STRING,
                    description:
                      "How this verse strengthens or illuminates the preacher's rough draft.",
                  },
                },
                required: ["ref", "kjvText", "homileticConnection"],
              },
            },
            closingPrayers: {
              type: Type.ARRAY,
              description: "2 reverent closing pastoral prayers tailored to the sermon.",
              items: {
                type: Type.OBJECT,
                properties: {
                  title: {
                    type: Type.STRING,
                    description:
                      "Title of the closing prayer (e.g., Prayer of Humble Trust & Consecration).",
                  },
                  tone: {
                    type: Type.STRING,
                    description:
                      "Pastoral tone (e.g., Penitential & Comforting, Doxological & Sending).",
                  },
                  prayerText: {
                    type: Type.STRING,
                    description:
                      "Full spoken closing prayer written in reverent, Scripture-rich language.",
                  },
                },
                required: ["title", "tone", "prayerText"],
              },
            },
          },
          required: [
            "titleSuggestions",
            "primaryTextSuggestion",
            "organizedBigIdea",
            "thoughtSynthesis",
            "organizedDivisions",
            "illustrations",
            "additionalScriptures",
            "closingPrayers",
          ],
        },
      },
    });

    const parsed = parseGeminiJson(response.text);
    res.json(parsed);
  } catch (error: any) {
    console.error("Error in /api/gemini/organize-draft:", error);
    res.status(500).json({
      error: error?.message || "Failed to organize sermon rough draft with Gemini.",
    });
  }
});

// 2. Multimodal Audio Transcription & Homiletical Delivery Comparison Endpoint
app.post("/api/gemini/transcribe-analyze", async (req, res) => {
  try {
    const {
      audioBase64,
      mimeType,
      sermonTitle,
      primaryText,
      manuscriptText,
      outlineSummary,
    } = req.body;

    if (!audioBase64) {
      res.status(400).json({ error: "Recorded audio data is required." });
      return;
    }

    const ai = getGeminiClient();
    const cleanMimeType = (mimeType || "audio/webm").split(";")[0];

    const audioPart = {
      inlineData: {
        mimeType: cleanMimeType,
        data: audioBase64,
      },
    };

    const groundTruthContext = `
SERMON TITLE: ${sermonTitle || "Untitled Sermon"}
PRIMARY SCRIPTURE: ${primaryText || "Not specified"}
PLANNED OUTLINE:
${outlineSummary || "No outline blocks."}

PLANNED MANUSCRIPT (Contextual Vocabulary Ground Truth):
${manuscriptText || "No prose manuscript."}
`.trim();

    // Step 1: Use gemini-3.5-transcribe to obtain an accurate transcript with KJV / theological ground truth
    let rawTranscript = "";
    try {
      const transcribeResp = await ai.models.generateContent({
        model: "gemini-3.5-transcribe",
        contents: {
          parts: [
            audioPart,
            {
              text: `Transcribe this preached sermon audio accurately. Use the following planned sermon manuscript and Scripture references as contextual vocabulary ground truth so that all biblical names, KJV archaic terms (e.g., propitiation, sanctification, wherewithal, eth/est endings), and scripture citations are spelled accurately:\n\n${groundTruthContext}`,
            },
          ],
        },
      });
      rawTranscript = (transcribeResp.text ?? "").trim();
    } catch (transcribeErr) {
      console.warn(
        "gemini-3.5-transcribe fallback to multimodal analysis:",
        transcribeErr
      );
    }

    // Step 2: Produce structured timestamped transcript + Homiletical Delivery Comparison
    const analysisParts: any[] = [];
    if (!rawTranscript) {
      analysisParts.push(audioPart);
    }
    analysisParts.push({
      text: `You are evaluating a recorded sermon delivery against the preacher's prepared manuscript and outline.

${groundTruthContext}

${
  rawTranscript
    ? `RAW SPOKEN TRANSCRIPT FROM RECORDING:\n${rawTranscript}\n`
    : `Listen carefully to the attached sermon audio recording.\n`
}

Tasks:
1. Produce a clean, timestamped spoken transcript broken into logical segments (e.g. [00:00], [00:45], etc.). Ensure all biblical names, theological terms, and King James Version (KJV) phrases are captured accurately without secular transcription errors. If the audio is brief or silent, faithfully report what was spoken (or note if the microphone captured silence/test audio) while still providing a constructive homiletical evaluation against the manuscript.
2. Provide a comprehensive Homiletical Delivery Comparison comparing what was planned in the manuscript/outline versus what was actually delivered in the pulpit:
   - Executive Summary of delivery vs. manuscript fidelity.
   - Covered Points (planned ideas that were clearly delivered).
   - Skipped or Condensed Points (planned material omitted or rushed).
   - Spontaneous Ad-libs & Pastoral Additions (unplanned illustrations, exhortations, or Scripture expansions uttered in the pulpit).
   - Pacing, Clarity & Homiletical Tone assessment.`,
    });

    const analysisResponse = await generateContentWithFallback(ai, {
      contents: { parts: analysisParts },
      config: {
        systemInstruction:
          "You are an expert homiletics professor and biblical transcriptionist. Preserve King James Version (KJV) terminology and theological precision.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            transcriptSegments: {
              type: Type.ARRAY,
              description: "Clean, timestamped spoken transcript segments.",
              items: {
                type: Type.OBJECT,
                properties: {
                  timestamp: {
                    type: Type.STRING,
                    description: "Timestamp in MM:SS format (e.g. 00:00, 01:15).",
                  },
                  text: {
                    type: Type.STRING,
                    description:
                      "Clean spoken text with accurate KJV and biblical terminology.",
                  },
                  matchedSection: {
                    type: Type.STRING,
                    description:
                      "Optional corresponding section from the manuscript or 'Spontaneous / Ad-lib'.",
                  },
                },
                required: ["timestamp", "text"],
              },
            },
            comparison: {
              type: Type.OBJECT,
              description:
                "Homiletical Delivery Comparison between planned manuscript and pulpit delivery.",
              properties: {
                executiveSummary: {
                  type: Type.STRING,
                  description:
                    "Executive overview comparing the prepared manuscript with the spoken pulpit delivery.",
                },
                alignmentScore: {
                  type: Type.INTEGER,
                  description:
                    "Percentage alignment (0-100) between planned structure and delivered sermon.",
                },
                deliveredPoints: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description:
                    "Key points and scriptures from the manuscript that were effectively delivered.",
                },
                skippedPoints: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description:
                    "Planned points, clauses, or illustrations in the manuscript that were skipped or abbreviated.",
                },
                spontaneousAdLibs: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description:
                    "Spontaneous ad-libs, unscripted pastoral exhortations, or extra cross-references added live.",
                },
                pacingAndDeliveryNotes: {
                  type: Type.STRING,
                  description:
                    "Evaluation of pacing, emphasis, transitions, and rhetorical cadence.",
                },
              },
              required: [
                "executiveSummary",
                "alignmentScore",
                "deliveredPoints",
                "skippedPoints",
                "spontaneousAdLibs",
                "pacingAndDeliveryNotes",
              ],
            },
          },
          required: ["transcriptSegments", "comparison"],
        },
      },
    });

    const resultJson = parseGeminiJson(analysisResponse.text);
    res.json(resultJson);
  } catch (error: any) {
    console.error("Error in /api/gemini/transcribe-analyze:", error);
    res.status(500).json({
      error: error?.message || "Failed to transcribe and analyze sermon audio.",
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*all", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Verbum Server running on http://localhost:${PORT}`);
  });
}

startServer();
