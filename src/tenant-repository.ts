import { Tenant, ResourceOwnership, ResourceAccess, ResourceType, AccountId, ResourceId, TenantAccess, TenantId, RoleId, Role, Resource, Account } from "./types";

export interface TenantRepository {

    createTenant({ tenant }: { tenant: Tenant }): Promise<Tenant | null>;
    getTenant({ id }: { id: TenantId }): Promise<Tenant | null>;
    getAllTenants(): Promise<Tenant[]>;
    getTenantAccess({ accountId, tenantId }: { accountId: AccountId, tenantId: string }): Promise<TenantAccess | null>;
    getAllTenantAccesses(): Promise<TenantAccess[]>;
    createTenantAccess({ accountId, tenantId, roleId }: { accountId: AccountId, tenantId: TenantId, roleId: RoleId }): Promise<TenantAccess | null>;

    createResourceOwnership({ resourceOwnership }: { resourceOwnership: ResourceOwnership }): Promise<ResourceOwnership | null>;
    changeOwnership({ resourceId, resourceType, newOwnerId }: { resourceId: ResourceId, resourceType: ResourceType, newOwnerId: TenantId }): Promise<ResourceOwnership | null>;
    getResourceOwnership({ resourceId, resourceType }: { resourceId: ResourceId, resourceType: ResourceType }): Promise<ResourceOwnership | null>;
    getAllResourceOwnerships(): Promise<ResourceOwnership[]>;

    createResource({ resource }: { resource: Resource }): Promise<Resource | null>;
    getAllResources(): Promise<Resource[]>;
    createResourceAccess({ accountId, resourceId, roleId, resourceType }: { accountId: AccountId, resourceId: ResourceId, roleId: RoleId, resourceType: ResourceType }): Promise<ResourceAccess | null>;
    deleteResourceAccess({ accountId, resourceId, resourceType }: { accountId: AccountId, resourceId: ResourceId, resourceType: ResourceType }): Promise<ResourceAccess | null>;
    getResourceAccess({ accountId, resourceId, resourceType }: { accountId: AccountId, resourceId: ResourceId, resourceType: ResourceType }): Promise<ResourceAccess | null>;
    getAllResourceAccesses(): Promise<ResourceAccess[]>;
    getResourcesOf({ accountId, resourceType }: { accountId: AccountId, resourceType: ResourceType }): Promise<Resource[]>;

    createRole({ role }: { role: Role }): Promise<Role | null>;
    getAllRoles(): Promise<Role[]>;
    
    createAccount({ account }: { account: Account }): Promise<Account | null>;
    getAllAccounts(): Promise<Account[]>;
    getAccount({ id }: { id: AccountId }): Promise<Account | null>;

}
