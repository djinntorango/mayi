import React, { useState, useEffect, useRef } from 'react';
import '../styles/prewrite.css';

class LearningAgent {
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

const TypingIndicator = () => (
  <div className="typing-indicator">
    <span></span>
    <span></span>
    <span></span>
  </div>
);

function Prewrite() {
  const [agent, setAgent] = useState(null);
  const [conversation, setConversation] = useState([]);
  const [userResponses, setUserResponses] = useState([]);
  const [userInput, setUserInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [topic, setTopic] = useState("");
  
  const conversationRef = useRef(null);

  useEffect(() => {
    if (conversationRef.current) {
      conversationRef.current.scrollTop = conversationRef.current.scrollHeight;
    }
  }, [conversation]);

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

      if (!response.ok) throw new Error(`API returned ${response.status}`);
      const data = await response.json();
      return data.text;
    } catch (error) {
      console.error('API Error:', error);
      return JSON.stringify({
        analysis: { score: 0.5, isRelevant: true, completesFrame: false },
        decision: { action: 'elaborate', reason: 'Error occurred' },
        response: { feedback: "Let's try that again!", followUp: null }
      });
    }
  };

  const handleUserInput = async (e) => {
    e.preventDefault();
    if (!userInput.trim() || isLoading || !agent) return;

    const currentInput = userInput;
    setUserInput('');
    setConversation(prev => [...prev, { sender: 'user', text: currentInput }]);
    setIsLoading(true);

    const llmResponse = await getAIResponse(currentInput, userResponses);
    const result = JSON.parse(llmResponse);

    // Add the AI's feedback
    setConversation(prev => [...prev, { sender: 'system', text: result.response.feedback }]);

    if (result.decision.action === 'next' || result.decision.action === 'complete') {
      // Store the response
      const newUserResponses = [...userResponses, {
        question: agent.getCurrentQuestion(),
        answer: currentInput,
        feedback: result.response.feedback
      }];
      setUserResponses(newUserResponses);

      // Move to next question if not complete
      if (result.decision.action === 'next') {
        agent.currentQuestionIndex++;
        setConversation(prev => [...prev, { 
          sender: 'system', 
          text: agent.getCurrentQuestion()
        }]);
        setUserInput(agent.getCurrentFrame());
      }

      // Update parent
      updateResponses(newUserResponses);
    } else if (result.decision.action === 'elaborate') {
      if (result.response.followUp) {
        setConversation(prev => [...prev, { 
          sender: 'system', 
          text: result.response.followUp 
        }]);
      }
      setUserInput(agent.getCurrentFrame());
    }

    setIsLoading(false);
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

  return (
    <div className="prewrite-container main-container">
      <div className="chat-interface">
        <div className="conversation-box" ref={conversationRef}>
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
                <TypingIndicator />
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
            Send
          </button>
        </form>
      </div>
    </div>
  );
}

export default Prewrite;