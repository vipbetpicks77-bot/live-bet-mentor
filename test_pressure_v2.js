import { pressureIndex } from './src/logic/pressureIndex.js';

const mockStatsNoSOG = {
    shotsOnGoal: { home: 0, away: 0 },
    dangerousAttacks: { home: 45, away: 30 },
    corners: { home: 4, away: 1 },
    totalShots: { home: 10, away: 5 }
};

console.log('Testing Pressure Index with MISSING Shots on Goal (should use Total Shots fallback):');
const result = pressureIndex.calculate(mockStatsNoSOG);
console.log('Result:', JSON.stringify(result, null, 2));

if (result.total > 0 && result.home > 0) {
    console.log('SUCCESS: Fallback logic working.');
} else {
    console.log('FAILURE: Pressure is still 0 despite total shots.');
}

const mockStatsTurkish = {
    shotsOnGoal: { home: 2, away: 1 },
    dangerousAttacks: { home: 45, away: 30 },
    corners: { home: 4, away: 1 }
};
console.log('\nTesting Pressure Index with standard stats:');
const result2 = pressureIndex.calculate(mockStatsTurkish);
console.log('Result:', JSON.stringify(result2, null, 2));
