// Script to add Sweet Protection ASINs to localStorage
// Run this in browser console on your helmet site

function addASINToDatabase(helmetId, asin, title, price, confidence) {
    try {
        // Get existing database
        const existing = JSON.parse(localStorage.getItem('helmet_asin_database') || '{}');

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
            lastChecked: new Date().toISOString(),
            notes: 'Added via ASIN extraction'
        };

        // Add to database
        if (!existing[helmetId]) {
            existing[helmetId] = [];
        }

        // Check for duplicates
        const duplicateIndex = existing[helmetId].findIndex(item => item.asin === asin);
        if (duplicateIndex >= 0) {
            existing[helmetId][duplicateIndex] = candidate;
            console.log(`✅ ASIN ${asin} updated for helmet ${helmetId}`);
        } else {
            existing[helmetId].push(candidate);
            console.log(`✅ ASIN ${asin} added for helmet ${helmetId}`);
        }

        // Save to localStorage
        localStorage.setItem('helmet_asin_database', JSON.stringify(existing));

        return true;
    } catch (error) {
        console.error('❌ Error adding ASIN:', error);
        return false;
    }
}

// Add the Sweet Protection ASINs
console.log('🔧 Adding Sweet Protection ASINs...');

// Found ASINs:
// Sweet Protection Falconer MIPS - ASIN: B0BYLFS6KZ
// Sweet Protection Trailblazer MIPS - ASIN: B0851WRLPY
// Sweet Protection Bushwhacker 2VI MIPS - ASIN: B0BYLQJXZ8
// Sweet Protection Falconer Aero 2VI MIPS - ASIN: B0DD8QFP82

console.log('⚠️  Please update the helmet IDs below with correct values from your database');
console.log('📝 Example usage:');
console.log('addASINToDatabase(HELMET_ID, "B0BYLFS6KZ", "Sweet Protection Falconer MIPS Helmet", "$300", 0.95);');
console.log('addASINToDatabase(HELMET_ID, "B0851WRLPY", "Sweet Protection Trailblazer MIPS Helmet", "$250", 0.95);');
console.log('addASINToDatabase(HELMET_ID, "B0BYLQJXZ8", "Sweet Protection Bushwhacker MIPS Helmet", "$280", 0.95);');
console.log('addASINToDatabase(HELMET_ID, "B0DD8QFP82", "Sweet Protection Falconer Aero MIPS Helmet", "$320", 0.95);');

// Uncomment and update helmet IDs when you find them:
// addASINToDatabase(FALCONER_HELMET_ID, "B0BYLFS6KZ", "Sweet Protection Falconer MIPS Helmet", "$300", 0.95);
// addASINToDatabase(TRAILBLAZER_HELMET_ID, "B0851WRLPY", "Sweet Protection Trailblazer MIPS Helmet", "$250", 0.95);
// addASINToDatabase(BUSHWHACKER_HELMET_ID, "B0BYLQJXZ8", "Sweet Protection Bushwhacker MIPS Helmet", "$280", 0.95);