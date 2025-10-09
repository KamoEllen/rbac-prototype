import { Elysia } from 'elysia';
import { checkPermission, type Module, type Action } from '../../core/permissions/checker';

export function requirePermission(module: Module, action: Action) {
  return new Elysia({ name: `permission:${module}:${action}` })
    .derive(async ({ currentUser, query, body, set }: any) => {
      const teamId = query?.teamId || body?.teamId;

      if (!teamId) {
        set.status = 400;
        throw new Error('Bad Request: teamId required');
      }

      const hasPermission = await checkPermission(
        currentUser.id,
        teamId,
        module,
        action
      );

      if (!hasPermission) {
        set.status = 403;
        throw new Error(`Forbidden: Missing ${module}:${action} permission`);
      }

      return { teamId };
    });
}