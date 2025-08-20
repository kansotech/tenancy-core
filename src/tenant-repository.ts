import { prisma } from "./prisma";
import { Tenant, ResourceOwnership, ResourceAccess, ResourceType, AccountId, ResourceId, TenantAccess, TenantId, RoleId, Role, Resource } from "./types";

export interface TenantRepository {

    createTenant({ tenant }: { tenant: Tenant }): Promise<Tenant | null>;
    getTenant({ id }: { id: TenantId }): Promise<Tenant | null>;
    getTenantAccess({ accountId, tenantId }: { accountId: AccountId, tenantId: string }): Promise<TenantAccess | null>;

    createResource({ resource }: { resource: Resource }): Promise<Resource | null>;

    createResourceOwnership({ resourceOwnership }: { resourceOwnership: ResourceOwnership }): Promise<ResourceOwnership | null>;
    changeOwnership({ resourceId, resourceType, newOwnerId }: { resourceId: ResourceId, resourceType: ResourceType, newOwnerId: TenantId }): Promise<ResourceOwnership | null>;
    getResourceOwnership({ resourceId, resourceType }: { resourceId: ResourceId, resourceType: ResourceType }): Promise<ResourceOwnership | null>;

    createResourceAccess({ accountId, resourceId, roleId, resourceType }: { accountId: AccountId, resourceId: ResourceId, roleId: RoleId, resourceType: ResourceType }): Promise<ResourceAccess | null>;
    deleteResourceAccess({ accountId, resourceId, resourceType }: { accountId: AccountId, resourceId: ResourceId, resourceType: ResourceType }): Promise<ResourceAccess | null>;
    getResourceAccess({ accountId, resourceId, resourceType }: { accountId: AccountId, resourceId: ResourceId, resourceType: ResourceType }): Promise<ResourceAccess | null>;

    createRole({ role }: { role: Role }): Promise<Role | null>;


}
