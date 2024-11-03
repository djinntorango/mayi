import React, { useState, useEffect } from 'react';
import '../styles/prewrite.css';

function Prewrite() {
  const [conversation, setConversation] = useState([]);
  const [userResponses, setUserResponses] = useState([]);
  const [userInput, setUserInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [topic, setTopic] = useState("");
  const [debug, setDebug] = useState([]); // Add debug state

  // Debug helper
  const addDebug = (msg) => {
    setDebug(prev => [...prev, `${new Date().toISOString()}: ${msg}`]);
  };

  const storyQuestions = [
    "Let's write a story today! Who is the main character?",
    "Where does the story take place?",
    "What is the main problem or challenge in the story?",
    "How is the problem solved?",
    "What happens at the beginning of the story?",
    "What important events happen in the middle of the story?",
    "How does the story end?"
  ];
  
  useEffect(() => {
    function handleMessage(event) {
      addDebug(`Message received: ${JSON.stringify(event.data)}`);
      if (event.data.type === 'SET_TOPIC') {
        addDebug(`Setting topic to: ${event.data.topic}`);
        setTopic(event.data.topic);
      }
    }

    window.addEventListener('message', handleMessage);
    
    // Tell Storyline we're ready
    addDebug('Sending PREWRITE_READY');
    window.parent.postMessage({ type: 'PREWRITE_READY' }, '*');

    return () => window.removeEventListener('message', handleMessage);
  }, []);

  useEffect(() => {
    function handleMessage(event) {
      if (event.data.type === 'SET_TOPIC') {
        setTopic(event.data.topic);
      }
    }

    window.addEventListener('message', handleMessage);
    
    // Tell Storyline we're ready
    window.parent.postMessage({ type: 'PREWRITE_READY' }, '*');

    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Initialize conversation
  useEffect(() => {
    // Always start a new conversation when topic changes
    setConversation([
      // Always show first message with topic (or without if none)
      { sender: 'system', text: topic ? `Your topic is: ${topic}. ` : `Let's write a story! ` },
      // Always show first question
      { sender: 'system', text: storyQuestions[0] }
    ]);
  }, [topic]); // Re-run when topic changes
  
  // Add some console logs to debug
  useEffect(() => {
    console.log('Current topic:', topic);
    console.log('Current conversation:', conversation);
  }, [topic, conversation]);

  // Send story data to Storyline
  const updateStoryline = (responses) => {
    try {
      // Create story elements object
      const storyElements = {
        character: responses[0]?.answer || '',
        setting: responses[1]?.answer || '',
        problem: responses[2]?.answer || '',
        solution: responses[3]?.answer || '',
        beginning: responses[4]?.answer || '',
        middle: responses[5]?.answer || '',
        ending: responses[6]?.answer || '',
        isComplete: responses.length === storyQuestions.length
      };

      // Send to parent (Storyline)
      window.parent.postMessage({
        type: 'STORY_UPDATE',
        storyElements
      }, '*');

    } catch (error) {
      console.error('Error updating Storyline:', error);
    }
  };

  const getAIResponse = async (userAnswer, previousResponses) => {
    try {
      const currentProgress = previousResponses.length;
      const isLastQuestion = currentProgress === storyQuestions.length - 1;
      const currentQuestion = storyQuestions[currentProgress];
      
      let corePrompt = `You are a writing teacher helping a student develop their story. 
      
      Previous responses:
      ${previousResponses.map(r => `Q: ${r.question}\nA: ${r.answer}`).join('\n\n')}
      
      Current question: "${currentQuestion}"
      Student's answer: "${userAnswer}"
      
      First, determine if the student's answer is appropriate for the current question.
      Then, respond in this exact format:

      FEEDBACK: Provide brief, encouraging feedback about their answer. If they seem off-track, gently redirect them.

      ACTION: Choose exactly ONE of these:
      1. If the answer needs more development, write a specific follow-up question (without any labels or brackets).
      2. If the answer is sufficient and there are more questions, write "NEXT:" followed by the next question.
      3. If this is the final question, write "FINAL:" followed by brief concluding feedback.

      Remember: The first question is about the main character, the second about setting, etc. Make sure feedback and questions align with the current story element being discussed.`;

      const response = await fetch('https://prewriteresponse-co3kwnyxqq-uc.a.run.app', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          corePrompt: corePrompt,
          prompt: userAnswer
        })
      });

      if (!response.ok) {
        throw new Error(`API returned ${response.status}`);
      }

      const data = await response.json();
      return data.text;

    } catch (error) {
      console.error('Error in getAIResponse:', error);
      return "I encountered an error. Let's continue with the next question.";
    }
  };

  const handleUserInput = async (e) => {
    e.preventDefault();
    if (userInput.trim() === "" || isLoading) return;

    setIsLoading(true);
    
    const aiResponse = await getAIResponse(userInput, userResponses);
    
    // Parse the AI response
    const feedbackMatch = aiResponse.match(/FEEDBACK:(.*?)(?=ACTION:|$)/s);
    const actionMatch = aiResponse.match(/ACTION:(.*?)$/s);
    
    const feedback = feedbackMatch ? feedbackMatch[1].trim() : aiResponse;
    const action = actionMatch ? actionMatch[1].trim() : '';
    
    const newConversation = [
      ...conversation,
      { sender: 'user', text: userInput },
      { sender: 'system', text: feedback }
    ];

    const newUserResponses = [
      ...userResponses,
      {
        question: storyQuestions[userResponses.length],
        answer: userInput,
        feedback: feedback
      }
    ];

    // Handle the next action
    if (action.startsWith('NEXT:')) {
      const nextQuestion = action.replace('NEXT:', '').trim();
      newConversation.push({ sender: 'system', text: nextQuestion });
    } else if (action.startsWith('FINAL:')) {
      const finalFeedback = action.replace('FINAL:', '').trim();
      newConversation.push({ sender: 'system', text: finalFeedback });
    } else if (action) {
      // It's a follow-up question
      newConversation.push({ sender: 'system', text: action });
    }

    setConversation(newConversation);
    setUserResponses(newUserResponses);
    setUserInput("");

    // Update Storyline
    updateStoryline(newUserResponses);

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
      {debug.map((msg, i) => (
          <div key={i}>{msg}</div>
        ))}
    </div>
  );
}

export default Prewrite;