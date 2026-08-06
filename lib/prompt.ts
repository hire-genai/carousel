// ── Hook variation pool — randomly picked to force fresh openings every time ──
const HOOK_STYLES = [
  "Open with a shocking statistic or data point that challenges conventional wisdom",
  "Open with a provocative question that makes the reader question their current approach",
  "Open with a bold, controversial statement that stops the scroll instantly",
  "Open with a relatable pain point framed as a shared struggle",
  "Open with a short personal story or turning point moment",
  "Open with a common myth or misconception — then immediately flip it",
  "Open with a prediction or future insight that feels urgent and timely",
  "Open with a before/after contrast that shows a dramatic transformation",
  "Open with a numbered promise — 'Here are X things most people get wrong about...'",
  "Open with a comparison that reframes the topic in a surprising way",
];

const CTA_STYLES = [
  "End with a direct question to the reader that invites a comment",
  "End with a single actionable step the reader can take today",
  "End with a challenge — dare the reader to try one specific thing",
  "End with a reflection prompt that makes the reader think about their own situation",
  "End with a resource offer — 'DM me [word] for the full framework'",
  "End with a bold declaration the reader can agree or disagree with",
  "End with a micro-commitment — something small but meaningful",
];

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function buildSlideStructure(numSlides: number): string {
  if (numSlides === 1) {
    return `- Slide 1 (COMPLETE): This is the entire carousel in one slide. Pack it with: a hook headline, 1 sentence context, and 2-3 punchy bullets. Make every word count.`;
  }
  if (numSlides === 2) {
    return `- Slide 1 (HOOK): Grab attention — bold headline + 1 sentence that teases the transformation\n- Slide 2 (CTA): Deliver the core insight + call to action`;
  }
  if (numSlides === 3) {
    return `- Slide 1 (HOOK): Grab attention — bold headline + teaser\n- Slide 2 (VALUE): The single most important insight\n- Slide 3 (CTA): Call to action with a final punch`;
  }
  return `- Slide 1 (HOOK): Grab attention — provocative headline + tease what's coming
- Slides 2 to ${numSlides - 1} (VALUE): One clear insight per slide — headline + context + bullets. Build narrative arc across slides.
- Slide ${numSlides} (CTA): Summarize transformation + call to action`;
}

// ── Product carousel ──────────────────────────────────────────────────────────
export function buildProductCarouselPrompt(
  numSlides: number,
  audience?: string,
  tone?: string,
  previousTitles?: string[],
): string {
  const hookStyle = pickRandom(HOOK_STYLES);
  const ctaStyle = pickRandom(CTA_STYLES);
  const audienceLine = audience ? `\n## Target Audience\nWrite for: ${audience}. Use language and examples that resonate with this group.\n` : "";
  const toneLine = tone ? `\n## Tone\nWrite in a ${tone} voice throughout.\n` : "";
  const slideStructure = buildSlideStructure(numSlides);
  const avoidLine = previousTitles?.length
    ? `\n## Avoid Repetition\nThe user already has carousels with these titles. Do NOT repeat their hooks, CTAs, or key points:\n${previousTitles.map((t) => `- "${t}"`).join("\n")}\nGenerate entirely fresh angles, examples, and wording.\n`
    : "";

  return `You are an expert LinkedIn content strategist specializing in product marketing and SaaS storytelling.

You will receive text scraped from a real product website. Create a compelling ${numSlides}-slide LinkedIn carousel.
${audienceLine}${toneLine}${avoidLine}
## Opening Hook Directive
${hookStyle}

## CTA Directive
${ctaStyle}

## Carousel Structure — EXACTLY ${numSlides} slides, no more, no less
${slideStructure}

## Critical Rules
- Use the REAL product name extracted from the website — do not invent
- Base ALL content on what is actually on the website — do not fabricate
- Headlines: 4-8 words, benefit-focused, not generic
- Body: 1 short sentence giving context (optional, max 15 words)
- Bullets: 2-3 punchy points, each max 12 words, starting with action verbs or numbers
- Build a clear narrative: Problem → Solution → Proof → Action

## Writing Style
- 2nd person ("You", "Your")
- Active voice only
- Zero fluff — every word must earn its place
- Use CONTRAST and SPECIFICITY: real numbers, real use cases, real outcomes

## CRITICAL: Output Format
Return ONLY valid JSON. No markdown, no code fences, no explanation.
The "slides" array MUST have EXACTLY ${numSlides} items — no more, no fewer.

{
  "title": "<product name + core value in 4-7 words>",
  "slides": [
    {
      "headline": "<punchy headline, 4-8 words>",
      "body": "<optional context sentence, max 15 words>",
      "bullets": ["<point 1>", "<point 2>", "<point 3>"]
    }
  ]
}`;
}

// ── Topic / URL / text carousel ───────────────────────────────────────────────
export function buildCarouselPrompt(
  numSlides: number,
  audience?: string,
  tone?: string,
  topic?: string,
  keyPoints?: string[],
  painPoints?: string[],
  previousTitles?: string[],
): string {
  const hookStyle = pickRandom(HOOK_STYLES);
  const ctaStyle = pickRandom(CTA_STYLES);
  const audienceLine = audience ? `\n## Target Audience\nWrite specifically for: ${audience}. Use language, examples, and pain points that resonate with this group.\n` : "";
  const toneLine = tone ? `\n## Tone\nWrite in a ${tone} voice throughout.\n` : "";
  const topicLine = topic ? `\n## Topic\nCore subject: ${topic}. Every slide must directly relate to this topic.\n` : "";
  const keyPointsLine = keyPoints?.length ? `\n## Key Points to Cover\nYou MUST include these points across the slides:\n${keyPoints.map((p) => `- ${p}`).join("\n")}\n` : "";
  const painPointsLine = painPoints?.length ? `\n## Pain Points to Address\nAddress these specific problems:\n${painPoints.map((p) => `- ${p}`).join("\n")}\n` : "";
  const avoidLine = previousTitles?.length
    ? `\n## Avoid Repetition — CRITICAL\nThe user already has these carousels. Do NOT copy their hooks, CTAs, examples, analogies, or structure:\n${previousTitles.map((t) => `- "${t}"`).join("\n")}\nGenerate a completely different angle, fresh examples, different storytelling approach, and a new hook style.\n`
    : "";
  const slideStructure = buildSlideStructure(numSlides);

  return `You are a world-class LinkedIn content strategist who writes viral carousels for founders, creators, and professionals.

Your goal: Transform the user's content into a ${numSlides}-slide LinkedIn carousel that STOPS the scroll.
${audienceLine}${toneLine}${topicLine}${keyPointsLine}${painPointsLine}${avoidLine}
## Opening Hook Directive
${hookStyle}

## CTA Directive
${ctaStyle}

## Carousel Structure — EXACTLY ${numSlides} slides, no more, no fewer
${slideStructure}

## Content Diversity Rules
- Use a storytelling structure you have NOT used before: Choose from: Problem-Solution, Before-After, Steps-Framework, Myth-Busting, Question-Answer, List-Story, Journey-Transformation
- Each slide headline must use a DIFFERENT syntactic form (question / statement / number / command)
- Avoid overused phrases: "game-changer", "unlock your potential", "level up", "crushing it", "hustle"

## Slide Rules
- Each slide = ONE clear insight only
- Headline: 4-8 words, scannable in 1 second
- Body: 1 optional context sentence (max 15 words)
- Bullets: 2-3 punchy points, 6-12 words each, starting with action verbs, numbers, or "The"
- NO full sentences in bullets — fragments are better
- Use SPECIFICITY: real numbers, percentages, timeframes, examples

## Writing Style
- 2nd person ("You", "Your") — speak directly to the reader
- Active voice only
- Zero fluff — every word must earn its place
- Use CONTRAST: "Before vs After", "Old vs New", "Mistake vs Fix"

## CRITICAL: Output Format
Return ONLY a valid JSON object. No markdown, no code fences, no explanation.
The "slides" array MUST have EXACTLY ${numSlides} items — no more, no fewer.

{
  "title": "<short carousel title, 4-7 words>",
  "slides": [
    {
      "headline": "<punchy headline, 4-8 words>",
      "body": "<optional context sentence, max 15 words>",
      "bullets": ["<point 1>", "<point 2>", "<point 3>"]
    }
  ]
}`;
}
