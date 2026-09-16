const { calculateRiskLevel } = require('../src/services/outbreakDetectionService');

describe('Outbreak Detection Service - calculateRiskLevel', () => {
    const defaultThresholds = {
        severe: { minCases: 15, growthPct: 100 },
        moderate: { minCases: 6, growthPct: 50 },
        watch: { minCases: 3 }
    };

    it('returns null if there are 0 cases', () => {
        expect(calculateRiskLevel(0, 0, 5, 0, defaultThresholds)).toBeNull();
    });

    it('returns "watch" if threshold met but growth is low', () => {
        expect(calculateRiskLevel(3, 0, 3, 0, defaultThresholds)).toBe('watch');
        expect(calculateRiskLevel(5, 0, 5, 0, defaultThresholds)).toBe('watch');
    });

    it('returns "moderate" if moderate minCases threshold is hit', () => {
        expect(calculateRiskLevel(6, 0, 6, 0, defaultThresholds)).toBe('moderate');
        expect(calculateRiskLevel(10, 0, 10, 0, defaultThresholds)).toBe('moderate');
    });

    it('returns "moderate" if growth rate hits 50% even if cases are below minCases', () => {
        // e.g., previous 4, current 6 -> growth is 50%, which hits moderate growth threshold
        expect(calculateRiskLevel(6, 0, 4, 0, defaultThresholds)).toBe('moderate');
    });

    it('returns "severe" if severe minCases threshold is hit', () => {
        expect(calculateRiskLevel(15, 0, 15, 0, defaultThresholds)).toBe('severe');
        expect(calculateRiskLevel(20, 0, 20, 0, defaultThresholds)).toBe('severe');
    });

    it('returns "severe" if growth rate hits 100% even if cases are below severe minCases', () => {
        // e.g., previous 6, current 12 -> growth 100% -> severe
        expect(calculateRiskLevel(12, 0, 6, 0, defaultThresholds)).toBe('severe');
    });

    it('handles previousCount = 0 as 100% growth if there are current cases', () => {
        // If previous is 0 and current is 8, growth is considered 100%, so it hits severe
        expect(calculateRiskLevel(8, 0, 0, 0, defaultThresholds)).toBe('severe');
    });

    afterAll(async () => {
        await require('./cleanup')();
    });
});
