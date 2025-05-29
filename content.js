// Content script to interact with web pages
console.log('Web Reader & Translator content script loaded');

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'extractContent') {
    const content = extractPageContent();
    sendResponse({content: content});
  }
});

function extractPageContent() {
  // Remove script and style elements
  const elementsToRemove = document.querySelectorAll('script, style, nav, header, footer, aside');
  const tempDoc = document.cloneNode(true);
  tempDoc.querySelectorAll('script, style, nav, header, footer, aside').forEach(el => el.remove());
  
  // Get main content
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
    const element = tempDoc.querySelector(selector);
    if (element && element.innerText.length > 100) {
      content = element.innerText;
      break;
    }
  }
  
  // Fallback to body if no content found
  if (!content) {
    content = tempDoc.body ? tempDoc.body.innerText : document.body.innerText;
  }
  
  // Clean and limit content
  return content
    .replace(/\s+/g, ' ')
    .replace(/\n+/g, '\n')
    .trim()
    .substring(0, 5000);
}
