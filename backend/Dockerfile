FROM denoland/deno:2.0

WORKDIR /app

COPY deno.json ./

RUN deno cache src/server.ts

COPY src/ ./src/

USER deno

EXPOSE 3001

CMD ["deno", "task", "start"]
