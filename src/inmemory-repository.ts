import { Tenant, Role, Resource, ResourceOwnership, ResourceAccess, ResourceType, ResourceId, AccountId, RoleId, TenantId, TenantAccess, Account } from "./types";
import { TenantRepository } from "./tenant-repository";

export class InMemoryTenantRepository implements TenantRepository {
    async createTenantAccess({ accountId, tenantId, roleId }: { accountId: AccountId; tenantId: TenantId; roleId: RoleId; }): Promise<TenantAccess | null> {
        const key = this.getTenantAccessKey(accountId, tenantId);
        
        if (this.tenantAccesses.has(key)) {
            return null;
        }

        const tenantAccess: TenantAccess = {
            accountId,
            tenantId,
            roleId,
            account: null,
            role: null,
            tenant: null
        };

        // Populate role with permissions if role exists
        const role = this.roles.get(roleId);
        if (role) {
            tenantAccess.role = role;
        }

        // Populate tenant if it exists
        const tenant = this.tenants.get(tenantId);
        if (tenant) {
            tenantAccess.tenant = tenant;
        }

        this.tenantAccesses.set(key, tenantAccess);
        return tenantAccess;
    }

    private tenants: Map<TenantId, Tenant> = new Map();
    private roles: Map<RoleId, Role> = new Map();
    private resources: Map<ResourceId, Resource> = new Map();
    private resourceOwnerships: Map<string, ResourceOwnership> = new Map(); // key: resourceId_resourceType
    private resourceAccesses: Map<string, ResourceAccess> = new Map(); // key: accountId_resourceId_resourceType
    private tenantAccesses: Map<string, TenantAccess> = new Map(); // key: accountId_tenantId
    private accounts: Map<AccountId, Account> = new Map();

    private getResourceOwnershipKey(resourceId: ResourceId, resourceType: ResourceType): string {
        return `${resourceId}_${resourceType ?? ''}`;
    }

    private getResourceAccessKey(accountId: AccountId, resourceId: ResourceId, resourceType: ResourceType): string {
        return `${accountId}_${resourceId}_${resourceType ?? ''}`;
    }

    private getTenantAccessKey(accountId: AccountId, tenantId: TenantId): string {
        return `${accountId}_${tenantId}`;
    }

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

    async getAllTenants(): Promise<Tenant[]> {
        return Array.from(this.tenants.values());
    }

    async getTenantAccess({ accountId, tenantId }: { accountId: AccountId, tenantId: string }): Promise<TenantAccess | null> {
        const key = this.getTenantAccessKey(accountId, tenantId);
        const tenantAccess = this.tenantAccesses.get(key);
        
        if (!tenantAccess) {
            return null;
        }

        // Populate role with permissions if role exists
        if (tenantAccess.roleId) {
            const role = this.roles.get(tenantAccess.roleId);
            if (role) {
                tenantAccess.role = role;
            }
        }

        return tenantAccess;
    }

    async getAllTenantAccesses(): Promise<TenantAccess[]> {
        return Array.from(this.tenantAccesses.values());
    }

    async createResource({ resource }: { resource: Resource }): Promise<Resource | null> {
        if (this.resources.has(resource.id)) {
            return null;
        }
        this.resources.set(resource.id, resource);
        return resource;
    }

    async createResourceOwnership({ resourceOwnership }: { resourceOwnership: ResourceOwnership }): Promise<ResourceOwnership | null> {
        const key = this.getResourceOwnershipKey(resourceOwnership.resourceId, resourceOwnership.resourceType);
        
        if (this.resourceOwnerships.has(key)) {
            return null;
        }

        this.resourceOwnerships.set(key, resourceOwnership);
        return resourceOwnership;
    }

    async changeOwnership({ resourceId, resourceType, newOwnerId }: { resourceId: ResourceId, resourceType: ResourceType, newOwnerId: TenantId }): Promise<ResourceOwnership | null> {
        const key = this.getResourceOwnershipKey(resourceId, resourceType);
        const ownership = this.resourceOwnerships.get(key);
        
        if (!ownership) {
            return null;
        }

        const tenant = this.tenants.get(newOwnerId);
        if (!tenant) {
            return null;
        }

        const updatedOwnership: ResourceOwnership = {
            ...ownership,
            tenantId: newOwnerId,
            tenant: tenant
        };

        this.resourceOwnerships.set(key, updatedOwnership);
        return updatedOwnership;
    }

    async getResourceOwnership({ resourceId, resourceType }: { resourceId: ResourceId, resourceType: ResourceType }): Promise<ResourceOwnership | null> {
        const key = this.getResourceOwnershipKey(resourceId, resourceType);
        return this.resourceOwnerships.get(key) || null;
    }

    async createResourceAccess({ accountId, resourceId, roleId, resourceType }: { accountId: AccountId, resourceId: ResourceId, roleId: RoleId, resourceType: ResourceType }): Promise<ResourceAccess | null> {
        const key = this.getResourceAccessKey(accountId, resourceId, resourceType);
        
        if (this.resourceAccesses.has(key)) {
            return null;
        }

        const resourceAccess: ResourceAccess = {
            accountId,
            resourceId,
            roleId,
            account: null,
            role: null,
            resource: null
        };

        // Populate role with permissions if role exists
        const role = this.roles.get(roleId);
        if (role) {
            resourceAccess.role = role;
        }

        // Populate resource if it exists
        const resource = this.resources.get(resourceId);
        if (resource) {
            resourceAccess.resource = resource;
        }

        this.resourceAccesses.set(key, resourceAccess);
        return resourceAccess;
    }

    async deleteResourceAccess({ accountId, resourceId, resourceType }: { accountId: AccountId, resourceId: ResourceId, resourceType: ResourceType }): Promise<ResourceAccess | null> {
        const key = this.getResourceAccessKey(accountId, resourceId, resourceType);
        const resourceAccess = this.resourceAccesses.get(key);
        
        if (!resourceAccess) {
            return null;
        }

        this.resourceAccesses.delete(key);
        return resourceAccess;
    }

    async getResourceAccess({ accountId, resourceId, resourceType }: { accountId: AccountId, resourceId: ResourceId, resourceType: ResourceType }): Promise<ResourceAccess | null> {
        const key = this.getResourceAccessKey(accountId, resourceId, resourceType);
        const resourceAccess = this.resourceAccesses.get(key);
        
        if (!resourceAccess) {
            return null;
        }

        // Populate role with permissions if role exists
        if (resourceAccess.roleId) {
            const role = this.roles.get(resourceAccess.roleId);
            if (role) {
                resourceAccess.role = role;
            }
        }

        return resourceAccess;
    }

    async getResourcesOf({ accountId, resourceType }: { accountId: AccountId, resourceType: ResourceType }): Promise<Resource[]> {
        const resources: Resource[] = [];
        
        // Find all resource accesses for this account and resource type
        for (const [key, resourceAccess] of this.resourceAccesses.entries()) {
            if (resourceAccess.accountId === accountId) {
                const resource = this.resources.get(resourceAccess.resourceId);
                if (resource && (resource.type === resourceType || (!resourceType && !resource.type))) {
                    resources.push(resource);
                }
            }
        }
        
        return resources;
    }

    async createRole({ role }: { role: Role }): Promise<Role | null> {
        if (this.roles.has(role.id)) {
            return null;
        }
        this.roles.set(role.id, role);
        return role;
    }

    // Additional helper methods for completeness (not in interface but useful)
    async addTenantAccess(tenantAccess: TenantAccess): Promise<boolean> {
        const key = this.getTenantAccessKey(tenantAccess.accountId, tenantAccess.tenantId);
        this.tenantAccesses.set(key, tenantAccess);
        return true;
    }

    async removeTenant({ id }: { id: TenantId }): Promise<boolean> {
        return this.tenants.delete(id);
    }

    async getRole({ roleId }: { roleId: RoleId }): Promise<Role | null> {
        return this.roles.get(roleId) || null;
    }

    async removeRole({ roleId }: { roleId: RoleId }): Promise<boolean> {
        return this.roles.delete(roleId);
    }

    // New methods for advanced graph visualization
    async getAllResourceOwnerships(): Promise<ResourceOwnership[]> {
        return Array.from(this.resourceOwnerships.values());
    }

    async getAllResources(): Promise<Resource[]> {
        return Array.from(this.resources.values());
    }

    async getAllResourceAccesses(): Promise<ResourceAccess[]> {
        return Array.from(this.resourceAccesses.values());
    }

    async getAllRoles(): Promise<Role[]> {
        return Array.from(this.roles.values());
    }

    async createAccount({ account }: { account: Account }): Promise<Account | null> {
        if (this.accounts.has(account.id)) {
            return null;
        }
        this.accounts.set(account.id, account);
        return account;
    }

    async getAllAccounts(): Promise<Account[]> {
        return Array.from(this.accounts.values());
    }

    async getAccount({ id }: { id: AccountId }): Promise<Account | null> {
        return this.accounts.get(id) || null;
    }
}
