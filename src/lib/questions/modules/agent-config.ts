import { QuestionModule } from '../../../types';

export const agentConfigModule: QuestionModule = {
  id: 'agent-config',
  name: 'Agent Configuration',
  description: 'Mistral-vibe agent definition (agent.toml)',
  entity_type: 'agent',
  sections: [
    {
      id: 'identity',
      title: 'Agent Identity',
      questions: [
        {
          id: 'agent_name',
          prompt: 'What is the name of your agent?',
          help_text: 'Use kebab-case (e.g., code-reviewer)',
          type: 'text',
          required: true,
          placeholder: 'security-expert'
        },
        {
          id: 'agent_purpose',
          prompt: 'What is the core purpose of this agent?',
          help_text: 'A brief description of what the agent is designed to do.',
          type: 'textarea',
          required: true,
          multiline: true
        }
      ]
    },
    {
      id: 'model',
      title: 'Model Configuration',
      questions: [
        {
          id: 'model_provider',
          prompt: 'Which model provider would you like to use?',
          type: 'select',
          required: true,
          config: {
            options: [
              { value: 'mistral', label: 'Mistral AI' },
              { value: 'anthropic', label: 'Anthropic' },
              { value: 'openai', label: 'OpenAI' },
              { value: 'google', label: 'Google AI' },
              { value: 'llamacpp', label: 'Llama.cpp' },
              { value: 'custom', label: 'Custom Provider' }
            ]
          }
        },
        {
          id: 'model_name',
          prompt: 'Which specific model would you like to use?',
          type: 'text',
          required: true,
          placeholder: 'mistral-large-latest'
        },
        {
          id: 'temperature',
          prompt: 'Model Temperature',
          help_text: 'Higher = more creative, Lower = more deterministic',
          type: 'slider',
          required: false,
          config: {
            min: 0,
            max: 1,
            step: 0.1,
            show_value: true
          },
          default_value: 0.2
        }
      ]
    },
    {
      id: 'tools',
      title: 'Tool Permissions',
      questions: [
        {
          id: 'tool_permission_strategy',
          prompt: 'How would you like to handle tool permissions?',
          type: 'select',
          required: true,
          config: {
            options: [
              { value: 'permissive', label: 'Permissive (All tools always allowed)', description: 'Fast but risky' },
              { value: 'restrictive', label: 'Restrictive (Always ask)', description: 'Safest but slow' },
              { value: 'custom', label: 'Custom (Per-tool settings)', description: 'Granular control' }
            ]
          }
        },
        {
          id: 'disabled_tools',
          prompt: 'Are there any tools you want to disable entirely?',
          type: 'multi-select',
          required: false,
          config: {
            options: [
              { value: 'bash', label: 'Bash Execution' },
              { value: 'write_file', label: 'Write File' },
              { value: 'search_replace', label: 'Search & Replace' },
              { value: 'read_file', label: 'Read File' },
              { value: 'grep', label: 'Grep Search' }
            ]
          }
        }
      ]
    }
  ]
};
