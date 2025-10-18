import { Socket } from "dgram";
import { environmentDefault } from "./default";

export const environment = {
    ...environmentDefault,
    production: false ,
     backend: 'http://localhost:3000/api',  // ← Cambiado
    Socket: 'http://localhost:3000',       // ← Cambiado
    jwtKey: 'jwtToken' // Key para localStorage
  };
  