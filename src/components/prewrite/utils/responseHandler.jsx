// src/utils/responseHandler.js
export function updateParentResponses(responses) {
    try {
      const habitatElements = {
        habitat: responses[0]?.answer || '',
        survivalNeeds: responses[1]?.answer || '',
        additionalNeeds: responses[2]?.answer || '',
        isComplete: responses.length === 3 && responses[2]?.answer
      };
  
      window.parent.postMessage({
        type: 'HABITAT_UPDATE',
        habitatElements
      }, '*');
    } catch (error) {
      console.error('Error updating responses:', error);
    }
  }