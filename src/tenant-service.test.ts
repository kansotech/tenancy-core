import { expect } from "chai";
import { describe, it, beforeEach } from "mocha";
import { TenantService } from "./tenant-service";
import { GlobalTenant, Role, Resource } from "./types";

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
    let service: TenantService;
    let globalTenant: GlobalTenant;
    let role: Role;
    let resource: Resource;

    beforeEach(async () => {
        service = new TenantService();
        globalTenant = createTestTenantTree();
        await service.initialize(globalTenant);
        role = { id: "role1", name: "Role 1", permissions: ["read", "write"] };
        await service.addRole(role);
        resource = { id: "res1" };
        await service.addResource({ resource, resourceType: "doc", tenantId: "tenant1" });
    });

    it("should authorize access when permissions match", async () => {
        await service.grantAccess("acc1", "res1", "role1");
        const result = await service.authorize("acc1", "res1", ["read"]);
        expect(result).to.be.true;
    });

    it("should not authorize access when permissions do not match", async () => {
        await service.grantAccess("acc1", "res1", "role1");
        const result = await service.authorize("acc1", "res1", ["admin"]);
        expect(result).to.be.false;
    });

    it("should revoke access", async () => {
        await service.grantAccess("acc1", "res1", "role1");
        await service.revokeAccess("acc1", "res1");
        const result = await service.authorize("acc1", "res1", ["read"]);
        expect(result).to.be.false;
    });

    it("should return resources for account", async () => {
        await service.grantAccess("acc1", "res1", "role1");
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
            permissions: ["admin", "global-manage"] 
        };
        await service.addRole(globalRole);

        // Create a resource in a sub-tenant (tenant2)
        const subTenantResource: Resource = { id: "subtenant-res" };
        await service.addResource({ 
            resource: subTenantResource, 
            resourceType: "doc", 
            tenantId: "tenant2" 
        });

        // Grant user access to the global tenant with global permissions
        await service.grantAccess("global-user", "global", "global-role");

        service.printTenantsTree(globalTenant);
        // User should be able to authorize on subtenant resource with global permissions
        const resultWithGlobalPermission = await service.authorize("global-user", "subtenant-res", ["admin"]);
        expect(resultWithGlobalPermission).to.be.true;

        // But should NOT be able to authorize with permissions not in their role
        const resultWithoutPermission = await service.authorize("global-user", "subtenant-res", ["delete"]);
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

        const newService = new TenantService();
        await newService.initialize(hierarchyTenant);
        newService.printTenantsTree(hierarchyTenant);

        // Verify tenants exist and have proper parent-child relationships
        const corpTenant = await newService.getTenant("corp");
        const divisionTenant = await newService.getTenant("division");
        const teamTenant = await newService.getTenant("team");

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
