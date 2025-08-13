
export interface Tenant {
    id: string;
    parentId?: string;
    name: string;
    parent?: Tenant;
    children?: Tenant[];
} 

//usually global tenant is meant for superadmin/solution maintainers
export type GlobalTenant = Required<Omit<Tenant, 'parentId' | 'parent'>>;
export type LeafTenant = Required<Omit<Tenant, 'children'>>;

export interface Resource {
    id: string | number;
}

export type ResourceType = string;

export interface ResourceOwnership {
    resourceId: string | number;
    resourceType: string;
    tenantId: string;

    resource?: Resource;
    tenant?: Tenant;
}

export interface ResourceAccess {
    roleId: string;
    accountId: string;
    resourceId: string | number;

    account?: Account;
    role?: Role;
    resource?: Resource;
}

export interface Account {
    id: string;
    name?: string;
    email?: string;
    organization?: string;
}

export interface Role {
    id: string;
    name?: string;
    description?: string;
    permissions?: Permission[];
}

export type Permission = string;