FROM ubuntu:22.04

# Prevent interactive timezone/keyboard prompts during package install
ENV DEBIAN_FRONTEND=noninteractive
ENV PYTHONUNBUFFERED=1

# Install compilers and runtimes for Python, Node.js, C, C++, and Java
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    nodejs \
    npm \
    gcc \
    g++ \
    openjdk-17-jdk-headless \
    golang-go \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Security: Create non-root unprivileged runner user
RUN useradd -m -s /bin/bash sandbox

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

# Set permissions
RUN chown -R sandbox:sandbox /app

EXPOSE 2000

USER sandbox

CMD ["node", "server.js"]
