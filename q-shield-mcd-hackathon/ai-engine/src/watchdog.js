// ==========================================
// THE WATCHDOG: BEHAVIORAL ANOMALY DETECTION
// ==========================================

/**
 * 1. Time Analysis: Bot vs Human Speed
 * Bots form turant bhar dete hain. Humans ko padhne aur click karne mein time lagta hai.
 */
function analyzeTimeScore(startTime, endTime) {
    const timeTakenSeconds = (endTime - startTime) / 1000;
    console.log(`Time taken to vote: ${timeTakenSeconds} seconds`);

    if (timeTakenSeconds < 3) {
        // 3 second se kam matlab definitely script/bot hai
        return 0; 
    } else if (timeTakenSeconds >= 3 && timeTakenSeconds < 8) {
        // Thoda fast hai, par human ho sakta hai
        return 70; 
    } else {
        // Normal human speed
        return 100; 
    }
}

/**
 * 2. Trajectory Analysis: Mouse Movement
 * Bots perfect straight line mein move karte hain. Humans thoda curve aur alag speed se move karte hain.
 * @param {Array} mouseEvents - [{x, y, time}, {x, y, time}...]
 */
function analyzeMouseTrajectory(mouseEvents) {
    if (!mouseEvents || mouseEvents.length < 10) {
        console.warn("Not enough mouse data collected!");
        return 30; // Suspicious: Bina mouse hilaye submit kar diya (API directly hit ki hogi)
    }

    let straightLineCount = 0;

    // Check angle changes between points
    for (let i = 2; i < mouseEvents.length; i++) {
        const p1 = mouseEvents[i - 2];
        const p2 = mouseEvents[i - 1];
        const p3 = mouseEvents[i];

        // Slope nikalte hain points ke beech
        const slope1 = (p2.y - p1.y) / (p2.x - p1.x || 1); // || 1 to avoid division by zero
        const slope2 = (p3.y - p2.y) / (p3.x - p2.x || 1);

        // Agar slope ekdum same hai (straight line), toh bot behavior ho sakta hai
        if (Math.abs(slope1 - slope2) < 0.05) {
            straightLineCount++;
        }
    }

    // Agar 80% se zyada movements perfect straight line hain, toh Bot hai
    const straightLinePercentage = (straightLineCount / mouseEvents.length) * 100;
    console.log(`Straight Line Movement: ${straightLinePercentage.toFixed(2)}%`);

    if (straightLinePercentage > 80) return 10; // Red Flag
    if (straightLinePercentage > 50) return 60; // Yellow Flag
    return 100; // Green Flag (Human-like organic curves)
}

/**
 * 3. Master Function: Calculate Final Trust Score
 * @param {Object} sessionData - { startTime, endTime, mouseEvents, pasteAttempts }
 */
export function calculateTrustScore(sessionData) {
    console.log("Analyzing Session Data for Anomalies...");

    const { startTime, endTime, mouseEvents, pasteAttempts } = sessionData;

    // Har test ka apna weight hai final score mein
    const timeScore = analyzeTimeScore(startTime, endTime);
    const mouseScore = analyzeMouseTrajectory(mouseEvents);
    
    // Agar user ne data copy-paste kiya hai (bots karte hain), penalty lagao
    const pastePenalty = (pasteAttempts || 0) > 0 ? 40 : 0; 

    // Final Weighted Average Score (Base score minus penalties)
    // Time carries 40% weight, Mouse carries 60% weight
    let finalScore = (timeScore * 0.4) + (mouseScore * 0.6) - pastePenalty;

    // Make sure score 0 se 100 ke beech hi rahe
    finalScore = Math.max(0, Math.min(100, finalScore));

    console.log(`🛡️ Final Trust Score: ${finalScore.toFixed(2)} / 100`);

    return {
        score: finalScore,
        isHuman: finalScore >= 75, // 75 se upar hai tabhi human manenge
        reason: finalScore < 75 ? "Suspicious automated behavior detected." : "Clear."
    };
}