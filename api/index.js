"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const openai_1 = __importDefault(require("openai"));
const axios_1 = __importDefault(require("axios"));
require("dotenv/config");
const pdf_parse_1 = __importDefault(require("pdf-parse"));
const app = (0, express_1.default)();
// Fetch the API Key from environment variables for security
const apiKey = process.env.OPENAI_API_KEY;
const openai = new openai_1.default({ apiKey });
function fetchPdfText(pdfUrl) {
    return __awaiter(this, void 0, void 0, function* () {
        const response = yield axios_1.default.get(pdfUrl, {
            responseType: 'arraybuffer'
        });
        const pdfBuffer = response.data;
        console.log("PDF Buffer:", pdfBuffer);
        return (0, pdf_parse_1.default)(pdfBuffer).then(data => {
            return data.text;
        }).catch(error => {
            console.error("Could not parse PDF:", error);
            throw error;
        });
    });
}
function main(content) {
    var _a, _b, _c;
    return __awaiter(this, void 0, void 0, function* () {
        const params = {
            messages: [
                { role: 'system', content: 'you are a tool service that can extracts structured data (senderName, documentNumber, documentDate, totalAmount) from document text and return it as a JSON object' },
                { role: 'user', content }
            ],
            model: 'gpt-3.5-turbo'
        };
        // TODO: fix params type
        const chatCompletion = yield openai.chat.completions.create(params);
        const generatedText = (_c = (_b = (_a = chatCompletion.choices[0]) === null || _a === void 0 ? void 0 : _a.message) === null || _b === void 0 ? void 0 : _b.content) === null || _c === void 0 ? void 0 : _c.trim();
        try {
            const jsonObject = JSON.parse(generatedText || "{}");
            return jsonObject;
        }
        catch (e) {
            console.error("Generated text could not be parsed into JSON:", e);
            return generatedText;
        }
    });
}
app.use(express_1.default.json());
app.post('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const pdfUrl = req.body.pdfUrl;
        const pdfText = yield fetchPdfText(pdfUrl);
        console.log("PDF Text:", pdfText);
        const result = yield main(String(pdfText));
        res.send(result);
    }
    catch (error) {
        console.error("An error occurred:", error);
        res.status(500).send("An error occurred");
    }
}));
app.get('/', (req, res) => {
    res.send('API is running. Please use POST to interact with the API. Example: curl -X POST -H "Content-Type: application/json" -d \'{"pdfUrl":"your-pdf-url-here"}\' https://gpt-based-extractions.vercel.app\n');
});
exports.default = app;
