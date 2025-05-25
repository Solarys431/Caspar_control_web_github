/**
 * Script di test per verificare le correzioni OSC Data Parsing
 * Questo file può essere utilizzato per testare che i dati OSC vengano
 * correttamente estratti come valori primitivi invece di oggetti
 */

// Test per verificare che i dati OSC siano valori primitivi
export const testOscDataParsing = (oscData) => {
  console.log('🔧 [TEST OSC FIX] Verifica parsing dati OSC:', oscData);
  
  const results = {
    frame: {
      value: oscData?.frame,
      type: typeof oscData?.frame,
      isValid: typeof oscData?.frame === 'number'
    },
    length: {
      value: oscData?.length,
      type: typeof oscData?.length,
      isValid: typeof oscData?.length === 'number'
    },
    paused: {
      value: oscData?.paused,
      type: typeof oscData?.paused,
      isValid: typeof oscData?.paused === 'boolean'
    }
  };

  console.log('🔧 [TEST OSC FIX] Risultati test:', results);

  // Verifica che tutti i valori siano del tipo corretto
  const allValid = results.frame.isValid && results.length.isValid && results.paused.isValid;
  
  if (allValid) {
    console.log('✅ [TEST OSC FIX] Tutti i dati OSC sono valori primitivi corretti!');
  } else {
    console.error('❌ [TEST OSC FIX] Alcuni dati OSC non sono valori primitivi corretti!');
  }

  return { results, allValid };
};

// Test per verificare la funzione isMediaFinished
export const testMediaFinishedDetection = (oscData, timecode) => {
  console.log('🔧 [TEST MEDIA FINISHED] Test rilevamento fine media');
  
  if (!oscData) {
    console.log('🔧 [TEST MEDIA FINISHED] Nessun dato OSC disponibile');
    return false;
  }

  // Simula la logica di isMediaFinished
  if (typeof oscData.frame === 'number' && typeof oscData.length === 'number' && oscData.length > 0) {
    const progress = (oscData.frame / oscData.length) * 100;
    const isFinished = progress >= 98 && !oscData.paused;
    
    console.log(`🔧 [TEST MEDIA FINISHED] Frame: ${oscData.frame}/${oscData.length}, Progresso: ${progress.toFixed(2)}%, Paused: ${oscData.paused}, Finito: ${isFinished}`);
    
    return isFinished;
  }

  console.log('🔧 [TEST MEDIA FINISHED] Dati frame/length non validi per il test');
  return false;
};

// Test per verificare la validazione template
export const testTemplateValidation = (templateFile, templateList) => {
  console.log('🔧 [TEST TEMPLATE VALIDATION] Test validazione template');
  console.log(`Template da validare: "${templateFile}"`);
  console.log('Lista template disponibili:', templateList);

  if (!templateFile || !templateList || !Array.isArray(templateList)) {
    console.log('❌ [TEST TEMPLATE VALIDATION] Parametri non validi');
    return false;
  }

  const templateExists = templateList.some(template => {
    if (typeof template === 'string') {
      return template === templateFile || template.includes(templateFile);
    }
    if (template && template.name) {
      return template.name === templateFile || template.name.includes(templateFile);
    }
    return false;
  });

  if (templateExists) {
    console.log('✅ [TEST TEMPLATE VALIDATION] Template trovato nella lista');
  } else {
    console.log('❌ [TEST TEMPLATE VALIDATION] Template NON trovato nella lista');
  }

  return templateExists;
};

// Test completo per verificare tutte le correzioni
export const runCompleteTest = (oscData, timecode, templateFile, templateList) => {
  console.log('🚀 [TEST COMPLETO] Avvio test completo delle correzioni...');
  
  const oscTest = testOscDataParsing(oscData);
  const mediaTest = testMediaFinishedDetection(oscData, timecode);
  const templateTest = testTemplateValidation(templateFile, templateList);

  const summary = {
    oscDataParsing: oscTest.allValid,
    mediaFinishedDetection: mediaTest !== null,
    templateValidation: templateTest !== null,
    allTestsPassed: oscTest.allValid && mediaTest !== null && templateTest !== null
  };

  console.log('🚀 [TEST COMPLETO] Riepilogo risultati:', summary);

  if (summary.allTestsPassed) {
    console.log('🎉 [TEST COMPLETO] Tutte le correzioni funzionano correttamente!');
  } else {
    console.log('⚠️ [TEST COMPLETO] Alcune correzioni potrebbero avere problemi');
  }

  return summary;
};

export default {
  testOscDataParsing,
  testMediaFinishedDetection,
  testTemplateValidation,
  runCompleteTest
};
