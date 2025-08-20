import { prisma } from "../prisma";
import { TenantRepository } from "../tenant-repository";
import { AccountId, Resource, ResourceAccess, ResourceId, ResourceOwnership, ResourceType, Role, RoleId, Tenant, TenantAccess, TenantId } from "../types";

export class PrismaRepo implements TenantRepository {
    createTenant({ tenant }: { tenant: Tenant; }): Promise<Tenant | null> {
        return prisma.tenant.create({
            data: {
                id: tenant.id,
                parentId: tenant.parentId,
                name: tenant.name,
            }
        });
    }
    createResource({ resource }: { resource: Resource; }): Promise<Resource | null> {
        return prisma.resource.create({
            data: {
                id: resource.id,
                type: resource.type ?? '',
            }
        });
    }
    createResourceOwnership({ resourceOwnership }: { resourceOwnership: ResourceOwnership; }): Promise<ResourceOwnership | null> {
        return prisma.resourceOwnership.create({
            data: {
                resourceId: resourceOwnership.resourceId,
                resourceType: resourceOwnership.resourceType ?? '',
                tenantId: resourceOwnership.tenantId,
            }
        });
    }

    async createRole({ role }: { role: Role; }): Promise<Role | null> {
        const createdRole = await prisma.role.create({
            data: {
                id: role.id,
                name: role.name,
                description: role.description ?? '',
            }
        });
        
        const result = {
            ...createdRole,
            permissions: null
        };

        return result;
    }
    
    async getTenant({ id }: { id: TenantId }): Promise<Tenant | null> {
        return prisma.tenant.findUnique({ where: { id } });
    }

    async getResourceAccess({ accountId, resourceId, resourceType }: { accountId: AccountId, resourceId: ResourceId, resourceType: ResourceType }): Promise<ResourceAccess | null> {
        const resourceAccess = await prisma.resourceAccess.findUnique({
            where: {
                accountId_resourceId_resourceType: {
                    accountId: accountId,
                    resourceId: resourceId,
                    resourceType: resourceType ?? '',
                },
            },
            include: {
                role: {
                    include: {
                        permissions: true
                    }
                }
            }
        });
        if (resourceAccess == null) {
            return null;
        }

        const permissions = resourceAccess.role.permissions.map(permission => permission.permissionName) ?? [];
        return {
            ...resourceAccess,
            role: {
                ...resourceAccess.role,
                permissions
            }
        };
    }

    async getResourceOwnership({ resourceId, resourceType }: { resourceId: ResourceId, resourceType: ResourceType }): Promise<ResourceOwnership | null> {
        return prisma.resourceOwnership.findUnique({
            where: {
                resourceId_resourceType: {
                    resourceId: resourceId,
                    resourceType: resourceType ?? '',
                },
            },
        });
    }

    async getTenantAccess({ accountId, tenantId }: { accountId: AccountId, tenantId: string }): Promise<TenantAccess | null> {
        const tenantAccess = await prisma.tenantAccess.findUnique({
            where: {
                accountId_tenantId: {
                    accountId,
                    tenantId
                },
            },
            include: {
                role: {
                    include: {
                        permissions: true
                    }
                }
            }
        });

        if (tenantAccess == null) {
            return null;
        }

        const permissions = tenantAccess.role.permissions.map(permission => permission.permissionName) ?? [];
        return {
            account: null,
            tenant: null,
            ...tenantAccess,
            role: {
                ...tenantAccess.role,
                permissions
            }
        };
    }

    async createResourceAccess({ accountId, resourceId, roleId, resourceType }: { accountId: AccountId, resourceId: ResourceId, roleId: RoleId, resourceType: ResourceType }): Promise<ResourceAccess> {
        return prisma.resourceAccess.create({
            data: {
                accountId: accountId,
                resourceId: resourceId,
                roleId: roleId,
                resourceType: resourceType ?? '',
            },
        });
    }

    async changeOwnership({ resourceId, resourceType, newOwnerId }: { resourceId: ResourceId, resourceType: ResourceType, newOwnerId: TenantId }): Promise<ResourceOwnership | null> {
        return prisma.resourceOwnership.update({
            where: {
                resourceId_resourceType: {
                    resourceId,
                    resourceType: resourceType ?? '',
                },
            },
            data: {
                tenantId: newOwnerId,
            },
        });
    }

    async deleteResourceAccess({ accountId, resourceId, resourceType }: { accountId: AccountId, resourceId: ResourceId, resourceType: ResourceType }): Promise<ResourceAccess | null> {
        return prisma.resourceAccess.delete({
            where: {
                accountId_resourceId_resourceType: {
                    accountId,
                    resourceId,
                    resourceType: resourceType ?? ''
                }
            },
        });
    }

}