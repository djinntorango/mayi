// src/hooks/useAgent.js
import { useState, useEffect } from 'react';
import { LearningAgent } from '../utils/LearningAgent';

export function useAgent(topicFromUrl) {
  const [agent, setAgent] = useState(null);
  const [topic, setTopic] = useState("");

  useEffect(() => {
    if (topicFromUrl) {
      const decodedTopic = decodeURIComponent(topicFromUrl);
      const newAgent = new LearningAgent(decodedTopic);
      setTopic(decodedTopic);
      setAgent(newAgent);
    }
  }, [topicFromUrl]);

  return { agent, topic };
}