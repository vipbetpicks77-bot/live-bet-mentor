const apiKey = 'AIzaSyBUOhIfLRpRnpBhX_qW5DcfBbQbZaEa0vk';
const modelName = 'gemini-2.0-flash';

async function testGemini() {
    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: "Kısaca 'Merhaba' de." }] }]
            })
        });

        console.log('Status:', response.status);
        const data = await response.json();
        console.log('Gemini Response:', data.candidates?.[0]?.content?.parts?.[0]?.text);
    } catch (error) {
        console.error('Fetch Error:', error);
    }
}

testGemini();
