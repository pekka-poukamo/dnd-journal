import { getFormData } from '../utils.js';

export const createEntryForm = (options = {}) => {
  const form = document.createElement('form');
  form.id = 'entry-form';
  form.className = 'entry-form';

  form.innerHTML = `
    <div class="form-group">
      <label for="entry-content">Notes</label>
      <textarea id="entry-content" name="content" class="form-textarea" rows="4" placeholder="Write your journal entry here..." required></textarea>
    </div>
    <div class="form-group">
      <button type="submit" class="btn btn-primary">Add Entry</button>
    </div>
  `;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const entryData = { content: data.get('content') };
    if (options.onSubmit) options.onSubmit(entryData);
  });

  return form;
};

