import { 
  VibeWorkspace, 
  GenerationPrompt 
} from '../../../types';
import { 
  UGCSController 
} from '../ugcs-controller';

export function buildAgentConfigPrompt(
  phase: 'context_gathering' | 'drafting' | 'review',
  workspace: VibeWorkspace,
  controller: UGCSController,
  draft?: string
): GenerationPrompt {
  const dimensionDirectives = controller.buildDimensionPrompt(phase);

  if (phase === 'context_gathering') {
    return {
      system: `You are an expert system architect performing the CONTEXT_GATHERING phase for a mistral-vibe agent configuration.

PURPOSE: Ground the generation in the provided user requirements. Catalog all constraints and configuration parameters exactly as requested.

${dimensionDirectives}

GOALS:
1. Extract every relevant parameter from user answers.
2. Identify all required tools and their permission levels.
3. Determine model preferences and temperature.
4. Note if a custom system prompt or additional skills are required.
5. List all constraints (disabled tools, specific allowlists/denylists).

CRITICAL: Catalog facts only. Do not speculate on values or suggest defaults yet unless the user explicitly requested them.`,
      
      user: `ENTITY TYPE: agent
USER ANSWERS:
${JSON.stringify(workspace.session.answers, null, 2)}

Identify and catalog all agent configuration requirements.`
    };
  }

  if (phase === 'drafting') {
    const skeletonPrompt = workspace.generation.skeletonConstraints 
      ? `\nSTRUCTURAL CONSTRAINTS (user-approved component plan — follow exactly):\n${workspace.generation.skeletonConstraints}\n\nGenerate the artifact with this exact section structure. Do not add, remove, or reorder sections.\n`
      : '';

    return {
      system: `You are generating a mistral-vibe agent.toml configuration file during the DRAFTING phase.
${skeletonPrompt}
PURPOSE: Synthesize the cataloged context into a functional, valid TOML artifact.

${dimensionDirectives}

FORMAT REQUIREMENTS:
- Output valid TOML only.
- Use the following sections:
  [tools.<tool_name>]
  permission = "always" | "ask" | "deny"
  default_timeout = <number>
  allowlist = ["<path>", ...]
  denylist = ["<path>", ...]
- Use active_model = "<model_id>"
- Include system_prompt_id if referenced.
- Include disabled_tools = ["<tool_name>", ...]

CRITICAL: No explanations. Just the TOML. Include comments only for parameter descriptions.`,
      
      user: `CONTEXT CATALOG:
${JSON.stringify(workspace.generation.contextMap, null, 2)}

Generate the agent.toml file now.`
    };
  }

  // Review phase
  return {
    system: `You are performing the REVIEW phase for a generated agent.toml configuration.

PURPOSE: Validate syntax, check dimension compliance, and correct failure modes.

${dimensionDirectives}

SRE FAILURE MODE AUDIT:
- High Exploration: Is the config too "creative" or vague?
- Self-Revision Loop: Does the output discuss itself?
- Constraint Violation: Is the TOML invalid or tool names incorrect?

CRITICAL: If errors or dimension violations are found, provide the full corrected TOML artifact. If it is already perfect, return the original content verbatim.`,
    
    user: `DRAFT ARTIFACT:
${draft}

USER REQUIREMENTS:
${JSON.stringify(workspace.session.answers, null, 2)}

Perform the review and return the final valid TOML content.`
  };
}
