import { GlobalTenant, Permission, Resource, ResourceOwnership, ResourceType, Role, Tenant } from "./types";
import { TenantRepository } from "./tenant-repository";
import { InMemoryTenantRepository } from "./in-memory-tenant-repository";

export class TenantService {
    
    private repository: TenantRepository;

    constructor(repository?: TenantRepository) {
        this.repository = repository || new InMemoryTenantRepository();
    }

    /**
     * Initialize the multi-tenancy system with a global tenant hierarchy
     */
    async initialize(globalTenant: GlobalTenant): Promise<void> {
        await this.addTenants(globalTenant);
    }

    /**
     * Print the tenants tree structure (utility method)
     */
    printTenantsTree(tenant: Tenant, level: number = 0): void {
        console.log(`${"  ".repeat(level)}- ${tenant.name} (ID: ${tenant.id})`);
        for (const child of tenant.children || []) {
            this.printTenantsTree(child, level + 1);
        }
    }

    private async addTenants(tenant: Tenant, parent?: Tenant): Promise<void> {
        const existingTenant = await this.repository.getTenant(tenant.id);
        if (existingTenant) {
            throw new Error(`Tenant with id ${tenant.id} already exists. Either a Cycle has been detected or the tenant is already added.`);
        }

        // Set parent relationship
        if (parent) {
            tenant.parent = parent;
        }

        await this.repository.addTenant(tenant);
        
        // Process children recursively
        for (const child of tenant.children || []) {
            await this.addTenants(child, tenant);
        }
    }

    /**
     * Add a role to the system
     */
    async addRole(role: Role): Promise<boolean> {
        return await this.repository.addRole(role);
    }

    /**
     * Add a resource and assign it to a tenant
     */
    async addResource({ resource, resourceType, tenantId }: {
        resource: Resource, tenantId: string, resourceType: ResourceType
    }): Promise<boolean> {
        const tenant = await this.repository.getTenant(tenantId);
        if (!tenant) {
            return false;
        }

        await this.repository.addResource(resource, resourceType);
        
        const resourceOwnership: ResourceOwnership = {
            tenantId,
            resourceType,
            resourceId: resource.id,
            tenant,
        };
        
        await this.repository.addResourceOwnership(resourceOwnership);
        return true;
    }

    /**
     * Check if an account has the required permissions for a resource
     * Supports hierarchical authorization (parent tenant access)
     */
    async authorize(accountId: string, resourceId: string | number, requiredPermissions: Permission[]): Promise<boolean> {
        const resourceAccesses = await this.repository.getResourceAccess(accountId);
        const resourceOwnership = await this.repository.getResourceOwnership(resourceId);

        if (!resourceOwnership) {
            return false;
        }

        const tenantsTree: (string | number | undefined)[] = [resourceId];
        let currentTenant = resourceOwnership?.tenant;
        while (currentTenant) {
            tenantsTree.push(currentTenant.id);
            currentTenant = currentTenant.parent;
        }

        for (const resourceAccess of resourceAccesses) {
            if (tenantsTree.includes(resourceAccess.resourceId)) {
                const role = await this.repository.getRole(resourceAccess.roleId);
                if (role) {
                    const hasPermission = requiredPermissions.every(permission => role.permissions?.includes(permission));
                    if (hasPermission) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    /**
     * Grant access to a resource for an account with a specific role
     */
    async grantAccess(accountId: string, resourceId: string | number, roleId: string): Promise<boolean> {
        const resourceAccess = { accountId, resourceId, roleId };
        return await this.repository.addResourceAccess(resourceAccess);
    }

    /**
     * Revoke access to a resource for an account
     */
    async revokeAccess(accountId: string, resourceId: string | number): Promise<boolean> {
        return await this.repository.removeResourceAccess(accountId, resourceId);
    }

    /**
     * Get all resources of a specific type that an account has access to
     */
    async getMyResources({ accountId, resourceType }: { accountId: string, resourceType: ResourceType }): Promise<Resource[]> {
        const resources: Resource[] = [];
        const resourceAccesses = await this.repository.getResourceAccess(accountId);
        const typedResources = await this.repository.getResources(resourceType);

        for (const resource of typedResources) {
            const ownership = await this.repository.getResourceOwnership(resource.id);
            if (!ownership) {
                continue;
            }
            for (const access of resourceAccesses) {
                if (access.resourceId === resource.id) {
                    resources.push(resource);
                }
            }
        }
        return resources;
    }

    /**
     * Get tenant information by ID
     */
    async getTenant(tenantId: string): Promise<Tenant | undefined> {
        return await this.repository.getTenant(tenantId);
    }
}