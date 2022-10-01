FROM node:18.10.0-bullseye-slim

WORKDIR /app
COPY ui /app
RUN npm install --include=dev
RUN ln -s node_modules/vite/bin/vite.js

CMD [ "npx", "vite", "--port", "80", "--host" ]
