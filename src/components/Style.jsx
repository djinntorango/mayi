import React, { useState, useEffect } from 'react';
import { setDoc, doc, getDoc } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../firebase';

const StyleSettings = ({ currentProject }) => {
  const initialSettings = {
    genre: 'Fantasy',
    tone: 'Dark',
    languageComplexity: 'Standard',
    figurativeLanguage: 'Moderate',
    preferredWords: '',
    avoidWords: '',
    jargonLevel: 'None',
    pointOfView: 'Third-Person',
    narratorType: 'Limited',
    custom: '',
  };

  const [user] = useAuthState(auth);
  const [settings, setSettings] = useState(initialSettings);
  const [successMessage, setSuccessMessage] = useState('');
  const [showResetModal, setShowResetModal] = useState(false);

  // Fetch existing project settings from Firestore
  useEffect(() => {
    const loadSettings = async () => {
      if (user && currentProject) {
        try {
          const projectDocRef = doc(db, 'users', user.uid, 'projects', currentProject.id);
          const projectDocSnapshot = await getDoc(projectDocRef);

          if (projectDocSnapshot.exists()) {
            const projectData = projectDocSnapshot.data();
            setSettings(projectData.settings || initialSettings);
          } else {
            console.log('No project document found for the given projectId.');
          }
        } catch (error) {
          console.error('Error loading settings:', error);
        }
      }
    };

    loadSettings();
  }, [user, currentProject]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings((prevSettings) => ({ ...prevSettings, [name]: value }));
  };

  const saveSettings = async () => {
    try {
      if (user && currentProject) {
        const projectDocRef = doc(db, 'users', user.uid, 'projects', currentProject.id);
        await setDoc(projectDocRef, {
          settings: { ...settings },
        }, { merge: true });

        setSuccessMessage('Style settings updated successfully');
        console.log('Settings saved successfully for project:', currentProject.id);
      } else {
        console.error('Failed to save settings. User:', user, 'Project:', currentProject);
        alert('Failed to save settings. User or project is not defined.');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings. Error: ' + error.message);
    }
  };

  const handleResetClick = () => {
    setShowResetModal(true);
  };

  const handleResetConfirm = async () => {
    setSettings(initialSettings);
    setShowResetModal(false);
    await saveSettings();
  };

  const handleResetCancel = () => {
    setShowResetModal(false);
  };

  return (
    <>
      <div className="container">
        <section className="interior">
          <div className="style-container">
            <div className="style-section">
              <h2>Writing Style</h2>

              <h4>Genre</h4>
              <label>
                <select name="genre" value={settings.genre} onChange={handleChange}>
                  <option value="Fantasy">Fantasy</option>
                  <option value="Sci-Fi">Sci-Fi</option>
                  <option value="Mystery">Mystery</option>
                  <option value="Romance">Romance</option>
                  <option value="Horror">Horror</option>
                  <option value="Historical">Historical</option>
                </select>
              </label>

              <h4>Tone</h4>
              <label>
                <select name="tone" value={settings.tone} onChange={handleChange}>
                  <option value="Dark">Dark</option>
                  <option value="Humorous">Humorous</option>
                  <option value="Dramatic">Dramatic</option>
                  <option value="Lighthearted">Lighthearted</option>
                  <option value="Serious">Serious</option>
                </select>
              </label>

              <h4>Language Complexity</h4>
              <label>
                <select name="languageComplexity" value={settings.languageComplexity} onChange={handleChange}>
                  <option value="Simple">Simple</option>
                  <option value="Standard">Standard</option>
                  <option value="Complex">Complex</option>
                </select>
              </label>

              <h4>Figurative Language</h4>
              <label>
                <select name="figurativeLanguage" value={settings.figurativeLanguage} onChange={handleChange}>
                  <option value="Minimal">Minimal</option>
                  <option value="Moderate">Moderate</option>
                  <option value="Rich">Rich</option>
                </select>
              </label>

              <h4>Point of View</h4>
              <label>
                <select name="pointOfView" value={settings.pointOfView} onChange={handleChange}>
                  <option value="First-Person">First-Person</option>
                  <option value="Second-Person">Second-Person</option>
                  <option value="Third-Person">Third-Person</option>
                </select>
              </label>

              <h4>Narrator Type</h4>
              <label>
                <select name="narratorType" value={settings.narratorType} onChange={handleChange}>
                  <option value="Limited">Limited</option>
                  <option value="All-Knowing">All-Knowing</option>
                </select>
              </label>
            </div>

            <div className="style-section">
              <h2>Vocabulary and Word Choice</h2>
              <label>
                Preferred Words:
                <textarea
                  name="preferredWords"
                  value={settings.preferredWords}
                  onChange={handleChange}
                  placeholder="e.g., sword, castle"
                />
              </label>
              <label>
                Avoid Words/Phrases:
                <textarea
                  name="avoidWords"
                  value={settings.avoidWords}
                  onChange={handleChange}
                  placeholder="e.g., cliché, stereotype"
                />
              </label>
            </div>
            <div className="style-section">
              <h2>Custom Instructions</h2>
              <label>
                <textarea
                  name="custom"
                  value={settings.custom}
                  onChange={handleChange}
                  placeholder="e.g., Emphasize the protagonist's inner conflict."
                />
              </label>
            </div>
            <div className="form-btn-container">
              <button className="reset-btn" onClick={handleResetClick}>Reset to Defaults</button>
              <button onClick={saveSettings}>Save Settings</button>
            </div>
          </div>
        </section>

        {successMessage && <div className="success-message">{successMessage} &#127881;</div>}

        {showResetModal && (
          <div className="modal-overlay">
            <div className="modal">
              <h2 className="cen">Warning</h2>
              <p className="cen">This will remove all your saved word choice, custom instructions, and style settings. This action cannot be undone. Do you wish to proceed?</p>
              <div className="modal-btn-container">
                <button onClick={handleResetConfirm}>Yes</button>
                <button onClick={handleResetCancel}>No</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default StyleSettings;
