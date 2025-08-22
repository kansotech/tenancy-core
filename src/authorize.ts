import { TenantRepository } from "./tenant-repository";
import { AccountId, Permission, Resource, ResourceId, ResourceType, RoleId, TenantId, } from "./types";


export class Authorization {

    constructor(private repository: TenantRepository) { }

    async authorize({ accountId, resourceId, requiredPermission, resourceType }: {
        accountId: AccountId, resourceId: ResourceId, requiredPermission: Permission, resourceType?: ResourceType
    }): Promise<boolean> {
        const resourceAccess = await this.repository.getResourceAccess({ accountId, resourceId, resourceType });

        if (resourceAccess) {
            // access found, if role doesn't fit, user has no access, and no need to check higher tenants
            return resourceAccess.role?.permissions?.some((permission) => permission === requiredPermission) ?? false;
        }

        // No access found, check higher tenants
        let resourceOwnership = await this.repository.getResourceOwnership({ resourceId, resourceType });
        let tenantId = resourceOwnership?.tenantId;
        while (tenantId) {
            //tenant found check if user has access to the tenant
            const tenantAccess = await this.repository.getTenantAccess({ accountId, tenantId });

            if (tenantAccess) {
                return tenantAccess.role?.permissions?.some((permission) => permission === requiredPermission) ?? false;
            }

            tenantId = (await this.repository.getTenant({ id: tenantId }))?.parentId ?? undefined;
        }

        return false;
    }

    // give an account access to a resource
    async grantAccess(
        { accountId, resourceId, roleId, resourceType }: {
            accountId: AccountId, resourceId: ResourceId, roleId: RoleId, resourceType?: ResourceType
        }
    ) {
        const resourceAccess = await this.repository.createResourceAccess({
            accountId,
            resourceId,
            roleId,
            resourceType
        })

        return resourceAccess;
    }

    async grantTenantAccess(
        { accountId, tenantId, roleId }: {
            accountId: AccountId, tenantId: TenantId, roleId: RoleId, resourceType?: ResourceType
        }
    ) {
        const tenantAccess = await this.repository.createTenantAccess({
            accountId,
            tenantId,
            roleId,
        })

        return tenantAccess;
    }

    async revokeAccess(
        { accountId, resourceId, resourceType }: {
            accountId: AccountId, resourceId: ResourceId, resourceType?: ResourceType
        }
    ) {
        const resourceAccess = await this.repository.deleteResourceAccess({ accountId, resourceId, resourceType });

        return resourceAccess;
    }

    async changeOwnership(
        {
            resourceId,
            resourceType,
            newOwnerId
        }: {
            resourceId: ResourceId,
            resourceType: ResourceType,
            newOwnerId: TenantId
        }
    ) {
        await this.repository.changeOwnership({ resourceId, resourceType, newOwnerId });
    }

    async getResourcesOf({ accountId, resourceType }: { accountId: AccountId, resourceType?: ResourceType }): Promise<Resource[]> {
        return this.repository.getResourcesOf({ accountId, resourceType });
    }
}