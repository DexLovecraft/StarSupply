# Étape 1 : Build avec Node.js
FROM node:20 AS builder
WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer les dépendances
RUN npm install

# Copier le reste du projet
COPY . .

EXPOSE 80