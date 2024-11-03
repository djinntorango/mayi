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
      [{ header: [2, 3, false] }],  // headers
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
        <div className="writing-tips">
          <h3>Writing Tips:</h3>
          <ul>
            <li>✏️ Use colorful words to describe {topic}</li>
            <li>📝 Add more details to make it interesting</li>
            <li>🎨 Try using the formatting tools above</li>
          </ul>
        </div>
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
      <style>
        {`
          .writing-editor-container {
            padding: 20px;
            max-width: 800px;
            margin: 0 auto;
            font-family: 'Comic Sans MS', cursive, sans-serif;
          }

          .editor-header {
            text-align: center;
            margin-bottom: 20px;
            color: #2c3e50;
          }

          .writing-tips {
            background-color: #f8f9fa;
            border-radius: 10px;
            padding: 15px;
            margin-bottom: 20px;
            border: 2px solid #e9ecef;
          }

          .writing-tips h3 {
            color: #6c5ce7;
            margin-top: 0;
          }

          .writing-tips ul {
            list-style: none;
            padding: 0;
          }

          .writing-tips li {
            margin: 10px 0;
            color: #2d3436;
          }

          .editor-wrapper {
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }

          /* Quill Customization */
          .ql-toolbar {
            border-radius: 10px 10px 0 0;
            background-color: #f8f9fa;
            border: none !important;
            border-bottom: 2px solid #e9ecef !important;
          }

          .ql-container {
            border-radius: 0 0 10px 10px;
            border: none !important;
            font-size: 16px;
            min-height: 300px;
          }

          .ql-editor {
            padding: 20px;
            min-height: 300px;
            background-color: white;
          }

          /* Make toolbar buttons more kid-friendly */
          .ql-toolbar button {
            width: 40px;
            height: 40px;
            margin: 5px;
          }

          .ql-toolbar button svg {
            transform: scale(1.2);
          }
        `}
      </style>
    </div>
  );
}

export default WritingEditor;