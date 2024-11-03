// src/utils/LearningAgent.js
export default class LearningAgent {
    constructor(topic) {
      this.topic = topic;
      this.currentQuestionIndex = 0;
      this.questions = [
        `Where do ${topic} live?`,
        `What do ${topic} need to survive?`,
        `What's something else ${topic} needs?`
      ];
      this.frames = [
        `${topic} lives in...`,
        `To survive, ${topic} needs...`,
        `Another thing ${topic} needs is...`
      ];
    }
  
    getCurrentQuestion() {
      return this.questions[this.currentQuestionIndex];
    }
  
    getCurrentFrame() {
      return this.frames[this.currentQuestionIndex];
    }
  
    generatePrompt(userAnswer, previousResponses) {
      const isLastQuestion = this.currentQuestionIndex === this.questions.length - 1;
  
      return `You are a teaching assistant helping a student learn about ${this.topic}.
  
  Current question: "${this.getCurrentQuestion()}"
  Expected frame: "${this.getCurrentFrame()}"
  Student's answer: "${userAnswer}"
  
  IMPORTANT INSTRUCTIONS:
  1. Evaluate student's answer and choose ONE action:
     - "next" if answer uses sentence frame AND is relevant
     - "elaborate" if answer needs improvement
     - "complete" if good answer AND this is the final question
  
  2. Current question number: ${this.currentQuestionIndex + 1} of ${this.questions.length}
  ${isLastQuestion ? '(This is the final question)' : ''}
  
  Previous responses:
  ${previousResponses.map(r => `Q: ${r.question}\nA: ${r.answer}`).join('\n\n')}`;
    }
  }
  