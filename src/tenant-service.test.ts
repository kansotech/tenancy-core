import { expect } from "chai";
import { describe, it, beforeEach } from "mocha";
import { GlobalTenant, Role, Resource } from "./types";
import { TenantBuilder } from "./builder";
import { InMemoryTenantRepository } from "./in-memory-tenant-repository";
import { Authorization } from "./authorize";

function createTestTenantTree(): GlobalTenant {
    return {
        id: "global",
        name: "GlobalTenant",
        children: [
            {
                id: "tenant1",
                name: "Tenant 1",
                parentId: "global",
                parent: undefined,
                children: [
                    {
                        id: "tenant2",
                        name: "Tenant 2",
                        parentId: "tenant1",
                        parent: undefined,
                        children: [],
                    },
                ],
            },
        ],
    };
}

describe("TenantService", () => {
    let service: TenantBuilder;
    let authorizer: Authorization;
    let globalTenant: GlobalTenant;
    let role: Role;
    let resource: Resource;

    beforeEach(async () => {
        const repo = new InMemoryTenantRepository();
        service = new TenantBuilder(repo);
        authorizer = new Authorization(repo);
        globalTenant = createTestTenantTree();
        await service.createTenantTree(globalTenant);
        role = { id: "role1", name: "Role 1", permissions: ["read", "write"], description: '' };
        await service.addRole(role);
        resource = { id: "res1", type: "doc" };
        await service.addResource({ resource, tenantId: "tenant1" });
    });

    it("should authorize access when permissions match", async () => {
        await authorizer.grantAccess({ accountId: "acc1", resourceId: "res1", roleId: "role1" });
        const result = await authorizer.authorize({ accountId: "acc1", resourceId: "res1", requiredPermission: "read" });
        expect(result).to.be.true;
    });

    it("should not authorize access when permissions do not match", async () => {
        await authorizer.grantAccess({ accountId: "acc1", resourceId: "res1", roleId: "role1" });
        const result = await authorizer.authorize({ accountId: "acc1", resourceId: "res1", requiredPermission: "admin" });
        expect(result).to.be.false;
    });

    it("should revoke access", async () => {
        await authorizer.grantAccess({ accountId: "acc1", resourceId: "res1", roleId: "role1" });
        await authorizer.revokeAccess({ accountId: "acc1", resourceId: "res1" });
        const result = await authorizer.authorize({ accountId: "acc1", resourceId: "res1", requiredPermission: "read" });
        expect(result).to.be.false;
    });

    it("should return resources for account", async () => {
        await authorizer.grantAccess({ accountId: "acc1", resourceId: "res1", roleId: "role1" });
        const resources = await service.getMyResources({ accountId: "acc1", resourceType: "doc" });
        expect(resources).to.have.lengthOf(1);
        expect(resources[0].id).to.equal("res1");
    });

    it("should not return resources for account without access", async () => {
        const resources = await service.getMyResources({ accountId: "acc2", resourceType: "doc" });
        expect(resources).to.have.lengthOf(0);
    });

    it("should authorize user with global tenant access on subtenant resource through hierarchy", async () => {
        // Create a role with global permissions
        const globalRole: Role = {
            id: "global-role",
            name: "Global Admin",
            permissions: ["admin", "global-manage"],
            description: null
        };
        await service.addRole(globalRole);

        // Create a resource in a sub-tenant (tenant2)
        const subTenantResource: Resource = { id: "subtenant-res", type: "doc" };
        await service.addResource({ resource: subTenantResource, tenantId: "tenant2" });

        // Grant user access to the global tenant with global permissions
        await authorizer.grantAccess({ accountId: "global-user", resourceId: "global", roleId: "global-role" });

        service.printTenantsTree(globalTenant);
        // User should be able to authorize on subtenant resource with global permissions
        const resultWithGlobalPermission = await authorizer.authorize({ accountId: "global-user", resourceId: "subtenant-res", requiredPermission: "admin" });
        expect(resultWithGlobalPermission).to.be.true;

        // But should NOT be able to authorize with permissions not in their role
        const resultWithoutPermission = await authorizer.authorize({ accountId: "global-user", resourceId: "subtenant-res", requiredPermission: "delete" });
        expect(resultWithoutPermission).to.be.false;
    });

    it("should have clean tenant hierarchy without permissions inheritance", async () => {
        // Create a tenant hierarchy - tenants are just organizational containers
        const hierarchyTenant: GlobalTenant = {
            id: "corp",
            name: "Corporation",
            children: [
                {
                    id: "division",
                    name: "Division",
                    parentId: "corp",
                    parent: undefined,
                    children: [
                        {
                            id: "team",
                            name: "Team",
                            parentId: "division",
                            parent: undefined,
                            children: [],
                        },
                    ],
                },
            ],
        };

        const repo = new InMemoryTenantRepository();
        const newService = new TenantBuilder(repo);
        await newService.createTenantTree(hierarchyTenant);
        newService.printTenantsTree(hierarchyTenant);

        // Verify tenants exist and have proper parent-child relationships
        const corpTenant = await repo.getTenant({ id: "corp" });
        const divisionTenant = await repo.getTenant({ id: "division" });
        const teamTenant = await repo.getTenant({ id: "team" });

        expect(corpTenant).to.exist;
        expect(divisionTenant).to.exist;
        expect(teamTenant).to.exist;

        // Verify parent-child relationships
        expect(divisionTenant?.parent?.id).to.equal("corp");
        expect(teamTenant?.parent?.id).to.equal("division");

        // Tenants are just containers - permissions come from roles during authorization
        expect(corpTenant?.name).to.equal("Corporation");
        expect(divisionTenant?.name).to.equal("Division");
        expect(teamTenant?.name).to.equal("Team");
    });


});
