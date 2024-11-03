// src/components/ChatInput.js
export function ChatInput({ userInput, setUserInput, handleSubmit, isLoading }) {
    return (
      <form className="input-box" onSubmit={handleSubmit}>
        <input
          type="text"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          placeholder="Type your answer..."
          disabled={isLoading}
        />
        <button type="submit" disabled={isLoading}>
          Send
        </button>
      </form>
    );
  }