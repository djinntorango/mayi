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
  const [isFetched, setIsFetched] = useState(false);

  const questions = [
    "Let's write a story today! What's the main character's name?",
    "Where does the main character live?",
    "What is the main problem the character faces?",
    "How does the story end?"
  ];

  useEffect(() => {
    const initializeConversation = () => {
      const nextQuestionIndex = userResponses.length; // Get next question index based on responses
      if (nextQuestionIndex < questions.length) {
        setConversation([{ sender: 'system', text: questions[nextQuestionIndex] }]);
        setCurrentQuestionIndex(nextQuestionIndex); // Update the current question index
      }
    };

    initializeConversation();
  }, [questions, userResponses]);

  useEffect(() => {
    const fetchUserResponses = async () => {
      if (!user || isFetched) return;

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
        setIsFetched(true);
      } catch (error) {
        console.error("Error fetching user responses:", error);
      }
    };

    fetchUserResponses();
  }, [user, firestore, questions, isFetched]);

  const handleUserInput = (e) => {
    e.preventDefault();
    if (userInput.trim() === "") return;

    const newConversation = [
      ...conversation,
      { sender: 'user', text: userInput },
    ];

    const nextIndex = currentQuestionIndex + 1; // Calculate next question index

    if (nextIndex < questions.length) {
      newConversation.push({ sender: 'system', text: questions[nextIndex] });
    }

    const newUserResponses = [
      ...userResponses,
      { question: questions[currentQuestionIndex], answer: userInput }
    ];

    setConversation(newConversation);
    setUserResponses(newUserResponses);
    setUserInput("");
    setCurrentQuestionIndex(nextIndex);
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
