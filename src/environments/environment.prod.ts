import { environmentDefault } from './default';

export const environment = {
  ...environmentDefault,
  production: true,
  backend: 'https://cafe.vertexhost.cloud/api',
  Socket: 'https://cafe.vertexhost.cloud',
  jwtKey: 'jwtToken'
};