import { 
  VibeWorkspace, 
  GenerationPrompt 
} from '../../../types';
import { 
  UGCSController 
} from '../ugcs-controller';

export function buildSkillDefinitionPrompt(
  phase: 'context_gathering' | 'drafting' | 'review',
  workspace: VibeWorkspace,
  controller: UGCSController,
  draft?: string
): GenerationPrompt {
  const dimensionDirectives = controller.buildDimensionPrompt(phase);

  if (phase === 'context_gathering') {
    return {
      system: `You are performing the CONTEXT_GATHERING phase for a mistral-vibe skill defined in SKILL.md.

PURPOSE: Catalog all metadata and workflow steps requested by the user. 

${dimensionDirectives}

GOALS:
1. Extract frontmatter requirements: name, description, user-invocable, allowed-tools.
2. Catalog sequential workflow steps.
3. Identify all pre-conditions and error-handling preferences.
4. Note if templates or scripts are requested.
5. Capture any user-provided examples.

CRITICAL: Catalog facts only. Do not invent steps. Describe what the skill *should* do, not how it *could* be improved.`,
      
      user: `ENTITY TYPE: skill
USER ANSWERS:
${JSON.stringify(workspace.session.answers, null, 2)}

Identify and catalog all skill requirements.`
    };
  }

  if (phase === 'drafting') {
    const skeletonPrompt = workspace.generation.skeletonConstraints 
      ? `\nSTRUCTURAL CONSTRAINTS (user-approved component plan — follow exactly):\n${workspace.generation.skeletonConstraints}\n\nGenerate the artifact with this exact section structure. Do not add, remove, or reorder sections.\n`
      : '';

    return {
      system: `You are generating a mistral-vibe SKILL.md definition during the DRAFTING phase.
${skeletonPrompt}
PURPOSE: Synthesize metadata and procedural intent into a valid Markdown artifact with YAML frontmatter.

${dimensionDirectives}

FORMAT REQUIREMENTS:
- YAML frontmatter fenced with ---
- Content: name (kebab-case), description (string), user-invocable (boolean), allowed-tools (array).
- Markdown body with ## Workflow and ## Examples sections.
- Workflow must be sequential, numbered steps.
- Use imperative voice in steps.

CRITICAL: No meta-commentary. Just the Markdown + YAML frontmatter.`,
      
      user: `CONTEXT CATALOG:
${JSON.stringify(workspace.generation.contextMap, null, 2)}

Generate the SKILL.md file now.`
    };
  }

  // Review phase
  return {
    system: `You are performing the REVIEW phase for a generated SKILL.md definition.

PURPOSE: Validate YAML syntax, check dimension compliance, and ensure sequential logic.

${dimensionDirectives}

SRE FAILURE MODE AUDIT:
- Split-Brain: Is the workflow organization inconsistent?
- Thundering Herd: Is the imagery dense enough to obscure intent?
- Logic Gaps: Are any prerequisites or error states ignored?

CRITICAL: If errors or dimension violations are found, provide the full corrected Markdown artifact. If it is already perfect, return the original content verbatim.`,
    
    user: `DRAFT ARTIFACT:
${draft}

USER REQUIREMENTS:
${JSON.stringify(workspace.session.answers, null, 2)}

Perform the review and return the final valid Markdown content.`
  };
}
