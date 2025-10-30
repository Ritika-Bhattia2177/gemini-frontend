document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('ask-form');
  const promptEl = document.getElementById('prompt');
  const output = document.getElementById('output');
  const submit = document.getElementById('submit');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const prompt = promptEl.value.trim();
    if (!prompt) return;

    output.textContent = 'Loading...';
    submit.disabled = true;

    try {
      const resp = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });

      if (!resp.ok) {
        const e = await resp.json().catch(() => ({ error: 'Unknown error' }));
        output.textContent = 'Error: ' + (e.error || JSON.stringify(e));
      } else {
        const data = await resp.json();
        // Prefer a normalized `answer` if the backend provided one, otherwise show raw `data`.
        if (data && data.answer) {
          output.textContent = data.answer;
        } else if (data && data.data) {
          output.textContent = JSON.stringify(data.data, null, 2);
        } else {
          output.textContent = JSON.stringify(data, null, 2);
        }
      }
    } catch (err) {
      output.textContent = 'Request failed: ' + (err.message || err);
    } finally {
      submit.disabled = false;
    }
  });
});
