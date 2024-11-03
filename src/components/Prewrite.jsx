import React, { useState, useEffect } from 'react';
import '../styles/prewrite.css';

function Prewrite() {
  const [conversation, setConversation] = useState([]);
  const [userResponses, setUserResponses] = useState([]);
  const [userInput, setUserInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [topic, setTopic] = useState("");

  const generateQuestions = (topic) => [
    `Where does/do ${topic} live?`,
    `What does ${topic} need to survive?`,
    `What's something else ${topic} needs?`
  ];

  // Get topic from URL parameters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const topicFromUrl = params.get('topic');
    if (topicFromUrl) {
      setTopic(decodeURIComponent(topicFromUrl));
    }
  }, []);

  // Set up conversation when topic changes
  useEffect(() => {
    if (topic) {
      setConversation([
        { sender: 'system', text: `Let's learn about ${topic}!` },
        { sender: 'system', text: generateQuestions(topic)[0] }
      ]);
    }
  }, [topic]);

  const updateResponses = (responses) => {
    try {
      const habitatElements = {
        habitat: responses[0]?.answer || '',
        survivalNeeds: responses[1]?.answer || '',
        additionalNeeds: responses[2]?.answer || '',
        isComplete: responses.length === generateQuestions(topic).length
      };

      window.parent.postMessage({
        type: 'HABITAT_UPDATE',
        habitatElements
      }, '*');

    } catch (error) {
      console.error('Error updating responses:', error);
    }
  };

  const getAIResponse = async (userAnswer, previousResponses) => {
    try {
      const questions = generateQuestions(topic);
      const currentProgress = previousResponses.length;
      const isLastQuestion = currentProgress === questions.length - 1;
      const currentQuestion = questions[currentProgress];
      
      let corePrompt = `You are a science teacher helping a student learn about ${topic}'s habitat and survival needs. 
      
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
      3. If this is the final question, write "FINAL:" followed by brief concluding feedback.`;

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
      return "I encountered an error. Let's continue with the next question.";
    }
  };

  const handleUserInput = async (e) => {
    e.preventDefault();
    if (userInput.trim() === "" || isLoading) return;

    setIsLoading(true);
    
    const aiResponse = await getAIResponse(userInput, userResponses);
    
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
        question: generateQuestions(topic)[userResponses.length],
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