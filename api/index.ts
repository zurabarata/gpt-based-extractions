import express from 'express';
import OpenAI from "openai";
import axios from "axios";
import {PDFExtract} from 'pdf.js-extract';
import 'dotenv/config';

const app = express();

// Fetch the API Key from environment variables for security
const apiKey = process.env.OPENAI_API_KEY;

const openai = new OpenAI({ apiKey });

async function fetchPdfText(pdfUrl: string) {
    const response = await axios.get(pdfUrl, {
        responseType: 'arraybuffer'
    });

    const pdfExtract = new PDFExtract();
    const pdfBuffer = response.data;
    console.log("PDF Buffer:", pdfBuffer);
    return new Promise((resolve, reject) => {
        pdfExtract.extractBuffer(pdfBuffer, {}, (err, data) => {
            if (err) return reject(err);
            const pages = data?.pages;
            const textContent = pages?.map(page => page.content.map(obj => obj.str).join(' ')).join(' ');
            resolve(textContent);
        });
    });

}

async function main(content: string | undefined) {
    const params = {
        messages: [
            { role: 'system', content: 'you are a tool service that can extracts structured data (senderName, documentNumber, documentDate, totalAmount) from document text and return it as a JSON object' },
            { role: 'user', content }
        ],
        model: 'gpt-3.5-turbo'
    };
    // TODO: fix params type
    const chatCompletion = await openai.chat.completions.create(params as any);
    const generatedText = chatCompletion.choices[0]?.message?.content?.trim();
    try {
        const jsonObject = JSON.parse(generatedText || "{}");
        return jsonObject;
    } catch (e) {
        console.error("Generated text could not be parsed into JSON:", e);
        return generatedText;
    }
}

app.use(express.json());

app.post('/', async (req, res) => {
    try {
        const pdfUrl = req.body.pdfUrl;

        const pdfText = await fetchPdfText(pdfUrl);

        console.log("PDF Text:", pdfText);
        const result = await main(String(pdfText));
        res.send(result);
    } catch (error) {
        console.error("An error occurred:", error);
        res.status(500).send("An error occurred");
    }
});

app.get('/', (req, res) => {
    res.send('API is running. Please use POST to interact with the API. Example: curl -X POST -H "Content-Type: application/json" -d \'{"pdfUrl":"your-pdf-url-here"}\' https://gpt-based-extractions.vercel.app\n');
});


export default app;