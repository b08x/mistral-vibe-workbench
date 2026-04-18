import { QuestionModule } from '../../../types';

export const skillDefinitionModule: QuestionModule = {
  id: 'skill-definition',
  name: 'Skill Definition',
  description: 'Mistral-vibe skill workflow definition (SKILL.md)',
  entity_type: 'skill',
  sections: [
    {
      id: 'metadata',
      title: 'Skill Metadata',
      questions: [
        {
          id: 'skill_name',
          prompt: 'What is the name of your skill?',
          help_text: 'Use kebab-case (e.g., code-review)',
          type: 'text',
          required: true,
          placeholder: 'security-audit'
        },
        {
          id: 'skill_description',
          prompt: 'What does this skill do?',
          help_text: 'A brief summary of the skill\'s purpose and functionality.',
          type: 'textarea',
          required: true,
          multiline: true
        },
        {
          id: 'user_invocable',
          prompt: 'Can this skill be manually invoked by the user?',
          type: 'boolean',
          required: true,
          default_value: true
        },
        {
          id: 'allowed_tools',
          prompt: 'Which tools does this skill need to use?',
          type: 'multi-select',
          required: true,
          config: {
            options: [
              { value: 'bash', label: 'Bash Execution' },
              { value: 'read_file', label: 'Read File' },
              { value: 'write_file', label: 'Write File' },
              { value: 'search_replace', label: 'Search & Replace' },
              { value: 'grep', label: 'Grep Search' }
            ]
          }
        }
      ]
    },
    {
      id: 'workflow',
      title: 'Workflow Definition',
      questions: [
        {
          id: 'workflow_approach',
          prompt: 'How would you like to define the workflow steps?',
          type: 'select',
          required: true,
          config: {
            options: [
              { value: 'describe', label: 'Describe Steps (Natural Language)', description: 'Quick and flexible' },
              { value: 'qa', label: 'Step-by-Step Generator', description: 'Structured and detailed' }
            ]
          }
        },
        {
          id: 'workflow_content',
          prompt: 'Define the steps of the workflow:',
          help_text: 'Describe what the agent should do, step by step.',
          type: 'textarea',
          required: true,
          multiline: true,
          placeholder: '1. Scan the directory\n2. Locate security issues\n3. Report findings'
        },
        {
          id: 'workflow_error_handling',
          prompt: 'How should the agent handle errors during the workflow?',
          type: 'select',
          required: true,
          config: {
            options: [
              { value: 'continue', label: 'Continue (Attempt to skip failed steps)', description: 'Aggressive' },
              { value: 'abort', label: 'Abort (Stop immediately on error)', description: 'Conservative' },
              { value: 'ask', label: 'Ask (Prompt user for decision)', description: 'Safest' }
            ]
          }
        }
      ]
    }
  ]
};
