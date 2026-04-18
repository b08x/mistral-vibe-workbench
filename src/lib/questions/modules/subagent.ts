import { QuestionModule } from '../../../types';

export const subagentConfigModule: QuestionModule = {
  id: 'subagent',
  name: 'Subagent Configuration',
  description: 'Mistral-vibe parallel extraction subagent configuration (subagent.toml)',
  entity_type: 'subagent',
  sections: [
    {
      id: 'identity',
      title: 'Chunk Identity',
      questions: [
        {
          id: 'subagent_role',
          prompt: "What is this subagent's role?",
          type: 'select',
          required: true,
          default_value: 'extraction',
          config: {
            options: [
              { value: 'extraction', label: 'Extraction' },
              { value: 'analysis', label: 'Analysis' },
              { value: 'verification', label: 'Verification' },
              { value: 'execution', label: 'Execution' }
            ]
          }
        },
        {
          id: 'chunk_id',
          prompt: 'Which chunk number is this subagent handling? (1-based)',
          type: 'number',
          required: true,
          validation: { min: 1 }
        },
        {
          id: 'total_chunks',
          prompt: 'How many total chunks in this dispatch?',
          type: 'number',
          required: true,
          validation: { min: 1 }
        }
      ]
    },
    {
      id: 'scope',
      title: 'File Scope',
      questions: [
        {
          id: 'scope_files',
          prompt: 'List the relative file paths assigned to this chunk (one per line).',
          help_text: 'Use exact relative paths, no glob patterns.',
          type: 'textarea',
          required: true,
          multiline: true,
          placeholder: 'src/auth/session.py\nsrc/utils/crypto.ts'
        },
        {
          id: 'scope_types',
          prompt: 'What file types are in this chunk?',
          type: 'multi-select',
          required: true,
          config: {
            options: [
              { value: 'code', label: 'Source Code' },
              { value: 'document', label: 'Standard Document' },
              { value: 'paper', label: 'Research Paper' },
              { value: 'image', label: 'Image' }
            ]
          }
        },
        {
          id: 'scope_max_files',
          prompt: 'Maximum files per chunk? (default: 22)',
          type: 'number',
          required: false,
          placeholder: '22'
        }
      ]
    },
    {
      id: 'mode',
      title: 'Extraction Mode',
      questions: [
        {
          id: 'mode_deep',
          prompt: 'Use aggressive inferred edge extraction? (slower, more edges)',
          type: 'boolean',
          required: true,
          default_value: false
        },
        {
          id: 'mode_semantic',
          prompt: 'Use semantic extraction (not just AST)?',
          type: 'boolean',
          required: true,
          default_value: true
        },
        {
          id: 'mode_hyperedges',
          prompt: 'Extract hyperedges (relationships involving 3+ nodes)?',
          type: 'boolean',
          required: true,
          default_value: true
        }
      ]
    },
    {
      id: 'domain',
      title: 'Domain Context',
      questions: [
        {
          id: 'context_domain_hint',
          prompt: "What domain is this corpus? (e.g. 'Software Architecture', 'ML Research')",
          type: 'text',
          required: true,
          placeholder: 'Software Architecture'
        },
        {
          id: 'context_prompt',
          prompt: 'Any style or quality instructions for the extraction?',
          type: 'text',
          required: false,
          placeholder: 'e.g. Use proper punctuation.'
        }
      ]
    },
    {
      id: 'edges',
      title: 'Edge Classification',
      questions: [
        {
          id: 'edge_customization',
          prompt: 'Do you want to customize which edge types are enabled?',
          type: 'boolean',
          required: true,
          default_value: false
        },
        {
          id: 'edge_extracted_override',
          prompt: 'Which EXTRACTED edge types to include?',
          type: 'multi-select',
          required: false,
          show_if: (answers: any) => answers.edge_customization === true,
          config: {
            options: [
              { value: 'calls', label: 'Calls' },
              { value: 'import', label: 'Import' },
              { value: 'reference', label: 'Reference' },
              { value: 'cite', label: 'Cite' },
              { value: 'defines', label: 'Defines' }
            ]
          }
        },
        {
          id: 'edge_inferred_override',
          prompt: 'Which INFERRED edge types to include?',
          type: 'multi-select',
          required: false,
          show_if: (answers: any) => answers.edge_customization === true,
          config: {
            options: [
              { value: 'implements', label: 'Implements' },
              { value: 'shares_data_with', label: 'Shares Data With' },
              { value: 'conceptually_related_to', label: 'Conceptually Related To' },
              { value: 'semantically_similar_to', label: 'Semantically Similar To' },
              { value: 'wraps', label: 'Wraps' }
            ]
          }
        }
      ]
    },
    {
      id: 'error_handling',
      title: 'Error Handling',
      questions: [
        {
          id: 'retry_on_fail',
          prompt: 'Retry failed extractions automatically?',
          type: 'boolean',
          required: true,
          default_value: true
        },
        {
          id: 'max_retries',
          prompt: 'Maximum retry attempts? (default: 2)',
          type: 'number',
          required: false,
          show_if: (answers: any) => answers.retry_on_fail === true,
          placeholder: '2'
        }
      ]
    }
  ]
};
