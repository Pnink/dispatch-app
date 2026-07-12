const form = document.getElementById('chat-form');
const input = document.getElementById('message-input');
const responseEl = document.getElementById('response');

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const text = input.value;
  if (!text.trim()) return;

  responseEl.className = 'loading';
  responseEl.textContent = 'Thinking...';
  input.disabled = true;

  const result = await window.dispatch.sendMessage(text);

  input.disabled = false;
  input.value = '';
  input.focus();

  if (result.error) {
    responseEl.className = 'error';
    responseEl.textContent = result.error;
  } else {
    responseEl.className = '';
    responseEl.textContent = result.reply;
  }
});
