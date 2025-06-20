# syntax = docker/dockerfile:1

# Adjust NODE_VERSION as desired
ARG NODE_VERSION=20.18.0
FROM node:${NODE_VERSION}-slim AS base

LABEL fly_launch_runtime="Node.js"

# Node.js app lives here
WORKDIR /app

# Set production environment
ENV NODE_ENV="production"
ARG YARN_VERSION=3.6.4

# Install Yarn 3
RUN corepack enable && \
    yarn set version ${YARN_VERSION}


# Throw-away build stage to reduce size of final image
FROM base AS build

# Install packages needed to build node modules
RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y build-essential node-gyp pkg-config python-is-python3

# Install node modules
COPY .yarn/plugins ./.yarn/plugins
COPY .yarnrc.yml package.json yarn.lock ./
RUN yarn install

# Copy application code
COPY . .


# Final stage for app image
FROM base

# Copy built application
COPY --from=build /app /app

# Copy and rename .env.production to .env
COPY .env.production /app/.env

# Start the server by default, this can be overwritten at runtime
EXPOSE 8080
CMD [ "yarn", "run", "start" ]
