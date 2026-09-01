# PHASE 04 — Seed Data Design

## Mục tiêu

Thiết kế seed local có dữ liệu Solar thực tế, nhất quán giữa chứng từ, Inventory và InventoryTransaction, hỗ trợ dashboard sáu tháng và demo workflow.

## Seed Safety

- Seed chỉ chạy khi `NODE_ENV !== production`.
- Cho phép reset dữ liệu khi `SEED_ALLOW_RESET=true`; nếu không, upsert master data theo code/email/SKU.
- Dùng database name riêng `solar_inventory` và log rõ target trước reset.
- Không log plain password ngoài README/demo credential section.
- Seed failure trả exit code khác 0, luôn đóng connection/session.

## Demo Accounts

| Role | Email | Password |
|---|---|---|
| ADMIN | admin@solar.local | Admin@123 |
| WAREHOUSE_MANAGER | manager@solar.local | Manager@123 |
| STAFF | staff@solar.local | Staff@123 |

Tất cả password được bcrypt hash trước insert.

## Categories — 10

Solar Panel, Hybrid Inverter, Grid-Tie Inverter, Battery Storage, DC Cable, Connector, DC Protection, AC Protection, Mounting System, Monitoring & Accessories.

## Products — tối thiểu 30

Bao gồm Jinko Tiger Neo 575W, AIKO 600W, Longi Hi-MO 7 580W, Canadian Solar TOPHiKu6 575W, Deye SUN-5K-SG, Deye SUN-8K-SG, Deye SUN-12K-SG, Solis 10K, Huawei SUN2000-10KTL, Growatt MOD 10KTL3-X, Dyness 5.12kWh, Pylontech US5000, BYD Battery-Box, DC Cable 4mm2, DC Cable 6mm2, MC4 Connector, DC SPD, DC MCCB, AC SPD, AC MCCB, Solar Mounting Rail, Mid Clamp, End Clamp, Grounding Lug, WiFi Logger và các thiết bị Solar thực tế khác.

- SKU, brand/model/unit/costPrice/minStock/warranty phải hợp lý.
- Không dùng Product A/B/Test Product.

## Suppliers — 5

Các nhà phân phối Solar Việt Nam giả lập nhưng tên chuyên nghiệp, có contact/address/phone hợp lý; không dùng dữ liệu cá nhân thật.

## Warehouses — 2

- `WH-HCM`: Kho Solar TP.HCM.
- `WH-DN`: Kho Solar Đà Nẵng.

## Projects — 10

Các công trình rooftop nhà xưởng/hộ gia đình/thương mại với capacity 5–500 kWp, phân bố PLANNED/IN_PROGRESS/COMPLETED.

## Operational Seed

- 15 StockReceipt CONFIRMED trải trên sáu tháng.
- 15 StockIssue CONFIRMED với project phù hợp và luôn nhỏ hơn tồn.
- Một số DRAFT để kiểm tra filtering nhưng không ảnh hưởng inventory.
- Tối thiểu 3 StockCheck CONFIRMED có adjustment tăng/giảm nhỏ.
- Inventory được dựng từ chính các confirmed operations, không insert số lượng tùy ý tách rời lịch sử.
- Mỗi mutation tạo InventoryTransaction với previous/new đúng.

## Generation Order

1. Connect MongoDB và xác minh replica set.
2. Reset collections theo thứ tự an toàn nếu được phép.
3. Insert users/categories/suppliers/warehouses/products/projects.
4. Trong session transaction, tạo/confirm receipts và Inventory/IMPORT logs.
5. Tạo/confirm issues sau khi đảm bảo tồn và tạo EXPORT logs.
6. Tạo/confirm stock checks và ADJUSTMENT logs.
7. Chạy reconciliation checks.

## Reconciliation Checks

- Với mỗi product/warehouse: initial 0 + sum(all transaction quantities) = Inventory.quantity.
- Không Inventory âm.
- previous/new chain theo thời gian không đứt.
- Mọi confirmed receipt/issue/check có số transaction tương ứng item count.
- DRAFT/CANCELLED không có transaction.
- Dashboard sáu tháng có cả IMPORT và EXPORT data.

## Determinism

- Sử dụng fixed dataset và date offsets tương đối theo đầu tháng hiện tại.
- Document codes deterministic hoặc unique theo dataset.
- Upsert dựa trên email/code/SKU; reset mode tạo kết quả giống nhau mỗi lần.

## Files to Implement

- `backend/src/database/seed.ts`
- `backend/src/database/seed/seed.constants.ts`
- `backend/src/database/seed/seed-data.ts`
- `backend/src/database/seed/seed-runner.ts`
- `backend/src/database/seed/reconcile-seed.ts`
- `backend/package.json` script `seed`.

## Dependencies

- bcrypt/argon2 package đã chọn, Mongoose connection và core domain services hoặc seed transaction helpers.

## Test Cases

- Fresh seed PASS và rerun reset seed PASS.
- Số lượng collection đạt minimum.
- Demo credentials login được.
- Reconciliation không phát hiện mismatch.
- Low-stock list có dữ liệu và dashboard sáu tháng không rỗng.

## Definition of Done

- Dataset đáp ứng minimum và đúng ngành Solar.
- Inventory/transactions được sinh từ nghiệp vụ, không mâu thuẫn.
- Seed chạy lại an toàn trên local và cung cấp demo accounts/workflow.

