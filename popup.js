document.addEventListener('DOMContentLoaded', function() {
  const extractBtn = document.getElementById('extractBtn');
  const summarizeBtn = document.getElementById('summarizeBtn');
  const translateBtn = document.getElementById('translateBtn');
  const languageSelect = document.getElementById('languageSelect');
  const contentDiv = document.getElementById('content');
  
  let extractedText = '';
  
  extractBtn.addEventListener('click', async function() {
    contentDiv.innerHTML = '<div class="loading">Extracting content...</div>';
    
    try {
      const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
      const results = await chrome.scripting.executeScript({
        target: {tabId: tab.id},
        function: extractPageContent
      });
      
      extractedText = results[0].result;
      contentDiv.innerHTML = `<strong>Extracted Content:</strong><br>${extractedText.substring(0, 500)}...`;
    } catch (error) {
      contentDiv.innerHTML = 'Error extracting content';
      console.error(error);
    }
  });
  
  summarizeBtn.addEventListener('click', async function() {
    if (!extractedText) {
      contentDiv.innerHTML = 'Please extract content first';
      return;
    }
    
    contentDiv.innerHTML = '<div class="loading">Summarizing...</div>';
    
    try {
      const response = await chrome.runtime.sendMessage({
        action: 'summarize',
        text: extractedText
      });
      
      contentDiv.innerHTML = `<strong>Summary:</strong><br>${response.summary}`;
    } catch (error) {
      contentDiv.innerHTML = 'Error summarizing content';
      console.error(error);
    }
  });
  
  translateBtn.addEventListener('click', async function() {
    if (!extractedText) {
      contentDiv.innerHTML = 'Please extract content first';
      return;
    }
    
    const targetLang = languageSelect.value;
    contentDiv.innerHTML = '<div class="loading">Translating...</div>';
    
    try {
      const response = await chrome.runtime.sendMessage({
        action: 'translate',
        text: extractedText,
        targetLang: targetLang
      });
      
      contentDiv.innerHTML = `<strong>Translation:</strong><br>${response.translation}`;
    } catch (error) {
      contentDiv.innerHTML = 'Error translating content';
      console.error(error);
    }
  });
});

function extractPageContent() {
  // Remove script and style elements
  const scripts = document.querySelectorAll('script, style');
  scripts.forEach(el => el.remove());
  
  // Get main content areas
  const contentSelectors = [
    'main',
    'article',
    '[role="main"]',
    '.content',
    '.post',
    '.entry',
    'body'
  ];
  
  let content = '';
  
  for (const selector of contentSelectors) {
    const element = document.querySelector(selector);
    if (element) {
      content = element.innerText || element.textContent;
      break;
    }
  }
  
  // Clean up the text
  return content
    .replace(/\s+/g, ' ')
    .replace(/\n+/g, '\n')
    .trim()
    .substring(0, 5000); // Limit length
}
