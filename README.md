

## Installation
To run the chat reader locally, follow these steps:

1. Install [Node.js](https://nodejs.org/) on your system
2. Clone this repository or download and extract [this ZIP file](https://github.com/zerodytrash/TikTok-Chat-Reader/archive/refs/heads/main.zip)
3. Open a console/terminal in the root directory of the project
4. Enter `npm i` to install all required dependencies 
5. Enter `node server.js` to start the application server

Now you should see the following message: `Server running! Please visit http://localhost:8091`<br>
Simply open http://localhost:8091/ in your browser. Thats it.

If you have problems with Node.js, you can also just open the `index.html` from the `public` folder.<br>


## Run in electron
Developpement

`npm start`

Build
`npm run pack`
`npm run dist`


`npx electron-builder --win`
`npx electron-builder --mac`



## AI Response Suggestions

The chat reader supports AI-powered response suggestions with two providers:

### OpenAI Integration

To use OpenAI for response suggestions:
1. Create a `.env` file in the root directory
2. Add your OpenAI API key: `OPENAI_API_KEY=your_key_here`
3. Select "OpenAI" as the AI provider in the UI

### Ollama Integration

[Ollama](https://ollama.com/) provides a way to run AI models locally on your own machine. To use Ollama:
1. Install Ollama on your system from [https://ollama.com/](https://ollama.com/)
2. Pull one or more models with `ollama pull <model_name>` (e.g., `ollama pull llama3`)
3. Make sure the Ollama server is running (it runs on port 11434 by default)
4. If your Ollama server is not running on localhost, create a `.env` file and add:
   `OLLAMA_HOST=http://your_ollama_host:11434`
5. Select "Ollama" as the AI provider in the UI and choose your preferred model from the dropdown

> **Note**: The system automatically filters out any model "thinking" content (enclosed in `<thinking>` tags) to provide cleaner suggested responses.

