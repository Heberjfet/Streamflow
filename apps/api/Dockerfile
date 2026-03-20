FROM deno:2-alpine

WORKDIR /app

# Install dependencies
RUN apt-get update && apt-get install -y curl ffmpeg

# Copy files
COPY . .

# Expose port
EXPOSE 8000

# Run
CMD ["run", "-A", "src/main.ts"]
