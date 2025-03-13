# TikTok Chat Reader - Docker Setup

This repository contains Docker configuration for the TikTok Chat Reader application.

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)
- (Optional) Access to an Ollama server for AI model processing

## Getting Started

1. Clone the repository:


2. Create a `.env` file in the root directory with your configuration:
   ```
   # Copy the template
   cp .env.example .env
   
   # Edit the file with your settings
   nano .env
   ```
   
   At minimum, you'll need to set your OpenAI API key:
   ```
   OPENAI_API_KEY=your_openai_api_key
   ```

3. Build and start the container:
   ```
   docker-compose up -d --build
   ```

4. Access the application at `http://localhost:8081`

## Configuration Options

The application can be configured through environment variables in your `.env` file:

- `OPENAI_API_KEY` - Your OpenAI API key (required for OpenAI features)
- `SESSIONID` - TikTok session ID (optional)
- `OLLAMA_HOST` - URL to your Ollama server (optional)
- `ENABLE_RATE_LIMIT` - Enable rate limiting (optional)
- `PORT` - Port for the application (defaults to 8081)

## Using Ollama with TikTok Chat Reader

To use Ollama with this application, you'll need:

1. An Ollama server running somewhere accessible to this container
2. Configure your `.env` file with the appropriate Ollama host URL:

   - If running Ollama on your host machine:  
     `OLLAMA_HOST=http://host.docker.internal:11434`
     
   - If running Ollama in another container:  
     `OLLAMA_HOST=http://ollama:11434` (requires setting up a network between containers)

### Setting Up Your Own Ollama Server

If you don't have an Ollama server yet, you can:

1. Run Ollama locally: https://ollama.com/download
2. Set up Ollama in a separate Docker container:
   ```
   docker run -d --name ollama -p 11434:11434 -v ollama-data:/root/.ollama ollama/ollama
   ```
3. Pull models on your Ollama server:
   ```
   ollama pull llama3
   ```

## Troubleshooting

### Build Issues

- **Python dependency errors**: The Dockerfile uses Alpine's package manager to install Python and related packages. If you see errors about Python packages, try using Alpine's package manager:
  ```
  # In the Dockerfile, use apk instead of pip:
  RUN apk add --no-cache python3 py3-setuptools make g++ git
  ```

- **npm Python configuration error**: With newer npm versions (10+), the `npm config set python` command is no longer supported. Use environment variables instead:
  ```
  # In the Dockerfile, use environment variable:
  ENV PYTHON=/usr/bin/python3
  RUN npm install --build-from-source
  ```

- **Externally managed environment errors**: Newer Alpine/Python versions implement PEP 668, which prevents pip from modifying system Python. Use Alpine packages (py3-*) instead of pip when possible.

- **Native module compilation failures**: If you see errors related to compiling native modules, you may need to modify the Dockerfile to include additional dependencies for your platform:
  ```
  # For additional development tools:
  RUN apk add --no-cache python3 py3-setuptools make g++ git libc6-compat
  ```

- **Missing environment variables**: Make sure your `.env` file exists and contains the necessary configuration.

### Runtime Issues

- **Error connecting to TikTok**: Make sure you've provided a valid `SESSIONID` if needed
- **Ollama connection error**: Check that your OLLAMA_HOST is correct and the Ollama server is accessible
- **Container fails to start**: Check logs using `docker-compose logs app`
- **Application not responding**: The container includes a healthcheck that will automatically restart the application if it becomes unresponsive

## Rebuilding After Changes

If you make changes to the code or configuration:

```
docker-compose down
docker-compose up -d --build
```

## Stopping the Application

```
docker-compose down
``` 