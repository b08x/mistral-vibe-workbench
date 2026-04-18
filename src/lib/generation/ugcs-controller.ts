import { 
  VibeWorkspace, 
  ComplianceStatus, 
  InterventionRecord, 
  GenerationResult,
  GenerationPrompt
} from '../../types';
import { 
  ProviderRegistry
} from '../providers/registry';
import controlSurfaceData from '../../config/generation_control_surface.json';

// Types for the control surface
type Phase = 'context_gathering' | 'drafting' | 'review';
type EntityType = 'agent' | 'skill' | 'system-prompt' | 'tool' | 'subagent';

interface DimensionDirective {
  register: string;
  directive: string;
  failure_mode: string;
  self_check: string;
}

interface OutputTypeProfile {
  _purpose: string;
  _sre_risk: string;
  dimensions: Record<string, DimensionDirective>;
  pass_through_unchanged?: string[];
  recommended_sections?: string[];
  validation_rules?: string[];
}

interface ControlSurface {
  file_profiles: Record<string, OutputTypeProfile>;
  dimensions: Array<{
    dimension: string;
    description: string;
    context_gathering: DimensionDirective;
    drafting: DimensionDirective;
    review: DimensionDirective;
  }>;
  global_intervention_primitives: Record<string, string>;
  sre_failure_mode_index: Record<string, {
    sre_analogue: string;
    telemetry: string;
    intervention: string;
  }>;
}

const controlSurface = controlSurfaceData as unknown as ControlSurface;

export class UGCSController {
  private entityType: EntityType;
  private profile: OutputTypeProfile;

  constructor(entityType: EntityType) {
    this.entityType = entityType;
    const profileKey = this.getProfileKey(entityType);
    this.profile = controlSurface.file_profiles[profileKey];
  }

  private getProfileKey(entityType: EntityType): string {
    switch (entityType) {
      case 'agent': return 'AGENT_TOML';
      case 'skill': return 'SKILL_MD';
      case 'system-prompt': return 'SYSTEM_PROMPT_MD';
      case 'subagent': return 'SUBAGENT_TOML';
      default: return 'AGENT_TOML';
    }
  }

  getDimensionDirectives(phase: Phase): Record<string, DimensionDirective> {
    const baseDimensions: Record<string, DimensionDirective> = {};
    
    for (const d of controlSurface.dimensions) {
      baseDimensions[d.dimension] = d[phase];
    }

    // Apply profile overrides
    if (this.profile && this.profile.dimensions) {
      for (const [dim, override] of Object.entries(this.profile.dimensions)) {
        if (baseDimensions[dim]) {
          baseDimensions[dim] = {
            ...baseDimensions[dim],
            ...override
          };
        }
      }
    }

    return baseDimensions;
  }

  buildDimensionPrompt(phase: Phase): string {
    const directives = this.getDimensionDirectives(phase);
    let prompt = "BEHAVIORAL DIMENSION DIRECTIVES:\n";
    
    for (const [dim, dir] of Object.entries(directives)) {
      prompt += `- ${dim} [${dir.register}]: ${dir.directive}\n`;
    }

    if (phase === 'review') {
      prompt += "\nSELF-CHECK PROTOCOL:\n";
      for (const [dim, dir] of Object.entries(directives)) {
        prompt += `- ${dim}: ${dir.self_check}\n`;
      }
    }

    return prompt;
  }

  detectFailureModes(content: string): string[] {
    const detected: string[] = [];
    
    for (const [mode, data] of Object.entries(controlSurface.sre_failure_mode_index)) {
      // Heuristic detection based on telemetry description
      if (this.telemetryMatch(content, data.telemetry)) {
        detected.push(mode);
      }
    }

    return detected;
  }

  private telemetryMatch(content: string, telemetry: string): boolean {
    // Simple heuristic matches for telemetry patterns
    if (telemetry.includes('Metaphor accumulation') && (content.split('like').length > 5 || content.split('as a').length > 5)) return true;
    if (telemetry.includes('self-commentary') && (content.includes('I have generated') || content.includes('This document'))) return true;
    if (telemetry.includes('competing metaphor systems') && content.split('##').length > 10) return true;
    return false;
  }

  getIntervention(failureMode: string): string {
    const modeData = controlSurface.sre_failure_mode_index[failureMode];
    if (!modeData) return '';
    return controlSurface.global_intervention_primitives[modeData.intervention] || '';
  }
}
