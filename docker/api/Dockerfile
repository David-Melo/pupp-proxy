FROM node:22

# Set ARGs For Image Build
ARG NODE_ENV=production
ARG PROJECT_PATH=/opt/app/

# Set ENVs For Container
ENV NODE_ENV=$NODE_ENV
ENV PROJECT_PATH=$PROJECT_PATH

# Puppeteer & Chromium Dependencies
RUN apt-get update && apt-get install -y \
    wget \
    ca-certificates \
    fonts-liberation \
    libappindicator3-1 \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libgdk-pixbuf2.0-0 \
    libnspr4 \
    libnss3 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    libgbm1 \ 
    xdg-utils \
    --no-install-recommends && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Install PM2 globally
RUN npm i pm2 -g

# Install Puppeteer Browsers
RUN npx puppeteer browsers install chrome

# Copy Run Script
COPY ./run.sh /usr/bin/run

# Set Run Ownership
RUN chmod 700 /usr/bin/run

# Set Final Workdir
WORKDIR /opt/app