import React from 'react';
import { Card, CardHeader, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';

function StoryOrganizer({ responses, onUpdate }) {
  const handleInputChange = (index, value) => {
    const updatedResponses = [...responses];
    updatedResponses[index] = { ...updatedResponses[index], answer: value };
    onUpdate(updatedResponses);
  };

  return (
    <div className="story-organizer p-6 bg-blue-50 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-center text-blue-800">Story Elements</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="col-span-1 md:col-span-2 bg-yellow-100 border-yellow-300">
          <CardHeader className="bg-yellow-200 text-yellow-800 font-bold text-lg">Main Character</CardHeader>
          <CardContent>
            <Input
              value={responses[0]?.answer || ''}
              onChange={(e) => handleInputChange(0, e.target.value)}
              className="w-full border-yellow-300 focus:ring-yellow-500"
              placeholder="Who is the story about?"
            />
          </CardContent>
        </Card>
        
        <Card className="bg-green-100 border-green-300">
          <CardHeader className="bg-green-200 text-green-800 font-bold text-lg">Setting</CardHeader>
          <CardContent>
            <Input
              value={responses[1]?.answer || ''}
              onChange={(e) => handleInputChange(1, e.target.value)}
              className="w-full border-green-300 focus:ring-green-500"
              placeholder="Where does the story take place?"
            />
          </CardContent>
        </Card>
        
        <Card className="bg-red-100 border-red-300">
          <CardHeader className="bg-red-200 text-red-800 font-bold text-lg">Conflict</CardHeader>
          <CardContent>
            <Input
              value={responses[2]?.answer || ''}
              onChange={(e) => handleInputChange(2, e.target.value)}
              className="w-full border-red-300 focus:ring-red-500"
              placeholder="What problem does the character face?"
            />
          </CardContent>
        </Card>
        
        <Card className="col-span-1 md:col-span-2 bg-purple-100 border-purple-300">
          <CardHeader className="bg-purple-200 text-purple-800 font-bold text-lg">Resolution</CardHeader>
          <CardContent>
            <Input
              value={responses[3]?.answer || ''}
              onChange={(e) => handleInputChange(3, e.target.value)}
              className="w-full border-purple-300 focus:ring-purple-500"
              placeholder="How does the story end?"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default StoryOrganizer;