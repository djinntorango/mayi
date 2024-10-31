import React, { useState, useEffect } from 'react';
import { getFirestore, doc, setDoc, collection, addDoc } from 'firebase/firestore';
import '../styles/prewrite.css';

function Prewrite() {
  const [conversation, setConversation] = useState([]);
  const [userResponses, setUserResponses] = useState([]);
  const [userInput, setUserInput] = useState("");
  const [sessionId, setSessionId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const firestore = getFirestore();

  const storyQuestions = [
    "Let's write a story today! Who is the main character?",
    "Where does the story take place?",
    "What is the main problem or challenge in the story?",
    "How is the problem solved?",
    "What happens at the beginning of the story?",
    "What important events happen in the middle of the story?",
    "How does the story end?"
  ];

  // Initialize conversation with first question
  useEffect(() => {
    if (conversation.length === 0) {
      setConversation([{ sender: 'system', text: storyQuestions[0] }]);
      initializeSession();
    }
  }, []);

  const initializeSession = async () => {
    try {
      const sessionsRef = collection(firestore, "story_sessions");
      const docRef = await addDoc(sessionsRef, {
        timestamp: new Date(),
        responses: []
      });
      setSessionId(docRef.id);
    } catch (error) {
      console.error("Error creating session:", error);
    }
  };

  const getAIResponse = async (userAnswer, previousResponses) => {
    try {
      const currentProgress = previousResponses.length;
      const isLastQuestion = currentProgress === storyQuestions.length - 1;
      
      let corePrompt = `You are a writing teacher helping a student develop their story. Here is their progress so far:
      ${previousResponses.map(r => `Q: ${r.question}\nA: ${r.answer}`).join('\n\n')}
      
      Current question: ${storyQuestions[currentProgress]}
      Student's answer: ${userAnswer}
      
      Provide feedback on their answer. Then, choose ONE of these actions:
      1. If the answer needs more detail or development, ask ONE specific follow-up question to help them expand.
      2. If the answer is sufficient and this isn't the last question, respond with "NEXT" followed by the next question: "${isLastQuestion ? '' : storyQuestions[currentProgress + 1]}"
      3. If this is the last question and the answer is good, provide brief encouraging final feedback.
      
      Format your response as:
      [Feedback]
      [Action: either a follow-up question, "NEXT" + next question, or final feedback]`;

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
    
    // Get AI response based on all previous responses
    const aiResponse = await getAIResponse(userInput, userResponses);
    
    // Parse AI response to separate feedback and next action
    const [feedback, action] = aiResponse.split('[Action:').map(str => str.trim());
    
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

    // If the AI indicates to move to the next question
    if (action && action.startsWith('NEXT')) {
      const nextQuestion = action.replace('NEXT', '').trim();
      newConversation.push({ sender: 'system', text: nextQuestion });
    } else if (action) {
      // If AI asked a follow-up question
      newConversation.push({ sender: 'system', text: action });
    }

    setConversation(newConversation);
    setUserResponses(newUserResponses);
    setUserInput("");

    // Save to Firestore
    if (sessionId) {
      try {
        const sessionRef = doc(firestore, "story_sessions", sessionId);
        await setDoc(sessionRef, {
          timestamp: new Date(),
          responses: newUserResponses
        }, { merge: true });
      } catch (error) {
        console.error("Error saving responses:", error);
      }
    }

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