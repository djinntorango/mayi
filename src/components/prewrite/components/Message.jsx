// src/components/Message.js
export function Message({ sender, text }) {
    return (
      <div className={`message ${sender}`}>
        <div className="sender">
          {sender === 'user' ? 'You' : 'Teacher'}
        </div>
        <div className="content">
          {text}
        </div>
      </div>
    );
  }
  