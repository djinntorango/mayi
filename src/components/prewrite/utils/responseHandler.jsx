// src/utils/responseHandler.js
export function updateParentResponses(responses) {
  try {
      const storyElements = {
          habitat: responses[0]?.answer || '',
          survivalNeeds: responses[1]?.answer || '',
          additionalNeeds: responses[2]?.answer || '',
          isComplete: responses.length === 3 && responses[2]?.answer
      };

      console.log('Sending message from React iframe:', {
          type: 'STORY_UPDATE',
          storyElements
      });

      // Ensure we're in an iframe
      if (window.self !== window.top) {
          window.parent.postMessage({
              type: 'STORY_UPDATE',
              storyElements
          }, '*');  
      } else {
          console.error('Not in an iframe - message not sent');
      }
  } catch (error) {
      console.error('Error updating responses:', error);
  }
}
