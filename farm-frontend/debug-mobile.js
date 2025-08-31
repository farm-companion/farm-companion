// Mobile Debug Script for Farm Companion
// Run this in browser console to diagnose mobile issues

console.log('🔍 Farm Companion Mobile Debug Started');

// Check if we're on mobile
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);

console.log('📱 Device Info:', {
  userAgent: navigator.userAgent,
  isMobile,
  isIOS,
  isSafari,
  viewport: {
    width: window.innerWidth,
    height: window.innerHeight,
    devicePixelRatio: window.devicePixelRatio
  }
});

// Check for content protection interference
const contentProtectionElements = document.querySelectorAll('[id*="content-protection"]');
console.log('🛡️ Content Protection Elements:', contentProtectionElements.length);

// Check for CSS that might be hiding content
const hiddenElements = document.querySelectorAll('[style*="display: none"], [style*="visibility: hidden"]');
console.log('🙈 Hidden Elements:', hiddenElements.length);

// Check for JavaScript errors
window.addEventListener('error', (e) => {
  console.error('❌ JavaScript Error:', {
    message: e.message,
    filename: e.filename,
    lineno: e.lineno,
    colno: e.colno,
    error: e.error
  });
});

// Check for unhandled promise rejections
window.addEventListener('unhandledrejection', (e) => {
  console.error('❌ Unhandled Promise Rejection:', e.reason);
});

// Test if content protection is blocking interactions
let interactionBlocked = false;
document.addEventListener('contextmenu', (e) => {
  if (e.defaultPrevented) {
    interactionBlocked = true;
    console.warn('⚠️ Right-click blocked by content protection');
  }
}, true);

document.addEventListener('selectstart', (e) => {
  if (e.defaultPrevented) {
    interactionBlocked = true;
    console.warn('⚠️ Text selection blocked by content protection');
  }
}, true);

// Check for viewport issues
const viewportMeta = document.querySelector('meta[name="viewport"]');
console.log('📐 Viewport Meta:', viewportMeta?.content);

// Check for CSS that might affect mobile rendering
const problematicCSS = [
  'user-select: none',
  'pointer-events: none',
  'visibility: hidden',
  'display: none',
  'opacity: 0'
];

problematicCSS.forEach(rule => {
  const elements = document.querySelectorAll(`[style*="${rule}"]`);
  if (elements.length > 0) {
    console.warn(`⚠️ Elements with ${rule}:`, elements.length);
  }
});

// Test if main content is visible
const mainContent = document.querySelector('main');
if (mainContent) {
  const rect = mainContent.getBoundingClientRect();
  const styles = window.getComputedStyle(mainContent);
  console.log('📄 Main Content Status:', {
    visible: rect.width > 0 && rect.height > 0,
    dimensions: { width: rect.width, height: rect.height },
    display: styles.display,
    visibility: styles.visibility,
    opacity: styles.opacity,
    position: styles.position,
    zIndex: styles.zIndex
  });
} else {
  console.error('❌ Main content element not found!');
}

// Check for hydration issues
setTimeout(() => {
  const hydrationMismatch = document.querySelectorAll('[data-hydration-mismatch]');
  if (hydrationMismatch.length > 0) {
    console.error('❌ Hydration mismatch detected:', hydrationMismatch.length);
  }
}, 1000);

// Test mobile-specific features
if (isMobile) {
  // Test touch events
  document.addEventListener('touchstart', (e) => {
    console.log('👆 Touch event detected:', e.touches.length);
  }, { once: true });
  
  // Test if content protection is mobile-friendly
  if (interactionBlocked) {
    console.error('❌ Content protection is blocking mobile interactions!');
  }
}

console.log('✅ Mobile Debug Complete');
