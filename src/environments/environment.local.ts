import { environmentDefault } from './default';

// Variante para pruebas en local con Docker (sin dominio).
// Apunta al backend del stack docker-compose publicado en el host (puerto 8090).
// Las builds de dominio (environment.cafe.ts / environment.prod.ts) siguen intactas.
export const environment = {
  ...environmentDefault,
  production: true,
  backend: 'http://localhost:8090/api',
  Socket: 'http://localhost:8090',
  jwtKey: 'jwtToken',
};
