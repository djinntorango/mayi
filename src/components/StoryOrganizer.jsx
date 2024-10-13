import React from 'react';
import { Card, CardContent, CardHeader } from '../components/ui/card';
import { Input } from '../components/ui/input';

function StoryOrganizer({ responses, onUpdate }) {
  const handleInputChange = (index, value) => {
    const updatedResponses = [...responses];
    updatedResponses[index] = { ...updatedResponses[index], answer: value };
    onUpdate(updatedResponses);
  };

  return (
    <div className="story-organizer">
      <h3 className="text-xl font-bold mb-4">Story Organizer</h3>
      <div className="grid grid-cols-2 gap-4">
        {responses.map((response, index) => (
          <Card key={index} className="bg-white shadow-md">
            <CardHeader className="bg-gray-100 font-semibold p-2">
              {response.question}
            </CardHeader>
            <CardContent className="p-2">
              <Input
                value={response.answer}
                onChange={(e) => handleInputChange(index, e.target.value)}
                className="w-full p-1 border rounded"
              />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default StoryOrganizer;