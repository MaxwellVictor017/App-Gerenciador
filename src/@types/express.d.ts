import { Tenant } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      tenant_id?: string;
      tenantId?: string;
      tenant?: Tenant;
    }
  }
}
