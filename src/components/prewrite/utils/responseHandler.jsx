// src/utils/responseHandler.js
export function updateParentResponses(responses) {
    try {
      const storyElements = {
        habitat: responses[0]?.answer || '',
        survivalNeeds: responses[1]?.answer || '',
        additionalNeeds: responses[2]?.answer || '',
        isComplete: responses.length === 3 && responses[2]?.answer
      };
  
      window.parent.postMessage({
        type: 'STORY_UPDATE',
        storyElements
      }, '*');
    } catch (error) {
      console.error('Error updating responses:', error);
    }
  }