# Multi-LLM API Toolkit

A lightweight, developer-friendly library that streamlines API interactions across multiple large language models. Easily make API calls to Claude, ChatGPT, Gemini, Grok, and OpenRouter with built-in support for text and image inputs, plus reasoning capabilities.

## Features

- **Unified API Interface** across multiple LLM providers:
  - Anthropic Claude 3.7 Sonnet & 3.5 Haiku
  - OpenAI GPT-4o & GPT-4o-mini and O-Series Models
  - Google Gemini 2.0 Pro & Flash
  - X.AI Grok-2 & Grok-2-vision
  - OpenRouter API (access to multiple models)

- **Advanced Reasoning Capabilities**
  - Support for Claude's thinking mode
  - Gemini thinking mode integration
  - OpenRouter reasoning mode
  - Standardized reasoning content handling

- **Streaming Support**
  - Standardized streaming interface across all providers
  - Automatic stream handling and transformation
  - Reasoning content streaming
  - Abort controller support

- **Multi-Modal Capabilities**
  - Text input/output
  - Image analysis across providers:
    - Claude with base64 image conversion
    - Gemini with image_url support
    - GPT-4o with image_url support
    - Grok-2-vision support

- **Advanced Features**
  - Anthropic thinking mode with token budget control
  - Standardized message formatting
  - Temperature and token control
  - Comprehensive error handling

## Installation
```bash
npm install multi-llm-api-toolkit
```

## Quick Start
```javascript
import { makeClaudeApiCall } from 'multi-llm-api-toolkit';

const response = await makeClaudeApiCall(
    apiKey,
    chatContext,
    systemMessage,
    modelVersion,
    maxTokens,
    temperature
);
```

## API Reference

### Claude API (Anthropic)
```typescript
makeClaudeApiCall(
    apiKey: string,
    chatContext: Message[],
    systemMessage: string,
    model: number, // 1: claude-3-7-sonnet-20250219, 2: claude-3-5-haiku-20241022, -1: claude-3-7-sonnet with reasoning
    maxTokens: number,
    temperature?: number
)
```

#### Reasoning Mode (Thinking)
```javascript
// Example with reasoning mode
const response = await makeClaudeApiCall(
    apiKey,
    chatContext,
    systemMessage,
    -1, // Use negative model number to enable reasoning
    maxTokens,
    temperature
);
```

### Grok API (X.AI)
```typescript
makeGrokApiCall(
    apiKey: string,
    chatContext: Message[],
    systemMessage: string[],
    model: number,
    maxTokens: number,
    temperature?: number
)
```

The function automatically selects between `grok-2-1212` and `grok-2-vision-1212` based on whether images are present in the chat context.

### Gemini API (Google)
```typescript
makeGeminiApiCall(
    apiKey: string,
    chatContext: Message[],
    systemMessage: string[],
    model: number, // 1: gemini-2.0-pro-exp-02-05, 2: gemini-2.0-flash-exp, -1: gemini-2.0-flash-thinking-exp
    maxTokens: number,
    temperature?: number
)
```

### ChatGPT API (OpenAI)
```typescript
makeChatGPTApiCall(
    apiKey: string,
    chatContext: Message[],
    systemMessage: string[],
    model: number, // 1: gpt-4o, 2: gpt-4o-mini, -1: o1, -2: o3-mini
    maxTokens: number,
    temperature?: number
)
```

### OpenRouter API
```typescript
makeOpenRouterApiCall(
    apiKey: string,
    chatContext: Message[],
    systemMessage: string,
    model: { name: string, type: number }, // Provide a model object; negative type enables reasoning mode
    maxTokens: number,
    temperature?: number
)
```

This function routes requests through the OpenRouter endpoint and supports reasoning mode when the model type is negative.

## Message Formats

### Basic Message Structure
```typescript
interface Message {
    role: "system" | "user" | "assistant";
    content: string;
    image?: ImageData[];
}

interface ImageData {
    media_type: string;
    url: string;
}
```

### System Message Format
```typescript
// For APIs that support array-based system messages
interface SystemMessage {
    type: "text";
    text: string;
    cache_control?: {
        type: "ephemeral" | "persistent";
    };
}
```

## Stream Handling

All API calls return a standardized stream format, regardless of the provider's native format:

```typescript
interface StreamResponse {
    type: 'content_block_delta' | 'reasoning_content';
    delta?: {
        text: string;
    };
    reasoning_content?: string;
}
```

The toolkit handles different provider formats:

```typescript
// OpenAI & Grok Format
{
    choices: [{
        delta: {
            content: string,
            reasoning_content?: string
        }
    }]
}

// Gemini Format
{
    text: string
}

// Claude Format
{
    type: 'content_block_start' | 'content_block_delta' | 'content_block_stop',
    delta: {
        text: string
    }
}
```

Example stream processing:
```javascript
const stream = await makeClaudeApiCall(/* params */);

for await (const chunk of stream) {
    if (chunk.type === 'content_block_delta') {
        console.log(chunk.delta.text);
    } else if (chunk.type === 'reasoning_content') {
        console.log('Reasoning:', chunk.reasoning_content);
    }
}
```

## Error Handling

All API calls include comprehensive error handling:

```javascript
try {
    const stream = await makeClaudeApiCall(/* params */);
} catch (error) {
    if (error.message.includes('API Error')) {
        // Handle API-specific errors
    }
    // Handle other errors
}
```

## Image Processing

```javascript
const contextWithImage = [{
    role: "user",
    content: "Analyze this image",
    image: [{
        media_type: "image/jpeg",
        url: "path/to/image.jpg"
    }]
}];

// Automatic base64 conversion for Claude
// Direct URL passing for other providers
const response = await makeClaudeApiCall(/* params */);
```

## Advanced Features

### Reasoning Mode
Enable reasoning/thinking capabilities across supported models:

```javascript
// Claude with thinking mode
const claudeResponse = await makeClaudeApiCall(
    apiKey,
    chatContext,
    systemMessage,
    -1, // Negative value enables thinking mode
    maxTokens,
    temperature
);

// Gemini with thinking mode
const geminiResponse = await makeGeminiApiCall(
    apiKey,
    chatContext,
    systemMessage,
    -1, // Negative value enables thinking mode
    maxTokens,
    temperature
);

// OpenRouter with reasoning
const openRouterResponse = await makeOpenRouterApiCall(
    apiKey,
    chatContext,
    systemMessage,
    { name: "anthropic/claude-3-opus-20240229", type: -1 }, // Negative type enables reasoning
    maxTokens,
    temperature
);
```

## Best Practices

1. **API Key Management**
   - Store API keys securely
   - Use environment variables
   - Implement key rotation

2. **Stream Processing**
   - Handle both regular content and reasoning content
   - Implement timeout handling
   - Use abort controllers for cancellation

3. **Model Selection**
   - Use positive model numbers for standard models
   - Use negative model numbers to enable reasoning capabilities
   - For OpenRouter, provide a model object with name and type

4. **Resource Management**
   - Monitor token usage
   - Implement rate limiting
   - Handle API quotas

## Contributing

Contributions are welcome!

## License

MIT License - see LICENSE file for details

## Acknowledgments

Special thanks to Anthropic, OpenAI, Google, and X.AI for their amazing LLM technologies.