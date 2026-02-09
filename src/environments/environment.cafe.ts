import { environmentDefault } from './default';

export const environment = {
  ...environmentDefault,
  production: true,
  backend: 'https://caritas.vertexhost.cloud/api',
  Socket: 'https://caritas.vertexhost.cloud',
  jwtKey: 'jwtToken'
};