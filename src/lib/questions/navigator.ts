import { 
  VibeWorkspace, 
  QuestionModule, 
  QuestionSection, 
  Question 
} from '../../types';

export class QuestionNavigator {
  private workspace: VibeWorkspace;
  private module: QuestionModule;

  constructor(workspace: VibeWorkspace, module: QuestionModule) {
    this.workspace = workspace;
    this.module = module;
  }

  getCurrentQuestion(): Question | null {
    if (!this.workspace.meta.currentSection) {
      this.workspace.meta.currentSection = this.module.sections[0].id;
    }
    
    const sectionIndex = this.module.sections.findIndex(s => s.id === this.workspace.meta.currentSection);
    const section = this.module.sections[sectionIndex];
    
    if (!section) return null;

    // Find first unanswered question in current section
    const unansweredInCurrent = section.questions.find(q => this.workspace.session.answers[q.id] === undefined);
    
    if (unansweredInCurrent) {
        this.workspace.meta.currentQuestion = unansweredInCurrent.id;
        return unansweredInCurrent;
    }

    // Move to next section
    const nextSection = this.module.sections[sectionIndex + 1];
    if (nextSection) {
        this.workspace.meta.currentSection = nextSection.id;
        this.workspace.meta.currentQuestion = nextSection.questions[0].id;
        return nextSection.questions[0];
    }

    return null; // All sections complete
  }

  next(answer: any): Question | null {
    const currentQ = this.getCurrentQuestion();
    if (!currentQ) return null;

    // Save answer
    this.workspace.session.answers[currentQ.id] = answer;
    this.workspace.session.history.push({
        questionId: currentQ.id,
        answer: answer,
        timestamp: new Date()
    });
    this.workspace.meta.questionsAnswered++;

    return this.getCurrentQuestion();
  }

  back(): Question | null {
    if (this.workspace.session.history.length === 0) return this.getCurrentQuestion();

    const lastEntry = this.workspace.session.history.pop();
    if (lastEntry) {
        delete this.workspace.session.answers[lastEntry.questionId];
        this.workspace.meta.questionsAnswered--;
    }

    return this.getCurrentQuestion();
  }

  getProgress() {
    return {
      answered: this.workspace.meta.questionsAnswered,
      total: this.getTotalQuestions(),
      percentage: Math.round((this.workspace.meta.questionsAnswered / this.getTotalQuestions()) * 100)
    };
  }

  private getTotalQuestions(): number {
      let total = 0;
      for (const section of this.module.sections) {
          total += section.questions.length;
      }
      return total;
  }

  isComplete(): boolean {
      return this.getCurrentQuestion() === null;
  }
}
