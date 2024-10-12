import React, { useState } from 'react';

function CharacterDatabase() {
  const [characters, setCharacters] = useState([]);

  const addCharacter = (character) => {
    setCharacters([...characters, character]);
  };

  return (
    <div className="CharacterDatabase">
      <h1>Character Database</h1>
      {/* Add form to create new characters */}
      <ul>
        {characters.map((character, index) => (
          <li key={index}>{character.name}</li>
        ))}
      </ul>
    </div>
  );
}

export default CharacterDatabase;