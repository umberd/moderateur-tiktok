# Tiktok Chat Moderator

## Description

Connectez-vous à un chat live TikTok et accédez à des fonctionnalités supplémentaires pour maîtriser votre expérience TikTok Live.

- Modération du chat (affichage des raisons et notifications)
- Bot qui répond aux utilisateurs
- Liste d'amis et d'indésirables
- Notification lors d'un contenu modéré ou de l'arrivée d'un ami/indésirable
- Export du chat
- Recherche dans le chat
- Affichage des likes par utilisateur
- Affichage des cadeaux par utilisateur
- Affichage du flux vidéo live TikTok
- Enregistrement du flux vidéo live TikTok
- Transcription en direct (sous-titres) du flux vidéo TikTok Live et exportation
- Liste de préfixes de messages (mazic:) (pour liste de musique, votes, questions)
- OpenAI pour modération, réponses du bot, transcription
- Ollama pour modération, réponses du bot

Pour utiliser OpenAI, vous aurez besoin d'une clé API (OPENAI_API_KEY).
Pour Ollama, lancez simplement le serveur sur votre ordinateur.


## Installation

Pour exécuter localement le lecteur de chat, suivez ces étapes :

1. Installez [Node.js](https://nodejs.org/) sur votre système
2. Clonez ce dépôt ou téléchargez-le et extrayez-le
3. Ouvrez une console/terminal dans le répertoire racine du projet
4. Exécutez `npm i` pour installer toutes les dépendances nécessaires
5. Exécutez `cd frontend && npm install && npm run build`
6. Lancez `node server.js` pour démarrer le serveur d'application

Vous devriez maintenant voir le message suivant : `Server running! Please visit http://localhost:8081`<br>
Ouvrez simplement http://localhost:8081/ dans votre navigateur. C’est tout.


## Exécution avec Electron
Développement

`npm start`

Construction
```
npm run pack
npm run dist
npx electron-builder --win
npx electron-builder --mac
```


## Stack Technique

Backend
- node
- express
- socket.io
- sqlite
- tiktoklive-connector
- openai

Frontend
- vite
- react
- tailwindcss
- flv.js
- openai

Electron
- pour générer des exécutables pour Windows, Mac, Linux

Docker
- pour une exécution dans un conteneur, utilisez docker-compose

Ollama
- lancez votre serveur Ollama avec `ollama serve` sur le port 11434




# English

## Description

Connect to a Tiktok live chat and provides additional functionalities to master your tiktok live experience

- Moderate chat (show reason and notifications)
- Provide a bot that will respond to users
- Friend and Undesirable list
- Notification on moderated content, friend/undesirable join
- Export Chat
- Search in chat
- Show likes per user
- Show gifts per user
- Show Tiktok live video stream
- Reccord Tiktok live video stream
- Live Transcript (subtitle) of Tiktok live video stream and export
- prefix message list (mazic:) (for music list, votes, questions)
- OpenAi for moderation, bot responses, transcription
- Ollama for moderation, bot responses


For OpenAi, you need a OPENAI_API_KEY
For ollama, just run it on your computer



## Installation
To run the chat reader locally, follow these steps:

1. Install [Node.js](https://nodejs.org/) on your system
2. Clone this repository or download and extract 
3. Open a console/terminal in the root directory of the project
4. Enter `npm i` to install all required dependencies 
5. Enter `cd frontend && npm install && npm run build`
5. Enter `node server.js` to start the application server

Now you should see the following message: `Server running! Please visit http://localhost:8081`<br>
Simply open http://localhost:8081/ in your browser. Thats it.




## Run in electron
Developpement

`npm start`

Build
`npm run pack`
`npm run dist`
`npx electron-builder --win`
`npx electron-builder --mac`



## Tech stack

Backend
- node
- express
- socket.io
- sqlite
- tiktoklive-connector
- openai

Frontend
- vite
- react
- tailwindcss
- flv.js
- openai

Electron
- for building executable for windows, mac, linux

Docker
- For running on a container, use docker-compose

Ollama
- run your ollama server `ollama serve` on port 11434




