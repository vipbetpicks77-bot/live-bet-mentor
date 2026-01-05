import { pressureIndex } from './src/logic/pressureIndex.js';

const mockStats = {
    shotsOnGoal: { home: 2, away: 1 },
    dangerousAttacks: { home: 45, away: 30 },
    corners: { home: 4, away: 1 }
};

console.log('Testing Pressure Index with mock stats:');
console.log(JSON.stringify(mockStats, null, 2));

const result = pressureIndex.calculate(mockStats);
console.log('Result:', JSON.stringify(result, null, 2));

if (result.total > 0) {
    console.log('SUCCESS: Pressure calculated correctly.');
} else {
    console.log('FAILURE: Pressure is still 0.');
}
