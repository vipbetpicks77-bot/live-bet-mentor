/**
 * PHASE 11 STRESS TEST SCRIPT
 * Running this script verifies the Secondary Validator's response to
 * data conflicts and service failures.
 */

import { mackolikScraper } from '../backend/scraper.js';
import { secondaryValidator } from '../logic/secondaryValidator.js';

const mockSofaMatch = {
    id: 'sofa_123',
    homeTeam: 'Real Madrid',
    awayTeam: 'Barcelona',
    score: { home: 2, away: 1 },
    minute: 75,
    leagueName: 'La Liga',
    kickoff: new Date().setHours(22, 0, 0, 0)
};

async function runStressTests() {
    console.log('--- STARTING PHASE 11 STRESS TESTS ---');

    // SCENARIO 1: CONFLICT (Negative Test)
    console.log('\n[TEST 1] Scenario: Data Conflict (Score Mismatch)');
    mackolikScraper.simulateConflict = true;
    mackolikScraper.simulateFailure = false;

    const mackolikMatches = await mackolikScraper.fetchLiveMatches();
    const result1 = secondaryValidator.validate(mockSofaMatch, mackolikMatches);

    if (result1 && !result1.consistent) {
        console.log('✅ TEST 1 PASSED: Conflict detected and logged correctly.');
    } else {
        console.error('❌ TEST 1 FAILED: Conflict NOT detected.');
    }

    // SCENARIO 2: FAILOVER (Service Interruption)
    console.log('\n[TEST 2] Scenario: Data Failover (Mackolik Offline)');
    mackolikScraper.simulateConflict = false;
    mackolikScraper.simulateFailure = true;

    const mackolikMatches2 = await mackolikScraper.fetchLiveMatches();
    const result2 = secondaryValidator.validate(mockSofaMatch, mackolikMatches2);

    if (result2 && result2.status === 'NOT_FOUND') {
        console.log('✅ TEST 2 PASSED: Silent failover successful (Match not found/reverted to primary).');
    } else if (mackolikMatches2.length === 0) {
        console.log('✅ TEST 2 PASSED: Scraper returned empty set, validator handled gracefully.');
    } else {
        console.error('❌ TEST 2 FAILED: Failover did not behave as expected.');
    }

    console.log('\n--- TESTS COMPLETED ---');
}

runStressTests().catch(err => {
    console.error('Test Execution Error:', err);
});
