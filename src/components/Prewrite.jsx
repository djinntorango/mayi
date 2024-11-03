import React, { useState, useEffect } from 'react';
import '../styles/prewrite.css';

// Agent class to handle conversation state and decision making
class LearningAgent {
  constructor(topic) {
    this.topic = topic;
    this.state = {
      currentQuestionIndex: 0,
      attemptsPerQuestion: {},
      memory: [], // Store important context/patterns
    };
    
    this.goals = {
      minAnswerQuality: 0.7,    // Threshold for accepting an answer
      maxAttempts: 3,           // Max attempts per question
      requireEvidence: true,    // Student should provide specific examples/details
    };
  }

  // Generate a context-aware prompt for the LLM
  generatePrompt(userAnswer, previousResponses) {
    return `You are an intelligent teaching agent helping a student learn about ${this.topic}'s habitat and needs.

CONTEXT:
- Current question index: ${this.state.currentQuestionIndex}
- Attempts on this question: ${this.state.attemptsPerQuestion[this.state.currentQuestionIndex] || 0}
- Previous responses: ${JSON.stringify(previousResponses)}
- Student memory: ${JSON.stringify(this.memory)}

GOALS:
1. Ensure student provides specific, detailed answers
2. Look for evidence and examples in their responses
3. Help students elaborate if answers are too vague
4. Move to next question only when answer is sufficient
5. Maintain encouraging, supportive tone

CURRENT STATE:
Previous responses:
${previousResponses.map(r => `Q: ${r.question}\nA: ${r.answer}`).join('\n\n')}

Current question: "${this.getCurrentQuestion()}"
Student's answer: "${userAnswer}"

INSTRUCTIONS:
1. Analyze the response quality (0-1)
2. Determine if the answer needs elaboration
3. Decide appropriate next action

Respond in JSON format:
{
  "analysis": {
    "score": <number 0-1>,
    "strengths": [],
    "weaknesses": [],
    "hasEvidence": <boolean>
  },
  "decision": {
    "action": "elaborate" | "next" | "complete",
    "reason": <string>
  },
  "response": {
    "feedback": <string>,
    "followUp": <string or null>
  }
}`;
  }

  // Process LLM response and update agent state
  processLLMResponse(llmResponse) {
    try {
      const response = JSON.parse(llmResponse);
      
      // Update agent memory with insights
      this.memory.push({
        questionIndex: this.state.currentQuestionIndex,
        score: response.analysis.score,
        patterns: response.analysis.strengths.concat(response.analysis.weaknesses)
      });

      // Update attempt counter
      const currentAttempts = this.state.attemptsPerQuestion[this.state.currentQuestionIndex] || 0;
      this.state.attemptsPerQuestion[this.state.currentQuestionIndex] = currentAttempts + 1;

      // Override LLM decision if max attempts reached
      if (currentAttempts >= this.goals.maxAttempts && response.decision.action === 'elaborate') {
        response.decision.action = 'next';
        response.decision.reason = 'Max attempts reached';
        response.response.feedback += " Let's move on to the next question.";
      }

      // Update question index if moving forward
      if (response.decision.action === 'next') {
        this.state.currentQuestionIndex++;
      }

      return response;
    } catch (error) {
      console.error('Error processing LLM response:', error);
      return null;
    }
  }

  getCurrentQuestion() {
    const questions = [
      `Where does ${this.topic} live?`,
      `What does ${this.topic} need to survive?`,
      `What's something else ${this.topic} needs?`
    ];
    return questions[this.state.currentQuestionIndex];
  }

  getCurrentFrame() {
    const frames = [
      `${this.topic} lives in...`,
      `To survive, ${this.topic} needs...`,
      `Another thing ${this.topic} needs is...`
    ];
    return frames[this.state.currentQuestionIndex];
  }
}

function Prewrite() {
  const [agent, setAgent] = useState(null);
  const [conversation, setConversation] = useState([]);
  const [userResponses, setUserResponses] = useState([]);
  const [userInput, setUserInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [topic, setTopic] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const topicFromUrl = params.get('topic');
    if (topicFromUrl) {
      const decodedTopic = decodeURIComponent(topicFromUrl);
      setTopic(decodedTopic);
      const newAgent = new LearningAgent(decodedTopic);
      setAgent(newAgent);
      setConversation([
        { sender: 'system', text: `Let's learn about ${decodedTopic}!` },
        { sender: 'system', text: newAgent.getCurrentQuestion() }
      ]);
      setUserInput(newAgent.getCurrentFrame());
    }
  }, []);

  const getAIResponse = async (userAnswer, previousResponses) => {
    try {
      const prompt = agent.generatePrompt(userAnswer, previousResponses);
      
      const response = await fetch('https://prewriteresponse-co3kwnyxqq-uc.a.run.app', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          corePrompt: prompt,
          prompt: userAnswer
        })
      });

      if (!response.ok) {
        throw new Error(`API returned ${response.status}`);
      }

      const data = await response.json();
      return data.text;

    } catch (error) {
      return JSON.stringify({
        analysis: { score: 0, strengths: [], weaknesses: [], hasEvidence: false },
        decision: { action: 'next', reason: 'Error occurred' },
        response: { feedback: "I encountered an error. Let's continue.", followUp: null }
      });
    }
  };

  const updateResponses = (responses) => {
    try {
      const habitatElements = {
        habitat: responses[0]?.answer || '',
        survivalNeeds: responses[1]?.answer || '',
        additionalNeeds: responses[2]?.answer || '',
        isComplete: responses.length === 3 && responses[2]?.answer
      };

      window.parent.postMessage({
        type: 'HABITAT_UPDATE',
        habitatElements
      }, '*');

    } catch (error) {
      console.error('Error updating responses:', error);
    }
  };

  const handleUserInput = async (e) => {
    e.preventDefault();
    if (!userInput.trim() || isLoading || !agent) return;

    setIsLoading(true);
    
    const llmResponse = await getAIResponse(userInput, userResponses);
    const result = agent.processLLMResponse(llmResponse);
    
    const newConversation = [
      ...conversation,
      { sender: 'user', text: userInput },
      { sender: 'system', text: result.response.feedback }
    ];

    if (result.decision.action === 'elaborate' && result.response.followUp) {
      newConversation.push({ sender: 'system', text: result.response.followUp });
    } else if (result.decision.action === 'next') {
      newConversation.push({ sender: 'system', text: agent.getCurrentQuestion() });
      setUserInput(agent.getCurrentFrame());
    } else if (result.decision.action === 'complete') {
      setUserInput('');
    }

    const newUserResponses = [
      ...userResponses,
      {
        question: agent.getCurrentQuestion(),
        answer: userInput,
        feedback: result.response.feedback,
        analysis: result.analysis
      }
    ];

    setConversation(newConversation);
    setUserResponses(newUserResponses);
    updateResponses(newUserResponses);
    setIsLoading(false);
  };

  return (
    <div className="prewrite-container main-container">
      <div className="chat-interface">
        <div className="conversation-box">
          {conversation.map((entry, index) => (
            <div key={index} className={`message ${entry.sender}`}>
              <div className="sender">
                {entry.sender === 'user' ? 'You' : 'Teacher'}
              </div>
              <div className="content">
                {entry.text}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="message system">
              <div className="content">
                <span className="loading">Thinking...</span>
              </div>
            </div>
          )}
        </div>
        <form className="input-box" onSubmit={handleUserInput}>
          <input
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="Type your answer..."
            disabled={isLoading}
          />
          <button type="submit" disabled={isLoading}>
            {isLoading ? "Sending..." : "Send"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Prewrite;