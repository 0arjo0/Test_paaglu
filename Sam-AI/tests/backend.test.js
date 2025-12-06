
/*
 * AUTOMATED TESTING SUITE FOR SAM-AI BACKEND
 * 
 * Usage: node tests/backend.test.js
 * Purpose: Verifies API health, Login logic, and Content Generation format.
 * Satisfies: "Automated testing suites" requirement.
 */

const API_URL = 'http://localhost:5000/api';
let AUTH_TOKEN_USER = ''; // Will hold the username after login

async function runTests() {
    console.log("🧪 STARTING SAM-AI TEST SUITE...\n");

    try {
        // TEST 1: Health Check
        await test('Server Health Check', async () => {
            const res = await fetch('http://localhost:5000/health');
            const data = await res.json();
            if (!res.ok) throw new Error('Health check failed');
            console.log(`   Model: ${data.model}, Status: ${data.status}`);
        });

        // TEST 2: Login (Admin)
        await test('Authentication (Admin)', async () => {
            const res = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: 'admin', password: 'password123' })
            });
            const data = await res.json();
            if (!data.success) throw new Error('Login failed');
            AUTH_TOKEN_USER = data.user.username; // Store for next tests
        });

        // TEST 3: Validation Agent (Should Fail)
        await test('Validation Agent (Block Unsafe Content)', async () => {
            const res = await fetch(`${API_URL}/generate`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'x-user-id': AUTH_TOKEN_USER
                },
                body: JSON.stringify({
                    productName: "C-4 Explosive",
                    brand: "Acme",
                    features: "High blast radius",
                    category: "Weapons"
                })
            });
            const data = await res.json();
            // We expect a 400 error here
            if (res.status !== 400 || !data.error.includes("VALIDATION_ERROR")) {
                throw new Error("Failed to block unsafe content");
            }
        });

        // TEST 4: Content Generation (Happy Path)
        await test('Content Generation (Happy Path)', async () => {
            const res = await fetch(`${API_URL}/generate`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'x-user-id': AUTH_TOKEN_USER
                },
                body: JSON.stringify({
                    productName: "ErgoChair 3000",
                    brand: "OfficePro",
                    features: "Mesh back, lumbar support",
                    category: "Furniture",
                    channel: "Amazon",
                    targetKeywords: "best office chair 2024" // Testing new field
                })
            });
            
            const data = await res.json();
            if (!data.title || !data.longDescription) throw new Error("Invalid content structure");
            if (!Array.isArray(data.bullets)) throw new Error("Bullets must be array");
            
            // Check if keywords were used (Data Enrichment check)
            const fullText = (data.title + data.longDescription).toLowerCase();
            if(!fullText.includes("office chair")) console.warn("   ⚠️ Warning: Keywords might be missing.");
        });

        // TEST 5: Integration Endpoint (Shopify)
        await test('Integration: Shopify Publish Simulation', async () => {
            const res = await fetch(`${API_URL}/integrations/publish`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'x-user-id': AUTH_TOKEN_USER
                },
                body: JSON.stringify({
                    platform: 'shopify',
                    productName: "Test Product",
                    content: { title: "Test Title", description: "Test Desc" }
                })
            });
            const data = await res.json();
            if (!data.success || !data.publishedUrl) throw new Error("Publishing failed");
            console.log(`   Published to: ${data.publishedUrl}`);
        });

        console.log("\n✅ ALL TESTS PASSED SUCCESSFULLY.");

    } catch (e) {
        console.error("\n❌ TEST SUITE FAILED");
        console.error(e);
    }
}

// Helper to wrap tests with logging
async function test(name, fn) {
    process.stdout.write(`running: ${name}... `);
    try {
        await fn();
        console.log("PASS");
    } catch (e) {
        console.log("FAIL");
        throw e;
    }
}

runTests();
