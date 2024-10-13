import React, { useState, useEffect } from 'react';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase';

function Prewrite() {
  const [conversation, setConversation] = useState([]);
  const [userResponses, setUserResponses] = useState([]);
  const [userInput, setUserInput] = useState("");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [user] = useAuthState(auth);
  const firestore = getFirestore();

  const questions = [
    "Let's write a story today! What's the main character's name?",
    "Where does the main character live?",
    "What is the main problem the character faces?",
    "How does the story end?"
  ];

  useEffect(() => {
    if (conversation.length === 0 && currentQuestionIndex === 0) {
      setConversation([{ sender: 'system', text: questions[0] }]);
    }
  }, [conversation, currentQuestionIndex, questions]);

  useEffect(() => {
    if (user) {
      const fetchUserResponses = async () => {
        try {
          const docRef = doc(firestore, "users", user.uid, "prewrites", "latest");
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.responses) {
              setUserResponses(data.responses);
              const updatedConversation = data.responses.map((response, index) => {
                return [
                  { sender: 'user', text: response.answer },
                  { sender: 'system', text: questions[index + 1] || '' }
                ];
              }).flat();
              setConversation(prev => [...prev, ...updatedConversation]);
            }
          }
        } catch (error) {
          console.error("Error fetching user responses:", error);
        }
      };

      fetchUserResponses();
    }
  }, [user, firestore, questions]);

  const handleUserInput = (e) => {
    e.preventDefault();
    if (userInput.trim() === "") return;

    const newConversation = [
      ...conversation,
      { sender: 'user', text: userInput },
    ];

    if (currentQuestionIndex + 1 < questions.length) {
      newConversation.push({ sender: 'system', text: questions[currentQuestionIndex + 1] });
    }

    const newUserResponses = [
      ...userResponses,
      { question: questions[currentQuestionIndex], answer: userInput }
    ];

    setConversation(newConversation);
    setUserResponses(newUserResponses);
    setUserInput("");
    setCurrentQuestionIndex(currentQuestionIndex + 1);
  };

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
