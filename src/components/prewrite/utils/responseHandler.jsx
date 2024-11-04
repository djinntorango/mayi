// src/utils/responseHandler.js
export function updateParentResponses(responses) {
    try {
        // Log incoming responses for debugging
        console.log('Checking responses:', responses);

        // Check if we have all three responses and they're all non-empty
        const isAllComplete = responses.length === 3 && 
            responses.every(response => response?.answer?.trim());

        const storyElements = {
            habitat: responses[0]?.answer || '',
            survivalNeeds: responses[1]?.answer || '',
            additionalNeeds: responses[2]?.answer || '',
            isComplete: isAllComplete  // Changed to use our new check
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