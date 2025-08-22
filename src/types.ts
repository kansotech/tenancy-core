
export interface Tenant {
    id: string;
    parentId?: string | null;
    name: string;
    parent?: Tenant;
    children?: Tenant[];
}

//usually global tenant is meant for superadmin/solution maintainers
export type GlobalTenant = Required<Omit<Tenant, 'parentId' | 'parent'>>;
export type LeafTenant = Required<Omit<Tenant, 'children'>>;

export interface Resource {
    id: ResourceId;
    type?: ResourceType;
}

export interface ResourceOwnership {
    resourceId: ResourceId;
    resourceType: ResourceType;
    tenantId: TenantId;

    resource?: Resource;
    tenant?: Tenant;
}

export interface ResourceAccess {
    roleId: RoleId;
    accountId: AccountId;
    resourceId: ResourceId;

    account?: Account | null;
    role?: Role | null;
    resource?: Resource | null;
}

export interface TenantAccess {
    roleId: RoleId;
    accountId: AccountId;
    tenantId: TenantId;

    account: Account | null;
    role: Role | null;
    tenant: Tenant | null;
}

export interface Account {
    id: AccountId;
    name: string | null;
    email: string | null;
    organization: string | null;
}

export interface Role {
    id: RoleId;
    name: string | null;
    description?: string | null;
    permissions: Permission[] | null;
}

export type TenantId = string;
export type RoleId = string;
export type Permission = string;
export type ResourceId = string;
export type ResourceType = string | undefined;
export type AccountId = string;