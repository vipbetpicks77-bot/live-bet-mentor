
import dotenv from 'dotenv';
dotenv.config();

const key = process.env.VITE_GEMINI_API_KEY;
if (key) {
    console.log('VITE_GEMINI_API_KEY exists. Length:', key.length);
    console.log('First 5 chars:', key.substring(0, 5));
} else {
    console.log('VITE_GEMINI_API_KEY is MISSING in process.env');
}
