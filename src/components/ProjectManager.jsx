import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, getDocs, addDoc, doc, updateDoc, orderBy } from 'firebase/firestore';

function ProjectManager({ user, currentProject, setCurrentProject }) {
  const [projects, setProjects] = useState([]);
  const [showNewProjectPopup, setShowNewProjectPopup] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');

  useEffect(() => {
    if (user) {
      fetchProjects();
    }
  }, [user]);

  const fetchProjects = async () => {
    const userDocRef = doc(db, "users", user.uid);
    const projectsCollectionRef = collection(userDocRef, "projects");

    // Fetch all projects for the user, ordered by creation date
    const q = query(projectsCollectionRef, orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    const projectList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    setProjects(projectList);

    if (projectList.length === 0) {
      // No projects found, show the popup to create a new project
      setShowNewProjectPopup(true);
    } else {
      // Automatically set the last project (most recently created) as the current project
      setCurrentProject(projectList[0]);
    }
  };

  const createNewProject = async () => {
    if (newProjectName.trim() !== '') {
      const userDocRef = doc(db, "users", user.uid);
      const projectsCollectionRef = collection(userDocRef, "projects");
      const docRef = await addDoc(projectsCollectionRef, {
        name: newProjectName,
        userId: user.uid,
        createdAt: new Date()
      });
      const newProject = { id: docRef.id, name: newProjectName };
      setCurrentProject(newProject);

      // Update user's document with the new project as the current project
      await updateDoc(userDocRef, {
        currentProject: newProject.id
      });

      setProjects(prev => [newProject, ...prev]);
      setNewProjectName('');
      setShowNewProjectPopup(false);
    }
  };

  return (
    <div className="project-manager">
      <select 
        value={currentProject ? currentProject.id : ''}
        onChange={async (e) => {
          if (e.target.value === "new") {
            setShowNewProjectPopup(true);
          } else {
            const selected = projects.find(p => p.id === e.target.value);
            setCurrentProject(selected);

            // Update user's document with the selected project as the current project
            const userDocRef = doc(db, "users", user.uid);
            await updateDoc(userDocRef, {
              currentProject: selected.id
            });
          }
        }}
      >
        <option value="new">+ Create New Project</option>
        {projects.map(project => (
          <option key={project.id} value={project.id}>{project.name}</option>
        ))}
      </select>

      {showNewProjectPopup && (
        <div className="popup">
          <h3>Create New Project</h3>
          <input
            type="text"
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            placeholder="Project Name"
          />
          <button onClick={createNewProject}>Create</button>
          <button onClick={() => setShowNewProjectPopup(false)}>Cancel</button>
        </div>
      )}
    </div>
  );
}

export default ProjectManager;
