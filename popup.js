document.addEventListener('DOMContentLoaded', function() {
  const extractBtn = document.getElementById('extractBtn');
  const summarizeBtn = document.getElementById('summarizeBtn');
  const translateBtn = document.getElementById('translateBtn');
  const languageSelect = document.getElementById('languageSelect');
  const contentDiv = document.getElementById('content');
  const errorDiv = document.getElementById('error');
  
  let extractedText = '';
  
  function showError(message) {
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    contentDiv.style.display = 'none';
  }
  
  function showContent(content) {
    contentDiv.innerHTML = content;
    contentDiv.style.display = 'block';
    errorDiv.style.display = 'none';
  }
  
  function showLoading(message) {
    showContent(`<div class="loading">${message}</div>`);
  }
  
  extractBtn.addEventListener('click', async function() {
    try {
      showLoading('🔍 Extracting content...');
      
      const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
      
      if (!tab) {
        throw new Error('No active tab found');
      }
      
      const results = await chrome.scripting.executeScript({
        target: {tabId: tab.id},
        function: extractPageContent
      });
      
      if (!results || !results[0]) {
        throw new Error('Failed to extract content');
      }
      
      extractedText = results[0].result;
      
      if (!extractedText || extractedText.trim().length === 0) {
        throw new Error('No content found on this page');
      }
      
      const preview = extractedText.length > 300 
        ? extractedText.substring(0, 300) + '...' 
        : extractedText;
        
      showContent(`<strong>✅ Extracted Content (${extractedText.length} chars):</strong><br><br>${preview.replace(/\n/g, '<br>')}`);
      
      // Enable other buttons
      summarizeBtn.disabled = false;
      translateBtn.disabled = false;
      
    } catch (error) {
      console.error('Extract error:', error);
      showError(`❌ Error: ${error.message}`);
    }
  });
  
  summarizeBtn.addEventListener('click', async function() {
    if (!extractedText) {
      showError('Please extract content first');
      return;
    }
    
    try {
      showLoading('🤖 Creating summary...');
      
      const response = await chrome.runtime.sendMessage({
        action: 'summarize',
        text: extractedText
      });
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      showContent(`<strong>📝 Summary:</strong><br><br>${response.summary}`);
      
    } catch (error) {
      console.error('Summarize error:', error);
      showError(`❌ Summarization failed: ${error.message}`);
    }
  });
  
  translateBtn.addEventListener('click', async function() {
    const targetLang = languageSelect.value;
    
    if (!extractedText) {
      showError('Please extract content first');
      return;
    }
    
    if (!targetLang) {
      showError('Please select a target language');
      return;
    }
    
    try {
      showLoading('🔄 Translating...');
      
      const response = await chrome.runtime.sendMessage({
        action: 'translate',
        text: extractedText,
        targetLang: targetLang
      });
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      const langName = languageSelect.options[languageSelect.selectedIndex].text;
      showContent(`<strong>🌍 Translation to ${langName}:</strong><br><br>${response.translation}`);
      
    } catch (error) {
      console.error('Translate error:', error);
      showError(`❌ Translation failed: ${error.message}`);
    }
  });
  
  // Initially disable summary and translate buttons
  summarizeBtn.disabled = true;
  translateBtn.disabled = true;
});

// Function to be injected into the page
function extractPageContent() {
  try {
    // Remove unwanted elements
    const unwantedSelectors = [
      'script', 'style', 'nav', 'header', 'footer', 
      'aside', '.advertisement', '.ads', '.menu',
      '.sidebar', '.popup', '.modal', '.cookie-banner'
    ];
    
    // Create a copy of the document to work with
    const clone = document.cloneNode(true);
    
    // Remove unwanted elements from clone
    unwantedSelectors.forEach(selector => {
      const elements = clone.querySelectorAll(selector);
      elements.forEach(el => el.remove());
    });
    
    // Try to find main content areas in order of preference
    const contentSelectors = [
      'main',
      'article', 
      '[role="main"]',
      '.main-content',
      '.content',
      '.post-content',
      '.entry-content',
      '.article-body',
      '.story-body',
      '.post-body',
      '#content',
      '#main',
      'body'
    ];
    
    let content = '';
    
    for (const selector of contentSelectors) {
      const element = clone.querySelector(selector);
      if (element) {
        const text = element.innerText || element.textContent || '';
        if (text.trim().length > 200) {
          content = text;
          break;
        }
      }
    }
    
    // Fallback to body if nothing else works
    if (!content) {
      content = document.body.innerText || document.body.textContent || '';
    }
    
    // Clean up the text
    content = content
      .replace(/\s+/g, ' ')           // Replace multiple spaces with single space
      .replace(/\n\s*\n/g, '\n')      // Replace multiple newlines with single newline
      .replace(/[\r\n]+/g, '\n')      // Normalize line endings
      .trim();
    
    // Limit content length but try to end at sentence boundary
    if (content.length > 5000) {
      const truncated = content.substring(0, 5000);
      const lastSentence = truncated.lastIndexOf('.');
      if (lastSentence > 3000) {
        content = truncated.substring(0, lastSentence + 1);
      } else {
        content = truncated + '...';
      }
    }
    
    return content;
    
  } catch (error) {
    throw new Error(`Content extraction failed: ${error.message}`);
  }
}
