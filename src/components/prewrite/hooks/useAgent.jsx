// src/hooks/useAgent.js
import { useState, useEffect } from 'react';
import LearningAgent from '../utils/learningAgent';

export function useAgent(topicFromUrl) {
  const [agent, setAgent] = useState(null);
  const [topic, setTopic] = useState("");

  useEffect(() => {
    if (topicFromUrl) {
      const decodedTopic = decodeURIComponent(topicFromUrl);
      setTopic(decodedTopic);
      setAgent(new LearningAgent(decodedTopic));
    }
  }, [topicFromUrl]);

  return { agent, topic };
}