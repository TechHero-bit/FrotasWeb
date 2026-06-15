import { inject } from '@angular/core';
import { CanActivateChildFn, CanActivateFn, Router, RouterStateSnapshot, UrlTree } from '@angular/router';

import { AdminAccessDeniedError, SupabaseService } from '../services/supabase.service';

async function validateAdminAccess(state: RouterStateSnapshot): Promise<boolean | UrlTree> {
  const router = inject(Router);
  const supabaseService = inject(SupabaseService);

  try {
    const adminSession = await supabaseService.getCurrentAdminSession();

    if (adminSession) {
      return true;
    }

    return router.createUrlTree(['/login'], {
      queryParams: {
        returnUrl: state.url
      }
    });
  } catch (error) {
    const reason = error instanceof AdminAccessDeniedError ? 'restricted' : 'unauthenticated';

    return router.createUrlTree(['/login'], {
      queryParams: {
        reason,
        returnUrl: state.url
      }
    });
  }
}

export const authGuard: CanActivateFn = async (_route, state): Promise<boolean | UrlTree> =>
  validateAdminAccess(state);

export const authChildGuard: CanActivateChildFn = async (_route, state): Promise<boolean | UrlTree> =>
  validateAdminAccess(state);
