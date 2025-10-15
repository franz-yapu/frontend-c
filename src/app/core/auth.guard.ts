import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { GeneralService } from './gerneral.service';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
   const storage = inject(GeneralService);
/*     const translate = inject(TranslateService) */
  const isLoggedIn = storage.getToken() ; // o tu lógica de auth

  if (!isLoggedIn) {
    router.navigate(['/login']);
    return false;
  }

  return true;
};