# PHASE 03 — Mongoose Schema Design

## Mục tiêu

Chuyển database design thành đặc tả Mongoose schema có type, enum, validation, index, embedded subdocument và serialization thống nhất để implementation không cần thiết kế lại.

## Schema Conventions

- Dùng `@Schema()`/`@Prop()` của `@nestjs/mongoose` và `SchemaFactory.createForClass`.
- Export document type bằng `HydratedDocument<T>`.
- Collection name khai báo rõ dạng snake_case/plural; không phụ thuộc auto pluralization.
- Tất cả aggregate roots bật `{ timestamps: true, versionKey: false, strict: true }`.
- `ObjectId` dùng `Types.ObjectId`; DTO/API nhận string và validate `@IsMongoId()`.
- API serialize `_id` thành `id`, bỏ `__v`, `passwordHash` và internal fields.
- Dùng `lean()` cho read-only list/report queries; document instance cho mutation cần save/session.
- Không đặt cross-collection business logic trong schema hooks.

## Shared Enums

Tạo enum TypeScript dùng chung: Role, UserStatus, EntityStatus, DocumentStatus, TransactionType, ReferenceType và ProjectStatus. DTO và schema import từ cùng nguồn để tránh lệch giá trị.

## UserSchema

- email: required, lowercase, trim, unique, maxlength 160.
- passwordHash: required, select false.
- fullName: required, trim, minlength 2, maxlength 120.
- role/status: required enum, index.
- lastLoginAt: optional Date.
- Unique index `{ email: 1 }`.
- Không hash password trong generic update hook; Auth/Users service hash rõ ràng trước write.

## CategorySchema

- code: required, uppercase, trim, unique, regex `^[A-Z0-9_-]+$`.
- name: required, trim, maxlength 120.
- normalizedName: required, lowercase/diacritic-preserving normalized string, unique.
- description optional maxlength 500; status enum/index.
- Hide normalizedName khỏi response mặc định.

## ProductSchema

- sku required uppercase/trim/unique, maxlength 80.
- name required maxlength 200; categoryId ObjectId ref Category/index.
- brand/model optional maxlength 120; unit required maxlength 40.
- costPrice integer Number từ 0 đến `Number.MAX_SAFE_INTEGER`.
- minStock integer >= 0; warrantyMonths integer 0..240.
- description maxlength 2000; imageUrl phải là URL hợp lệ nếu có.
- status enum/index; compound indexes phục vụ category/status/name.
- Không có quantity hoặc stock field.

## SupplierSchema

- code unique uppercase; name required.
- contactName, phone, email, address, taxCode optional với maxlength hợp lý.
- Email validate format khi có; phone lưu string để giữ số 0 đầu.
- status/index; không unique optional email/taxCode để tránh null-index conflict.

## WarehouseSchema

- code unique uppercase; name required.
- address/description optional; status enum/index.
- Warehouse INACTIVE không nhận chứng từ mới nhưng dữ liệu lịch sử vẫn truy vấn được.

## InventorySchema

- productId/warehouseId required ObjectId refs và index.
- quantity integer min 0 default 0.
- version integer min 0 default 0.
- Unique compound index `{ productId: 1, warehouseId: 1 }`.
- Không expose create/update/delete CRUD cho client.

## Embedded ReceiptItemSchema

- `_id` tự sinh để React/form có stable key.
- productId required ObjectId ref Product.
- quantity required integer > 0.
- unitPrice required integer >= 0 và <= MAX_SAFE_INTEGER.
- Subschema `{ _id: true, timestamps: false }`.

## StockReceiptSchema

- code unique uppercase; supplierId/warehouseId/createdBy indexed refs.
- receiptDate required Date; note optional maxlength 1000.
- status DocumentStatus default DRAFT/index; confirmedAt optional.
- items embedded ReceiptItem[], minlength 1.
- Custom array validator chống duplicate productId.
- Compound index `{ status: 1, receiptDate: -1 }`.

## Embedded IssueItemSchema và StockIssueSchema

- Issue item: `_id`, productId, quantity integer > 0.
- Header: code, warehouseId, optional projectId, issueDate, createdBy, note, status, confirmedAt, items.
- Unique code; indexes warehouseId/projectId/createdBy và `{ status, issueDate }`.
- Custom validator chống duplicate products.

## InventoryTransactionSchema

- productId, warehouseId, createdBy: required ObjectId refs/index.
- type/referenceType: required enum.
- quantity: required signed non-zero integer.
- previousQuantity/newQuantity: required integer >= 0.
- referenceId: required ObjectId; no single Mongoose ref vì polymorphic.
- note optional maxlength 1000; createdAt required/default now; không updatedAt.
- Schema validation bảo đảm `previousQuantity + quantity === newQuantity`.
- Compound indexes theo Phase 02; collection không có update/delete service.

## ProjectSchema

- code unique uppercase; name/customerName required.
- address/note optional; capacity finite Number >= 0.
- status enum/index; startDate optional; indexes cho search/report.

## Embedded StockCheckItemSchema và StockCheckSchema

- Item: productId, systemQuantity >= 0, actualQuantity optional >= 0, difference optional integer, inventoryVersion >= 0.
- Header: code, warehouseId, checkDate, createdBy, note, status, confirmedAt, items.
- DRAFT cho phép actual/difference null; service yêu cầu đầy đủ khi confirm.
- Custom validator chống duplicate productId; unique code và date/status indexes.

## Serialization

- Global Mongoose serialization helper hoặc response mapper chuyển ObjectId/Date an toàn.
- Không trả nguyên Mongoose document từ controller khi có sensitive/internal fields.
- API dates dùng ISO-8601 UTC; frontend format Asia/Bangkok.
- Money trả JSON Number vì schema giới hạn safe integer.

## Validation Boundary

- Mongoose validation là lớp cuối; DTO validation là lớp đầu.
- Unique constraint vẫn cần catch MongoDB E11000 và map 409.
- Reference existence/status, state transition và stock rules thuộc service.
- Không tin custom validators từ frontend.

## Test Cases

- Schema từ chối quantity âm/fractional, price âm, invalid enums/ObjectIds.
- Duplicate SKU/email/code và compound inventory trả E11000.
- Embedded items rỗng/trùng bị từ chối.
- passwordHash không xuất hiện khi query mặc định.
- Transaction invariant sai bị từ chối.

## Files to Implement

- `backend/src/common/enums/*.enum.ts`
- `backend/src/common/utils/mongoose-transform.util.ts`
- `backend/src/users/schemas/user.schema.ts`
- `backend/src/categories/schemas/category.schema.ts`
- `backend/src/products/schemas/product.schema.ts`
- `backend/src/suppliers/schemas/supplier.schema.ts`
- `backend/src/warehouses/schemas/warehouse.schema.ts`
- `backend/src/inventory/schemas/inventory.schema.ts`
- `backend/src/stock-receipts/schemas/stock-receipt.schema.ts`
- `backend/src/stock-issues/schemas/stock-issue.schema.ts`
- `backend/src/inventory-transactions/schemas/inventory-transaction.schema.ts`
- `backend/src/projects/schemas/project.schema.ts`
- `backend/src/stock-checks/schemas/stock-check.schema.ts`

## Dependencies

- `mongoose`, `@nestjs/mongoose`, `class-validator`, `class-transformer`.

## Definition of Done

- Mọi collection/subdocument có type, validation, index và serialization rõ.
- Business validation được đặt đúng layer; không lạm dụng hooks.
- Schema đặc tả đáp ứng embedded items, audit history và no-negative inventory.

