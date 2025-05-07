FROM node:22

# Set ARGs For Image Build
ARG NODE_ENV=production
ARG PROJECT_PATH=/opt/app/

# Set ENVs For Container
ENV NODE_ENV=$NODE_ENV
ENV PROJECT_PATH=$PROJECT_PATH

# Install PM2 globally
RUN npm i pm2 -g

# Copy Run Script
COPY ./run.sh /usr/bin/run

# Set Run Ownership
RUN chmod 700 /usr/bin/run

# Set Final Workdir
WORKDIR /opt/app