FROM node:18

# ✅ Install netcat
RUN apt-get update && apt-get install -y netcat-openbsd

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

COPY wait-for-it.sh .
RUN chmod +x wait-for-it.sh

EXPOSE 5001

CMD ["sh", "-c", "./wait-for-it.sh db npm run dev"]