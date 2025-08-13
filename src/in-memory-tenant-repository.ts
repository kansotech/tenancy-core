import { Tenant, Role, Resource, ResourceOwnership, ResourceAccess, ResourceType } from "./types";
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

    async addRoles(roles: Role[]): Promise<boolean> {
        for (const role of roles) {
            if (this.roles.has(role.id)) {
                throw new Error(`Role with id ${role.id} already exists.`);
            }
        }

        for (const role of roles) {
            this.roles.set(role.id, role);
        }

        return true;
    }

    // Tenant operations
    async addTenant(tenant: Tenant): Promise<boolean> {
        if (this.tenants.has(tenant.id)) {
            return false;
        }
        this.tenants.set(tenant.id, tenant);
        return true;
    }

    async getTenant(tenantId: string): Promise<Tenant | undefined> {
        return this.tenants.get(tenantId);
    }

    async removeTenant(tenantId: string): Promise<boolean> {
        return this.tenants.delete(tenantId);
    }

    // Role operations
    async addRole(role: Role): Promise<boolean> {
        this.roles.set(role.id, role);
        return true;
    }

    async getRole(roleId: string): Promise<Role | undefined> {
        return this.roles.get(roleId);
    }

    async removeRole(roleId: string): Promise<boolean> {
        return this.roles.delete(roleId);
    }

    // Resource operations
    async addResource(resource: Resource, resourceType: ResourceType): Promise<boolean> {
        const resources = this.resources.get(resourceType) || [];
        resources.push(resource);
        this.resources.set(resourceType, resources);
        return true;
    }

    // Resource ownership operations
    async addResourceOwnership(ownership: ResourceOwnership): Promise<boolean> {
        this.resourceOwnerships.set(ownership.resourceId, ownership);
        return true;
    }

    async getResourceOwnership(resourceId: string | number): Promise<ResourceOwnership | undefined> {
        return this.resourceOwnerships.get(resourceId);
    }

    async changeResourceOwnership(resourceId: string | number, newTenantId: string): Promise<boolean> {
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

    async getResourceAccess(accountId: string): Promise<ResourceAccess[]> {
        return this.resourceAccesses.get(accountId) || [];
    }

    async removeResourceAccess(accountId: string, resourceId: string | number): Promise<boolean> {
        const accesses = this.resourceAccesses.get(accountId);
        if (!accesses) {
            return false;
        }
        const filteredAccesses = accesses.filter(access => access.resourceId !== resourceId);
        this.resourceAccesses.set(accountId, filteredAccesses);
        return true;
    }

    async changeResourceAccessRole(accountId: string, resourceId: string | number, newRoleId: string): Promise<boolean> {
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

    async getResource(resourceId: string | number, resourceType: ResourceType): Promise<Resource | undefined> {
        const resources =  this.resources.get(resourceType);
        return resources?.find(resource => resource.id === resourceId);
    }

    async getResources(resourceType: ResourceType): Promise<Resource[]> {
        return this.resources.get(resourceType) || [];
    }

}
