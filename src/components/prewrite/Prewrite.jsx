// In src/Prewrite.js
// Add this useEffect to handle initial sentence frame
useEffect(() => {
  if (agent) {
    setUserInput(agent.getCurrentFrame());
  }
}, [agent]);

// Modify the handleUserInput function to properly handle elaboration
const handleUserInput = async (e) => {
  e.preventDefault();
  if (!userInput.trim() || isLoading || !agent) return;

  const currentInput = userInput;
  setUserInput(''); // Clear input immediately
  setConversation(prev => [...prev, { sender: 'user', text: currentInput }]);
  setIsLoading(true);
  
  const result = await getAIResponse(currentInput, userResponses);
  
  // Add the feedback first
  setConversation(prev => [...prev, { sender: 'system', text: result.response.feedback }]);

  // Handle elaboration - crucial to check this first
  if (result.decision.action === 'elaborate') {
    if (result.response.followUp) {
      setConversation(prev => [...prev, { sender: 'system', text: result.response.followUp }]);
    }
    setUserInput(agent.getCurrentFrame()); // Keep the same frame for elaboration
    setIsLoading(false);
    return; // Exit early - don't process anything else
  }

  // Only proceed if we're not elaborating
  if (result.decision.action === 'next' || result.decision.action === 'complete') {
    const newUserResponses = [
      ...userResponses,
      {
        question: agent.getCurrentQuestion(),
        answer: currentInput,
        feedback: result.response.feedback,
        analysis: result.analysis
      }
    ];

    setUserResponses(newUserResponses);
    updateResponses(newUserResponses);

    if (result.decision.action === 'next') {
      agent.currentQuestionIndex++;
      setConversation(prev => [...prev, { 
        sender: 'system', 
        text: agent.getCurrentQuestion()
      }]);
      setUserInput(agent.getCurrentFrame());
    } else {
      setUserInput('');
    }
  }

  setIsLoading(false);
};