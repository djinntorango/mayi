// export default Prewrite;
import React, { useState, useEffect } from 'react';
import { getFirestore, doc, setDoc, collection, addDoc } from 'firebase/firestore';
import '../styles/prewrite.css';

function Prewrite() {
  const [conversation, setConversation] = useState([]);
  const [userResponses, setUserResponses] = useState([]);
  const [userInput, setUserInput] = useState("");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [sessionId, setSessionId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const firestore = getFirestore();

  const baseQuestions = [
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
      setConversation([{ sender: 'system', text: baseQuestions[0] }]);
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

  const getAIFeedback = async (question, answer, isLastResponse) => {
    try {
      let corePrompt;
      if (isLastResponse) {
        corePrompt = "You are providing final feedback on a student's story. Be encouraging but brief.";
      } else {
        corePrompt = `You are helping a student develop their story. They are answering the question: "${question}"
                      If their answer needs more detail or development, ask ONE follow-up question to help them expand.
                      If their answer is sufficient, respond with exactly: "NEXT_QUESTION"`;
      }
  
      const response = await fetch('https://prewriteresponse-co3kwnyxqq-uc.a.run.app', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          corePrompt: corePrompt,
          prompt: answer
        })
      });
  
      if (!response.ok) {
        console.error('API Response not ok:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('Error details:', errorText);
        throw new Error(`API returned ${response.status}`);
      }
  
      const data = await response.json();
      console.log('API Response:', data);
  
      // Extract the text response from the API response
      return data.text || "Let's move to the next question.";
  
    } catch (error) {
      console.error('Error in getAIResponse:', error);
      return "I encountered an error. Let's continue with the next question.";
    }
  };

  const handleUserInput = async (e) => {
    e.preventDefault();
    if (userInput.trim() === "" || isLoading) return;

    setIsLoading(true);
    
    const currentQuestion = baseQuestions[currentQuestionIndex];
    const feedback = await getAIFeedback(currentQuestion, userInput);
    
    const newConversation = [
      ...conversation,
      { sender: 'user', text: userInput },
    ];

    if (feedback) {
      newConversation.push({ sender: 'system', text: feedback });
    }

    if (currentQuestionIndex + 1 < baseQuestions.length) {
      newConversation.push({ 
        sender: 'system', 
        text: baseQuestions[currentQuestionIndex + 1] 
      });
    }

    const newUserResponses = [
      ...userResponses,
      { 
        question: currentQuestion, 
        answer: userInput,
        feedback: feedback 
      }
    ];

    setConversation(newConversation);
    setUserResponses(newUserResponses);
    setUserInput("");
    setCurrentQuestionIndex(currentQuestionIndex + 1);

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