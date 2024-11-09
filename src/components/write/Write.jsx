import React, { useState, useEffect, useRef } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import './write.css';

function WritingEditor() {
  const [editorContent, setEditorContent] = useState('');
  const [topic, setTopic] = useState('');
  const [storyData, setStoryData] = useState({
    topic: '',
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
      const decodedData = {
        topic: decodeURIComponent(topicFromUrl),
        habitat: decodeURIComponent(habitatFromUrl || ''),
        survivalNeeds: decodeURIComponent(survivalFromUrl || ''),
        additionalNeeds: decodeURIComponent(additionalFromUrl || ''),
        cleanText: decodeURIComponent(cleanTextFromUrl || '')
      };

      setTopic(decodedData.topic);
      setStoryData(decodedData);

      const initialContent = generateInitialContent(decodedData);
      setEditorContent(initialContent);
      updateStorylineVariable(initialContent);
    }
  }, []);

  const generateInitialContent = (data) => {
    const content = `
      <h2>All About ${data.topic}</h2>
      <p>${data.habitat}</p>
      <p>${data.survivalNeeds}</p>
      <p>${data.additionalNeeds}</p>
      <p>${data.cleanText}</p>
    `.trim();
    return content;
  };

  const updateStorylineVariable = (content) => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;
    tempDiv.querySelectorAll('p, h2').forEach(element => {
        element.insertAdjacentText('afterend', ' ');
    });
    const cleanText = tempDiv.textContent || tempDiv.innerText || '';

    window.parent.postMessage({
        type: 'STORY_UPDATE',
        storyElements: {
            cleanText: cleanText
        }
    }, '*');
  };

  const modules = {
    toolbar: [
      ['bold', 'italic'],
      [{ color: [] }, { background: [] }],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['clean']
    ]
  };

  const formats = [
    'header',
    'bold', 'italic',
    'color', 'background',
    'list', 'bullet'
  ];

  const handleChange = (content) => {
    setEditorContent(content);
    updateStorylineVariable(content);
  };

  return (
    <div className="writing-editor-container">
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