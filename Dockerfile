FROM node:10-alpine AS deps

WORKDIR /app
COPY package.json .
COPY yarn.lock .

RUN apk --update add --virtual build_deps \
    build-base libc-dev linux-headers python
RUN yarn

FROM node:10-alpine
WORKDIR /app
RUN apk --update add tzdata chromium chromium-chromedriver
RUN ln -sf /usr/share/zoneinfo/Asia/Singapore /etc/localtime
RUN echo "Asia/Singapore" >  /etc/timezone
COPY . .
COPY --from=deps /app/node_modules ./node_modules
RUN yarn
CMD [ "yarn", "start" ]
