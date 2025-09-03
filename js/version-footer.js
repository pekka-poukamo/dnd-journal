// Version Footer Helper - renders version info in the footer

export const renderVersionFooter = () => {
  try {
    const footerContent = document.querySelector('.footer-content');
    if (!footerContent) return;

    return import('./version.js').then((versionModule) => {
      const versionInfo = versionModule.VERSION_INFO;
      const versionText = versionInfo.commit === 'dev'
        ? 'Development'
        : `v${versionInfo.runNumber} (${versionInfo.shortCommit})`;
      const versionElement = document.createElement('div');
      versionElement.className = 'version-info';
      versionElement.textContent = versionText;
      versionElement.title = `Deployed: ${versionInfo.timestamp}\nCommit: ${versionInfo.commit}\nBranch: ${versionInfo.ref}`;
      footerContent.appendChild(versionElement);
    }).catch(() => {});
  } catch {}
};

