# --- Build Stage ---
FROM node:24-alpine AS builder
ENV CI=true
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

# Si manejas variables de entorno para Vite (VITE_API_URL, etc.), decláralas como ARG
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml* ./
RUN pnpm install --frozen-lockfile --config.strict-dep-builds=false --config.confirmModulesPurge=false

COPY . .
RUN pnpm run build

# --- Production Stage ---
FROM nginx:alpine-slim
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]