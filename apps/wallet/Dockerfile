FROM node:alpine AS development

WORKDIR /app

COPY package.json /app
COPY yarn.lock /app

RUN yarn install

COPY . .

RUN yarn run build

FROM node:alpine AS production

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

WORKDIR /app

COPY package.json /app
COPY yarn.lock /app


RUN yarn install --prod

COPY --from=development /app/dist ./dist

CMD ["node", "dist/app/wallet/main"]