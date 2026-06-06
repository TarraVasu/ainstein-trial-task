# AI Learning Card Generator

A minimal, real-time web application that progressively streams AI-generated learning cards using WebSockets. Built for the Ainstein Technical Trial Task.

## Technical Stack
- **Frontend**: React (Vite) with bespoke Vanilla CSS for premium aesthetics.
- **Backend**: Node.js + Express + `ws` for real-time WebSocket communication.
- **AI**: Gemini 2.5 Flash via `@google/genai`.

## How to Run Locally

### Prerequisites
- Node.js installed on your machine.
- A Gemini API Key.

### Setup Instructions

1. **Clone/Download the repository**
2. **Navigate to the root directory**:
   ```bash
   cd Ask-Ainstein
   ```
3. **Install dependencies** (This will install root, client, and server dependencies if you ran `npm install` at root, otherwise run them manually. But we set it up so you can just install at root if we configure postinstall, but for safety, the scaffolding did `npm install` in client and server):
   ```bash
   # If you haven't already:
   npm install
   cd client && npm install
   cd ../server && npm install
   cd ..
   ```
4. **Set up environment variables**:
   Create a `.env` file in the `server` directory and add your Gemini API key:
   ```env
   GEMINI_API_KEY=your_api_key_here
   ```
5. **Start the application**:
   From the root directory, run:
   ```bash
   npm start
   ```
   This uses `concurrently` to start both the Vite development server (usually on `http://localhost:5173`) and the Node.js backend server (`ws://localhost:3001`).

## Architecture & Error Handling Approach

### WebSocket Streaming
The application uses a persistent WebSocket connection instead of HTTP polling. When the user clicks "Generate", the React client sends a JSON payload `{ action: 'generate', topic, simulateError }` to the Node.js server. 

The server then loops 3 times, performing the following for each card:
1. Emits a `CARD_START` event to tell the client to display a beautiful skeleton loader.
2. Calls the Gemini API to generate the specific card's content.
3. Emits a `CARD_SUCCESS` event with the payload. The client receives this and gracefully fades out the skeleton and fades in the content.

### Isolated Error Recovery
A core requirement is the ability to handle a failure on a specific card without crashing the app or affecting other successfully generated cards.

If `simulateError` is toggled on, the backend intentionally throws an error when generating Card 3, emitting a `CARD_ERROR` event with the index `2`. 

**The UI handles this gracefully:**
- The React state isolates the status of each card in an array. Card 1 and Card 2 remain in their `success` state.
- Card 3 transitions into an `error` state, rendering a localized error message and a "Retry Generation" button.
- Clicking the retry button sends a `{ action: 'retry', cardIndex: 2 }` payload over the **same** existing WebSocket connection.
- The server specifically generates that single card and streams back a `CARD_SUCCESS` for index `2`, completing the flow seamlessly.
