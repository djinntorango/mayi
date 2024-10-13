import React, { useState, useEffect } from 'react';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase';

function Prewrite() {
  const [conversation, setConversation] = useState([]);  // Holds the full chat log
  const [userResponses, setUserResponses] = useState([]);  // Holds the user's answers for the side panel
  const [userInput, setUserInput] = useState("");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [user] = useAuthState(auth);
  const firestore = getFirestore();

  // Predefined questions
  const questions = [
    "Let's write a story today! What's the main character's name?",
    "Where does the main character live?",
    "What is the main problem the character faces?",
    "How does the story end?"
  ];

  // Set the first question when the component mounts
  useEffect(() => {
    if (conversation.length === 0 && currentQuestionIndex === 0) {
      setConversation([{ sender: 'system', text: questions[0] }]);  // Set the first question
    }
  }, [conversation, currentQuestionIndex, questions]);

  // Update conversation and side panel with new responses
  const handleUserInput = (e) => {
    e.preventDefault();

    if (userInput.trim() === "") return;  // Don't allow empty input

    const newConversation = [
      ...conversation,
      { sender: 'user', text: userInput },  // Add user's response to the conversation
    ];

    // Only queue the next question if there are more questions left
    if (currentQuestionIndex + 1 < questions.length) {
      newConversation.push({ sender: 'system', text: questions[currentQuestionIndex + 1] });
    }

    const newUserResponses = [
      ...userResponses,
      { question: questions[currentQuestionIndex], answer: userInput }
    ];

    setConversation(newConversation);
    setUserResponses(newUserResponses);
    setUserInput("");  // Clear the input field
    setCurrentQuestionIndex(currentQuestionIndex + 1);
  };

  // Optionally, save the responses to Firestore
  useEffect(() => {
    if (!user || userResponses.length === 0) return;

    const saveToFirestore = async () => {
      try {
        const docRef = doc(firestore, "users", user.uid, "prewrites", "latest");
        await setDoc(docRef, { responses: userResponses }, { merge: true });
      } catch (error) {
        console.error("Error saving prewrite data:", error);
      }
    };

    saveToFirestore();
  }, [userResponses, user, firestore]);

  return (
    <div className="prewrite-container main-container">
      <div className="chat-interface">
        <div className="conversation-box">
          {conversation.map((entry, index) => (
            <div key={index} className={`message ${entry.sender}`}>
              <p>{entry.text}</p>
            </div>
          ))}
        </div>
        <form className="input-box" onSubmit={handleUserInput}>
          <input
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="Type your answer..."
            autoFocus
          />
          <button type="submit">Send</button>
        </form>
      </div>

      <div className="side-panel">
        <h3>Your Story Details</h3>
        <ul>
          {userResponses.map((response, index) => (
            <li key={index}>
              <strong>{response.question}</strong>: {response.answer}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default Prewrite;
