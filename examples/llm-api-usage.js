import { 
    makeClaudeApiCall, 
    makeGrokApiCall, 
    makeGeminiApiCall, 
    makeChatGPTApiCall 
} from '../multi-llm-api-toolkit/llm-api-calls.js';


const exampleContext = [
    { role: "system", content: "You are a helpful assistant." },
    { role: "user", content: "Hello, how are you?" },
    { role: "assistant", content: "I'm doing well, thank you! How can I help you today?" },
    { role: "user", content: "Can you explain quantum computing?" }
];

// Example system message
const systemMessage = [
    { text: "You are a helpful AI assistant that provides clear and concise explanations." }
];

// Example usage with different models
async function demonstrateLLMAPIs() {
    try {
        const maxTokens = 1000;
        const temperature = 0.7;

        // 1. Claude API Example (Anthropic)
        console.log("Using Claude API...");
        const claudeStream = await makeClaudeApiCall(
            process.env.ANTHROPIC_API_KEY,
            exampleContext,
            systemMessage,
            1, // 1 for claude-3-sonnet, 2 for claude-3-haiku
            maxTokens,
            temperature
        );

        // 2. Grok API Example (X.AI)
        console.log("Using Grok API...");
        const grokStream = await makeGrokApiCall(
            process.env.X_API_KEY,
            exampleContext,
            systemMessage,
            1,
            maxTokens,
            temperature
        );

        // 3. Gemini API Example (Google)
        console.log("Using Gemini API...");
        const geminiStream = await makeGeminiApiCall(
            process.env.GOOGLE_API_KEY,
            exampleContext,
            systemMessage,
            1, // 1 for gemini-pro, 2 for gemini-flash
            maxTokens,
            temperature
        );

        // 4. ChatGPT API Example (OpenAI)
        console.log("Using ChatGPT API...");
        const chatGPTStream = await makeChatGPTApiCall(
            process.env.OPENAI_API_KEY,
            exampleContext,
            systemMessage,
            1, // 1 for gpt-4, 2 for gpt-4-mini
            maxTokens,
            temperature
        );

        // Example of processing a stream response
        async function processStream(stream, modelName) {
            console.log(`Processing ${modelName} stream...`);
            for await (const chunk of stream) {
                if (chunk.type === 'content_block_delta') {
                    console.log(`${modelName} response:`, chunk.delta.text);
                }
            }
        }

        // Process streams
        await Promise.all([
            processStream(claudeStream, "Claude"),
            processStream(grokStream, "Grok"),
            processStream(geminiStream, "Gemini"),
            processStream(chatGPTStream, "ChatGPT")
        ]);

    } catch (error) {
        console.error("Error in LLM API demonstration:", error);
    }
}

// Example with image handling
async function demonstrateImageCapabilities() {
    const contextWithImage = [
        {
            role: "user",
            content: "What's in this image?",
            image: [{
                media_type: "image/jpeg",
                url: "path/to/your/image.jpg or https://example.com/image.jpg"
            }]
        }
    ];

    // Claude and Gemini support image analysis
    const claudeResponse = await makeClaudeApiCall(
        process.env.ANTHROPIC_API_KEY,
        contextWithImage,
        systemMessage[0].text,
        1,
        maxTokens,
        temperature
    );

    // Process the response
    for await (const chunk of claudeResponse) {
        if (chunk.type === 'content_block_delta') {
            console.log("Image analysis:", chunk.delta.text);
        }
    }
}

// Run the demonstrations
demonstrateLLMAPIs();
demonstrateImageCapabilities(); 