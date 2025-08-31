// Reusable minimal modal component (vanilla JS)
// Provides a promise-based API for simple choices

export const showChoiceModal = ({ title = 'Choose an option', message = '', options = [] }) => {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';

    const dialog = document.createElement('div');
    dialog.className = 'modal-dialog';

    const header = document.createElement('div');
    header.className = 'modal-header';
    header.textContent = title;

    const body = document.createElement('div');
    body.className = 'modal-body';
    if (typeof message === 'string') {
      body.textContent = message;
    } else if (message instanceof Node) {
      body.appendChild(message);
    }

    const footer = document.createElement('div');
    footer.className = 'modal-footer';

    const cleanup = (result) => {
      try {
        document.removeEventListener('keydown', onKeyDown);
        document.body.removeChild(overlay);
      } catch {}
      resolve(result);
    };

    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        cleanup('cancel');
      }
    };

    // Build buttons from options
    const normalized = Array.isArray(options) && options.length > 0
      ? options
      : [
          { id: 'ok', label: 'OK' }
        ];

    normalized.forEach(opt => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `btn ${opt.type === 'primary' ? 'btn-primary' : 'btn-secondary'}`;
      btn.textContent = opt.label || String(opt.id);
      btn.addEventListener('click', () => cleanup(opt.id));
      footer.appendChild(btn);
    });

    dialog.appendChild(header);
    dialog.appendChild(body);
    dialog.appendChild(footer);
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);
    document.addEventListener('keydown', onKeyDown);
  });
};

