// import React, { useState, useEffect } from 'react';
// import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
// import { useAuthState } from 'react-firebase-hooks/auth';
// import { auth } from '../firebase';
// import StoryOrganizer from './StoryOrganizer';
// import '../styles/prewrite.css';

// function Prewrite() {
//   const [conversation, setConversation] = useState([]);
//   const [userResponses, setUserResponses] = useState([]);
//   const [userInput, setUserInput] = useState("");
//   const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
//   const [user] = useAuthState(auth);
//   const firestore = getFirestore();
//   const [isFetched, setIsFetched] = useState(false);

//   const questions = [
//     "Let's write a story today! Who is the main character?",
//     "Where does the story take place?",
//     "What is the main problem or challenge in the story?",
//     "How is the problem solved?",
//     "What happens at the beginning of the story?",
//     "What important events happen in the middle of the story?",
//     "How does the story end?"
//   ];

//   useEffect(() => {
//     const fetchUserResponses = async () => {
//       if (!user || isFetched) return;

//       try {
//         const docRef = doc(firestore, "users", user.uid, "prewrites", "latest");
//         const docSnap = await getDoc(docRef);
//         if (docSnap.exists()) {
//           const data = docSnap.data();
//           if (data.responses) {
//             setUserResponses(data.responses);
//             const updatedConversation = data.responses.flatMap((response, index) => [
//               { sender: 'system', text: questions[index] },
//               { sender: 'user', text: response.answer }
//             ]);
            
//             if (data.responses.length < questions.length) {
//               updatedConversation.push({ 
//                 sender: 'system', 
//                 text: questions[data.responses.length] 
//               });
//             }
            
//             setConversation(updatedConversation);
//             setCurrentQuestionIndex(data.responses.length);
//           }
//         }
//         setIsFetched(true);
//       } catch (error) {
//         console.error("Error fetching user responses:", error);
//       }
//     };

//     fetchUserResponses();
//   }, [user, firestore, questions, isFetched]);

//   useEffect(() => {
//     if (isFetched && conversation.length === 0) {
//       setConversation([{ sender: 'system', text: questions[0] }]);
//     }
//   }, [isFetched, conversation, questions]);

//   const handleUserInput = (e) => {
//     e.preventDefault();
//     if (userInput.trim() === "") return;

//     const newConversation = [
//       ...conversation,
//       { sender: 'user', text: userInput },
//     ];

//     if (currentQuestionIndex + 1 < questions.length) {
//       newConversation.push({ sender: 'system', text: questions[currentQuestionIndex + 1] });
//     }

//     const newUserResponses = [
//       ...userResponses,
//       { question: questions[currentQuestionIndex], answer: userInput }
//     ];

//     setConversation(newConversation);
//     setUserResponses(newUserResponses);
//     setUserInput("");
//     setCurrentQuestionIndex(currentQuestionIndex + 1);
//   };

//   const handleOrganizerUpdate = (updatedResponses) => {
//     setUserResponses(updatedResponses);
//     const updatedConversation = updatedResponses.flatMap((response, index) => [
//       { sender: 'system', text: questions[index] },
//       { sender: 'user', text: response.answer }
//     ]);
    
//     if (updatedResponses.length < questions.length) {
//       updatedConversation.push({ 
//         sender: 'system', 
//         text: questions[updatedResponses.length] 
//       });
//     }
    
//     setConversation(updatedConversation);
//     setCurrentQuestionIndex(updatedResponses.length);
//   };

//   useEffect(() => {
//     if (!user || userResponses.length === 0) return;

//     const saveToFirestore = async () => {
//       try {
//         const docRef = doc(firestore, "users", user.uid, "prewrites", "latest");
//         await setDoc(docRef, { 
//           responses: userResponses,
//           currentQuestionIndex: currentQuestionIndex
//         }, { merge: true });
//       } catch (error) {
//         console.error("Error saving prewrite data:", error);
//       }
//     };

//     saveToFirestore();
//   }, [userResponses, currentQuestionIndex, user, firestore]);

//   return (
//     <div className="prewrite-container main-container">
//       <div className="chat-interface">
//         <div className="conversation-box">
//           {conversation.map((entry, index) => (
//             <div key={index} className={`message ${entry.sender}`}>
//               <div className="sender">
//                 {entry.sender === 'user' ? user.displayName : 'Teacher'}
//               </div>
//               <div className="content">
//                 {entry.text}
//               </div>
//             </div>
//           ))}
//         </div>
//         <form className="input-box" onSubmit={handleUserInput}>
//           <input
//             type="text"
//             value={userInput}
//             onChange={(e) => setUserInput(e.target.value)}
//             placeholder="Type your answer..."
//           />
//           <button type="submit">Send</button>
//         </form>
//       </div>

//       <StoryOrganizer responses={userResponses} onUpdate={handleOrganizerUpdate} />
//     </div>
//   );
// }

// src/Prewrite.js
import React, { useState } from 'react';
import { useAgent } from './hooks/useAgent';
import { useConversation } from './hooks/useConversation';
import { getAIResponse } from './hooks/useAIResponse';
import { TypingIndicator } from './components/TypingIndicator';
import { Message } from './components/Message';
import { ChatInput } from './components/ChatInput';
import { updateParentResponses } from './utils/responseHandler';
import './styles/prewrite.css';

function Prewrite() {
  const params = new URLSearchParams(window.location.search);
  const { agent, topic } = useAgent(params.get('topic'));
  const { conversation, setConversation, conversationRef } = useConversation(agent, topic);
  const [userResponses, setUserResponses] = useState([]);
  const [userInput, setUserInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleUserInput = async (e) => {
    e.preventDefault();
    if (!userInput.trim() || isLoading || !agent) return;

    const currentInput = userInput;
    setUserInput('');
    setConversation(prev => [...prev, { sender: 'user', text: currentInput }]);
    setIsLoading(true);

    const result = await getAIResponse(agent, currentInput, userResponses);

    setConversation(prev => [...prev, { sender: 'system', text: result.response.feedback }]);

    if (result.decision.action === 'next' || result.decision.action === 'complete') {
      const newUserResponses = [...userResponses, {
        question: agent.getCurrentQuestion(),
        answer: currentInput,
        feedback: result.response.feedback
      }];
      setUserResponses(newUserResponses);

      if (result.decision.action === 'next') {
        agent.currentQuestionIndex++;
        setConversation(prev => [...prev, { 
          sender: 'system', 
          text: agent.getCurrentQuestion()
        }]);
        setUserInput(agent.getCurrentFrame());
      }

      updateParentResponses(newUserResponses);
    } else if (result.decision.action === 'elaborate') {
      if (result.response.followUp) {
        setConversation(prev => [...prev, { 
          sender: 'system', 
          text: result.response.followUp 
        }]);
      }
      setUserInput(agent.getCurrentFrame());
    }

    setIsLoading(false);
  };

  return (
    <div className="prewrite-container main-container">
      <div className="chat-interface">
        <div className="conversation-box" ref={conversationRef}>
          {conversation.map((entry, index) => (
            <Message key={index} sender={entry.sender} text={entry.text} />
          ))}
          {isLoading && (
            <div className="message system">
              <div className="content">
                <TypingIndicator />
              </div>
            </div>
          )}
        </div>
        <ChatInput
          userInput={userInput}
          setUserInput={setUserInput}
          handleSubmit={handleUserInput}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}

export default Prewrite;