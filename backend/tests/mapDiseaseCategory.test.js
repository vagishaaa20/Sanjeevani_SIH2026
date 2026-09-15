const { mapDiseaseCategory } = require('../src/services/triageService');

describe('triageService - mapDiseaseCategory', () => {

    it('tags a straightforward positive symptom correctly', () => {
        expect(mapDiseaseCategory('Patient reports fever and chills for 3 days.'))
            .toBe('Fever/Infectious');
    });

    it('tags clinical shorthand correctly', () => {
        expect(mapDiseaseCategory('CC: N/V/D x 2 days. Acute gastroenteritis (GI).'))
            .toBe('Gastrointestinal');
    });

    it('picks the category with the most keyword hits on a multi-symptom note', () => {
        expect(mapDiseaseCategory('Mild fever with cough, wheezing, and shortness of breath.'))
            .toBe('Respiratory');
    });

    it('does NOT tag a category for a single negated symptom ("denies")', () => {
        expect(mapDiseaseCategory('Denies fever.')).toBe('Other');
    });

    it('suppresses an entire negated enumerated list via "denies" (preceding negation)', () => {
        const result = mapDiseaseCategory('Denies fever, chest pain, or GI complaints.');
        expect(result).toBe('Other');
    });

    it('correctly tags a MIXED note: negated symptom + a real positive symptom, separated by a boundary word', () => {
        const result = mapDiseaseCategory('Denies fever or chills. Reports persistent cough for 5 days.');
        expect(result).toBe('Respiratory');
    });

    it('handles "no" as a negation trigger for an enumerated list', () => {
        const result = mapDiseaseCategory('No chest pain, no palpitations. Presents with rash on forearm.');
        expect(result).toBe('Skin/Allergic');
    });

    it('handles "negative for" as a negation trigger, reset by "c/o" boundary', () => {
        const result = mapDiseaseCategory('ROS negative for fever, negative for GI symptoms. C/o headache.');
        expect(result).toBe('Neurological');
    });

    it('falls back to "Other" when no positive symptoms match anything', () => {
        expect(mapDiseaseCategory('Patient here for routine checkup, no complaints.')).toBe('Other');
    });

    it('returns "Other" for empty or missing input', () => {
        expect(mapDiseaseCategory('')).toBe('Other');
        expect(mapDiseaseCategory(undefined)).toBe('Other');
    });

    // --- KNOWN GAP — documents current (incorrect) behavior, not desired behavior ---
    // The negation scan only looks BACKWARD from each keyword. Real clinical notes often
    // place the negation AFTER the finding ("Neuro exam unremarkable", "ROS negative" as
    // a trailing summary line). This test currently passes because that's what the code
    // does today — but it's wrong, and should be treated as a bug to fix, not a spec.
    it('[KNOWN GAP] currently mis-tags a note with only TRAILING negation as positive', () => {
        const result = mapDiseaseCategory(
            'Denies fever, chest pain, or GI complaints. Neuro exam unremarkable. ROS otherwise negative.'
        );
        // Documenting the current (incorrect) output so this is visible, not silent:
        expect(result).toBe('Neurological'); // SHOULD be 'Other' once trailing negation is handled
    });
});