// Version Display - Pure Functional Module (ADR-0002 Compliant)
// Displays deployment version information in UI

import { VERSION_INFO } from './version.js';

// Pure function to format version string
export const formatVersionDisplay = (versionInfo) => {
  if (versionInfo.commit === 'dev') {
    return 'Development';
  }
  
  return `v${versionInfo.runNumber} (${versionInfo.shortCommit})`;
};

// Pure function to create version element
export const createVersionElement = () => {
  const versionText = formatVersionDisplay(VERSION_INFO);
  
  const element = document.createElement('div');
  element.className = 'version-info';
  element.textContent = versionText;
  element.title = `Deployed: ${VERSION_INFO.timestamp}\nCommit: ${VERSION_INFO.commit}\nBranch: ${VERSION_INFO.ref}`;
  
  return element;
};

// Pure function to append version to target element
export const appendVersionToElement = (targetElement) => {
  if (!targetElement) {
    return false;
  }
  
  const versionElement = createVersionElement();
  targetElement.appendChild(versionElement);
  return true;
};