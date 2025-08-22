import { TenantRepository } from "./tenant-repository";
import { Tenant } from "./types";

export class Printer {

    constructor(private repository: TenantRepository) { }

    async printAdvancedGraph(): Promise<void> {
        console.log("🏢 ADVANCED TENANCY GRAPH");
        console.log("=".repeat(80));

        // Get all data
        const [tenants, accounts, roles, resources, resourceOwnerships, resourceAccesses, tenantAccesses] = await Promise.all([
            this.repository.getAllTenants(),
            this.repository.getAllAccounts(),
            this.repository.getAllRoles(),
            this.repository.getAllResources(),
            this.repository.getAllResourceOwnerships(),
            this.repository.getAllResourceAccesses(),
            this.repository.getAllTenantAccesses()
        ]);

        // Build tenant hierarchy - create a clean copy to avoid duplicates
        const cleanTenants = tenants.map(t => ({ ...t, children: [] as Tenant[] }));
        const tenantMap = new Map(cleanTenants.map(t => [t.id, t]));
        const rootTenants = cleanTenants.filter(t => !t.parentId);

        // Populate children relationships fresh
        cleanTenants.forEach(tenant => {
            if (tenant.parentId) {
                const parent = tenantMap.get(tenant.parentId);
                const child = tenantMap.get(tenant.id);
                if (parent && child) {
                    parent.children.push(child);
                }
            }
        });

        console.log("\n📊 TENANT HIERARCHY:");
        console.log("-".repeat(50));
        for (const rootTenant of rootTenants) {
            await this.printTenantHierarchyWithDetails(rootTenant, 0, {
                accounts,
                roles,
                resources,
                resourceOwnerships,
                resourceAccesses,
                tenantAccesses
            });
        }

        console.log("\n👥 ACCOUNTS OVERVIEW:");
        console.log("-".repeat(50));
        for (const account of accounts) {
            await this.printAccountDetails(account, {
                roles,
                resources,
                resourceAccesses,
                tenantAccesses,
                tenants
            });
        }

        console.log("\n🔐 ROLES OVERVIEW:");
        console.log("-".repeat(50));
        for (const role of roles) {
            this.printRoleDetails(role, { resourceAccesses, tenantAccesses, accounts, tenants });
        }

        console.log("\n💾 RESOURCES OVERVIEW:");
        console.log("-".repeat(50));
        for (const resource of resources) {
            this.printResourceDetails(resource, { resourceOwnerships, resourceAccesses, tenants, accounts, roles });
        }
    }

    private async printTenantHierarchyWithDetails(
        tenant: Tenant,
        level: number,
        data: {
            accounts: any[],
            roles: any[],
            resources: any[],
            resourceOwnerships: any[],
            resourceAccesses: any[],
            tenantAccesses: any[]
        }
    ): Promise<void> {
        const indent = "  ".repeat(level);
        const { tenantAccesses, resourceOwnerships } = data;

        // Get tenant access count
        const tenantAccessCount = tenantAccesses.filter(ta => ta.tenantId === tenant.id).length;

        // Get owned resources count
        const ownedResourcesCount = resourceOwnerships.filter(ro => ro.tenantId === tenant.id).length;

        console.log(`${indent}🏢 ${tenant.name} (${tenant.id})`);
        console.log(`${indent}   👥 ${tenantAccessCount} account(s) with access`);
        console.log(`${indent}   💾 ${ownedResourcesCount} owned resource(s)`);

        // Show tenant accesses
        const tenantSpecificAccesses = tenantAccesses.filter(ta => ta.tenantId === tenant.id);
        for (const access of tenantSpecificAccesses) {
            const role = data.roles.find(r => r.id === access.roleId);
            console.log(`${indent}     → Account: ${access.accountId}, Role: ${role?.name || access.roleId}`);
        }

        // Show owned resources
        const ownedResources = resourceOwnerships.filter(ro => ro.tenantId === tenant.id);
        for (const ownership of ownedResources) {
            const resource = data.resources.find(r => r.id === ownership.resourceId);
            console.log(`${indent}     💾 ${resource?.id || ownership.resourceId} (${ownership.resourceType})`);
        }

        // Process children
        for (const child of tenant.children || []) {
            await this.printTenantHierarchyWithDetails(child, level + 1, data);
        }
    }

    private async printAccountDetails(
        account: any,
        data: {
            roles: any[],
            resources: any[],
            resourceAccesses: any[],
            tenantAccesses: any[],
            tenants: any[]
        }
    ): Promise<void> {
        const { roles, tenantAccesses, resourceAccesses } = data;

        console.log(`👤 ${account.name || 'Unnamed'} (${account.id})`);
        console.log(`   📧 ${account.email || 'No email'}`);
        console.log(`   🏢 ${account.organization || 'No organization'}`);

        // Tenant accesses
        const userTenantAccesses = tenantAccesses.filter(ta => ta.accountId === account.id);
        console.log(`   🏢 Tenant Access (${userTenantAccesses.length}):`);
        for (const access of userTenantAccesses) {
            const role = roles.find(r => r.id === access.roleId);
            const tenant = data.tenants.find(t => t.id === access.tenantId);
            console.log(`     → ${tenant?.name || access.tenantId} as ${role?.name || access.roleId}`);
        }

        // Resource accesses
        const userResourceAccesses = resourceAccesses.filter(ra => ra.accountId === account.id);
        console.log(`   💾 Resource Access (${userResourceAccesses.length}):`);
        for (const access of userResourceAccesses) {
            const role = roles.find(r => r.id === access.roleId);
            console.log(`     → ${access.resourceId} (${access.resourceType}) as ${role?.name || access.roleId}`);
        }

        console.log("");
    }

    private printRoleDetails(
        role: any,
        data: {
            resourceAccesses: any[],
            tenantAccesses: any[],
            accounts: any[],
            tenants: any[]
        }
    ): void {
        const { resourceAccesses, tenantAccesses } = data;

        console.log(`🔐 ${role.name || 'Unnamed Role'} (${role.id})`);
        console.log(`   📝 ${role.description || 'No description'}`);
        console.log(`   🛡️  Permissions: ${role.permissions?.join(', ') || 'None'}`);

        const roleResourceAccesses = resourceAccesses.filter(ra => ra.roleId === role.id);
        const roleTenantAccesses = tenantAccesses.filter(ta => ta.roleId === role.id);

        console.log(`   📊 Used in ${roleResourceAccesses.length} resource access(es)`);
        console.log(`   📊 Used in ${roleTenantAccesses.length} tenant access(es)`);
        console.log("");
    }

    private printResourceDetails(
        resource: any,
        data: {
            resourceOwnerships: any[],
            resourceAccesses: any[],
            tenants: any[],
            accounts: any[],
            roles: any[]
        }
    ): void {
        const { resourceOwnerships, resourceAccesses, tenants, roles } = data;

        console.log(`💾 ${resource.id} (${resource.type || 'No type'})`);

        // Ownership
        const ownership = resourceOwnerships.find(ro => ro.resourceId === resource.id);
        if (ownership) {
            const owner = tenants.find(t => t.id === ownership.tenantId);
            console.log(`   🏢 Owned by: ${owner?.name || ownership.tenantId}`);
        }

        // Access
        const accesses = resourceAccesses.filter(ra => ra.resourceId === resource.id);
        console.log(`   👥 Access granted to ${accesses.length} account(s):`);
        for (const access of accesses) {
            const role = roles.find(r => r.id === access.roleId);
            console.log(`     → Account: ${access.accountId}, Role: ${role?.name || access.roleId}`);
        }

        console.log("");
    }
}