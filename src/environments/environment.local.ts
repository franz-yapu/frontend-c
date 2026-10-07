import { environmentDefault } from './default';

// Variante para pruebas en local con Docker (sin dominio).
// Apunta al backend del stack docker-compose publicado en el host (puerto 8090).
// Las builds de dominio (environment.cafe.ts / environment.prod.ts) siguen intactas.
//
// Se usa la IP de la PC en la red (192.168.31.112) y no 'localhost' a proposito:
// asi la misma compilacion sirve para verlo en el navegador de la PC Y en el
// movil. Desde el movil 'localhost' seria el propio telefono y no encontraria
// nada. Si cambia la IP de la PC, hay que actualizarla aqui.
export const environment = {
  ...environmentDefault,
  production: true,
  backend: 'http://192.168.31.112:8090/api',
  Socket: 'http://192.168.31.112:8090',
  jwtKey: 'jwtToken',
};
