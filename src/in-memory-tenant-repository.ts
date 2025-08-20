import { Tenant, Role, Resource, ResourceOwnership, ResourceAccess, ResourceType, ResourceId, AccountId, RoleId, TenantId, TenantAccess } from "./types";
import { TenantRepository } from "./tenant-repository";

export class InMemoryTenantRepository implements TenantRepository {

    private tenants: Map<string, Tenant> = new Map();
    private roles: Map<string, Role> = new Map();
    private resources: Map<ResourceType, Resource[]> = new Map();
    private resourceOwnerships: Map<string | number, ResourceOwnership> = new Map();
    private resourceAccesses: Map<string, ResourceAccess[]> = new Map();

    async addTenants(tenants: Tenant[]): Promise<boolean> {
        for (const tenant of tenants) {
            if (this.tenants.has(tenant.id)) {
                throw new Error(`Tenant with id ${tenant.id} already exists.`);
            }
        }

        for (const tenant of tenants) {
            this.tenants.set(tenant.id, tenant);
        }

        return true;
    }

    getTenantAccess({ accountId, tenantId }: { accountId: AccountId; tenantId: string; }): Promise<TenantAccess | null> {
        throw new Error("Method not implemented.");
    }
    createResourceOwnership({ resourceOwnership }: { resourceOwnership: ResourceOwnership; }): Promise<ResourceOwnership | null> {
        throw new Error("Method not implemented.");
    }
    changeOwnership({ resourceId, resourceType, newOwnerId }: { resourceId: ResourceId; resourceType: ResourceType; newOwnerId: TenantId; }): Promise<ResourceOwnership | null> {
        throw new Error("Method not implemented.");
    }
    createResourceAccess({ accountId, resourceId, roleId, resourceType }: { accountId: AccountId; resourceId: ResourceId; roleId: RoleId; resourceType: ResourceType; }): Promise<ResourceAccess | null> {
        throw new Error("Method not implemented.");
    }
    deleteResourceAccess({ accountId, resourceId, resourceType }: { accountId: AccountId; resourceId: ResourceId; resourceType: ResourceType; }): Promise<ResourceAccess | null> {
        throw new Error("Method not implemented.");
    }

    async createRole({ role }: { role: Role }): Promise<Role | null> {
        if (this.roles.has(role.id)) {
            throw new Error(`Role with id ${role.id} already exists.`);
        }
        this.roles.set(role.id, role);
        return role;
    }

    // Tenant operations
    async createTenant({ tenant }: { tenant: Tenant }): Promise<Tenant | null> {
        if (this.tenants.has(tenant.id)) {
            return null;
        }
        this.tenants.set(tenant.id, tenant);
        return tenant;
    }

    async getTenant({ id }: { id: TenantId }): Promise<Tenant | null> {
        return this.tenants.get(id) || null;
    }

    async removeTenant({ id }: { id: TenantId }): Promise<boolean> {
        return this.tenants.delete(id);
    }

    // Role operations
    async addRole(role: Role): Promise<boolean> {
        this.roles.set(role.id, role);
        return true;
    }

    async getRole(roleId: RoleId): Promise<Role | undefined> {
        return this.roles.get(roleId);
    }

    async removeRole(roleId: RoleId): Promise<boolean> {
        return this.roles.delete(roleId);
    }

    // Resource operations
    async createResource({ resource, resourceType }: { resource: Resource, resourceType: ResourceType }): Promise<Resource | null> {
        const resources = this.resources.get(resourceType) || [];
        resources.push(resource);
        this.resources.set(resourceType, resources);
        return resource;
    }

    // Resource ownership operations
    async addResourceOwnership(ownership: ResourceOwnership): Promise<boolean> {
        this.resourceOwnerships.set(ownership.resourceId, ownership);
        return true;
    }

    async getResourceOwnership({ resourceId }: { resourceId: ResourceId }): Promise<ResourceOwnership | null> {
        return this.resourceOwnerships.get(resourceId) || null;
    }

    async changeResourceOwnership({ resourceId, newTenantId }: { resourceId: ResourceId, newTenantId: TenantId }): Promise<boolean> {
        const ownership = this.resourceOwnerships.get(resourceId);
        if (!ownership) {
            return false;
        }
        const tenant = this.tenants.get(newTenantId);
        if (!tenant) {
            return false;
        }
        ownership.tenantId = newTenantId;
        ownership.tenant = tenant;
        return true;
    }

    // Resource access operations
    async addResourceAccess(access: ResourceAccess): Promise<boolean> {
        const accesses = this.resourceAccesses.get(access.accountId) || [];
        accesses.push(access);
        this.resourceAccesses.set(access.accountId, accesses);
        return true;
    }

    async getResourceAccess({ accountId }: { accountId: AccountId }): Promise<ResourceAccess | null> {
        const accesses = this.resourceAccesses.get(accountId);
        return accesses ? accesses[0] : null;
    }

    async removeResourceAccess({ accountId, resourceId }: { accountId: AccountId, resourceId: ResourceId }): Promise<boolean> {
        const accesses = this.resourceAccesses.get(accountId);
        if (!accesses) {
            return false;
        }
        const filteredAccesses = accesses.filter(access => access.resourceId !== resourceId);
        this.resourceAccesses.set(accountId, filteredAccesses);
        return true;
    }

    async changeResourceAccessRole(accountId: AccountId, resourceId: ResourceId, newRoleId: RoleId): Promise<boolean> {
        const accesses = this.resourceAccesses.get(accountId);
        if (!accesses) {
            return false;
        }
        const access = accesses.find(a => a.resourceId === resourceId);
        if (!access) {
            return false;
        }
        access.roleId = newRoleId;
        return true;
    }

    async getResource(resourceId: ResourceId, resourceType: ResourceType): Promise<Resource | undefined> {
        const resources = this.resources.get(resourceType);
        return resources?.find(resource => resource.id === resourceId);
    }

    async getResources(resourceType: ResourceType): Promise<Resource[]> {
        return this.resources.get(resourceType) || [];
    }

}
