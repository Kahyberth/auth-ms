# Dependencies stage
FROM oven/bun:1 AS dependencies

WORKDIR /usr/src/app

COPY package.json bun.lockb ./

RUN bun install



# Builder stage
FROM oven/bun:1 AS builder

WORKDIR /usr/src/app

COPY --from=dependencies /usr/src/app/node_modules node_modules

COPY . .

RUN bun run build

#RUN bun ci -f --only=production && bun cache clean --force



# Final stage
FROM oven/bun:1 AS final


USER root
RUN apt-get update \
  && apt-get install -y iputils-ping telnet \
  && rm -rf /var/lib/apt/lists/*


WORKDIR /usr/src/app

COPY --from=builder /usr/src/app/node_modules node_modules

COPY --from=builder /usr/src/app/dist dist




USER bun

EXPOSE 3001

CMD ["bun", "dist/main.js"]

