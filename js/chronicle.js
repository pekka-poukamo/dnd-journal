// Chronicle Page Scaffold - renders placeholders for So Far and Parts list
import { initYjs, getYjsState } from './yjs.js';

const renderPlaceholders = () => {
  const soFar = document.getElementById('so-far-content');
  const partsList = document.getElementById('parts-list');
  if (soFar) soFar.textContent = 'No summary yet.';
  if (partsList) partsList.textContent = 'No parts yet.';
};

const init = async () => {
  await initYjs();
  renderPlaceholders();
};

init();

