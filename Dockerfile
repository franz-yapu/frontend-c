
# Build Angular
# BUILD_CMD elige la variante: 'buildcafe' (dominio, por defecto),
# 'buildprod' o 'buildlocal' (backend local para pruebas en Docker).
FROM node:20-alpine AS build
ARG BUILD_CMD=buildcafe
WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps
COPY . .
RUN npm run ${BUILD_CMD}

# Servir con Nginx
FROM nginx:alpine
COPY --from=build /app/dist/frontend-angular/browser/ /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]