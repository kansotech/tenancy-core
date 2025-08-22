# 🏢 Tenancy Core

A powerful and secure multi-tenancy library for Node.js applications that provides hierarchical tenant management, role-based access control, and resource ownership with focus on security, maintainability, and performance.

## ✨ Features

- 🏗️ **Hierarchical Tenancy** - Support for complex tenant hierarchies with parent-child relationships
- 🔐 **Role-Based Access Control** - Flexible permission system with customizable roles
- 💾 **Resource Management** - Comprehensive resource ownership and access control
- 🎯 **Authorization Engine** - Smart authorization that traverses tenant hierarchy
- 📊 **Advanced Visualization** - Beautiful graph representation of your tenant structure
- 🛡️ **Security First** - Built with security best practices and proper access isolation
- 🔧 **Database Agnostic** - Works with any database through repository pattern
- 📈 **Scalable** - Designed for high-performance multi-tenant applications

## 🚀 Installation

```bash
npm install @multitenancy/core
# or
yarn add @multitenancy/core
```

## 📖 Quick Start

### Basic Setup

```typescript
import { TenantBuilder, InMemoryTenantRepository, Authorization } from '@multitenancy/core';

// Create repository (you can implement your own for any database)
const repository = new InMemoryTenantRepository();

// Initialize builder and authorization
const tenantBuilder = new TenantBuilder(repository);
const authorization = new Authorization(repository);
const printer = new Printer(repository);
```

### Creating Tenant Hierarchy

```typescript
// Define your tenant structure
const tenantTree = {
  id: "saas-platform",
  name: "Restaurant SaaS Platform",
  children: [
    {
      id: "restaurant-chain",
      name: "Restaurant Chain HQ",
      children: [
        {
          id: "downtown-branch",
          name: "Downtown Branch",
          children: []
        }
      ]
    }
  ]
};

// Create the hierarchy
await tenantBuilder.createTenantTree(tenantTree);
```

### Managing Roles and Permissions

```typescript
// Create roles with permissions
await tenantBuilder.addRole({
  id: "platform-admin",
  name: "Platform Administrator",
  permissions: ["platform-admin", "manage-all-tenants", "system-config"]
});

await tenantBuilder.addRole({
  id: "server-role",
  name: "Server",
  permissions: ["take-orders", "serve-food"]
});
```

### Managing Accounts and Resources

```typescript
// Add accounts
await tenantBuilder.addAccount({
  id: "saas-admin",
  name: "SaaS Platform Admin",
  email: "admin@saasplatform.com",
  organization: "Restaurant SaaS Platform"
});

// Add resources and assign ownership
await tenantBuilder.addResource({
  resource: { id: "menu-tablet", type: "device" },
  tenantId: "restaurant-chain"
});

// Grant tenant access
await authorization.grantTenantAccess({
  accountId: "saas-admin",
  tenantId: "saas-platform",
  roleId: "platform-admin"
});
```

### Authorization

```typescript
// Check if user has permission to access a resource
const hasAccess = await authorization.authorize({
  accountId: "saas-admin",
  resourceId: "menu-tablet",
  requiredPermission: "platform-admin",
  resourceType: "device"
});

console.log(`Access granted: ${hasAccess}`); // true
```

## 🎨 Advanced Visualization

Get a beautiful overview of your entire tenancy structure:

```typescript
// Print comprehensive graph
await printer.printAdvancedGraph();
```

**Output:**

```
🏢 ADVANCED TENANCY GRAPH
================================================================================

📊 TENANT HIERARCHY:
--------------------------------------------------
🏢 Restaurant SaaS Platform (saas-platform)
   👥 1 account(s) with access
   💾 0 owned resource(s)
     → Account: saas-admin, Role: Platform Administrator
  🏢 Restaurant Chain HQ (restaurant-chain)
     👥 0 account(s) with access
     💾 1 owned resource(s)
       💾 menu-tablet (device)
    🏢 Downtown Branch (downtown-branch)
       👥 0 account(s) with access
       💾 1 owned resource(s)
         💾 branch-pos (device)

👥 ACCOUNTS OVERVIEW:
--------------------------------------------------
👤 SaaS Platform Admin (saas-admin)
   📧 admin@saasplatform.com
   🏢 Restaurant SaaS Platform
   🏢 Tenant Access (1):
     → Restaurant SaaS Platform as Platform Administrator
   💾 Resource Access (0):


🔐 ROLES OVERVIEW:
--------------------------------------------------
🔐 Server (server-role)
   📝 No description
   🛡️  Permissions: take-orders, serve-food
   📊 Used in 0 resource access(es)
   📊 Used in 0 tenant access(es)

🔐 Platform Administrator (platform-admin)
   📝 No description
   🛡️  Permissions: platform-admin, manage-all-tenants, system-config
   📊 Used in 0 resource access(es)
   📊 Used in 1 tenant access(es)


💾 RESOURCES OVERVIEW:
--------------------------------------------------
💾 menu-tablet (device)
   🏢 Owned by: Restaurant Chain HQ
   👥 Access granted to 0 account(s):

💾 branch-pos (device)
   🏢 Owned by: Downtown Branch
   👥 Access granted to 0 account(s):
```

## 🏗️ Architecture

### Tenant Hierarchy

Tenants can have parent-child relationships, allowing for complex organizational structures:

```
🌐 SaaS Platform (Global)
    └── 🏢 Restaurant Chain (Customer)
        ├── 🏪 Branch 1 (Location)
        ├── 🏪 Branch 2 (Location)
        └── 🏭 Kitchen Department (Sub-unit)
```

### Authorization Flow

1. **Direct Resource Access** - Check if user has direct access to the resource
2. **Hierarchy Traversal** - If no direct access, traverse up the tenant hierarchy
3. **Permission Validation** - Validate required permissions at each level
4. **Access Decision** - Grant or deny access based on permissions found

### Key Concepts

- **Tenant** - An organizational unit (company, department, location)
- **Account** - A user or service account
- **Role** - A collection of permissions
- **Resource** - Any entity that requires access control
- **Ownership** - Which tenant owns a resource
- **Access** - Permissions granted to accounts for resources or tenants

## 🔧 Repository Pattern

Implement your own repository for any database:

```typescript
import { TenantRepository } from '@multitenancy/core';

class MyDatabaseRepository implements TenantRepository {
  // Implement all required methods for your database
  async createTenant({ tenant }) {
    // Your database logic here
  }
  
  async getTenant({ id }) {
    // Your database logic here
  }
  
  // ... implement all other methods
}
```

## 🎯 Use Cases

### SaaS Platforms
- Multi-customer isolation
- Hierarchical customer organizations
- Feature access control per tenant

### Enterprise Applications
- Department-based access control
- Regional office management
- Project-based resource isolation

### E-commerce Platforms
- Multi-vendor marketplaces
- Store hierarchy management
- Seller resource isolation

### Healthcare Systems
- Hospital network management
- Department access control
- Patient data isolation

## 🛡️ Security Features

- **Tenant Isolation** - Complete data separation between tenants
- **Hierarchical Permissions** - Inherit permissions from parent tenants
- **Role-Based Access** - Fine-grained permission control
- **Resource Ownership** - Clear ownership boundaries
- **Authorization Validation** - Comprehensive access checking

## 📚 API Reference

### TenantBuilder

- `createTenantTree(globalTenant)` - Create hierarchical tenant structure
- `addRole(role)` - Add role with permissions
- `addAccount(account)` - Add user account
- `addResource({ resource, tenantId })` - Add resource with ownership
- `printAdvancedGraph()` - Visualize tenant structure

### Authorization

- `authorize({ accountId, resourceId, requiredPermission, resourceType? })` - Check access
- `grantAccess({ accountId, resourceId, roleId, resourceType? })` - Grant resource access
- `grantTenantAccess({ accountId, tenantId, roleId })` - Grant tenant access
- `revokeAccess({ accountId, resourceId, resourceType? })` - Revoke access
- `changeOwnership({ resourceId, resourceType, newOwnerId })` - Transfer ownership

## 📄 License

MIT

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines and submit pull requests to our repository.

## 📧 Support

For questions and support, please open an issue on our GitHub repository or contact us at support@multitenancy.dev