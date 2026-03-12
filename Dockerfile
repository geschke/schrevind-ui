FROM node:24-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY src ./src
COPY public ./public
COPY index.html .
COPY vite.config.ts .
COPY tsconfig*.json .
COPY env.d.ts .

RUN npm run build


FROM nginx:1.28-alpine

COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

# runtime config template must be available in the container
COPY deploy/config.template.js /usr/share/nginx/html/config.template.js

# entrypoint must be installed and used
COPY deploy/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 80
ENTRYPOINT ["/entrypoint.sh"]