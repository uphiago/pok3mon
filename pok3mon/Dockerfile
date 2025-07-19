FROM node:20-bullseye-slim AS build

WORKDIR /app

# ARG BASE_PATH="/"
# ENV BASE_PATH=${BASE_PATH}

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build


FROM node:20-alpine AS runtime

ENV NODE_ENV=production
ENV PORT=3000

WORKDIR /app

RUN npm install --global serve@14

COPY --from=build /app/dist ./dist

USER node

EXPOSE 3000

CMD ["sh", "-c", "serve -s dist -p ${PORT}"]