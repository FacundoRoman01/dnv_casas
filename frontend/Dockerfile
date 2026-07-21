# --- Build ---
FROM node:20-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# Vite hornea las VITE_* en build time — el browser corre en el host,
# así que la API se alcanza por el puerto publicado, no por el nombre del servicio.
ARG VITE_API_URL=http://localhost:5254/api
ENV VITE_API_URL=$VITE_API_URL

# Sin default a propósito: si falta o es un placeholder, vite.config.js hace
# fallar el build. Un número de WhatsApp muerto rompe las 16 CTAs del sitio
# en silencio, así que es mejor que reviente acá.
ARG VITE_WHATSAPP
ENV VITE_WHATSAPP=$VITE_WHATSAPP

# Opcional: sin esto el link de Instagram no se muestra.
ARG VITE_INSTAGRAM
ENV VITE_INSTAGRAM=$VITE_INSTAGRAM

# Escotilla para buildear en local sin el número real. El pipeline de deploy
# simplemente no la pasa.
ARG ALLOW_PLACEHOLDER_WHATSAPP
ENV ALLOW_PLACEHOLDER_WHATSAPP=$ALLOW_PLACEHOLDER_WHATSAPP

COPY . .
RUN npm run build

# --- Serve ---
FROM nginx:alpine AS runtime
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
