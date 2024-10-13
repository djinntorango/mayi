import React, { useState, useEffect } from 'react';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase';
import StoryOrganizer from './StoryOrganizer';

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
    const fetchUserResponses = async () => {
      if (!user || isFetched) return;

      try {
        const docRef = doc(firestore, "users", user.uid, "prewrites", "latest");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.responses) {
            setUserResponses(data.responses);
            const updatedConversation = data.responses.flatMap((response, index) => [
              { sender: 'system', text: questions[index] },
              { sender: 'user', text: response.answer }
            ]);
            
            if (data.responses.length < questions.length) {
              updatedConversation.push({ 
                sender: 'system', 
                text: questions[data.responses.length] 
              });
            }
            
            setConversation(updatedConversation);
            setCurrentQuestionIndex(data.responses.length);
          }
        }
        setIsFetched(true);
      } catch (error) {
        console.error("Error fetching user responses:", error);
      }
    };

    fetchUserResponses();
  }, [user, firestore, questions, isFetched]);

  useEffect(() => {
    if (isFetched && conversation.length === 0) {
      setConversation([{ sender: 'system', text: questions[0] }]);
    }
  }, [isFetched, conversation, questions]);

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

  const handleOrganizerUpdate = (updatedResponses) => {
    setUserResponses(updatedResponses);
    const updatedConversation = updatedResponses.flatMap((response, index) => [
      { sender: 'system', text: questions[index] },
      { sender: 'user', text: response.answer }
    ]);
    
    if (updatedResponses.length < questions.length) {
      updatedConversation.push({ 
        sender: 'system', 
        text: questions[updatedResponses.length] 
      });
    }
    
    setConversation(updatedConversation);
  };

  useEffect(() => {
    if (!user || userResponses.length === 0) return;

    const saveToFirestore = async () => {
      try {
        const docRef = doc(firestore, "users", user.uid, "prewrites", "latest");
        await setDoc(docRef, { 
          responses: userResponses,
          currentQuestionIndex: currentQuestionIndex
        }, { merge: true });
      } catch (error) {
        console.error("Error saving prewrite data:", error);
      }
    };

    saveToFirestore();
  }, [userResponses, currentQuestionIndex, user, firestore]);

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
            />
            <button type="submit">Send</button>
          </form>
        </div>

        <StoryOrganizer responses={userResponses} onUpdate={handleOrganizerUpdate} />
      </div>
  );
}

export default Prewrite;