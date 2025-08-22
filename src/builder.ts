import { TenantRepository } from "./tenant-repository";
import { GlobalTenant, Resource, ResourceOwnership, Role, Tenant, Account } from "./types";


export class TenantBuilder {
    constructor(private repository: TenantRepository) { }

    async createTenantTree(globalTenant: GlobalTenant): Promise<void> {
        await this.addTenants(globalTenant);
    }

    private async addTenants(tenant: Tenant, parent?: Tenant): Promise<void> {
        const existingTenant = await this.repository.getTenant({ id: tenant.id });
        if (existingTenant) {
            throw new Error(`Tenant with id ${tenant.id} already exists. Either a Cycle has been detected or the tenant is already added.`);
        }

        // Set parent relationship
        if (parent) {
            tenant.parentId = parent.id;
        }

        await this.repository.createTenant({ tenant });

        // Process children recursively
        for (const child of tenant.children || []) {
            await this.addTenants(child, tenant);
        }
    }

    async addRole(role: Role): Promise<Role | null> {
        return this.repository.createRole({ role });
    }

    async addResource({ resource, tenantId }: {
        resource: Resource, tenantId: string
    }): Promise<boolean> {
        const resourceType = resource.type;

        const tenant = await this.repository.getTenant({ id: tenantId });
        if (!tenant) {
            return false;
        }

        await this.repository.createResource({ resource });

        const resourceOwnership: ResourceOwnership = {
            tenantId,
            resourceType,
            resourceId: resource.id,
            tenant,
        };

        await this.repository.createResourceOwnership({ resourceOwnership });
        return true;
    }

    async addAccount(account: Account): Promise<Account | null> {
        return this.repository.createAccount({ account });
    }

}