FROM node:18.10.0-bullseye-slim

WORKDIR /asset-input
COPY ui /asset-input

RUN useradd -ms /bin/bash builduser
RUN chown -R builduser: /asset-input
USER builduser

ENV npm_config_cache=/home/builduser/.npm

RUN npm install --include=dev
RUN ln -s node_modules/vite/bin/vite.js

CMD [ "npx", "vite", "--port", "80", "--host" ]
