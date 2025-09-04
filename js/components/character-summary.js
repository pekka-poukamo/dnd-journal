import { } from '../utils.js';

export const renderCharacterSummary = (container, character) => {
  if (!container) return;
  container.innerHTML = '';

  if (!character || (!character.name && !character.race && !character.class)) {
    container.appendChild(createEmptyState('No character information yet.'));
    return;
  }

  const characterInfo = document.createElement('div');
  characterInfo.className = 'character-info';

  const heading = document.createElement('h2');
  heading.textContent = character.name || '';
  characterInfo.appendChild(heading);

  const subheading = document.createElement('h5');
  const race = character.race || '';
  const clazz = character.class || '';
  subheading.textContent = `${race} • ${clazz}`.trim();
  characterInfo.appendChild(subheading);

  container.appendChild(characterInfo);
};

const createEmptyState = (message) => {
  const emptyDiv = document.createElement('div');
  emptyDiv.className = 'empty-state';
  const p = document.createElement('p');
  p.textContent = message;
  emptyDiv.appendChild(p);
  return emptyDiv;
};

