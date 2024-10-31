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

  const getAIFeedback = async (question, answer) => {
    try {
      const response = await fetch('https://teacherresponse-co3kwnyxqq-uc.a.run.app', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content: `You are a helpful writing teacher. The student is answering the question: "${question}". 
                       Provide encouraging feedback and a follow-up question or suggestion to help them develop their answer further. 
                       Keep your response brief and friendly. If the answer is too short or vague, encourage more detail.`
            },
            {
              role: "user",
              content: answer
            }
          ]
        })
      });

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error('Error getting AI feedback:', error);
      return null;
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