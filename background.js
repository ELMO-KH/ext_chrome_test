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
  try {
    // Simple extractive summarization algorithm
    if (!text || text.trim().length === 0) {
      throw new Error('No text to summarize');
    }
    
    // Split into sentences
    const sentences = text
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 20 && s.length < 200);
    
    if (sentences.length === 0) {
      return 'Unable to create summary - no suitable sentences found.';
    }
    
    // Score sentences based on word frequency and position
    const words = text.toLowerCase().match(/\b\w+\b/g) || [];
    const wordFreq = {};
    
    words.forEach(word => {
      if (word.length > 3) {
        wordFreq[word] = (wordFreq[word] || 0) + 1;
      }
    });
    
    const sentenceScores = sentences.map((sentence, index) => {
      const sentenceWords = sentence.toLowerCase().match(/\b\w+\b/g) || [];
      let score = 0;
      
      sentenceWords.forEach(word => {
        if (wordFreq[word]) {
          score += wordFreq[word];
        }
      });
      
      // Boost score for sentences at the beginning
      if (index < 3) score *= 1.5;
      
      return { sentence, score, index };
    });
    
    // Get top 3-5 sentences
    const numSentences = Math.min(Math.max(3, Math.floor(sentences.length * 0.3)), 5);
    const topSentences = sentenceScores
      .sort((a, b) => b.score - a.score)
      .slice(0, numSentences)
      .sort((a, b) => a.index - b.index)
      .map(item => item.sentence);
    
    const summary = topSentences.join('. ') + '.';
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 800));
    
    return summary;
    
  } catch (error) {
    throw new Error(`Summarization failed: ${error.message}`);
  }
}

async function translateText(text, targetLang) {
  try {
    if (!text || text.trim().length === 0) {
      throw new Error('No text to translate');
    }
    
    if (!targetLang) {
      throw new Error('Target language not specified');
    }
    
    // For demo purposes - enhanced mock translations
    const mockTranslations = {
      'es': 'Este contenido ha sido traducido al español. La traducción completa incluiría todo el texto extraído de la página web, manteniendo el significado y contexto original.',
      'fr': 'Ce contenu a été traduit en français. La traduction complète inclurait tout le texte extrait de la page web, en préservant le sens et le contexte original.',
      'de': 'Dieser Inhalt wurde ins Deutsche übersetzt. Die vollständige Übersetzung würde den gesamten von der Webseite extrahierten Text umfassen und dabei die ursprüngliche Bedeutung und den Kontext bewahren.',
      'it': 'Questo contenuto è stato tradotto in italiano. La traduzione completa includerebbe tutto il testo estratto dalla pagina web, preservando il significato e il contesto originale.',
      'pt': 'Este conteúdo foi traduzido para português. A tradução completa incluiria todo o texto extraído da página web, preservando o significado e contexto original.',
      'zh': '此内容已翻译成中文。完整的翻译将包括从网页中提取的所有文本，保持原始的含义和上下文。',
      'ja': 'このコンテンツは日本語に翻訳されました。完全な翻訳には、ウェブページから抽出されたすべてのテキストが含まれ、元の意味と文脈が保持されます。',
      'ko': '이 콘텐츠는 한국어로 번역되었습니다. 완전한 번역에는 웹페이지에서 추출된 모든 텍스트가 포함되며 원래의 의미와 맥락이 보존됩니다.',
      'ar': 'تم ترجمة هذا المحتوى إلى العربية. ستتضمن الترجمة الكاملة جميع النصوص المستخرجة من صفحة الويب مع الحفاظ على المعنى والسياق الأصلي.',
      'ru': 'Этот контент был переведен на русский язык. Полный перевод будет включать весь текст, извлеченный с веб-страницы, сохраняя первоначальный смысл и контекст.'
    };
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    if (!mockTranslations[targetLang]) {
      throw new Error(`Translation not available for language: ${targetLang}`);
    }
    
    return mockTranslations[targetLang];
    
    /* 
    // For production with Google Translate API:
    const API_KEY = 'your-google-translate-api-key';
    const url = `https://translation.googleapis.com/language/translate/v2?key=${API_KEY}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: text.substring(0, 2000), // Limit for API
        target: targetLang,
        source: 'auto',
        format: 'text'
      })
    });
    
    if (!response.ok) {
      throw new Error(`Translation API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data.translations[0].translatedText;
    */
    
  } catch (error) {
    throw new Error(`Translation failed: ${error.message}`);
  }
}
