// Chatbot script - handles chat interface
const chatForm = document.getElementById('chat-form');
const promptInput = document.getElementById('prompt');
const submitBtn = document.getElementById('submit');
const chatMessages = document.getElementById('chat-messages');

// Auto-resize textarea
promptInput.addEventListener('input', function() {
  this.style.height = 'auto';
  this.style.height = Math.min(this.scrollHeight, 120) + 'px';
});

// Handle Enter key (Shift+Enter for new line)
promptInput.addEventListener('keydown', function(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    chatForm.dispatchEvent(new Event('submit'));
  }
});

// Add message to chat
function addMessage(text, isUser = false) {
  const messageDiv = document.createElement('div');
  messageDiv.className = 'flex gap-3 animate-fade-in';
  
  if (isUser) {
    messageDiv.innerHTML = `
      <div class="flex-1 flex justify-end">
        <div class="bg-accent/20 border border-accent/40 rounded-lg p-4 max-w-[80%]">
          <p class="text-slate-100">${escapeHtml(text)}</p>
        </div>
      </div>
      <div class="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      </div>
    `;
  } else {
    messageDiv.innerHTML = `
      <div class="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center flex-shrink-0">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      </div>
      <div class="flex-1 bg-slate-800/60 rounded-lg p-4 max-w-[80%]">
        <div class="text-slate-200 prose prose-invert prose-sm max-w-none">${formatResponse(text)}</div>
      </div>
    `;
  }
  
  chatMessages.appendChild(messageDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Add loading indicator
function addLoadingIndicator() {
  const loadingDiv = document.createElement('div');
  loadingDiv.id = 'loading-indicator';
  loadingDiv.className = 'flex gap-3 animate-fade-in';
  loadingDiv.innerHTML = `
    <div class="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center flex-shrink-0">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    </div>
    <div class="flex-1 bg-slate-800/60 rounded-lg p-4">
      <div class="flex gap-1">
        <div class="w-2 h-2 rounded-full bg-accent animate-bounce" style="animation-delay: 0ms"></div>
        <div class="w-2 h-2 rounded-full bg-accent animate-bounce" style="animation-delay: 150ms"></div>
        <div class="w-2 h-2 rounded-full bg-accent animate-bounce" style="animation-delay: 300ms"></div>
      </div>
    </div>
  `;
  chatMessages.appendChild(loadingDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function removeLoadingIndicator() {
  const loading = document.getElementById('loading-indicator');
  if (loading) loading.remove();
}

// Format response text
function formatResponse(text) {
  // Convert markdown-style code blocks
  text = text.replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre class="bg-slate-900 p-3 rounded mt-2 overflow-x-auto"><code>$2</code></pre>');
  
  // Convert inline code
  text = text.replace(/`([^`]+)`/g, '<code class="bg-slate-900 px-1 py-0.5 rounded text-sm">$1</code>');
  
  // Convert line breaks
  text = text.replace(/\n\n/g, '</p><p class="mt-2">');
  text = text.replace(/\n/g, '<br>');
  
  return '<p>' + text + '</p>';
}

// Escape HTML
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Handle form submission
chatForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const prompt = promptInput.value.trim();
  if (!prompt) return;
  
  // Add user message
  addMessage(prompt, true);
  
  // Clear input and reset height
  promptInput.value = '';
  promptInput.style.height = 'auto';
  
  // Disable submit button
  submitBtn.disabled = true;
  submitBtn.innerHTML = `
    <svg class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  `;
  
  // Add loading indicator
  addLoadingIndicator();
  
  try {
    const response = await fetch('/api/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt })
    });
    
    const data = await response.json();
    
    removeLoadingIndicator();
    
    if (data.ok && data.answer) {
      addMessage(data.answer, false);
    } else if (data.error) {
      addMessage(`❌ Error: ${data.error}`, false);
    } else {
      addMessage('❌ Unexpected response format', false);
    }
  } catch (err) {
    removeLoadingIndicator();
    addMessage(`❌ Network error: ${err.message}`, false);
  } finally {
    // Re-enable submit button
    submitBtn.disabled = false;
    submitBtn.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
      </svg>
      Send
    `;
    promptInput.focus();
  }
});
