export enum Role {
  ADMIN = 'ADMIN',
  WAREHOUSE_MANAGER = 'WAREHOUSE_MANAGER',
  STAFF = 'STAFF',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export enum EntityStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export enum DocumentStatus {
  DRAFT = 'DRAFT',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
}

export enum TransactionType {
  IMPORT = 'IMPORT',
  EXPORT = 'EXPORT',
  ADJUSTMENT = 'ADJUSTMENT',
}

export enum ReferenceType {
  STOCK_RECEIPT = 'STOCK_RECEIPT',
  STOCK_ISSUE = 'STOCK_ISSUE',
  STOCK_CHECK = 'STOCK_CHECK',
}

export enum ProjectStatus {
  PLANNED = 'PLANNED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}
