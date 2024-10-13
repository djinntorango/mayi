import React, { useState, useEffect } from 'react';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase';

function Prewrite() {
  const [conversation, setConversation] = useState([]);
  const [userInput, setUserInput] = useState("");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [user] = useAuthState(auth);
  const firestore = getFirestore();

  // Pre-defined questions
  const questions = [
    "Today we'll write a story about... What is the topic of your story?",
    "Who is the main character in your story? What's their name?",
    "Where does the main character live?",
    "What is the main challenge or problem that your character faces?"
  ];

  // Function to save conversation to Firestore
  const saveConversationToFirestore = async (newConversation) => {
    if (user) {
      const userDocRef = doc(firestore, 'conversations', user.uid);
      await setDoc(userDocRef, { conversation: newConversation });
    }
  };

  // Load conversation from localStorage or Firestore when the component mounts
  useEffect(() => {
    const loadConversation = async () => {
      if (user) {
        const userDocRef = doc(firestore, 'conversations', user.uid);
        const docSnap = await getDoc(userDocRef);
        
        if (docSnap.exists()) {
          const savedConversation = docSnap.data().conversation;
          setConversation(savedConversation);
          setCurrentQuestionIndex(savedConversation.length / 2); // Assuming one question and one response are saved together
        }
      } else {
        const savedConversation = localStorage.getItem('prewriteConversation');
        if (savedConversation) {
          setConversation(JSON.parse(savedConversation));
          setCurrentQuestionIndex(JSON.parse(savedConversation).length / 2);
        }
      }
    };

    loadConversation();
  }, [user, firestore]);

  // Function to handle user's input submission
  const handleUserInput = () => {
    if (userInput.trim() && currentQuestionIndex < questions.length) {
      const question = { role: 'system', content: questions[currentQuestionIndex] };
      const userResponse = { role: 'user', content: userInput };
      const updatedConversation = [...conversation, question, userResponse];

      // Update conversation state and persist it locally and in Firestore
      setConversation(updatedConversation);
      localStorage.setItem('prewriteConversation', JSON.stringify(updatedConversation));
      saveConversationToFirestore(updatedConversation);

      // Clear the input field and move to the next question
      setUserInput("");
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  return (
    <div className="prewrite-container">
      <div className="chat-window">
        {conversation.map((msg, index) => (
          <div key={index} className={`chat-message ${msg.role}`}>
            <p>{msg.content}</p>
          </div>
        ))}
        {currentQuestionIndex < questions.length && (
          <div className="chat-message system">
            <p>{questions[currentQuestionIndex]}</p>
          </div>
        )}
      </div>
      <div className="user-input">
        <input
          type="text"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          placeholder="Type your response..."
        />
        <button onClick={handleUserInput} disabled={currentQuestionIndex >= questions.length}>
          Send
        </button>
      </div>
    </div>
  );
}

export default Prewrite;
