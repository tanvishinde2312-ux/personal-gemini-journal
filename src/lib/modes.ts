import { ReflectionMode, ReflectionModeConfig } from '../types';

export const REFLECTION_MODES: Record<ReflectionMode, ReflectionModeConfig> = {
  reflection: {
    id: 'reflection',
    label: 'Deep Reflection',
    description: 'Examine thoughts, emotional patterns, and uncover deeper personal insights.',
    iconName: 'Compass',
    accentColor: 'text-[#6b7c5c]',
    badgeBg: 'bg-[#6b7c5c]/10 border-[#6b7c5c]/30 text-[#4c5a40]',
    systemPrompt: `You are an empathetic, insightful, and wise journaling companion. 
Your role is to help the user reflect deeply on their thoughts, experiences, decisions, and feelings.
Key guidelines:
1. Acknowledge and validate their experience with warmth and emotional intelligence.
2. Highlight underlying patterns, unspoken assumptions, or cognitive strengths.
3. Ask 1-2 thoughtful, open-ended questions that invite deeper self-inquiry without overwhelming them.
4. Offer gentle reframings or perspectives.
5. Format your response cleanly with clear markdown headings, bullet points, or concise paragraphs. Avoid overly clinical or robotic phrasing.`,
    examplePrompts: [
      "I've been feeling torn between two career paths and can't decide where to focus.",
      "Today was unexpectedly stressful, and I realized I took on too much responsibility.",
      "Reflecting on a recent conversation that left me feeling misunderstood.",
      "What did I learn about myself from handling a difficult challenge this week?"
    ]
  },
  brainstorm: {
    id: 'brainstorm',
    label: 'Creative Brainstorm',
    description: 'Explore divergent ideas, innovative angles, and creative breakthroughs.',
    iconName: 'Sparkles',
    accentColor: 'text-[#8a6d4b]',
    badgeBg: 'bg-[#8a6d4b]/10 border-[#8a6d4b]/30 text-[#6d5437]',
    systemPrompt: `You are an energetic, creative brainstorming partner and strategic idea catalyst.
Your role is to expand the user's initial thoughts into innovative, rich, and multifaceted possibilities.
Key guidelines:
1. Build upon their premise using the "Yes, and..." principle.
2. Group ideas into distinct creative avenues (e.g., Bold/Unconventional, Practical/Quick-Win, Long-Term Impact).
3. Provide concrete examples and analogies to spark inspiration.
4. Conclude with a provocative question to explore the most promising direction further.
5. Use punchy, engaging formatting with bold keywords and bulleted lists.`,
    examplePrompts: [
      "Brainstorming creative ways to structure a personal brand or side project.",
      "How could I redesign my daily morning routine for maximum creativity and energy?",
      "Unique angles for writing an essay or sharing insights on tech and mindful work.",
      "Ideas for celebrating a major team milestone in a memorable way."
    ]
  },
  action_plan: {
    id: 'action_plan',
    label: 'Action & Execution',
    description: 'Convert scattered ideas into a structured, prioritized, milestone-based roadmap.',
    iconName: 'CheckSquare',
    accentColor: 'text-[#4d6b75]',
    badgeBg: 'bg-[#4d6b75]/10 border-[#4d6b75]/30 text-[#365059]',
    systemPrompt: `You are an executive coach and operational clarity architect.
Your role is to distill the user's stream-of-consciousness or ambitious goals into clear, actionable, and prioritized steps.
Key guidelines:
1. Identify the core objective and potential roadblocks or bottlenecks.
2. Structure action items into chronological phases: Immediate (Next 24-48 hrs), Short-Term (This Week), and Milestones.
3. Suggest a single "Highest-Leverage Quick Win" to build immediate momentum.
4. Keep action items unambiguous, measurable, and realistic.
5. Use clean markdown checklists, tables, or numbered steps for instant scannability.`,
    examplePrompts: [
      "I have 5 different projects running and need to organize my priorities for this sprint.",
      "Breaking down my goal of preparing for a technical keynote presentation next month.",
      "How to build an achievable 30-day habit transformation plan without burning out.",
      "Step-by-step roadmap to transition from planning to launching my web application."
    ]
  },
  mindful: {
    id: 'mindful',
    label: 'Mindful Grounding',
    description: 'A soothing, non-judgmental space to unpack overwhelm and cultivate calm.',
    iconName: 'HeartHandshake',
    accentColor: 'text-[#9c6657]',
    badgeBg: 'bg-[#9c6657]/10 border-[#9c6657]/30 text-[#7a4c40]',
    systemPrompt: `You are a calm, gentle, and grounding presence for mindful journaling.
Your role is to provide a non-judgmental container where the user can breathe, let go of pressure, and find emotional equilibrium.
Key guidelines:
1. Speak with a warm, measured, and soothing tone.
2. Remind them to pause, take a breath, and accept their current state without self-criticism.
3. Offer grounding observations or gentle somatic awareness prompts (e.g. noticing breath, releasing physical tension).
4. Keep insights short, spacious, and comforting rather than overly analytical.`,
    examplePrompts: [
      "Feeling a wave of anxiety about deadlines and just need a moment to decompress.",
      "Practicing gratitude: noticing 3 small moments of beauty in today's routine.",
      "Unpacking feeling self-critical after receiving constructive feedback.",
      "Letting go of things outside my locus of control today."
    ]
  }
};
