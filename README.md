# Multi-LLM API Toolkit

A lightweight, developer-friendly library that streamlines API interactions across multiple large language models. Easily make API calls to Claude, ChatGPT, Gemini, and Grok with built-in support for text and image inputs.

## Features

- **Unified API Interface** across multiple LLM providers:
  - Anthropic Claude 3.5 (Sonnet & Haiku)
  - OpenAI GPT-4 & variants
  - Google Gemini Pro & Flash
  - X.AI Grok

- **Streaming Support**
  - Standardized streaming interface across all providers
  - Automatic stream handling and transformation
  - Built-in timeout management
  - Abort controller support

- **Multi-Modal Capabilities**
  - Text input/output
  - Image analysis (Claude & Gemini & ChatGPT)
  - Automatic base64 image conversion
  - Support for multiple image formats

- **Advanced Features**
  - Anthropic-exclusive cache control
  - PDF content handling
  - Customizable system messages
  - Temperature and token control
  - Error handling and retries

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
    model: 1 | 2, // 1: claude-3-sonnet, 2: claude-3-haiku
    maxTokens: number,
    temperature?: number
)
```

#### Cache Control (Anthropic Exclusive)
```javascript
// Example with cache control
const contextWithCache = [{
    role: "user",
    content: {
        type: "text",
        text: "Your message",
        cache_control: { type: "ephemeral" }
    }
}];

const stream = await makeClaudeApiCall(
    apiKey,
    contextWithCache,
    systemMessage,
    1,
    maxTokens,
    temperature
);
```

### Grok API (X.AI)
```typescript
makeGrokApiCall(
    apiKey: string,
    chatContext: Message[],
    systemMessage: SystemMessage[],
    model: number,
    maxTokens: number,
    temperature?: number
)
```

### Gemini API (Google)
```typescript
makeGeminiApiCall(
    apiKey: string,
    chatContext: Message[],
    systemMessage: SystemMessage[],
    model: 1 | 2, // 1: gemini-pro, 2: gemini-flash
    maxTokens: number,
    temperature?: number
)
```

### ChatGPT API (OpenAI)
```typescript
makeChatGPTApiCall(
    apiKey: string,
    chatContext: Message[],
    systemMessage: SystemMessage[],
    model: 1 | 2, // 1: gpt-4, 2: gpt-4-mini
    maxTokens: number,
    temperature?: number
)
```

## Message Formats

### Basic Message Structure
```typescript
interface Message {
    role: "system" | "user" | "assistant";
    content: string | ContentBlock;
    image?: ImageData[];
}

interface ImageData {
    media_type: string;
    url: string;
}
```

### Cache Control Message (Anthropic)
```typescript
interface CacheControlMessage {
    role: string;
    content: {
        type: "text";
        text: string;
        cache_control: {
            type: "ephemeral" | "persistent";
        };
    };
}
```

## Stream Handling

All API calls return a standardized stream format, regardless of the provider's native format:

```typescript
interface StreamResponse {
    type: 'content_block_delta';
    delta: {
        text: string;
    };
}
```

Provider-specific formats that are automatically standardized:

```typescript
// OpenAI & Grok Format
{
    choices: [{
        delta: {
            content: string
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

// Automatic base64 conversion handled internally
const response = await makeClaudeApiCall(/* params */);
```

## Advanced Features

### Cache Control (Anthropic Exclusive)
Claude's cache control feature allows for fine-grained control over message persistence:

```javascript
// Ephemeral messages (not stored in context)
const ephemeralContext = [{
    role: "user",
    content: {
        type: "text",
        text: "Sensitive information",
        cache_control: { type: "ephemeral" }
    }
}];

// Persistent messages (stored in context)
const persistentContext = [{
    role: "user",
    content: {
        type: "text",
        text: "Important context",
        cache_control: { type: "persistent" }
    }
}];
```


## Best Practices

1. **API Key Management**
   - Store API keys securely
   - Use environment variables
   - Implement key rotation

2. **Stream Processing**
   - Always implement timeout handling
   - Use abort controllers for cancellation
   - Handle stream errors gracefully

3. **Cache Control**
   - Use ephemeral cache for sensitive data
   - Implement persistent cache for reusable content
   - Only available with Anthropic's Claude

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