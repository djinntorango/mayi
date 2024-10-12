import React, { useState, useEffect, useCallback } from 'react';


const outlineTemplates = [
  {
    name: "Hero's Journey",
    sections: [
      { title: "Ordinary World", events: ["Introduce protagonist", "Show everyday life"] },
      { title: "Call to Adventure", events: ["Present the challenge or opportunity"] },
      { title: "Refusal of the Call", events: ["Hero's initial reluctance"] },
      { title: "Meeting the Mentor", events: ["Encounter with a guide or advisor"] },
      { title: "Crossing the Threshold", events: ["Hero leaves familiar world"] },
      { title: "Tests, Allies, Enemies", events: ["Face challenges", "Make friends and foes"] },
      { title: "Approach to the Inmost Cave", events: ["Prepare for major challenge"] },
      { title: "Ordeal", events: ["Central crisis or challenge"] },
      { title: "Reward", events: ["Hero's success and its immediate aftermath"] },
      { title: "The Road Back", events: ["Begin journey home"] },
      { title: "Resurrection", events: ["Final test or challenge"] },
      { title: "Return with Elixir", events: ["Hero returns transformed"] }
    ]
  },
  {
    name: "Three-Act Play",
    sections: [
      { title: "Act 1: Setup", events: ["Introduce characters", "Establish setting", "Present inciting incident"] },
      { title: "Act 2: Confrontation", events: ["Rising action", "Complications and obstacles", "Midpoint twist"] },
      { title: "Act 3: Resolution", events: ["Climax", "Falling action", "Denouement"] }
    ]
  },
];

export default outlineTemplates;