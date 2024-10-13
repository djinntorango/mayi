import React, { useState } from 'react';
import './Prewrite.css';

function Prewrite() {
  const [step, setStep] = useState(0);
  const [responses, setResponses] = useState({
    storyTitle: "",
    mainCharacter: "",
    setting: "",
    goal: "",
    conflict: "",
  });
  const [currentInput, setCurrentInput] = useState("");

  const questions = [
    "Let's brainstorm your story! What's the title?",
    "Who is the main character?",
    "Where does your character live?",
    "What does your character want to achieve?",
    "What is the main problem your character faces?",
  ];

  const handleInput = (e) => {
    setCurrentInput(e.target.value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!currentInput) return;

    // Update responses based on the current step
    switch (step) {
      case 0:
        setResponses(prev => ({ ...prev, storyTitle: currentInput }));
        break;
      case 1:
        setResponses(prev => ({ ...prev, mainCharacter: currentInput }));
        break;
      case 2:
        setResponses(prev => ({ ...prev, setting: currentInput }));
        break;
      case 3:
        setResponses(prev => ({ ...prev, goal: currentInput }));
        break;
      case 4:
        setResponses(prev => ({ ...prev, conflict: currentInput }));
        break;
      default:
        break;
    }

    setCurrentInput(""); // Reset input field
    setStep(step + 1); // Move to the next question
  };

  return (
    <div className="prewrite-container">
      <div className="prewrite-conversation">
        {step < questions.length ? (
          <>
            <p className="prewrite-message">{questions[step]}</p>
            <form onSubmit={handleSubmit}>
              <input 
                type="text" 
                value={currentInput} 
                onChange={handleInput} 
                placeholder="Type your response..." 
              />
              <button type="submit">Send</button>
            </form>
          </>
        ) : (
          <p className="prewrite-message">Awesome! You've completed the brainstorming.</p>
        )}
      </div>

      <div className="prewrite-summary">
        <h3>Story Summary</h3>
        <p><strong>Title:</strong> {responses.storyTitle}</p>
        <p><strong>Main Character:</strong> {responses.mainCharacter}</p>
        <p><strong>Setting:</strong> {responses.setting}</p>
        <p><strong>Character Goal:</strong> {responses.goal}</p>
        <p><strong>Conflict:</strong> {responses.conflict}</p>
      </div>
    </div>
  );
}

export default Prewrite;
