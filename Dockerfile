FROM node:18-alpine

# Install build dependencies for native modules
RUN apk add --no-cache python3 py3-setuptools make g++ git

# Create app directory
WORKDIR /app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
COPY package*.json ./

# Install dependencies using environment variable for Python path
ENV PYTHON=/usr/bin/python3
RUN npm install 
# Bundle app source
COPY . .

# Expose the port the app runs on
EXPOSE 8081

# Command to run the application
CMD ["node", "server.js"] 