import React from 'react';

function StoryOrganizer({ responses, onUpdate }) {
    const handleInputChange = (index, value) => {
      const updatedResponses = [...responses];
      updatedResponses[index] = { ...updatedResponses[index], answer: value };
      onUpdate(updatedResponses);
    };
  
    const elements = [
      { name: 'Character', placeholder: 'Who is the story about?' },
      { name: 'Setting', placeholder: 'Where does the story take place?' },
      { name: 'Conflict', placeholder: 'What problem does the character face?' },
      { name: 'Resolution', placeholder: 'How does the story end?' }
    ];
  
    return (
      <div className="story-organizer">
        <h2>Story Elements</h2>
        {elements.map((element, index) => (
          <div key={index} className={`story-element ${element.name.toLowerCase()}`}>
            <h3>{element.name}</h3>
            <input
              type="text"
              value={responses[index]?.answer || ''}
              onChange={(e) => handleInputChange(index, e.target.value)}
              placeholder={element.placeholder}
            />
          </div>
        ))}
      </div>
    );
  }

export default StoryOrganizer;