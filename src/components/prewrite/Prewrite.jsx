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