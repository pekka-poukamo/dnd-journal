// js/components/Cards.js - Card components for entries and characters

import { createElement } from '../utils/dom.js';
import { 
  formatDate, 
  formatRelativeDate, 
  createPreview, 
  formatCharacterSummary, 
  formatEntryType,
  createInitials 
} from '../utils/formatters.js';

// Pure function for creating entry cards
export const createEntryCard = (entry) => {
  const preview = createPreview(entry.content, 150);
  const formattedDate = formatDate(entry.date || entry.created);
  const relativeDate = formatRelativeDate(entry.created);
  const entryType = formatEntryType(entry.type);

  const titleElement = createElement('h3', {
    className: 'entry-card__title'
  }, [entry.title]);

  const metaElement = createElement('div', {
    className: 'entry-card__meta'
  }, [`${entryType} • ${formattedDate} • ${relativeDate}`]);

  const previewElement = createElement('p', {
    className: 'entry-card__preview'
  }, [preview]);

  const tagsContainer = createElement('div', {
    className: 'entry-card__tags'
  }, (entry.tags || []).map(tag => 
    createElement('span', { className: 'tag' }, [tag])
  ));

  return createElement('div', {
    className: 'entry-card',
    dataset: { entryId: entry.id },
    onclick: () => window.location.href = `journal.html?id=${entry.id}`,
    tabindex: '0',
    role: 'button',
    'aria-label': `Open entry: ${entry.title}`
  }, [
    titleElement,
    metaElement,
    previewElement,
    tagsContainer
  ]);
};

// Pure function for creating character cards
export const createCharacterCard = (character) => {
  const summary = formatCharacterSummary(character);
  const initials = createInitials(character.name);

  const avatarElement = createElement('div', {
    className: 'character-card__avatar'
  }, [initials]);

  const nameElement = createElement('h3', {
    className: 'character-card__title'
  }, [character.name]);

  const summaryElement = createElement('div', {
    className: 'character-card__meta'
  }, [summary]);

  const backstoryPreview = character.backstory 
    ? createPreview(character.backstory, 100)
    : 'No backstory yet...';

  const backstoryElement = createElement('p', {
    className: 'character-card__preview'
  }, [backstoryPreview]);

  const traitsContainer = character.traits 
    ? createElement('div', {
        className: 'character-card__tags'
      }, character.traits.split(',').map(trait =>
        createElement('span', { className: 'tag tag--secondary' }, [trait.trim()])
      ))
    : createElement('div', { className: 'character-card__tags' }, []);

  return createElement('div', {
    className: 'character-card',
    dataset: { characterId: character.id },
    onclick: () => window.location.href = `character.html?id=${character.id}`,
    tabindex: '0',
    role: 'button',
    'aria-label': `Open character: ${character.name}`
  }, [
    createElement('div', { className: 'character-card__header flex gap-md' }, [
      avatarElement,
      createElement('div', { className: 'flex-1' }, [
        nameElement,
        summaryElement
      ])
    ]),
    backstoryElement,
    traitsContainer
  ]);
};

// Pure function for creating compact character card (for sidebar)
export const createCompactCharacterCard = (character) => {
  const summary = formatCharacterSummary(character);
  const initials = createInitials(character.name);

  const avatarElement = createElement('div', {
    className: 'character-card__avatar character-card__avatar--small'
  }, [initials]);

  const nameElement = createElement('h4', {
    className: 'character-card__title'
  }, [character.name]);

  const summaryElement = createElement('div', {
    className: 'character-card__meta'
  }, [summary]);

  return createElement('div', {
    className: 'character-card character-card--compact',
    dataset: { characterId: character.id }
  }, [
    createElement('div', { className: 'flex gap-sm items-center' }, [
      avatarElement,
      createElement('div', { className: 'flex-1' }, [
        nameElement,
        summaryElement
      ])
    ])
  ]);
};

// Pure function for creating empty state cards
export const createEmptyState = (message, actionText = null, actionUrl = null) => {
  const messageElement = createElement('p', {}, [message]);
  
  const children = [messageElement];
  
  if (actionText && actionUrl) {
    const actionElement = createElement('a', {
      href: actionUrl,
      className: 'button'
    }, [actionText]);
    children.push(actionElement);
  }

  return createElement('div', {
    className: 'empty-state'
  }, children);
};

// Pure function for creating stat cards
export const createStatCard = (label, value, description = null) => {
  const labelElement = createElement('div', {
    className: 'stat-label'
  }, [label]);

  const valueElement = createElement('div', {
    className: 'stat-value'
  }, [value.toString()]);

  const children = [labelElement, valueElement];

  if (description) {
    const descElement = createElement('div', {
      className: 'stat-description'
    }, [description]);
    children.push(descElement);
  }

  return createElement('div', {
    className: 'stat-card'
  }, children);
};