import { expect } from "chai";
import { describe, it, beforeEach } from "mocha";
import { GlobalTenant, Role, Resource } from "./types";
import { TenantBuilder } from "./builder";
import { InMemoryTenantRepository } from "./inmemory-repository";
import { Authorization } from "./authorize";
import { Printer } from "./printer";

function createTestTenantTree(): GlobalTenant {
    return {
        id: "saas-platform",
        name: "Restaurant SaaS Platform",
        children: [
            {
                id: "restaurant-chain",
                name: "Restaurant Chain HQ",
                parentId: "saas-platform",
                parent: undefined,
                children: [
                    {
                        id: "downtown-branch",
                        name: "Downtown Branch",
                        parentId: "restaurant-chain",
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
    let repo: InMemoryTenantRepository;
    beforeEach(async () => {
        repo = new InMemoryTenantRepository();
        service = new TenantBuilder(repo);
        authorizer = new Authorization(repo);
        globalTenant = createTestTenantTree();
        await service.createTenantTree(globalTenant);
        role = { id: "server-role", name: "Server", permissions: ["take-orders", "serve-food"], description: '' };
        await service.addRole(role);
        resource = { id: "menu-tablet", type: "device" };
        await service.addResource({ resource, tenantId: "restaurant-chain" });
    });

    it("should authorize access when permissions match", async () => {
        await authorizer.grantAccess({ accountId: "waiter-john", resourceId: "menu-tablet", roleId: "server-role" });
        const result = await authorizer.authorize({ accountId: "waiter-john", resourceId: "menu-tablet", requiredPermission: "take-orders" });
        expect(result).to.be.true;
    });

    it("should not authorize access when permissions do not match", async () => {
        await authorizer.grantAccess({ accountId: "waiter-john", resourceId: "menu-tablet", roleId: "server-role" });
        const result = await authorizer.authorize({ accountId: "waiter-john", resourceId: "menu-tablet", requiredPermission: "manage-finances" });
        expect(result).to.be.false;
    });

    it("should revoke access", async () => {
        await authorizer.grantAccess({ accountId: "waiter-john", resourceId: "menu-tablet", roleId: "server-role" });
        await authorizer.revokeAccess({ accountId: "waiter-john", resourceId: "menu-tablet" });
        const result = await authorizer.authorize({ accountId: "waiter-john", resourceId: "menu-tablet", requiredPermission: "take-orders" });
        expect(result).to.be.false;
    });

    it("should return resources for account", async () => {
        await authorizer.grantAccess({ accountId: "waiter-john", resourceId: "menu-tablet", roleId: "server-role" });
        const resources = await authorizer.getResourcesOf({ accountId: "waiter-john", resourceType: "device" });
        expect(resources).to.have.lengthOf(1);
        expect(resources[0].id).to.equal("menu-tablet");
    });

    it("should not return resources for account without access", async () => {
        const resources = await authorizer.getResourcesOf({ accountId: "waiter-sarah", resourceType: "device" });
        expect(resources).to.have.lengthOf(0);
    });

    it("creates resource ownership", async () => {
        await service.addResource({
            resource: { id: "pos-system", type: "device" },
            tenantId: "restaurant-chain"
        })

        const ownership = await repo.getResourceOwnership({ resourceId: "pos-system", resourceType: "device" });
        expect(ownership).to.exist;
        expect(ownership!.tenantId).to.equal("restaurant-chain");
    });


    it("should authorize user with global tenant access on subtenant resource through hierarchy", async () => {
        // Create a role with global SaaS platform permissions
        const globalRole: Role = {
            id: "platform-admin",
            name: "Platform Administrator",
            permissions: ["platform-admin", "manage-all-tenants", "system-config"],
            description: null
        };
        await service.addRole(globalRole);

        // Create a resource in a sub-tenant (downtown-branch)
        const subTenantResource: Resource = { id: "branch-pos", type: "device" };
        await service.addResource({ resource: subTenantResource, tenantId: "downtown-branch" });

        await service.addAccount({ id: "saas-admin", email: "admin@saasplatform.com", name: "SaaS Platform Admin", organization: "Restaurant SaaS Platform" });
        // Grant user access to the global SaaS platform with admin permissions
        await authorizer.grantTenantAccess({ accountId: "saas-admin", tenantId: "saas-platform", roleId: "platform-admin" });

        // SaaS admin should be able to authorize on any subtenant resource with platform permissions
        const resultWithGlobalPermission = await authorizer.authorize({ accountId: "saas-admin", resourceId: subTenantResource.id, resourceType: subTenantResource.type, requiredPermission: "platform-admin" });
        expect(resultWithGlobalPermission).to.be.true;

        // But should NOT be able to authorize with permissions not in their role
        const resultWithoutPermission = await authorizer.authorize({ accountId: "saas-admin", resourceId: subTenantResource.id, resourceType: subTenantResource.type, requiredPermission: "cook-food" });
        expect(resultWithoutPermission).to.be.false;
    });

    it("should allow undefined resourceType", async () => {
        await authorizer.grantAccess({ accountId: "waiter-john", resourceId: "menu-tablet", roleId: "server-role" });
        const result = await authorizer.authorize({ accountId: "waiter-john", resourceId: "menu-tablet", requiredPermission: "take-orders", resourceType: undefined });
        expect(result).to.be.true;
    });

});
