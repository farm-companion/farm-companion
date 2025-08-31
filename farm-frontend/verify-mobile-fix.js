// Mobile Fix Verification Script
// Run this in mobile browser console to verify fixes are working

console.log('🔍 Mobile Fix Verification Started');

// Test 1: Mobile Detection
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);

console.log('📱 Mobile Detection Test:', {
  isMobile,
  isIOS,
  isSafari,
  userAgent: navigator.userAgent.substring(0, 100) + '...'
});

// Test 2: Content Visibility
const mainContent = document.querySelector('main');
const header = document.querySelector('header');
const body = document.body;

console.log('📄 Content Visibility Test:', {
  mainContent: {
    exists: !!mainContent,
    visible: mainContent ? mainContent.offsetWidth > 0 && mainContent.offsetHeight > 0 : false,
    display: mainContent ? getComputedStyle(mainContent).display : 'N/A',
    visibility: mainContent ? getComputedStyle(mainContent).visibility : 'N/A'
  },
  header: {
    exists: !!header,
    visible: header ? header.offsetWidth > 0 && header.offsetHeight > 0 : false
  },
  body: {
    visible: body.offsetWidth > 0 && body.offsetHeight > 0,
    backgroundColor: getComputedStyle(body).backgroundColor
  }
});

// Test 3: Text Selection (should work on mobile)
const testTextSelection = () => {
  const testElement = document.createElement('div');
  testElement.textContent = 'Test text selection';
  testElement.style.position = 'absolute';
  testElement.style.top = '-1000px';
  testElement.style.left = '-1000px';
  document.body.appendChild(testElement);
  
  const styles = getComputedStyle(testElement);
  const userSelect = styles.userSelect || styles.webkitUserSelect;
  
  document.body.removeChild(testElement);
  
  return userSelect !== 'none';
};

console.log('✏️ Text Selection Test:', {
  textSelectionEnabled: testTextSelection()
});

// Test 4: Touch Interactions
const testTouchInteractions = () => {
  const buttons = document.querySelectorAll('button, a, [role="button"]');
  const touchableElements = Array.from(buttons).filter(btn => {
    const rect = btn.getBoundingClientRect();
    return rect.width >= 44 && rect.height >= 44;
  });
  
  return {
    totalButtons: buttons.length,
    touchableButtons: touchableElements.length,
    touchablePercentage: Math.round((touchableElements.length / buttons.length) * 100)
  };
};

console.log('👆 Touch Interactions Test:', testTouchInteractions());

// Test 5: Content Protection Status
const contentProtectionScripts = document.querySelectorAll('[id*="content-protection"]');
const watermarkElements = document.querySelectorAll('.watermark-container');

console.log('🛡️ Content Protection Status:', {
  protectionScripts: contentProtectionScripts.length,
  watermarkElements: watermarkElements.length,
  watermarkVisible: watermarkElements.length > 0 ? 
    getComputedStyle(watermarkElements[0]).display !== 'none' : false
});

// Test 6: CSS Media Queries
const testMediaQueries = () => {
  const mobileStyles = window.matchMedia('(max-width: 768px)');
  const desktopStyles = window.matchMedia('(min-width: 769px)');
  
  return {
    mobileMatch: mobileStyles.matches,
    desktopMatch: desktopStyles.matches,
    currentWidth: window.innerWidth,
    currentHeight: window.innerHeight
  };
};

console.log('📐 Media Queries Test:', testMediaQueries());

// Test 7: JavaScript Errors
let jsErrors = [];
const originalError = console.error;
console.error = function(...args) {
  jsErrors.push(args.join(' '));
  originalError.apply(console, args);
};

// Test 8: Performance
const performanceTest = () => {
  const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
  const domReady = performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart;
  
  return {
    loadTime: loadTime + 'ms',
    domReady: domReady + 'ms',
    isFast: loadTime < 3000
  };
};

console.log('⚡ Performance Test:', performanceTest());

// Test 9: Accessibility
const accessibilityTest = () => {
  const images = document.querySelectorAll('img');
  const imagesWithAlt = Array.from(images).filter(img => img.alt && img.alt.trim() !== '');
  const buttons = document.querySelectorAll('button');
  const buttonsWithAria = Array.from(buttons).filter(btn => btn.getAttribute('aria-label') || btn.textContent.trim() !== '');
  
  return {
    totalImages: images.length,
    imagesWithAlt: imagesWithAlt.length,
    altTextPercentage: Math.round((imagesWithAlt.length / images.length) * 100),
    totalButtons: buttons.length,
    accessibleButtons: buttonsWithAria.length,
    buttonAccessibilityPercentage: Math.round((buttonsWithAria.length / buttons.length) * 100)
  };
};

console.log('♿ Accessibility Test:', accessibilityTest());

// Final Summary
setTimeout(() => {
  console.log('📊 FINAL VERIFICATION SUMMARY:');
  console.log('✅ Mobile Detection:', isMobile ? 'WORKING' : 'NOT MOBILE');
  console.log('✅ Content Visible:', mainContent && mainContent.offsetWidth > 0 ? 'YES' : 'NO');
  console.log('✅ Text Selection:', testTextSelection() ? 'ENABLED' : 'DISABLED');
  console.log('✅ Touch Targets:', testTouchInteractions().touchablePercentage >= 90 ? 'GOOD' : 'NEEDS IMPROVEMENT');
  console.log('✅ JavaScript Errors:', jsErrors.length === 0 ? 'NONE' : jsErrors.length + ' ERRORS');
  console.log('✅ Performance:', performanceTest().isFast ? 'FAST' : 'SLOW');
  
  if (jsErrors.length > 0) {
    console.log('❌ JavaScript Errors Found:');
    jsErrors.forEach((error, index) => {
      console.log(`  ${index + 1}. ${error}`);
    });
  }
  
  console.log('🎉 Mobile Fix Verification Complete!');
}, 1000);
