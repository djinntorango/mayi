import React, { useState, useEffect } from 'react';
import '../styles/prewrite.css';

function Prewrite() {
  const [conversation, setConversation] = useState([]);
  const [userResponses, setUserResponses] = useState([]);
  const [userInput, setUserInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [topic, setTopic] = useState("");
  const [debugMessages, setDebugMessages] = useState([]);

  const storyQuestions = [
    "Let's write a story today! Who is the main character?",
    "Where does the story take place?",
    "What is the main problem or challenge in the story?",
    "How is the problem solved?",
    "What happens at the beginning of the story?",
    "What important events happen in the middle of the story?",
    "How does the story end?"
  ];

  const addDebug = (message) => {
    console.log(message);
    setDebugMessages(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  // Check for topic when component mounts
  useEffect(() => {
    addDebug('Component mounted');

    // Function to check for topic
    const checkForTopic = () => {
      addDebug('Checking for storylineTopic...');
      // Check if we can access window.parent
      try {
        if (window.parent && window.parent.storylineTopic !== undefined) {
          addDebug(`Found topic in parent: ${window.parent.storylineTopic}`);
          setTopic(window.parent.storylineTopic);
          return true;
        }
      } catch (e) {
        addDebug(`Error accessing parent: ${e.message}`);
      }

      // Check current window
      if (window.storylineTopic !== undefined) {
        addDebug(`Found topic in window: ${window.storylineTopic}`);
        setTopic(window.storylineTopic);
        return true;
      }

      addDebug('Topic not found');
      return false;
    };

    // Try immediately
    if (!checkForTopic()) {
      // If not found, start polling
      addDebug('Starting topic polling');
      const pollInterval = setInterval(() => {
        if (checkForTopic()) {
          addDebug('Topic found, stopping polling');
          clearInterval(pollInterval);
        }
      }, 500); // Check every 500ms

      // Stop polling after 10 seconds
      setTimeout(() => {
        clearInterval(pollInterval);
        addDebug('Polling timeout reached');
      }, 10000);
    }
  }, []);

  useEffect(() => {
    addDebug(`Topic changed to: ${topic}`);
    setConversation([
      { sender: 'system', text: topic ? `Your topic is: ${topic}. ` : `Let's write a story! ` },
      { sender: 'system', text: storyQuestions[0] }
    ]);
  }, [topic]);

  const updateStoryline = (responses) => {
    try {
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

      addDebug(`Sending story update: ${JSON.stringify(storyElements)}`);
      window.parent.postMessage({
        type: 'STORY_UPDATE',
        storyElements
      }, '*');

    } catch (error) {
      addDebug(`Error updating Storyline: ${error.message}`);
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
      addDebug(`Error in AI response: ${error.message}`);
      return "I encountered an error. Let's continue with the next question.";
    }
  };

  const handleUserInput = async (e) => {
    e.preventDefault();
    if (userInput.trim() === "" || isLoading) return;

    setIsLoading(true);
    addDebug(`Processing user input: ${userInput}`);
    
    const aiResponse = await getAIResponse(userInput, userResponses);
    addDebug(`Received AI response: ${aiResponse}`);
    
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

    if (action.startsWith('NEXT:')) {
      const nextQuestion = action.replace('NEXT:', '').trim();
      newConversation.push({ sender: 'system', text: nextQuestion });
    } else if (action.startsWith('FINAL:')) {
      const finalFeedback = action.replace('FINAL:', '').trim();
      newConversation.push({ sender: 'system', text: finalFeedback });
    } else if (action) {
      newConversation.push({ sender: 'system', text: action });
    }

    setConversation(newConversation);
    setUserResponses(newUserResponses);
    setUserInput("");
    updateStoryline(newUserResponses);
    setIsLoading(false);
  };

  return (
    <div className="prewrite-container main-container">
      {/* Debug Panel */}
      <div style={{
        position: 'fixed',
        top: 0,
        right: 0,
        background: 'rgba(0,0,0,0.8)',
        color: 'white',
        padding: '10px',
        maxHeight: '200px',
        overflowY: 'auto',
        fontSize: '12px',
        zIndex: 9999,
        width: '300px'
      }}>
        <h4 style={{ margin: '0 0 5px 0', color: '#fff' }}>Debug Messages:</h4>
        {debugMessages.map((msg, i) => (
          <div key={i} style={{ marginBottom: '3px', borderBottom: '1px solid #333' }}>{msg}</div>
        ))}
      </div>

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