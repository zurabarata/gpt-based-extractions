import express from 'express';
import OpenAI from "openai";
import axios from "axios";
import 'dotenv/config';
import pdfParse from 'pdf-parse';
import cors from 'cors';

const app = express();

// Enable CORS for all routes and allow any origin
app.use(cors());

// Fetch the API Key from environment variables for security
const apiKey = process.env.OPENAI_API_KEY;

const openai = new OpenAI({ apiKey });

async function fetchPdfText(pdfUrl: string): Promise<string | undefined> {
    const response = await axios.get(pdfUrl, {
        responseType: 'arraybuffer'
    });

    const pdfBuffer = response.data;
    console.log("PDF Buffer:", pdfBuffer);

    return pdfParse(pdfBuffer).then((data: { text: string; }) => {
        return data.text;
    }).catch((error: any) => {
        console.error("Could not parse PDF:", String(error));
        throw error;
    });
}


async function main(content: string | undefined) {
    const params = {
        messages: [
            { role: 'system', content: 'you are a tool service that can extracts structured data: senderName, recipientName, totalAmount, documentDate, dueDate,  documentNumber from document text and return it as a JSON object, if you cant find a value for a field return null for that field, return whatever you have in 5 secs' },
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
    console.log("Received request:", req.body); // Debug log

    try {
        const pdfUrl = req.body.pdfUrl;
        if (!pdfUrl) {
            res.status(400).send("pdfUrl not provided in request body");
            return;
        }

        console.log("Fetching PDF from:", pdfUrl); // Debug log
        const pdfText = await fetchPdfText(pdfUrl);
        console.log("PDF Text fetched");

        console.log("Sending to GPT-3"); // Debug log
        const result = await main(String(pdfText));
        console.log("GPT-3 result:", result); // Debug log

        res.send(result);
    } catch (error) {
        console.error("An error occurred:", error);
        // @ts-ignore
        res.status(500).send(`An error occurred: ${error.message}`); // More detailed error message
    }
});


app.get('/', (req, res) => {
    res.send('API is running. Please use POST to interact with the API. Example: curl -X POST -H "Content-Type: application/json" -d \'{"pdfUrl":"your-pdf-url-here"}\' https://gpt-based-extractions.vercel.app\n');
});


export default app;