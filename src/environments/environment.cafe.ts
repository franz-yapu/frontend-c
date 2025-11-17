import { environmentDefault } from './default';

export const environment = {
  ...environmentDefault,
  production: true,
  backend: 'https://vertexhost.cloud/api/',
  Socket: 'https://vertexhost.cloud',
  jwtKey: 'jwtToken'
};