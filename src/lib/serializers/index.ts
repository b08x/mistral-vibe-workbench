import { AgentConfigState, SkillDefinitionState, SystemPromptState } from '../../types';

export class TOMLSerializer {
  static serialize(config: AgentConfigState): string {
    let toml = '';
    
    if (config.model_name) toml += `active_model = "${config.model_name}"\n`;
    if (config.system_prompt_id) toml += `system_prompt_id = "${config.system_prompt_id}"\n`;
    
    if (config.disabled_tools && config.disabled_tools.length > 0) {
      toml += `disabled_tools = [${config.disabled_tools.map(t => `"${t}"`).join(', ')}]\n`;
    }

    if (config.tool_permissions) {
      for (const [tool, perm] of Object.entries(config.tool_permissions)) {
        toml += `\n[tools.${tool}]\n`;
        toml += `permission = "${(perm as any).permission}"\n`;
        if ((perm as any).default_timeout) toml += `default_timeout = ${(perm as any).default_timeout}\n`;
      }
    }

    return toml;
  }
}

export class MarkdownSerializer {
  static serializeSkill(skill: SkillDefinitionState): string {
    let md = '---\n';
    md += `name: ${skill.skill_name}\n`;
    md += `description: ${skill.skill_description}\n`;
    md += `user-invocable: ${skill.user_invocable}\n`;
    if (skill.allowed_tools && skill.allowed_tools.length > 0) {
      md += `allowed-tools:\n${skill.allowed_tools.map(t => `  - ${t}`).join('\n')}\n`;
    }
    md += '---\n\n';
    md += `# ${skill.skill_name?.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')} Skill\n\n`;
    md += `## Overview\n${skill.skill_description}\n\n`;
    md += `## Workflow\n${skill.workflow_content}\n`;
    
    return md;
  }

  static serializeSystemPrompt(prompt: SystemPromptState): string {
    let md = `## Identity & Role\nI am a virtual expert configured for: ${prompt.prompt_purpose}\n\n`;
    
    if (prompt.expert_domains && prompt.expert_domains.length > 0) {
      md += `## Expertise\n`;
      md += prompt.expert_domains.map(d => `- ${d}`).join('\n') + '\n\n';
    }

    md += `## Communication Approach\nStyle: ${prompt.communication_style}\nFormat: ${prompt.response_format}\n\n`;
    
    if (prompt.constraints && prompt.constraints.length > 0) {
      md += `## Constraints\n`;
      md += prompt.constraints.map(c => `- ${c}`).join('\n') + '\n\n';
    }

    return md;
  }
}
