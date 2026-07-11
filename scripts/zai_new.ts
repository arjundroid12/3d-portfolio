/**
 * QUIRK AI Library — direct REST API calls (no SDK).
 *
 * Text AI (Script Studio, Idea Engine): Z.AI public API (glm-4.5-flash, free)
 * Vision AI (Thumbnail Tester): Groq API (Llama 4 Scout, free)
 *
 * Both called via fetch() — works on Vercel, sandbox, anywhere.
 */

const ZAI_URL = "https://api.z.ai/api/paas/v4/chat/completions";
const ZAI_KEY = process.env.ZAI_API_KEY || "";
const ZAI_MODEL = "glm-4.5-flash";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_KEY = process.env.GROQ_API_KEY || "";
const GROQ_VISION_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";

/** Call Z.AI text API. glm-4.5-flash is a reasoning model — needs max_tokens >= 4000. */
async function callZAI(messages: Array<{ role: string; content: string }>, maxTokens: number = 4000): Promise<string> {
  if (!ZAI_KEY) throw new Error("ZAI_API_KEY not set");

  const res = await fetch(ZAI_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${ZAI_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: ZAI_MODEL,
      messages,
      max_tokens: Math.max(maxTokens, 4000),
      temperature: 0.85,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`Z.AI API ${res.status}: ${text.slice(0, 200)}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

/** Call Groq vision API for thumbnail analysis. */
async function callGroqVision(systemPrompt: string, userPrompt: string, imageUrl: string): Promise<string> {
  if (!GROQ_KEY) throw new Error("GROQ_API_KEY not set");

  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${GROQ_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: GROQ_VISION_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: [
            { type: "text", text: userPrompt },
            { type: "image_url", image_url: { url: imageUrl } },
          ],
        },
      ],
      max_tokens: 800,
      temperature: 0.7,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`Groq API ${res.status}: ${text.slice(0, 200)}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

// =============================================================================
// Script Studio
// =============================================================================

export interface ScriptGenInput {
  niche: string;
  platform: "reels" | "shorts" | "longform" | "tiktok" | "carousel";
  tone: "casual" | "hype" | "educational" | "storytelling" | "authoritative";
  topic?: string;
  durationSec?: number;
  cta?: string;
}

export interface GeneratedScript {
  title: string;
  hook: string;
  body: string;
  cta: string;
  hashtags: string[];
  estimatedDuration: string;
  notes: string;
}

const PLATFORM_SPEC: Record<ScriptGenInput["platform"], string> = {
  reels: "Instagram Reels, vertical 9:16, 15-90 seconds, fast cuts, text-on-screen heavy, strong hook in first 1.5 seconds",
  shorts: "YouTube Shorts, vertical 9:16, 15-60 seconds, search-friendly title, optimized for the YouTube algorithm with a rewatch loop",
  tiktok: "TikTok, vertical 9:16, 15-180 seconds, native-feeling, trend-aware, uses TikTok-native patterns (POV, stitch bait, sound-driven)",
  longform: "YouTube long-form video, 16:9, 5-12 minutes, structured intro/problem/solution/payoff, retention curves in mind",
  carousel: "Instagram carousel, 5-8 slides, each slide has 1 idea + 1 visual cue, swipe-bait first slide",
};

const TONE_SPEC: Record<ScriptGenInput["tone"], string> = {
  casual: "casual, conversational, like texting a friend — first person, contractions, light humor",
  hype: "high energy, urgent, punchy — short sentences, exclamation points, builds momentum",
  educational: "clear, structured, value-first — explains the why before the how, no fluff",
  storytelling: "narrative-driven, scene-setting, sensory details — opens with a moment, builds tension, resolves",
  authoritative: "confident, expert, evidence-backed — citations where useful, definitive claims, no hedging",
};

export async function generateScript(input: ScriptGenInput): Promise<GeneratedScript> {
  const platformSpec = PLATFORM_SPEC[input.platform];
  const toneSpec = TONE_SPEC[input.tone];
  const durationHint = input.durationSec ? `Aim for ~${input.durationSec} seconds spoken.` : "";
  const topicHint = input.topic ? `Topic: ${input.topic}.` : "Suggest a topic that fits this niche.";
  const ctaHint = input.cta ? `Use this CTA: ${input.cta}.` : "Suggest a natural CTA that fits the content (follow, save, comment, link in bio, etc.).";

  const systemPrompt = `You are QUIRK Script Studio — a world-class short-form and long-form content writer. You always output STRICT JSON. No markdown, no prose outside JSON.`;

  const userPrompt = `Write a content script.

Creator niche: ${input.niche}
Platform: ${input.platform} — ${platformSpec}
Tone: ${toneSpec}
${topicHint}
${durationHint}
${ctaHint}

Return JSON with EXACTLY these keys:
{
  "title": "string — click-friendly title, 50-70 chars, optimized for the platform",
  "hook": "string — the opening 1-3 seconds, worded exactly as the creator would say it on camera. Max 25 words. Must stop the scroll.",
  "body": "string — full script body with natural paragraph breaks (use \\n\\n). Include scene cues in [brackets] sparingly. Do NOT include the hook or CTA — those are separate fields.",
  "cta": "string — the closing call to action, in 1-2 sentences, on-voice with the tone",
  "hashtags": ["array of 5-10 relevant hashtags, no # symbol, lowercase"],
  "estimatedDuration": "string — human readable like '45 sec' or '8 min 30 sec'",
  "notes": "string — 1-2 sentences of strategy notes for the creator (e.g. pacing, delivery, sound choice)"
}

Output ONLY the JSON object. No prose. No \`\`\`json fences.`;

  const raw = await callZAI([
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ]);

  const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

  let parsed: GeneratedScript;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      parsed = JSON.parse(match[0]);
    } else {
      throw new Error("Z.AI returned non-JSON script. Raw: " + raw.slice(0, 300));
    }
  }

  if (!parsed.title || !parsed.hook || !parsed.body) {
    throw new Error("Z.AI returned incomplete script");
  }
  if (!Array.isArray(parsed.hashtags)) parsed.hashtags = [];
  if (!parsed.cta) parsed.cta = "";
  if (!parsed.estimatedDuration) parsed.estimatedDuration = "—";
  if (!parsed.notes) parsed.notes = "";

  return parsed;
}

export async function improveScriptSection(args: {
  section: "hook" | "body" | "cta";
  current: string;
  niche: string;
  platform: ScriptGenInput["platform"];
  tone: ScriptGenInput["tone"];
  instruction?: string;
}): Promise<string> {
  const sectionSpec = {
    hook: "the opening 1-3 seconds — must stop the scroll, max 25 words",
    body: "the main script body — natural paragraph breaks, scene cues in [brackets]",
    cta: "the closing call to action — 1-2 sentences, on-voice, not salesy",
  }[args.section];

  const systemPrompt = `You are QUIRK Script Studio — a world-class content writer. You output ONLY the rewritten section text — no preamble, no JSON, no markdown.`;

  const userPrompt = `Rewrite ${args.section} for a ${args.platform} video.
Niche: ${args.niche}
Tone: ${args.tone}
Section spec: ${sectionSpec}
${args.instruction ? `User instruction: ${args.instruction}` : ""}

Current ${args.section}:
"""
${args.current}
"""

Output ONLY the rewritten ${args.section} text. No quotes, no headers, no markdown.`;

  const out = await callZAI([
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ]);

  return out.trim().replace(/^["']|["']$/g, "");
}

// =============================================================================
// Idea Engine
// =============================================================================

export type IdeaTone = "educational" | "entertaining" | "inspirational" | "controversial";

export async function generateIdeas(args: {
  niche: string;
  platform: ScriptGenInput["platform"];
  tone?: IdeaTone;
  count?: number;
}): Promise<Array<{ title: string; angle: string; hookPreview: string; format: string }>> {
  const count = args.count ?? 8;

  const toneSpec: Record<IdeaTone, string> = {
    educational: "value-first, teaches the viewer something specific in 30 seconds or less",
    entertaining: "humor-driven, surprising, shareable — designed to be sent to a friend",
    inspirational: "aspirational, motivational, makes the viewer feel they can do it too",
    controversial: "takes a strong stance, challenges common wisdom, invites debate in comments",
  };

  const toneLine = args.tone
    ? `Tone: ${args.tone} — ${toneSpec[args.tone]}.`
    : "Vary the tone across ideas (mix educational, entertaining, inspirational, and controversial).";

  const systemPrompt = `You are QUIRK Idea Engine — you generate scroll-stopping content ideas for creators. You always output STRICT JSON.`;

  const userPrompt = `Generate ${count} content ideas for a creator in the "${args.niche}" niche, optimized for ${args.platform}.

${toneLine}

Each idea should be DIFFERENT in format and angle. Mix formats: POV, listicle, tutorial, story time, myth bust, comparison, behind the scenes, reaction, hot take, day in the life, before/after, etc.

Return JSON: an array of EXACTLY ${count} objects, each:
{
  "title": "string — 6-12 words, scroll-stopping idea title",
  "angle": "string — 1 sentence explaining why this idea works for this audience right now",
  "hookPreview": "string — the opening 1-2 seconds, in the creator's first-person voice, max 20 words",
  "format": "string — content format: 'POV' | 'listicle' | 'tutorial' | 'story time' | 'myth bust' | 'comparison' | 'behind the scenes' | 'reaction' | 'hot take' | 'day in the life' | 'before/after'"
}

Output ONLY the JSON array. No markdown fences, no prose.`;

  const raw = await callZAI([
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ]);

  const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

  let parsed: any[];
  try {
    parsed = JSON.parse(cleaned);
    if (!Array.isArray(parsed)) throw new Error("not array");
  } catch {
    const match = cleaned.match(/\[[\s\S]*\]/);
    if (match) {
      parsed = JSON.parse(match[0]);
    } else {
      throw new Error("Z.AI returned non-JSON ideas. Raw: " + raw.slice(0, 200));
    }
  }

  return parsed.slice(0, count).map((p) => ({
    title: String(p.title ?? "").slice(0, 200),
    angle: String(p.angle ?? "").slice(0, 400),
    hookPreview: String(p.hookPreview ?? "").slice(0, 300),
    format: String(p.format ?? "tutorial").slice(0, 40),
  }));
}

// =============================================================================
// Thumbnail Tester
// =============================================================================

export interface ThumbnailAnalysis {
  composition: number;
  emotion: number;
  textLegibility: number;
  ctr: number;
  reasoning: string;
  overall: number;
}

export async function analyzeThumbnail(args: {
  imageDataUrl: string;
  niche?: string;
  platform?: string;
}): Promise<ThumbnailAnalysis> {
  const systemPrompt = `You are QUIRK Thumbnail Tester — an expert thumbnail strategist. You analyze thumbnails and score them on 4 dimensions: composition (0-100), emotion (0-100), textLegibility (0-100), ctr (0-5.0). You ALWAYS output STRICT JSON. No markdown, no prose outside JSON.`;

  const nicheLine = args.niche ? `The creator's niche is "${args.niche}".` : "";
  const platformLine = args.platform ? `The thumbnail is for ${args.platform}.` : "The thumbnail is for a short-form video platform.";

  const userPrompt = `Analyze this thumbnail. ${platformLine} ${nicheLine}

Return JSON with EXACTLY these keys:
{
  "composition": <number 0-100>,
  "emotion": <number 0-100>,
  "textLegibility": <number 0-100>,
  "ctr": <number 0-5.0>,
  "reasoning": "<2-3 sentences explaining the scores, citing specific elements. Mention what's working AND what could be improved.>"
}

Output ONLY the JSON object. No markdown fences, no prose.`;

  const raw = await callGroqVision(systemPrompt, userPrompt, args.imageDataUrl);

  const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

  let parsed: any;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      parsed = JSON.parse(match[0]);
    } else {
      throw new Error("Groq vision returned non-JSON. Raw: " + raw.slice(0, 200));
    }
  }

  const composition = clamp(Number(parsed.composition ?? 0), 0, 100);
  const emotion = clamp(Number(parsed.emotion ?? 0), 0, 100);
  const textLegibility = clamp(Number(parsed.textLegibility ?? 0), 0, 100);
  const ctr = clamp(Number(parsed.ctr ?? 0), 0, 5);
  const reasoning = String(parsed.reasoning ?? "").slice(0, 1200);

  const ctrNormalized = (ctr / 5) * 100;
  const overall = Math.round(
    composition * 0.3 + emotion * 0.25 + textLegibility * 0.25 + ctrNormalized * 0.2
  );

  return { composition, emotion, textLegibility, ctr, reasoning, overall: clamp(overall, 0, 100) };
}

function clamp(n: number, min: number, max: number) {
  if (Number.isNaN(n)) return min;
  return Math.max(min, Math.min(max, n));
}
