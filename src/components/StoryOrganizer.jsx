import React from 'react';

function StoryOrganizer({ responses, onUpdate }) {
  const handleInputChange = (index, value) => {
    const updatedResponses = [...responses];
    updatedResponses[index] = { ...updatedResponses[index], answer: value };
    onUpdate(updatedResponses);
  };

  const elements = [
    { name: 'Character', placeholder: 'Who is the main character?', className: 'character charset' },
    { name: 'Setting', placeholder: 'Where does the story take place?', className: 'setting charset' },
    { name: 'Problem', placeholder: 'What is the main problem or challenge?', className: 'problem prosol' },
    { name: 'Solution', placeholder: 'How is the problem solved?', className: 'solution prosol' },
    { name: 'Beginning', placeholder: 'What happens at the start of the story?', className: 'beginning' },
    { name: 'Middle', placeholder: 'What important events happen in the middle?', className: 'middle' },
    { name: 'End', placeholder: 'How does the story end?', className: 'end' }
  ];

  return (
    <div className="story-organizer">
      <h2>Story Elements</h2>
      <div className="story-row">
        {elements.slice(0, 2).map((element, index) => (
          <div key={index} className={`story-element ${element.className}`}>
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
      <div className="story-row">
        {elements.slice(2, 4).map((element, index) => (
          <div key={index + 2} className={`story-element ${element.className}`}>
            <h3>{element.name}</h3>
            <input
              type="text"
              value={responses[index + 2]?.answer || ''}
              onChange={(e) => handleInputChange(index + 2, e.target.value)}
              placeholder={element.placeholder}
            />
          </div>
        ))}
      </div>
      <div className="story-timeline">
        {elements.slice(4).map((element, index) => (
          <div key={index + 4} className={`story-element ${element.className}`}>
            <h3>{element.name}</h3>
            <input
              type="text"
              value={responses[index + 4]?.answer || ''}
              onChange={(e) => handleInputChange(index + 4, e.target.value)}
              placeholder={element.placeholder}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export default StoryOrganizer;