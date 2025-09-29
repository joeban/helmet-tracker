#!/usr/bin/env node

/**
 * PA-API Rate Limit Monitor
 * Tracks API usage and provides recommendations
 */

const fs = require('fs').promises;
const path = require('path');

// File paths
const PROGRESS_FILE = path.join(__dirname, '../data/asin-discovery-progress.json');
const ENRICHMENT_FILE = path.join(__dirname, '../data/enrichment-progress.json');
const USAGE_LOG_FILE = path.join(__dirname, '../data/api-usage-log.json');

async function loadJSON(filepath) {
  try {
    const data = await fs.readFile(filepath, 'utf-8');
    return JSON.parse(data);
  } catch {
    return null;
  }
}

async function getUsageStats() {
  // Load all tracking files
  const [discovery, enrichment, usageLog] = await Promise.all([
    loadJSON(PROGRESS_FILE),
    loadJSON(ENRICHMENT_FILE),
    loadJSON(USAGE_LOG_FILE)
  ]);

  // Calculate current date in PST
  const now = new Date();
  const pstOffset = -8;
  const utcHours = now.getUTCHours();
  const pstHours = (utcHours + pstOffset + 24) % 24;
  const hoursUntilMidnightPST = (24 - pstHours) % 24 || 24;

  // Count today's API calls
  const todayPST = new Date(now.getTime() - (pstOffset * 60 * 60 * 1000));
  todayPST.setHours(0, 0, 0, 0);

  let todaysCalls = 0;
  if (usageLog?.requests) {
    todaysCalls = usageLog.requests.filter(req => {
      const reqDate = new Date(req.timestamp);
      return reqDate >= todayPST;
    }).length;
  }

  // Calculate totals
  const discoveryRequests = discovery?.stats?.totalProcessed || 0;
  const enrichmentRequests = enrichment?.stats?.totalProcessed || 0;
  const totalHistoricalRequests = discoveryRequests + enrichmentRequests;

  // Daily limit calculations
  const baseDailyLimit = 8640;
  const remainingToday = Math.max(0, baseDailyLimit - todaysCalls);
  const safeHourlyRate = 360; // Stay well under limit
  const remainingHours = hoursUntilMidnightPST;
  const safeRemainingCalls = Math.min(remainingToday, safeHourlyRate * remainingHours);

  return {
    current: {
      time: now.toISOString(),
      pstHours,
      hoursUntilReset: hoursUntilMidnightPST,
      todaysCalls,
      remainingToday,
      safeRemainingCalls
    },
    progress: {
      discovery: {
        completed: discovery?.stats?.found || 0,
        notFound: discovery?.stats?.notFound || 0,
        remaining: 281 - (discovery?.stats?.totalProcessed || 0),
        successRate: discovery?.stats?.found
          ? ((discovery.stats.found / discovery.stats.totalProcessed) * 100).toFixed(1)
          : 0
      },
      enrichment: {
        completed: enrichment?.stats?.completed || 0,
        remaining: (discovery?.stats?.found || 0) - (enrichment?.stats?.completed || 0)
      }
    },
    recommendations: []
  };
}

async function generateRecommendations(stats) {
  const recs = [];

  // Check if we should run now
  if (stats.current.todaysCalls >= 8640) {
    recs.push({
      priority: 'HIGH',
      message: `Daily limit reached. Wait ${stats.current.hoursUntilReset}h until reset.`,
      action: 'WAIT'
    });
  } else if (stats.current.remainingToday > 100) {
    recs.push({
      priority: 'NORMAL',
      message: `${stats.current.remainingToday} requests available today`,
      action: 'RUN_SAFE'
    });
  }

  // Estimate completion time
  if (stats.progress.discovery.remaining > 0) {
    const daysToCompleteDiscovery = Math.ceil(stats.progress.discovery.remaining / 360);
    recs.push({
      priority: 'INFO',
      message: `Discovery will complete in ~${daysToCompleteDiscovery} days at safe rate`,
      action: 'CONTINUE'
    });
  }

  if (stats.progress.enrichment.remaining > 0) {
    const daysToCompleteEnrichment = Math.ceil(stats.progress.enrichment.remaining / 360);
    recs.push({
      priority: 'INFO',
      message: `Enrichment will complete in ~${daysToCompleteEnrichment} days at safe rate`,
      action: 'CONTINUE'
    });
  }

  // Success metrics
  if (stats.progress.discovery.successRate < 70) {
    recs.push({
      priority: 'WARNING',
      message: `Low ASIN discovery rate (${stats.progress.discovery.successRate}%). Consider refining search terms.`,
      action: 'OPTIMIZE'
    });
  }

  return recs;
}

async function displayReport() {
  console.log('=====================================');
  console.log('PA-API Rate Limit Monitor');
  console.log('=====================================\n');

  const stats = await getUsageStats();
  stats.recommendations = await generateRecommendations(stats);

  // Current Status
  console.log('📊 CURRENT STATUS');
  console.log(`Time: ${new Date().toLocaleString()}`);
  console.log(`PST Hours: ${stats.current.pstHours}:00`);
  console.log(`Reset in: ${stats.current.hoursUntilReset} hours`);
  console.log(`Today's API calls: ${stats.current.todaysCalls}/8640`);
  console.log(`Remaining (safe): ${stats.current.safeRemainingCalls}\n`);

  // Progress
  console.log('📈 PROGRESS REPORT');
  console.log('Discovery:');
  console.log(`  ✅ Found: ${stats.progress.discovery.completed}`);
  console.log(`  ❌ Not Found: ${stats.progress.discovery.notFound}`);
  console.log(`  ⏳ Remaining: ${stats.progress.discovery.remaining}/281`);
  console.log(`  📊 Success Rate: ${stats.progress.discovery.successRate}%`);
  console.log('\nEnrichment:');
  console.log(`  ✅ Completed: ${stats.progress.enrichment.completed}`);
  console.log(`  ⏳ Remaining: ${stats.progress.enrichment.remaining}\n`);

  // Recommendations
  console.log('💡 RECOMMENDATIONS');
  for (const rec of stats.recommendations) {
    const icon = rec.priority === 'HIGH' ? '🚨' :
                 rec.priority === 'WARNING' ? '⚠️' :
                 rec.priority === 'NORMAL' ? '✅' : 'ℹ️';
    console.log(`${icon} ${rec.message}`);
  }

  // Next Actions
  console.log('\n🎯 NEXT ACTIONS');
  if (stats.current.remainingToday > 100) {
    console.log('1. Run discovery: npm run pa-api:discover');
    console.log('2. Monitor progress: npm run pa-api:monitor');
  } else {
    console.log(`1. Wait ${stats.current.hoursUntilReset}h for quota reset`);
    console.log('2. Set reminder for midnight PST');
  }

  // Estimate completion
  const totalRemaining = stats.progress.discovery.remaining + stats.progress.enrichment.remaining;
  const daysToComplete = Math.ceil(totalRemaining / 360);
  console.log(`\n⏱️ Estimated completion: ${daysToComplete} days at safe rate`);
}

// Log API usage
async function logUsage(operation, success = true) {
  let usageLog = await loadJSON(USAGE_LOG_FILE) || { requests: [] };

  usageLog.requests.push({
    timestamp: new Date().toISOString(),
    operation,
    success
  });

  // Keep only last 7 days of logs
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  usageLog.requests = usageLog.requests.filter(req =>
    new Date(req.timestamp) > sevenDaysAgo
  );

  await fs.writeFile(USAGE_LOG_FILE, JSON.stringify(usageLog, null, 2));
}

// Run monitor
if (require.main === module) {
  displayReport().catch(console.error);
}

module.exports = { getUsageStats, logUsage };