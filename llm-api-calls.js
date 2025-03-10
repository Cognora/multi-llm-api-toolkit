import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";

export async function makeClaudeApiCall(apiKey, chatContext, systemMessage, model, maxTokens, temperature = 0.7) {
    try {
        const anthropic = new Anthropic({
            apiKey: apiKey,
        });

        let messages = await Promise.all(chatContext.map(async msg => ({
            role: msg.role,
            content: msg.image !== null ? [
                ...(await Promise.all(msg.image.map(async img => ({
                    type: "image",
                    source: {
                        type: "base64", 
                        media_type: img.media_type,
                        data: await convertToBase64(img.url)
                    }
                })))),
                {
                    type: "text",
                    text: msg.content
                }
            ] : msg.content
        })));

        const stream = await anthropic.beta.promptCaching.messages.create({
            model: model == 1 ? "claude-3-5-sonnet-20241022" : "claude-3-5-haiku-latest",
            max_tokens: maxTokens,
            temperature: temperature,
            messages: messages,
            stream: true,
            system: systemMessage
        }, {
            headers: {
                'anthropic-beta': 'pdfs-2024-09-25,prompt-caching-2024-07-31'
            }
        });

        return stream;
    } catch (error) {
        throw new Error(`Claude API Error: ${error.message}`);
    }
}

export async function makeGrokApiCall(apiKey, chatContext, systemMessage, model, maxTokens, temperature = 0.7) {
    try {
        const openai = new OpenAI({
            apiKey: apiKey,
            baseURL: "https://api.x.ai/v1",
        });

        let fullSystemMessage = systemMessage.map(msg => msg.text).join('\n\n');

        let messages = [
            { role: "system", content: fullSystemMessage },
            ...chatContext.map(msg => ({
                role: msg.role,
                content: msg.content
            }))
        ];

        const stream = await openai.chat.completions.create({
            model: "grok-beta",
            messages: messages,
            stream: true,
        });

        return standardizeStream(stream);
    } catch (error) {
        throw new Error(`Grok API Error: ${error.message}`);
    }
}

export async function makeGeminiApiCall(apiKey, chatContext, systemMessage, model, maxTokens, temperature = 0.7) {
    try {
        const googleGenerativeAI = new GoogleGenerativeAI(apiKey);

        let fullSystemMessage = systemMessage.map(msg => msg.text).join('\n\n');

        const genModel = googleGenerativeAI.getGenerativeModel({
            model: model == 1 ? "gemini-1.5-pro" : "gemini-1.5-flash",
            systemInstruction: fullSystemMessage
        });

        let messages = chatContext.map(msg => ({
            role: msg.role,
            parts: [{ 
                    text: msg.content 
                },
                    ...(msg.image ? msg.image.map(img => ({
                        "type": "image_url",
                        "image_url": {
                            "url": `${img.url}`,
                        },
                    })) : [])
                ]
        }));

        const lastMessage = messages.length > 0 ? messages[messages.length - 1].parts[0].text : "";
        const chatSession = genModel.startChat({
            history: messages
        });

        const streamResponse = await chatSession.sendMessageStream(lastMessage);
        return standardizeStream(streamResponse.stream);
    } catch (error) {
        throw new Error(`Gemini API Error: ${error.message}`);
    }
}

export async function makeChatGPTApiCall(apiKey, chatContext, systemMessage, model, maxTokens, temperature = 0.7) {
    try {
        const openai = new OpenAI({
            apiKey: apiKey,
        });

        let fullSystemMessage = systemMessage.map(msg => msg.text).join('\n\n');

        let messages = [
            { role: "system", content: fullSystemMessage },
            ...chatContext.map(msg => {
                if (msg.image && msg.image.length > 0) {
                    return {
                        role: msg.role,
                        content: [
                            ...msg.image.map(img => ({
                                type: "image_url",
                                image_url: {
                                    url: `${img.url}`,
                                    detail: "high"
                                }
                            })),
                            {
                                type: "text",
                                text: msg.content
                            }
                        ]
                    };
                }
                return {
                    role: msg.role,
                    content: msg.content
                };
            })
        ];

        const completion = await openai.chat.completions.create({
            model: model == 1 ? "gpt-4o" : "gpt-4o-mini",
            messages: messages,
            stream: true,
            max_completion_tokens: maxTokens,
            temperature: temperature
        });

        return standardizeStream(completion);
    } catch (error) {
        throw new Error(`ChatGPT API Error: ${error.message}`);
    }
}


function standardizeStream(stream) {
    try {
        return {
            [Symbol.asyncIterator]: async function* () {
                try {
                    for await (const chunk of stream) {
                        // Handle OpenAI/Grok format
                        if (chunk.choices?.[0]?.delta?.content) {
                            yield {
                                type: 'content_block_delta',
                                delta: { text: chunk.choices[0].delta.content }
                            };
                        // Handle Gemini format
                        } else if (chunk.text) {
                            yield {
                                type: 'content_block_delta',
                                delta: { text: chunk.text }
                            };
                        }
                    }
                } catch (error) {
                    throw new Error(`Stream Processing Error: ${error.message}`);
                }
            }
        };
    } catch (error) {
        throw new Error(`Stream Creation Error: ${error.message}`);
    }
}

async function convertToBase64(imageUrl) {
    try {
        const response = await fetch(imageUrl);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const binaryData = await response.arrayBuffer();
        return Buffer.from(binaryData).toString('base64');
    } catch (error) {
        throw new Error(`Base64 Conversion Error: ${error.message}`);
    }
}
