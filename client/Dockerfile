FROM node:18 as build

WORKDIR /app
COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

FROM nginx:alpine

# Copy React build
COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom nginx config (IMPORTANT)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80