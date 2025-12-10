# ---------- Base Image ----------
FROM node:18-alpine AS builder

# ---------- Working Directory ----------
WORKDIR /app

COPY package*.json ./
RUN npm install --legacy-peer-deps

# ---------- Copy All Project Files ----------
COPY . .

# ---------- Build TypeScript -> JavaScript ----------
RUN npm run build



# ---------- Production Image ----------
FROM node:18-alpine AS production

WORKDIR /app
ENV NODE_ENV=production

# Install only production dependencies
COPY package*.json ./
RUN npm install --only=production --legacy-peer-deps

# Copy built files
COPY --from=builder /app/dist ./dist

# Expose NestJS port
EXPOSE 3000

# Run NestJS in production mode
CMD ["npm", "run", "start:prod"]
