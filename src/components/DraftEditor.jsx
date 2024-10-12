import React, { useState } from 'react';

function DraftEditor() {
  const [draft, setDraft] = useState('');

  const saveDraft = () => {
    // Add logic to save the draft
  };

  return (
    <div className="DraftEditor">
      <h1>Draft Editor</h1>
      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder="Start writing your draft here"
      />
      <button onClick={saveDraft}>Save Draft</button>
    </div>
  );
}

export default DraftEditor;