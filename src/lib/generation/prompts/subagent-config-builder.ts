import { 
  VibeWorkspace, 
  GenerationPrompt 
} from '../../../types';
import { 
  UGCSController 
} from '../ugcs-controller';

export function buildSubagentConfigPrompt(
  phase: 'context_gathering' | 'drafting' | 'review',
  workspace: VibeWorkspace,
  controller: UGCSController,
  draft?: string
): GenerationPrompt {
  const dimensionDirectives = controller.buildDimensionPrompt(phase);

  if (phase === 'context_gathering') {
    return {
      system: `You are performing the CONTEXT_GATHERING phase for a mistral-vibe parallel extraction subagent configuration.

PURPOSE: Catalog all chunk assignment parameters, extraction behavior settings, and file scope. This subagent is one node in a parallel fleet — all values must be concrete and traceable to the user's dispatch plan.

${dimensionDirectives}

CATALOG GOALS:

1. CHUNK IDENTITY
   - chunk_id: which chunk is this? (positive integer, 1-based)
   - total_chunks: how many chunks total in this dispatch? (>= chunk_id)
   - role: extraction | analysis | verification | execution

2. FILE SCOPE ASSIGNMENT
   - files: exact list of relative file paths assigned to this chunk
     !! These must be literal paths, not glob patterns !!
   - types: which file types are present? (code | document | paper | image)
   - max_files: maximum files per chunk (default 22)

3. EXTRACTION MODE
   - deep: aggressive inferred edges? (boolean, default false)
   - semantic: semantic extraction vs AST-only? (boolean, default true)
   - hyperedges: extract hyperedges? (boolean, default true)

4. OUTPUT REQUIREMENTS
   - format: always "json" for extraction subagents
   - schema_version: default "1.0"
   - require_nodes: must nodes be present? (boolean)
   - require_edges: must edges be present? (boolean)
   - require_confidence: must confidence scores be present? (boolean)

5. ERROR HANDLING
   - retry_on_fail: retry failed extractions? (boolean)
   - max_retries: maximum retry attempts (integer, default 2)
   - log_failures: log failures to file? (boolean)

6. EDGE CLASSIFICATION RULES
   Note the fixed edge type enum:
   EXTRACTED edges (explicit in source):
     calls, import, reference, cite, defines
   INFERRED edges (reasonable inference):
     implements, shares_data_with, conceptually_related_to, semantically_similar_to, wraps
   AMBIGUOUS edges (uncertain):
     flag_for_review
   
   Catalog which edge types the user wants enabled/disabled.
   Default: all of the above are active unless user excluded specific types.

7. CONFIDENCE SCORE CONFIGURATION
   Note: The confidence table has fixed canonical values.
   Catalog only if the user explicitly wants to override any tier:
   - EXTRACTED: 1.0 (fixed)
   - INFERRED_HIGH: 0.9 (fixed)
   - INFERRED_MID: 0.7 (fixed)
   - INFERRED_LOW: 0.5 (fixed)
   - AMBIGUOUS: 0.2 (fixed)

8. FILE HANDLERS
   For each file type present in scope.types, catalog:
   - extensions list
   - focus areas (for code) or extract targets (for document/paper)
   - vision enabled (for image only)

9. CONTEXT INJECTION
   - domain_hint: what domain is this codebase/corpus? (e.g. "Software Architecture")
   - prompt: any style or quality instructions for the extraction? (e.g. "Use proper punctuation.")
   - frontmatter fields to propagate (default: source_url, captured_at, author, contributor)

CRITICAL: Record "NOT_SPECIFIED" for any field the user did not address. Do not assign edge types, file paths, or chunk IDs that the user did not provide.`,
      
      user: `ENTITY TYPE: subagent
USER ANSWERS:
${JSON.stringify(workspace.session.answers, null, 2)}

Catalog all subagent configuration requirements following the 9-goal structure. Output as structured JSON with keys matching each goal section.`
    };
  }

  if (phase === 'drafting') {
    const skeletonPrompt = workspace.generation.skeletonConstraints 
      ? `\nSTRUCTURAL CONSTRAINTS (user-approved component plan — follow exactly):\n${workspace.generation.skeletonConstraints}\n\nGenerate the artifact with this exact section structure. Do not add, remove, or reorder sections.\n`
      : '';

    return {
      system: `You are generating a mistral-vibe extraction subagent configuration file during the DRAFTING phase. Output is TOML following subagent-template.md exactly.

${skeletonPrompt}

PURPOSE: Synthesize the cataloged chunk assignment into a complete, valid TOML configuration for one extraction subagent.

${dimensionDirectives}

DEFINED ENUMERATIONS — reference during generation:

EDGE TYPE ENUM (use only these values):
  EXTRACTED: calls | import | reference | cite | defines
  INFERRED:  implements | shares_data_with | conceptually_related_to | semantically_similar_to | wraps
  AMBIGUOUS: flag_for_review
  HYPEREDGE RELATIONS: participate_in | implement | form

CONFIDENCE SCORE TABLE (fixed values — do not alter):
  extracted      = 1.0
  inferred_high  = 0.9
  inferred_mid   = 0.7
  inferred_low   = 0.5
  ambiguous      = 0.2

FILE TYPE ENUM: code | document | paper | image

STRUCTURAL SCHEMA — follow this section order exactly:

[subagent]
role = "<enum>"                   # extraction | analysis | verification | execution
chunk_id = <int>                  # 1-based, from catalog
total_chunks = <int>              # >= chunk_id, from catalog

[subagent.scope]
files = [                         # Literal relative paths only — no glob patterns
  "<path>",
  ...
]
types = ["<enum>", ...]           # code | document | paper | image
max_files = <int>                 # Default 22

[subagent.mode]
deep = <bool>                     # Default false
semantic = <bool>                 # Default true
hyperedges = <bool>               # Default true

[subagent.output]
format = "json"                   # Always "json" for extraction subagents
schema_version = "<string>"       # Default "1.0"
require_nodes = <bool>            # Default true
require_edges = <bool>            # Default true
require_confidence = <bool>       # Default true

[subagent.error_handling]
retry_on_fail = <bool>            # Default true
max_retries = <int>               # Default 2
log_failures = <bool>             # Default true

[extraction.edge_rules]
# Edge Classification Rules
extracted = ["<edge_type>", ...]  # Only from EXTRACTED enum
inferred  = ["<edge_type>", ...]  # Only from INFERRED enum
ambiguous = ["<edge_type>", ...]  # Only from AMBIGUOUS enum

[extraction.confidence]
# Confidence Score Table — use fixed canonical values
extracted      = 1.0
inferred_high  = 0.9
inferred_mid   = 0.7
inferred_low   = 0.5
ambiguous      = 0.2

[extraction.node_id]
format = "{stem}_{entity}"
stem   = "lowercase(Path).suffix_removed"
entity = "symbol_name_normalized"
# example: "src/auth/session.py + ValidateToken → session_validatetoken"

[extraction.semantic_similarity]
enabled = <bool>                  # Default true — adds semantically_similar_to edges

[extraction.hyperedges]
enabled        = <bool>           # Default true
min_nodes      = <int>            # Default 3 (minimum to form a hyperedge)
max_per_chunk  = <int>            # Default 3

[file_handlers.code]              # Only if "code" is in scope.types
extensions = [".py", ".ts", ".js", ".go", ".rs", ".rb", ".java"]
# Override extensions only if user specified non-default languages
focus = [
  "semantic edges AST cannot find",
  "call relationships",
  "shared data structures",
  "architecture patterns"
]
skip = ["imports (AST already has these)"]

[file_handlers.document]          # Only if "document" is in scope.types
extensions = [".md", ".txt", ".rst", ".adoc"]
extract = [
  "named concepts",
  "entities",
  "citations",
  "rationale (WHY decisions made)"
]

[file_handlers.paper]             # Only if "paper" is in scope.types
extensions = [".pdf"]
extract = [
  "research questions",
  "methods",
  "results",
  "limitations",
  "citations"
]

[file_handlers.image]             # Only if "image" is in scope.types
extensions = [".png", ".jpg", ".jpeg", ".webp", ".svg"]
use_vision = true
extract = [
  "layout patterns",
  "design decisions",
  "key elements",
  "purpose"
]

[context]
domain_hint = "<string>"          # Domain of the codebase/corpus
prompt      = "<string>"          # Style/quality instruction for extraction agent

[context.frontmatter]
propagate = ["source_url", "captured_at", "author", "contributor"]
# Add or remove fields only if user specified

EMIT RULES:
- Output valid TOML only. No markdown fences. No explanations outside of # comments.
- Omit [file_handlers.*] sections for types NOT in subagent.scope.types.
- All edge type values must be from the defined enums exactly.
- All confidence scores must be the fixed canonical values — do not alter them.
- file paths in subagent.scope.files must be literal strings — no glob patterns.`,
      
      user: `CONTEXT CATALOG:
${JSON.stringify(workspace.generation.contextMap, null, 2)}

Generate the subagent TOML configuration now.`
    };
  }

  // Review phase
  return {
    system: `You are performing the REVIEW phase for a generated mistral-vibe extraction subagent configuration.

PURPOSE: Validate enum values, chunk ID logic, file path format, confidence score table integrity, and structural compliance. Return corrected artifact or original verbatim.

${dimensionDirectives}

VALIDATION CHECKLIST:

TOML SYNTAX:
  [ ] Parses without errors
  [ ] No duplicate keys
  [ ] All arrays use proper TOML syntax
  [ ] All booleans are true/false (not strings)

CHUNK ID LOGIC:
  [ ] chunk_id is a positive integer >= 1
  [ ] total_chunks is a positive integer >= chunk_id
  [ ] chunk_id <= total_chunks

FILE SCOPE:
  [ ] subagent.scope.files is a non-empty array
  [ ] All file paths are literal relative strings (no *, ?, **, or {} glob syntax)
  [ ] All file paths use forward slashes
  [ ] subagent.scope.types values are all from: code | document | paper | image

EDGE TYPE AUDIT — CRITICAL:
  [ ] All values in extraction.edge_rules.extracted are from EXTRACTED enum:
      calls | import | reference | cite | defines
  [ ] All values in extraction.edge_rules.inferred are from INFERRED enum:
      implements | shares_data_with | conceptually_related_to | semantically_similar_to | wraps
  [ ] All values in extraction.edge_rules.ambiguous are from AMBIGUOUS enum:
      flag_for_review
  [ ] No edge type appears in more than one classification list

CONFIDENCE SCORE AUDIT — CRITICAL:
  [ ] extracted      = 1.0  (exactly)
  [ ] inferred_high  = 0.9  (exactly)
  [ ] inferred_mid   = 0.7  (exactly)
  [ ] inferred_low   = 0.5  (exactly)
  [ ] ambiguous      = 0.2  (exactly)

FILE HANDLER CONSISTENCY:
  [ ] [file_handlers.code] exists if and only if "code" is in scope.types
  [ ] [file_handlers.document] exists if and only if "document" is in scope.types
  [ ] [file_handlers.paper] exists if and only if "paper" is in scope.types
  [ ] [file_handlers.image] exists if and only if "image" is in scope.types
  [ ] file_handlers.image.use_vision is boolean (not string)
  [ ] All file extensions in handler lists start with "." (e.g. ".py" not "py")

OUTPUT CONFIG:
  [ ] subagent.output.format is exactly "json"
  [ ] subagent.role is one of: extraction | analysis | verification | execution

DIMENSION COMPLIANCE:
  [ ] Abstraction Level: NONE — all values are concrete literals
  [ ] Novelty Injection: NONE — no invented keys, no non-template sections
  [ ] Constraint Adherence: ABSOLUTE — all enum and range constraints satisfied

SRE FAILURE MODE SCAN:
  [ ] Hard Boundary Enforcement: all enum values are from defined lists (no fuzzy matches)
  [ ] Split-Brain: chunk_id and total_chunks are internally consistent

IF ANY ITEM IS FAIL:
  Correct the artifact. Return the full corrected TOML.

IF ALL ITEMS ARE PASS:
  Return the original content verbatim. Do not alter formatting or comments.

Do NOT explain what you checked. Output ONLY the TOML.`,
    
    user: `DRAFT ARTIFACT:
${draft}

USER REQUIREMENTS:
${JSON.stringify(workspace.session.answers, null, 2)}

Perform the review and return the final valid TOML content.`
  };
}
