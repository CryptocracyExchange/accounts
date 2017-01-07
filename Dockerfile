FROM node:7.4-alpine


WORKDIR /usr/local/accounts
COPY . /usr/local/accounts
RUN apk add --no-cache make gcc g++ python zeromq zeromq-dev
RUN npm install

ENV DEEPSTREAM_AUTH_ROLE=provider \
    DEEPSTREAM_AUTH_USERNAME=accounts-service

# Define default command.
CMD [ "npm", "run", "start-prod"]

EXPOSE 8999
