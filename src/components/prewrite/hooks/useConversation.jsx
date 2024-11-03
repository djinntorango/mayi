// In src/hooks/useConversation.js
export function useConversation(agent, topic) {
  const [conversation, setConversation] = useState([]);
  const conversationRef = useRef(null);

  // Initialize conversation and set initial sentence frame
  useEffect(() => {
    if (agent && topic) {
      setConversation([
        { sender: 'system', text: `Let's learn about ${topic}!` },
        { sender: 'system', text: agent.getCurrentQuestion() }
      ]);
      // Don't set userInput here - move it to Prewrite component
    }
  }, [agent, topic]);

  useEffect(() => {
    if (conversationRef.current) {
      conversationRef.current.scrollTop = conversationRef.current.scrollHeight;
    }
  }, [conversation]);

  return { conversation, setConversation, conversationRef };
}
