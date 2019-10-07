FROM node:10-alpine as build

WORKDIR /app

ADD package.json .
ADD yarn.lock .
ADD .yarnclean .

RUN yarn

ADD . .

RUN yarn tsc

FROM node:10-alpine as App

COPY --from=build /app/node_modules/ /app/node_modules/
COPY --from=build /app/dist/ /app/dist/
COPY --from=build /app/package.json /app/package.json
COPY --from=build /app/tsconfig.json /app/tsconfig.json

RUN ls -lah /app

ENV DEBUG=*

WORKDIR /app

CMD ["node", "dist/index"]
