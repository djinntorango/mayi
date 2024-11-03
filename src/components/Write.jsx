import React, { useState, useEffect, useRef } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';


function WritingEditor() {
  const [editorContent, setEditorContent] = useState('');
  const [topic, setTopic] = useState('');
  const [responses, setResponses] = useState({
    habitat: '',
    survivalNeeds: '',
    additionalNeeds: ''
  });
  const quillRef = useRef(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const topicFromUrl = params.get('topic');
    const habitatFromUrl = params.get('habitat');
    const survivalFromUrl = params.get('survivalNeeds');
    const additionalFromUrl = params.get('additionalNeeds');

    if (topicFromUrl) {
      setTopic(decodeURIComponent(topicFromUrl));
      
      const newResponses = {
        habitat: habitatFromUrl ? decodeURIComponent(habitatFromUrl) : '',
        survivalNeeds: survivalFromUrl ? decodeURIComponent(survivalFromUrl) : '',
        additionalNeeds: additionalFromUrl ? decodeURIComponent(additionalFromUrl) : ''
      };
      setResponses(newResponses);

      // Create initial content from responses
      const initialContent = generateInitialContent(topicFromUrl, newResponses);
      setEditorContent(initialContent);
    }
  }, []);

  const generateInitialContent = (topic, responses) => {
    return `<h2>All About ${topic}</h2>
<p>${responses.habitat}</p>
<p>${responses.survivalNeeds}</p>
<p>${responses.additionalNeeds}</p>`;
  };

  // Customize Quill toolbar for kids
  const modules = {
    toolbar: [
      ['bold', 'italic'],
      [{ color: [] }, { background: [] }],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['clean']  // remove formatting
    ]
  };

  // Custom formats allowed
  const formats = [
    'header',
    'bold', 'italic',
    'color', 'background',
    'list', 'bullet'
  ];

  // Handle content changes
  const handleChange = (content) => {
    setEditorContent(content);
    // Post message to parent with updated content
    window.parent.postMessage({
      type: 'WRITING_UPDATE',
      content: content
    }, '*');
  };

  return (
    <div className="writing-editor-container">
      <div className="editor-header">
        <h1>Let's Write About {topic}!</h1>
      </div>
      <div className="editor-wrapper">
        <ReactQuill
          ref={quillRef}
          theme="snow"
          value={editorContent}
          onChange={handleChange}
          modules={modules}
          formats={formats}
        />
      </div>
    </div>
  );
}

export default WritingEditor;