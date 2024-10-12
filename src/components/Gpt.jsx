import React, { useState } from 'react';
import { getFunctions, httpsCallable } from "firebase/functions";
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase'; // Removed db for now

const ChatInterface = ({ currentProject }) => {
  //const [user] = useAuthState(auth);
  const [chatHistory, setChatHistory] = useState([]);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const sendPrompt = async () => {
    if (!prompt) return;

    setLoading(true);
    setError(null);

    try {
      const functions = getFunctions();
      const chatFn = httpsCallable(functions, 'generateChatResponse');
      const result = await chatFn({ prompt });

      console.log("Cloud Function Result:", result); // Debugging

      if (result.data && result.data.outline) {
        // Update the chat history with the prompt and response (outline)
        const newChat = { prompt, response: result.data.outline };
        setChatHistory([...chatHistory, newChat]);

        // Clear the prompt input
        setPrompt(""); 
      } else {
        setError("No response received from the server.");
      }

    } catch (error) {
      setError("An error occurred while generating the response.");
      console.error("Error calling Cloud Function:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chat-interface">
      <div className="chat-left-panel">
        <h1>我爱你，老婆</h1>

        <div className="chat-history">
          {chatHistory.length === 0 && <p>No chat history available.</p>}
          {chatHistory.map((chat, index) => (
            <div key={index} className="chat-message">
              <div><strong>三岁:</strong> {chat.prompt}</div>
              <div><strong>老公GPT:</strong> {chat.response || "No response yet"}</div>
            </div>
          ))}
        </div>

        <div className="chat-input-area">
          <textarea
            className="chat-input"
            placeholder="Enter your prompt here..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
          <button
            onClick={sendPrompt}
            disabled={loading}
            className="send-button"
          >
            {loading ? 'Generating...' : 'Send'}
          </button>
          {error && <p style={{ color: 'red' }}>{error}</p>}
        </div>
      </div>

      <div className="chat-right-panel">
        <h2>Chat History</h2>
        <div className="history-list">
          {chatHistory.map((chat, index) => (
            <div key={index} className="history-item">
              <p>{chat.prompt}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
