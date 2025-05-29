// Background service worker for handling API calls
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'summarize') {
    summarizeText(request.text)
      .then(summary => sendResponse({summary}))
      .catch(error => sendResponse({error: error.message}));
    return true; // Keep message channel open
  }
  
  if (request.action === 'translate') {
    translateText(request.text, request.targetLang)
      .then(translation => sendResponse({translation}))
      .catch(error => sendResponse({error: error.message}));
    return true; // Keep message channel open
  }
});

async function summarizeText(text) {
  // Using a simple extractive summarization
  // For production, you'd want to use OpenAI API or similar
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
  const summary = sentences.slice(0, 3).join('. ') + '.';
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return summary || 'Unable to generate summary';
}

async function translateText(text, targetLang) {
  try {
    // Using Google Translate API (you'll need to add your API key)
    // For demo purposes, this is a mock implementation
    
    // Mock translation - in production, use Google Translate API
    const mockTranslations = {
      'es': 'Este es un texto traducido al español.',
      'fr': 'Ceci est un texte traduit en français.',
      'de': 'Dies ist ein ins Deutsche übersetzter Text.',
      'it': 'Questo è un testo tradotto in italiano.',
      'pt': 'Este é um texto traduzido para português.',
      'zh': '这是翻译成中文的文本。',
      'ja': 'これは日本語に翻訳されたテキストです。',
      'ko': '이것은 한국어로 번역된 텍스트입니다.'
    };
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    return mockTranslations[targetLang] || 'Translation not available for this language';
    
    // Uncomment and modify this for real Google Translate API:
    /*
    const response = await fetch(`https://translation.googleapis.com/language/translate/v2?key=YOUR_API_KEY`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: text.substring(0, 1000), // Limit text length
        target: targetLang,
        format: 'text'
      })
    });
    
    const data = await response.json();
    return data.data.translations[0].translatedText;
    */
  } catch (error) {
    console.error('Translation error:', error);
    return 'Translation failed';
  }
}
