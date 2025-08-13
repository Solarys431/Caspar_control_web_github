/**
 * TEST SCRIPT per verificare che le utility gestiscano correttamente 
 * il dual format (string vs object) di media/template
 */

import {
  getMediaDisplayName,
  getMediaValue,
  getMediaFileName,
  getMediaBaseName,
  getMediaKey,
  isObjectFormat,
  normalizeMediaArray,
  filterMediaBySearch,
  getFileType,
  getTemplateType
} from './mediaUtils';

// Test data - formato legacy (stringhe)
const legacyMedia = [
  'assets/video/intro.mp4',
  'graphics/lower_third.html',
  'templates/ticker.html',
  'media/logo.png'
];

// Test data - formato nuovo (oggetti)
const newFormatMedia = [
  {
    name: 'intro.mp4',
    path: 'assets/video/intro.mp4',
    httpUrl: 'http://server/assets/video/intro.mp4',
    source: 'assets'
  },
  {
    name: 'lower_third.html',
    path: 'graphics/lower_third.html',
    httpUrl: 'http://server/graphics/lower_third.html',
    source: 'templates'
  },
  {
    filename: 'ticker.html',
    path: 'templates/ticker.html'
  },
  {
    name: 'logo.png',
    path: 'media/logo.png'
  }
];

// Test data - formato misto
const mixedFormatMedia = [
  'assets/video/intro.mp4',
  {
    name: 'lower_third.html',
    path: 'graphics/lower_third.html'
  },
  'templates/ticker.html',
  {
    name: 'logo.png',
    path: 'media/logo.png'
  }
];

/**
 * Esegue tutti i test
 */
export const runMediaUtilsTests = () => {
  console.log('🧪 STARTING MEDIA UTILS TESTS...\n');

  // Test 1: Legacy format
  console.log('📁 TEST 1: Legacy Format (Strings)');
  testMediaArray(legacyMedia, 'Legacy');

  // Test 2: New format
  console.log('\n📁 TEST 2: New Format (Objects)');
  testMediaArray(newFormatMedia, 'New');

  // Test 3: Mixed format
  console.log('\n📁 TEST 3: Mixed Format');
  testMediaArray(mixedFormatMedia, 'Mixed');

  // Test 4: Edge cases
  console.log('\n📁 TEST 4: Edge Cases');
  testEdgeCases();

  // Test 5: Filter functionality
  console.log('\n📁 TEST 5: Filter Functionality');
  testFilterFunctionality();

  console.log('\n✅ ALL TESTS COMPLETED');
};

/**
 * Testa un array di media
 */
const testMediaArray = (mediaArray, formatName) => {
  console.log(`\n  Testing ${formatName} format with ${mediaArray.length} items:`);
  
  mediaArray.forEach((media, index) => {
    const displayName = getMediaDisplayName(media);
    const value = getMediaValue(media);
    const fileName = getMediaFileName(media);
    const baseName = getMediaBaseName(media);
    const key = getMediaKey(media, index);
    const isObject = isObjectFormat(media);
    const fileType = getFileType(media);
    const templateType = getTemplateType(media);

    console.log(`    [${index}] Original:`, media);
    console.log(`         Display: "${displayName}"`);
    console.log(`         Value: "${value}"`);
    console.log(`         FileName: "${fileName}"`);
    console.log(`         BaseName: "${baseName}"`);
    console.log(`         Key: "${key}"`);
    console.log(`         IsObject: ${isObject}`);
    console.log(`         FileType: "${fileType}"`);
    console.log(`         TemplateType: "${templateType}"`);
    console.log('');
  });

  // Test normalized array
  const normalized = normalizeMediaArray(mediaArray);
  console.log(`  Normalized array has ${normalized.length} items`);
  
  // Verify React key uniqueness
  const keys = normalized.map(item => item.key);
  const uniqueKeys = new Set(keys);
  console.log(`  React keys unique: ${keys.length === uniqueKeys.size ? '✅' : '❌'}`);
};

/**
 * Testa casi limite
 */
const testEdgeCases = () => {
  const edgeCases = [
    null,
    undefined,
    '',
    {},
    { name: '' },
    { path: null },
    { filename: undefined },
    'file_without_extension',
    { name: 'file.with.multiple.dots.mp4' }
  ];

  console.log('\n  Testing edge cases:');
  
  edgeCases.forEach((testCase, index) => {
    try {
      const displayName = getMediaDisplayName(testCase);
      const value = getMediaValue(testCase);
      const fileName = getMediaFileName(testCase);
      const key = getMediaKey(testCase, index);
      
      console.log(`    [${index}] Input: ${JSON.stringify(testCase)}`);
      console.log(`         Display: "${displayName}"`);
      console.log(`         Value: "${value}"`);
      console.log(`         FileName: "${fileName}"`);
      console.log(`         Key: "${key}"`);
      console.log('         ✅ No errors');
    } catch (error) {
      console.log(`    [${index}] ❌ Error: ${error.message}`);
    }
    console.log('');
  });
};

/**
 * Testa la funzionalità di filtro
 */
const testFilterFunctionality = () => {
  const testArray = [
    'video/intro.mp4',
    { name: 'lower_third.html', path: 'templates/lower_third.html' },
    'graphics/ticker.html',
    { name: 'logo.png', path: 'assets/logo.png' }
  ];

  console.log('\n  Original array:', testArray.length, 'items');
  
  // Test search filters
  const searchTests = ['intro', 'html', 'lower', 'LOGO', 'xxx'];
  
  searchTests.forEach(term => {
    const filtered = filterMediaBySearch(testArray, term);
    console.log(`    Search "${term}": ${filtered.length} results`);
  });

  // Test empty search
  const emptySearch = filterMediaBySearch(testArray, '');
  console.log(`    Empty search: ${emptySearch.length} results (should equal original)`);
  
  // Test file type detection
  console.log('\n  File type detection:');
  testArray.forEach(media => {
    const displayName = getMediaDisplayName(media);
    const fileType = getFileType(media);
    console.log(`    "${displayName}" -> type: ${fileType}`);
  });

  // Test template type detection
  console.log('\n  Template type detection:');
  const templateTests = [
    'ticker.html',
    'lower_third.html',
    'logo_graphic.html',
    'text_overlay.html',
    { name: 'generic_template.html' }
  ];
  
  templateTests.forEach(template => {
    const displayName = getMediaDisplayName(template);
    const templateType = getTemplateType(template);
    console.log(`    "${displayName}" -> template type: ${templateType}`);
  });
};

// Per test manuali nella console del browser
if (typeof window !== 'undefined') {
  window.testMediaUtils = runMediaUtilsTests;
  console.log('💡 Use window.testMediaUtils() to run tests in browser console');
}