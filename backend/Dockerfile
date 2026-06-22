# Stage 1: Build
FROM node:20-alpine AS build

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY tsconfig.json ./
COPY src/ ./src/
RUN npx tsc

# Copy non-TypeScript files needed at runtime
COPY src/db/init.sql ./dist/db/init.sql

# Copy GeoJSON boundary files (used by backend to enumerate countries for batch clipping)
# Files are provided in the build context at build time.
RUN mkdir -p /app/geojson
COPY geojson/ /app/geojson/

# Stage 2: Production
FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install --omit=dev

COPY --from=build /app/dist ./dist
COPY --from=build /app/geojson /app/geojson

EXPOSE 4000

CMD ["node", "dist/index.js"]