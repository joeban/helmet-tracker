/**
 * Utility to generate test search analytics data for demonstration
 */

export function generateTestSearchData() {
  if (typeof window === 'undefined') return;

  const testSearches = [
    { term: 'best bike helmet', intent: 'buying' },
    { term: 'safest helmet virginia tech', intent: 'safety_research' },
    { term: 'giro helmet', intent: 'brand_specific' },
    { term: 'mountain bike helmet', intent: 'browsing' },
    { term: 'road bike helmet MIPS', intent: 'buying' },
    { term: 'specialized helmet', intent: 'brand_specific' },
    { term: 'poc helmet review', intent: 'buying' },
    { term: 'helmet safety ratings', intent: 'safety_research' },
    { term: 'bell helmet', intent: 'brand_specific' },
    { term: 'kask helmet price', intent: 'buying' },
    { term: 'scott helmet', intent: 'browsing' },
    { term: 'helmet crash test', intent: 'safety_research' },
    { term: 'cheap bike helmet', intent: 'buying' },
    { term: 'commuter helmet', intent: 'browsing' },
    { term: 'aero helmet', intent: 'browsing' }
  ];

  const sessionId = `test_session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Create a test session
  const session = {
    sessionId,
    startTime: Date.now() - (Math.random() * 3600000), // Within last hour
    events: [] as any[],
    userAgent: navigator.userAgent,
    referrer: document.referrer
  };

  // Generate search events
  testSearches.forEach((search, index) => {
    const timestamp = session.startTime + (index * 30000) + (Math.random() * 25000);
    const event = {
      type: 'search',
      timestamp,
      data: {
        search_term: search.term,
        result_count: Math.floor(Math.random() * 50) + 10,
        intent: {
          category: search.intent,
          urgency: Math.random() > 0.7 ? 'high' : 'low',
          specificity: search.term.split(' ').length > 2 ? 'specific' : 'general'
        },
        filters: Math.random() > 0.5 ? {
          category: ['road', 'mountain', 'urban'][Math.floor(Math.random() * 3)]
        } : {}
      }
    };
    session.events.push(event);
  });

  // Store the test session
  sessionStorage.setItem('helmet_conversion_session', JSON.stringify(session));

  // Generate some attribution data
  const attributions = [];
  for (let i = 0; i < 5; i++) {
    attributions.push({
      sessionId: `test_session_${Date.now() - (i * 600000)}_${Math.random().toString(36).substr(2, 9)}`,
      helmetId: `helmet_${Math.floor(Math.random() * 100)}`,
      affiliateNetwork: ['amazon', 'competitivecyclist', 'backcountry'][Math.floor(Math.random() * 3)],
      clickTimestamp: Date.now() - (Math.random() * 86400000), // Within last day
      conversionValue: Math.floor(Math.random() * 50) + 10
    });
  }

  localStorage.setItem('helmet_attributions', JSON.stringify(attributions));

  console.log('✅ Test search analytics data generated');
  console.log(`📊 Created ${session.events.length} search events and ${attributions.length} conversion attributions`);
}

// Function to clear test data
export function clearTestSearchData() {
  if (typeof window === 'undefined') return;

  // Clear session data
  sessionStorage.removeItem('helmet_conversion_session');

  // Clear attribution data
  localStorage.removeItem('helmet_attributions');

  // Clear funnel data
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith('conversion_funnel_')) {
      localStorage.removeItem(key);
    }
  }

  console.log('🧹 Test search analytics data cleared');
}