import { Socket } from "dgram";
import { environmentDefault } from "./default";

export const environment = {
    ...environmentDefault,
    production: false ,
     backend: 'http://www.vertexhost.cloud/api',  // ← Cambiado
    Socket: 'http://www.vertexhost.cloud',       // ← Cambiado
    jwtKey: 'jwtToken' // Key para localStorage
  };