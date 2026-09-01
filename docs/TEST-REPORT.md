# Test Report

Ngày kiểm thử: 2026-09-01  
Môi trường: Windows, Node.js 22.20.0, npm 10.9.3, MongoDB 8.2.6 single-node replica set `rs0`.

## Kết quả

| Hạng mục | Lệnh / phương pháp | Kết quả |
|---|---|---|
| Backend TypeScript build | `npm --prefix backend run build` | PASS |
| Backend lint | `npm --prefix backend run lint` | PASS |
| Backend unit test | `npm --prefix backend test` | PASS |
| Backend E2E health | `npm --prefix backend run test:e2e` | PASS |
| Frontend production build | `npm --prefix frontend run build` | PASS |
| Frontend ESLint | `npm --prefix frontend run lint` | PASS |
| Backend production dependency audit | `npm audit --omit=dev` | PASS — 0 vulnerability |
| Backend full dependency audit | `npm audit` | PASS — 0 vulnerability |
| Frontend dependency audit | `npm audit` | PASS — 0 vulnerability |
| Seed on replica set | `npm run seed` | PASS |
| REST demo workflow | `npm --prefix backend run verify:workflow` | PASS |
| Browser/UI workflow | `npm --prefix frontend run verify:ui` | PASS |

## REST workflow đã xác minh

- Login admin: PASS.
- Tạo Category, Product, Supplier, Warehouse, Project: PASS.
- Xác nhận nhập kho: `0 → 20`: PASS.
- Xác nhận xuất kho: `20 → 15`: PASS.
- Thử xuất 30 khi còn 15: trả HTTP 400 và `Số lượng tồn kho không đủ.`: PASS.
- Rollback phiếu xuất lỗi, tồn vẫn 15: PASS.
- Xác nhận kiểm kê: `15 → 14`: PASS.
- Transaction history gồm `IMPORT +20`, `EXPORT -5`, `ADJUSTMENT -1`: PASS.
- STAFF gọi API tạo Category: HTTP 403: PASS.
- Không JWT gọi Dashboard: HTTP 401: PASS.
- Swagger `/api/docs`: PASS.

## Browser/UI workflow đã xác minh

- Chrome headless đăng nhập bằng tài khoản admin: PASS.
- Dashboard tải dữ liệu thật và render Recharts: PASS.
- Duyệt 14 route desktop không redirect sai, không HTTP 5xx: PASS.
- Mở form nhập kho nhiều dòng: PASS.
- Responsive sidebar/menu ở viewport 390 × 844: PASS.
- Console error và page error: 0.

Ảnh kiểm chứng:

- [Login desktop](screenshots/login-desktop.png)
- [Dashboard desktop](screenshots/dashboard-desktop.png)
- [Form nhập kho](screenshots/stock-receipt-form.png)
- [Dashboard mobile menu](screenshots/dashboard-mobile-menu.png)

## Chưa kiểm thử

- Trình duyệt Safari/iOS thật: NOT TESTED.
- Tải đồng thời/benchmark hiệu năng quy mô lớn: NOT TESTED.
- Production deployment, HTTPS và cloud MongoDB: NOT IN SCOPE.
- Penetration test chuyên sâu: NOT TESTED.

