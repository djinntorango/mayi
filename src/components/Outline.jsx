import React, { useState, useEffect, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { getFunctions, httpsCallable } from "firebase/functions";
import { getFirestore, doc, getDoc, setDoc, deleteDoc, updateDoc, deleteField } from "firebase/firestore";
import { useAuthState } from 'react-firebase-hooks/auth';
import { ContentSkeletonLoader } from './SkeletonLoader';
import { FaPlus, FaMinus } from 'react-icons/fa';
import { auth, db } from '../firebase';
import { debounce } from 'lodash';
import outlineTemplates from './outlineTemplates';

const AddButton = ({ onClick, children, className }) => (
  <button
    onClick={onClick}
    className={`add-button ${className || ''}`}
    style={{
      opacity: 0,
      transition: 'opacity 0.3s',
    }}
    onMouseEnter={(e) => e.target.style.opacity = 1}
    onMouseLeave={(e) => e.target.style.opacity = 0}
  >
    {children}
  </button>
);

const OutlineEditor = ({currentProject, setAutoSaveStatus }) => {
  const [user] = useAuthState(auth);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [prompt, setPrompt] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  const generateUniqueId = () => {
    return Math.random().toString(36).substr(2, 9);
  };

  useEffect(() => {
    const loadOutline = async () => {
      setLoading(true);
      setError(null);
      setSections([]);
      if (user && currentProject) {
        try {
          const projectDocRef = doc(db, 'users', user.uid, 'projects', currentProject.id);
          const projectDocSnapshot = await getDoc(projectDocRef);

          if (projectDocSnapshot.exists()) {
            const projectData = projectDocSnapshot.data();
            const existingOutline = projectData.sections;
            if (existingOutline) {
              const sectionsWithIds = existingOutline.map(section => ({
                ...section,
                id: section.id || generateUniqueId()
              }));
              setSections(sectionsWithIds);
              setPrompt("");
            } else {
              console.log('No outline found for the given projectId.');
            }
          } else {
            console.log('No project document found for the given projectId.');
          }
        } catch (error) {
          console.error("Error loading outline:", error);
          setError("An error occurred while loading the outline.");
        } finally {
          setLoading(false);
        }
      }
    };

    loadOutline();
  }, [user, currentProject]);

  const applyTemplate = (template) => {
    const sectionsWithIds = template.sections.map(section => ({
      ...section,
      id: generateUniqueId(),
      events: section.events.map(event => ({ description: event }))
    }));
    setSections(sectionsWithIds);
    setSelectedTemplate(null);
  };

  const saveOutline = async (sectionsToSave) => {
    try {
      setAutoSaveStatus("Saving...");
      const outlineDocRef = doc(db, 'users', user.uid, 'projects', currentProject.id);
      await setDoc(outlineDocRef, { sections: sectionsToSave }, { merge: true });
      setAutoSaveStatus("Saved");
      setTimeout(() => setAutoSaveStatus(""), 2000); // Clear the status after 2 seconds
    } catch (error) {
      console.error("An error occurred while auto-saving the outline:", error);
      setAutoSaveStatus("Save failed");
      setTimeout(() => setAutoSaveStatus(""), 2000);
    }
  };

  const debouncedSave = useCallback(
    debounce((sectionsToSave) => saveOutline(sectionsToSave), 2000),
    [user, currentProject]
  );

  useEffect(() => {
    if (sections.length > 0) {
      debouncedSave(sections);
    }
  }, [sections, debouncedSave]);

  const generateOutline = async () => {
    setLoading(true);
    setError(null);

    try {
      const functions = getFunctions();
      const generateOutlineFn = httpsCallable(functions, 'generateOutline');
      const result = await generateOutlineFn({ prompt });
      const generatedSections = result.data.outline.sections.map(section => ({
        ...section,
        id: generateUniqueId()
      }));
      setSections(generatedSections);
    } catch (error) {
      setError("An error occurred while generating the outline.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const onDragEnd = (result) => {
    if (!result.destination) return;
  
    const { source, destination, type } = result;
  
    if (type === 'section') {
      const newSections = Array.from(sections);
      const [reorderedSection] = newSections.splice(source.index, 1);
      newSections.splice(destination.index, 0, reorderedSection);
      setSections(newSections);
    } else if (type === 'event') {
      const sourceSectionIndex = parseInt(source.droppableId.split('-')[1]);
      const destinationSectionIndex = parseInt(destination.droppableId.split('-')[1]);
  
      const newSections = Array.from(sections);
      const sourceEvents = Array.from(newSections[sourceSectionIndex].events);
      const [movedEvent] = sourceEvents.splice(source.index, 1);
  
      if (sourceSectionIndex === destinationSectionIndex) {
        // If the event is moved within the same section
        sourceEvents.splice(destination.index, 0, movedEvent);
        newSections[sourceSectionIndex].events = sourceEvents;
      } else {
        // If the event is moved to a different section
        const destinationEvents = Array.from(newSections[destinationSectionIndex].events);
        destinationEvents.splice(destination.index, 0, movedEvent);
        newSections[destinationSectionIndex].events = destinationEvents;
        newSections[sourceSectionIndex].events = sourceEvents;
      }
  
      setSections(newSections);
    }
  };

  const handleEventChange = (sectionIndex, eventIndex, newValue) => {
    const newSections = Array.from(sections);
    newSections[sectionIndex].events[eventIndex].description = newValue;
    setSections(newSections);
  };

  const addSection = (index) => {
    const newSections = [...sections];
    newSections.splice(index, 0, { id: generateUniqueId(), title: 'New Section', events: [] });
    setSections(newSections);
  };

  const removeSection = (index) => {
    const newSections = sections.filter((_, i) => i !== index);
    setSections(newSections);
  };

  const addEvent = (sectionIndex) => {
    const newSections = [...sections];
    newSections[sectionIndex].events.push({ description: 'New Event' });
    setSections(newSections);
  };

  const removeEvent = (sectionIndex, eventIndex) => {
    const newSections = [...sections];
    newSections[sectionIndex].events.splice(eventIndex, 1);
    setSections(newSections);
  };

  const handleSectionTitleChange = (index, newTitle) => {
    const newSections = [...sections];
    newSections[index].title = newTitle;
    setSections(newSections);
  };

  const deleteOutline = async () => {
    setLoading(true);
    setError(null);

    try {
      const outlineDocRef = doc(db, 'users', user.uid, 'projects', currentProject.id);
      await updateDoc(outlineDocRef, {
        sections: deleteField()
      });
      setSections([]);
    } catch (error) {
      setError("An error occurred while deleting the outline.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const InterSectionAddButton = ({ onClick }) => (
    <div
      className="inter-section-add-button"
      onClick={onClick}
    >
      <FaPlus /> Add Section
    </div>
  );

  return (
    <div className="outline-main">
    <div className="title-flex">
      <h1>Outline</h1>
      {!loading && sections.length > 0 && (
        <button onClick={deleteOutline} disabled={loading}>
          Delete Outline
        </button>
      )}
    </div>

    {sections.length === 0 && !selectedTemplate && (
      <div className="template-selection">
        {outlineTemplates.map((template, index) => (
          <button key={index} onClick={() => applyTemplate(template)}>
            {template.name}
          </button>
        ))}
        <textarea
          className="outline-prompt"
          placeholder="Enter your outline prompt here..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />
        <button onClick={generateOutline} disabled={loading}>
          Generate Outline
        </button>
      </div>
    )}

    {loading && <ContentSkeletonLoader />}
    {error && <p style={{ color: 'red' }}>{error}</p>}

    {!loading && sections.length > 0 && (

        <>
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="sections" type="section">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef}>
                  <AddButton onClick={() => addSection(0)}><FaPlus /> Add Section</AddButton>
                  {sections.map((section, sectionIndex) => (
                    <React.Fragment key={section.id}>
                    <Draggable key={section.id} draggableId={section.id} index={sectionIndex}>
                      {(provided) => (
                        <div
                        className="draggable-section" 
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          style={{
                            margin: '20px 0',
                            padding: '10px',
                            border: '1px solid #ccc',
                            ...provided.draggableProps.style,
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                            <input
                              type="text"
                              value={section.title}
                              onChange={(e) => handleSectionTitleChange(sectionIndex, e.target.value)}
                              style={{ marginRight: '10px' }}
                            />
                            <button onClick={() => removeSection(sectionIndex)}><FaMinus /></button>
                          </div>
                          <Droppable droppableId={`section-${sectionIndex}`} type="event">
                            {(provided) => (
                              <div {...provided.droppableProps} ref={provided.innerRef}>
                                {section.events.map((event, eventIndex) => (
                                  <Draggable key={eventIndex} draggableId={`${section.id}-${eventIndex}`} index={eventIndex}>
                                    {(provided) => (
                                      <div
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        {...provided.dragHandleProps}
                                        style={{
                                          padding: '10px',
                                          marginBottom: '10px',
                                          backgroundColor: '#f8f8f8',
                                          borderRadius: '4px',
                                          border: '1px solid #ddd',
                                          display: 'flex',
                                          alignItems: 'center',
                                          ...provided.draggableProps.style,
                                        }}
                                      >
                                        <input
                                          type="text"
                                          value={event.description}
                                          onChange={(e) => handleEventChange(sectionIndex, eventIndex, e.target.value)}
                                          style={{ flex: 1, marginRight: '10px' }}
                                        />
                                        <button onClick={() => removeEvent(sectionIndex, eventIndex)}><FaMinus /></button>
                                      </div>
                                    )}
                                  </Draggable>
                                ))}
                                {provided.placeholder}
                                <AddButton onClick={() => addEvent(sectionIndex)}><FaPlus /> Add Event</AddButton>
                              </div>
                            )}
                          </Droppable>
                        </div>
                      )}
                    </Draggable>
                                      <AddButton
                                      onClick={() => addSection(sectionIndex + 1)}
                                      className="inter-section-add-button"
                                    >
                                      <FaPlus /> Add Section
                                    </AddButton>
                                  </React.Fragment>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </>
      )}
    </div>
  );
};

export default OutlineEditor;
