// src/hooks/useConversation.js
import { useState, useEffect, useRef } from 'react';

export function useConversation(agent, topic) {
  const [conversation, setConversation] = useState([]);
  const conversationRef = useRef(null);

  useEffect(() => {
    if (agent && topic) {
      setConversation([
        { sender: 'system', text: `Let's learn about ${topic}!` },
        { sender: 'system', text: agent.getCurrentQuestion() }
      ]);
    }
  }, [agent, topic]);

  useEffect(() => {
    if (conversationRef.current) {
      conversationRef.current.scrollTop = conversationRef.current.scrollHeight;
    }
  }, [conversation]);

  return { conversation, setConversation, conversationRef };
}
