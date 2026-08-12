import { AuthenticatedUser } from '../auth/decorators/current-user.decorator';

export function ownerWhere(user: AuthenticatedUser) {
  return user.organizationId
    ? { organizationId: user.organizationId }
    : { userId: user.id };
}

export function ownerData(user: AuthenticatedUser) {
  return {
    organizationId: user.organizationId ?? undefined,
    userId: user.organizationId ? undefined : user.id,
  };
}
