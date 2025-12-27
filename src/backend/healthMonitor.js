/**
 * HEALTH MONITOR (Phase 11 - Scenario 3)
 * Tracks system stability over 24-48 hours
 */

export class HealthMonitor {
    constructor() {
        this.snapshots = [];
        this.startTime = Date.now();
        this.maxSnapshots = 576; // 48 hours at 5min intervals
    }

    captureSnapshot(dataWorker) {
        const snapshot = {
            timestamp: Date.now(),
            uptime: Math.floor((Date.now() - this.startTime) / 1000), // seconds
            memory: {
                fixturesCount: dataWorker.fixtures?.length || 0,
                logsCount: dataWorker.decisionLogs?.length || 0,
                secondaryFixturesCount: dataWorker.secondaryFixtures?.length || 0
            },
            health: { ...dataWorker.healthStats },
            performance: {
                lastFetchDuration: dataWorker.lastFetchDuration || 0,
                avgDQS: this.calculateAvgDQS(dataWorker.fixtures || [])
            }
        };

        this.snapshots.push(snapshot);

        // Rotate snapshots (FIFO)
        if (this.snapshots.length > this.maxSnapshots) {
            this.snapshots.shift();
        }

        return snapshot;
    }

    calculateAvgDQS(fixtures) {
        if (fixtures.length === 0) return 0;
        const sum = fixtures.reduce((acc, f) => acc + (f.dqs || 0), 0);
        return (sum / fixtures.length).toFixed(3);
    }

    getReport() {
        if (this.snapshots.length < 2) {
            return { error: 'Insufficient data (need at least 2 snapshots)' };
        }

        const first = this.snapshots[0];
        const last = this.snapshots[this.snapshots.length - 1];
        const uptimeHours = (last.uptime / 3600).toFixed(2);

        return {
            duration: {
                seconds: last.uptime,
                hours: uptimeHours,
                snapshots: this.snapshots.length
            },
            memoryGrowth: {
                fixtures: last.memory.fixturesCount - first.memory.fixturesCount,
                logs: last.memory.logsCount - first.memory.logsCount,
                secondary: last.memory.secondaryFixturesCount - first.memory.secondaryFixturesCount,
                verdict: this.assessMemoryGrowth(first, last)
            },
            healthTrend: {
                errorCount: last.health.errorCount - first.health.errorCount,
                noBetCount: last.health.noBetCount - first.health.noBetCount,
                totalFetches: last.health.totalFetches || 0
            },
            performanceTrend: {
                avgDQS: last.performance.avgDQS,
                fetchDuration: last.performance.lastFetchDuration
            },
            stability: this.calculateStability()
        };
    }

    assessMemoryGrowth(first, last) {
        const logGrowth = last.memory.logsCount - first.memory.logsCount;
        const fixtureGrowth = last.memory.fixturesCount - first.memory.fixturesCount;

        if (logGrowth > 1000 || fixtureGrowth > 100) {
            return 'WARNING: Potential memory leak detected';
        }
        return 'STABLE: Memory usage within expected bounds';
    }

    calculateStability() {
        if (this.snapshots.length < 10) return 'INSUFFICIENT_DATA';

        const recentSnapshots = this.snapshots.slice(-10);
        const errorCounts = recentSnapshots.map(s => s.health.errorCount);
        const errorGrowth = errorCounts[errorCounts.length - 1] - errorCounts[0];

        if (errorGrowth > 10) return 'UNSTABLE';
        if (errorGrowth > 5) return 'DEGRADED';
        return 'STABLE';
    }

    exportToJSON() {
        return JSON.stringify({
            report: this.getReport(),
            snapshots: this.snapshots
        }, null, 2);
    }
}
