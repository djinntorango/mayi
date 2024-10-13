import React, { useState, useEffect } from 'react';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase';
import StoryOrganizer from './StoryOrganizer';
import { Card, CardContent, CardHeader } from '../components/ui/card';
import { Input } from '../components/ui/input';

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
    <div className="prewrite-container main-container flex">
      <div className="chat-interface flex-1 mr-4">
        <div className="conversation-box mb-4 p-4 bg-gray-100 rounded-lg max-h-[70vh] overflow-y-auto">
          {conversation.map((entry, index) => (
            <div key={index} className={`message ${entry.sender} mb-2 p-2 rounded ${entry.sender === 'system' ? 'bg-blue-100' : 'bg-green-100'}`}>
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
            className="w-full p-2 border rounded"
            autoFocus
          />
          <button type="submit" className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">Send</button>
        </form>
      </div>

      <div className="side-panel flex-1">
        <StoryOrganizer responses={userResponses} onUpdate={handleOrganizerUpdate} />
      </div>
    </div>
  );
}

export default Prewrite;