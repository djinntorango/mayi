// src/hooks/useAIResponse.js
export async function getAIResponse(agent, userAnswer, previousResponses) {
    try {
      const prompt = agent.generatePrompt(userAnswer, previousResponses);
      
      const response = await fetch('https://prewriteresponse-co3kwnyxqq-uc.a.run.app', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ corePrompt: prompt, prompt: userAnswer })
      });
  
      if (!response.ok) throw new Error(`API returned ${response.status}`);
      const data = await response.json();
      return JSON.parse(data.text);
    } catch (error) {
      console.error('API Error:', error);
      return {
        analysis: { score: 0.5, isRelevant: true, completesFrame: false },
        decision: { action: 'elaborate', reason: 'Error occurred' },
        response: { feedback: "Let's try that again!", followUp: null }
      };
    }
  }