import { 
  VibeWorkspace, 
  GenerationPrompt 
} from '../../../types';
import { 
  UGCSController 
} from '../ugcs-controller';

export function buildSystemPromptPrompt(
  phase: 'context_gathering' | 'drafting' | 'review',
  workspace: VibeWorkspace,
  controller: UGCSController,
  draft?: string
): GenerationPrompt {
  const dimensionDirectives = controller.buildDimensionPrompt(phase);

  if (phase === 'context_gathering') {
    return {
      system: `You are performing the CONTEXT_GATHERING phase for a mistral-vibe custom system prompt.

PURPOSE: Ground the identity and expertise of the agent in the provided user answers.

${dimensionDirectives}

GOALS:
1. Define the agent's core identity and role.
2. List specific expertise domains and technical depth.
3. Identify communication style and response format preferences.
4. Catalog all behavioral constraints and priority hierarchies.
5. Capture any user-provided examples of good/bad behavior.

CRITICAL: Catalog facts only. Do not invent personality traits or expertise areas yet.`,
      
      user: `ENTITY TYPE: system-prompt
USER ANSWERS:
${JSON.stringify(workspace.session.answers, null, 2)}

Identify and catalog all system prompt requirements.`
    };
  }

  if (phase === 'drafting') {
    return {
      system: `You are generating a custom mistral-vibe system prompt during the DRAFTING phase.

PURPOSE: Synthesize identity and expertise into a professional, first-person identity document.

${dimensionDirectives}

FORMAT REQUIREMENTS:
- Clear headers (## Identity & Role, ## Expertise, ## Communication Approach, etc.)
- Use first-person perspective ('I am...', 'I analyze...', 'I do not...')
- Content: professional expertise, technical depth, behavioral guidance.
- Constraints: Must be specific, list behaviors the agent will NOT perform.

CRITICAL: Do not perform the identity in the output text itself — specify the identity the agent should adopt. No meta-commentary.`,
      
      user: `CONTEXT CATALOG:
${JSON.stringify(workspace.generation.contextMap, null, 2)}

Generate the system prompt file now.`
    };
  }

  // Review phase
  return {
    system: `You are performing the REVIEW phase for a generated system prompt artifact.

PURPOSE: Validate identity consistency, check dimension compliance, and remove theatrical manifesto-drift.

${dimensionDirectives}

SRE FAILURE MODE AUDIT:
- Manifesto Drift: Are there theatrical identity claims?
- High Exploration: Is the expertise synthesized too metaphorically?
- Self-Revision Loop: Does the prompt discuss its own construction?

CRITICAL: If errors or dimension violations are found, provide the full corrected file content. If it is already perfect, return the original content verbatim.`,
    
    user: `DRAFT ARTIFACT:
${draft}

USER REQUIREMENTS:
${JSON.stringify(workspace.session.answers, null, 2)}

Perform the review and return the final valid system prompt content.`
  };
}
