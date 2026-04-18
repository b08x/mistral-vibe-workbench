import { QuestionModule } from '../../../types';

export const systemPromptModule: QuestionModule = {
  id: 'system-prompt',
  name: 'System Prompt',
  description: 'Mistral-vibe system prompt definition (system.md)',
  entity_type: 'system-prompt',
  sections: [
    {
      id: 'identity',
      title: 'Agent Identity',
      questions: [
        {
          id: 'prompt_id',
          prompt: 'What is the unique ID for this system prompt?',
          help_text: 'Use kebab-case (e.g., custom-prompt)',
          type: 'text',
          required: true,
          placeholder: 'security-reviewer'
        },
        {
          id: 'prompt_purpose',
          prompt: 'What is the purpose of this custom prompt?',
          help_text: 'What kind of agent or identity should this define?',
          type: 'textarea',
          required: true,
          multiline: true
        }
      ]
    },
    {
      id: 'expertise',
      title: 'Expertise & Knowledge',
      questions: [
        {
          id: 'expert_domains',
          prompt: 'Which domains should the agent be an expert in?',
          type: 'list',
          required: true,
          placeholder: 'Enter relevant expertise areas'
        },
        {
          id: 'technical_depth',
          prompt: 'What is the expected technical depth?',
          type: 'select',
          required: true,
          config: {
            options: [
              { value: 'beginner', label: 'Beginner (Tutorial-like explanations)' },
              { value: 'intermediate', label: 'Intermediate (Standard professional terminology)' },
              { value: 'expert', label: 'Expert (Deep technical jargon, advanced concepts)' }
            ]
          }
        }
      ]
    },
    {
      id: 'behavior',
      title: 'Communication & Behavior',
      questions: [
        {
          id: 'communication_style',
          prompt: 'Which communication style should the agent use?',
          type: 'select',
          required: true,
          config: {
            options: [
              { value: 'professional', label: 'Professional (Concise, polite, direct)' },
              { value: 'conversational', label: 'Conversational (Friendly, relaxed, approachable)' },
              { value: 'technical', label: 'Technical (Precise, objective, formal)' },
              { value: 'socratic', label: 'Socratic (Ask questions to guide the user)' }
            ]
          }
        },
        {
          id: 'response_format',
          prompt: 'What should be the primary response format?',
          type: 'select',
          required: true,
          config: {
            options: [
              { value: 'concise', label: 'Concise (Brief summaries)' },
              { value: 'detailed', label: 'Detailed (Full explanations, code snippets)' },
              { value: 'step-by-step', label: 'Step-by-Step (Clear numbered procedures)' },
              { value: 'analytical', label: 'Analytical (Comparison, pros/cons, trade-offs)' }
            ]
          }
        }
      ]
    },
    {
      id: 'constraints',
      title: 'Behavioral Constraints',
      questions: [
        {
          id: 'constraints',
          prompt: 'Which behaviors are strictly forbidden?',
          help_text: 'List specific things the agent should NOT do.',
          type: 'list',
          required: false,
          placeholder: 'Never delete files without asking, Never share API keys, etc.'
        },
        {
          id: 'priorities',
          prompt: 'What are the agent\'s top priorities?',
          help_text: 'List the order of importance for its actions.',
          type: 'list',
          required: false,
          placeholder: 'Accuracy, Security, Clarity, Efficiency'
        }
      ]
    }
  ]
};
