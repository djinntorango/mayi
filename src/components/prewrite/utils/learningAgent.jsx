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
        `${topic} live in `,
        `${topic} need `,
        `Another thing ${topic} needs is `
      ];
    }
  
    getCurrentQuestion() {
      return this.questions[this.currentQuestionIndex];
    }
  
    getCurrentFrame() {
      return this.frames[this.currentQuestionIndex];
    }
  
    generatePrompt(userAnswer, previousResponses) {
      return `You are a teaching assistant helping a student learn about ${this.topic}.
    
    Current question: "${this.getCurrentQuestion()}"
    Expected frame: "${this.getCurrentFrame()}"
    Student's answer: "${userAnswer}"
    
    Evaluate the student's answer and respond using these strict rules:
    1. If the student did NOT use the complete sentence frame:
       - Set action to "elaborate"
       - Include feedback asking them to use the complete sentence
       - Do NOT move to the next question
    
    2. If the student used the complete sentence frame and the answer is relevant:
       - Set action to "next"
       - Give positive feedback
       - Allow moving to next question
    
    3. If this is the final question and they used the frame correctly:
       - Set action to "complete"
       - Give concluding feedback
    
    Previous responses:
    ${previousResponses.map(r => `Q: ${r.question}\nA: ${r.answer}`).join('\n\n')}`;
    }
  }
  