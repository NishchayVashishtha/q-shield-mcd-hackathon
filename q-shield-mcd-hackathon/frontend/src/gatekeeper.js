import * as faceapi from 'face-api.js';

// ==========================================
// STEP 1: LOAD AI MODELS INTO BROWSER MEMORY
// ==========================================
export async function loadAIModels() {
    console.log("Loading AI Models...");
    // Daks ko bolna ki 'models' folder public directory mein rakhe
    const MODEL_URL = '/models'; 

    try {
        await Promise.all([
            faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL), // Face detect karne ke liye
            faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL), // Aankh, naak track karne ke liye
            faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL), // Identity match (128-d array) ke liye
            faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL) // Liveness (Smile) ke liye
        ]);
        console.log("All Models Loaded Successfully! 🟢");
        return true;
    } catch (error) {
        console.error("Error loading models. Check if /models folder is in public dir.", error);
        return false;
    }
}

// ==========================================
// STEP 2: EXTRACT DESCRIPTOR FROM ID CARD
// ==========================================
export async function extractIDDescriptor(idImageElement) {
    console.log("Scanning ID Card...");
    // Image se single face dhundo aur uska descriptor nikalo
    const detection = await faceapi.detectSingleFace(idImageElement)
                                   .withFaceLandmarks()
                                   .withFaceDescriptor();
    
    if (!detection) {
        throw new Error("No face detected on the ID card. Please upload a clear image.");
    }
    
    console.log("ID Card scanned successfully!");
    return detection.descriptor; // Ye ek math array hai jo face ki pehchan hai
}

// ==========================================
// STEP 3: LIVENESS CHECK & FACE MATCHING
// ==========================================
export async function verifyLivenessAndMatch(videoElement, idDescriptor) {
    console.log("Starting live camera verification...");

    return new Promise((resolve, reject) => {
        // Ek interval set karte hain jo har 500ms mein camera check karega
        const checkInterval = setInterval(async () => {
            const detection = await faceapi.detectSingleFace(videoElement)
                                           .withFaceLandmarks()
                                           .withFaceExpressions() // Smile check karne ke liye
                                           .withFaceDescriptor(); // Match karne ke liye

            if (detection) {
                // Liveness Rule: User ko thoda smile karna hoga (Expression score > 0.7)
                const isSmiling = detection.expressions.happy > 0.7;

                if (isSmiling) {
                    console.log("Liveness Verified! User is smiling. ✅");
                    clearInterval(checkInterval); // Interval rok do

                    // Ab ID wale descriptor aur Live descriptor ko compare karo
                    const liveDescriptor = detection.descriptor;
                    const distance = faceapi.euclideanDistance(idDescriptor, liveDescriptor);
                    
                    console.log(`Match Distance: ${distance}`);

                    // Agar distance 0.6 se kam hai, toh exact match hai
                    if (distance < 0.6) {
                        resolve({ success: true, message: "Identity Verified! 🟢", distance: distance, descriptor: liveDescriptor });
                    } else {
                        resolve({ success: false, message: "Face does not match the ID Card. 🔴", distance: distance });
                    }
                } else {
                    console.log("Waiting for user to smile to prove liveness...");
                    // UI pe message dikhane ke liye Daks isko use kar sakta hai
                }
            }
        }, 500); // Check every half second

        // Agar 15 seconds tak verify nahi hua, toh timeout kardo
        setTimeout(() => {
            clearInterval(checkInterval);
            reject(new Error("Liveness check timed out. Please look at the camera and smile."));
        }, 15000);
    });
}

// ==========================================
// STEP 4: HASH FACE DESCRIPTOR FOR PRIVACY
// ==========================================
/**
 * Converts a Float32Array face descriptor into a SHA-256 hex string.
 * Rounds aggressively to 1 significant digit so minor scan variations
 * still produce the same hash for the same face.
 */
export async function hashFaceDescriptor(descriptor) {
    // Round to nearest 0.1 — coarse enough to be stable across scans
    const rounded = Array.from(descriptor).map(v => Math.round(v * 5) / 5);
    const str = JSON.stringify(rounded);
    const buffer = new TextEncoder().encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
