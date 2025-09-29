// Manual ASIN Addition Helper
// Run this in browser console on your site to add ASINs manually

function addASINToHelmet(helmetId, asin, title = '', price = '', confidence = 0.95) {
  // Get the ASIN manager
  const manager = window.ASINDiscoveryManager || (() => {
    console.error('ASIN Manager not available. Make sure you\'re on a page with the ASIN system loaded.');
    return null;
  })();

  if (!manager) return;

  // Create ASIN candidate
  const candidate = {
    asin: asin,
    title: title,
    price: price,
    confidence: confidence,
    url: `https://amazon.com/dp/${asin}`,
    imageUrl: '',
    source: 'manual',
    timestamp: Date.now(),
    verified: true,
    lastChecked: new Date().toISOString()
  };

  // Add to manager
  try {
    manager.getInstance().addASINCandidate(helmetId, candidate);
    console.log(`✅ Successfully added ASIN ${asin} to helmet ${helmetId}`);
    console.log(`📋 Candidate:`, candidate);
  } catch (error) {
    console.error('❌ Failed to add ASIN:', error);
  }
}

// Example usage:
console.log('🔧 Manual ASIN Helper Loaded');
console.log('📝 Usage: addASINToHelmet(helmetId, asin, title, price, confidence)');
console.log('📝 Example: addASINToHelmet(8, "B0BHXS8VG9", "Giro Aries Spherical Adult Helmet", "$250", 0.95)');

// Known ASINs to add:
const knownASINs = [
  {
    helmetId: 8, // Giro Aries Spherical (you'll need to find the correct ID)
    asin: 'B0BHXS8VG9',
    title: 'Giro Aries Spherical Adult Helmet',
    price: '$250',
    confidence: 0.95
  }
  // Add more as you find them
];

// Function to add all known ASINs
function addAllKnownASINs() {
  console.log('🚀 Adding all known ASINs...');
  knownASINs.forEach(item => {
    addASINToHelmet(item.helmetId, item.asin, item.title, item.price, item.confidence);
  });
  console.log('✅ Finished adding known ASINs');
}

// Export functions to global scope for console use
window.addASINToHelmet = addASINToHelmet;
window.addAllKnownASINs = addAllKnownASINs;