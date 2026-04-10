import { environmentDefault } from "./default";

export const environment = {
    ...environmentDefault,
    production: false ,

     backend: 'http://localhost:3000/api',
     Socket: 'http://localhost:3000',
    jwtKey: 'jwtToken' // Key para localStorage
  };
  