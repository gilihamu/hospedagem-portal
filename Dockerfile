# ── Frontend (React + Vite) ───────────────────────────────────
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .

ARG VITE_API_URL=/api
ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_ENV=production

RUN npm run build

# ── Serve with nginx ─────────────────────────────────────────
FROM nginx:alpine AS final

# Remove default config
RUN rm /etc/nginx/conf.d/default.conf

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
