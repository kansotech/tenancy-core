import { Tenant, Role, Resource, ResourceOwnership, ResourceAccess, ResourceType } from "./types";

export interface TenantRepository {
    // Tenant operations
    addTenant(tenant: Tenant): Promise<boolean>;
    addTenants(tenants: Tenant[]): Promise<boolean>;
    getTenant(tenantId: string): Promise<Tenant | undefined>;
    removeTenant(tenantId: string): Promise<boolean>;

    // Role operations
    addRole(role: Role): Promise<boolean>;
    addRoles(roles: Role[]): Promise<boolean>;
    getRole(roleId: string): Promise<Role | undefined>;
    removeRole(roleId: string): Promise<boolean>;

    // Resource operations
    addResource(resource: Resource, resourceType: ResourceType): Promise<boolean>;
    getResource(resourceId: string | number, resourceType: ResourceType): Promise<Resource | undefined>;
    getResources(resourceType: ResourceType): Promise<Resource[]>;

    // Resource ownership operations
    addResourceOwnership(ownership: ResourceOwnership): Promise<boolean>;
    getResourceOwnership(resourceId: string | number): Promise<ResourceOwnership | undefined>;
    changeResourceOwnership(resourceId: string | number, newTenantId: string): Promise<boolean>;

    // Resource access operations
    addResourceAccess(access: ResourceAccess): Promise<boolean>;
    getResourceAccess(accountId: string): Promise<ResourceAccess[]>;
    removeResourceAccess(accountId: string, resourceId: string | number): Promise<boolean>;
    changeResourceAccessRole(accountId: string, resourceId: string | number, newRoleId: string): Promise<boolean>;


}
