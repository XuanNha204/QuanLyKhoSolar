const baseUrl = process.env.API_URL ?? 'http://localhost:3001/api/v1';

async function request(path, options = {}, expectedStatus) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      'content-type': 'application/json',
      ...(options.token ? { authorization: `Bearer ${options.token}` } : {}),
      ...options.headers,
    },
  });
  const body = await response.json().catch(() => ({}));
  if (expectedStatus !== undefined && response.status !== expectedStatus)
    throw new Error(
      `${path}: expected ${expectedStatus}, received ${response.status}: ${JSON.stringify(body)}`,
    );
  if (expectedStatus === undefined && !response.ok)
    throw new Error(`${path}: ${response.status}: ${JSON.stringify(body)}`);
  return { status: response.status, body };
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}
const json = (body) => ({ method: 'POST', body: JSON.stringify(body) });
const patch = (body = {}) => ({ method: 'PATCH', body: JSON.stringify(body) });

const login = await request(
  '/auth/login',
  json({ email: 'admin@solar.local', password: 'Admin@123' }),
);
const token = login.body.data.accessToken;
assert(token, 'Login không trả accessToken.');
await request('/auth/me', { token });
await request('/dashboard', { token });

const suffix = Date.now().toString().slice(-7);
const category = (
  await request(
    '/categories',
    {
      ...json({
        code: `IT-${suffix}`,
        name: `Danh mục tích hợp ${suffix}`,
        description: 'Dữ liệu kiểm thử workflow.',
      }),
      token,
    },
    201,
  )
).body.data;
const product = (
  await request(
    '/products',
    {
      ...json({
        sku: `IT-JK-${suffix}`,
        name: `Jinko Workflow ${suffix} 575W`,
        categoryId: category.id,
        brand: 'Jinko Solar',
        model: 'JKM575N-72HL4',
        unit: 'tấm',
        costPrice: 3150000,
        minStock: 10,
        warrantyMonths: 144,
        description: 'Sản phẩm kiểm thử tích hợp.',
      }),
      token,
    },
    201,
  )
).body.data;
const supplier = (
  await request(
    '/suppliers',
    {
      ...json({
        code: `NCC-${suffix}`,
        name: `Nhà cung cấp tích hợp ${suffix}`,
        contactName: 'Nguyễn Demo',
        phone: '0909000000',
        email: `supplier-${suffix}@solar.local`,
        address: 'TP. Hồ Chí Minh',
      }),
      token,
    },
    201,
  )
).body.data;
const warehouse = (
  await request(
    '/warehouses',
    {
      ...json({
        code: `KHO-${suffix}`,
        name: `Kho tích hợp ${suffix}`,
        address: 'TP. Hồ Chí Minh',
        description: 'Kho workflow tự động.',
      }),
      token,
    },
    201,
  )
).body.data;
const project = (
  await request(
    '/projects',
    {
      ...json({
        code: `CT-${suffix}`,
        name: `Công trình tích hợp ${suffix}`,
        customerName: 'Khách hàng Demo',
        address: 'Bình Dương',
        capacity: 25,
        status: 'IN_PROGRESS',
        startDate: new Date().toISOString(),
        note: 'Công trình workflow.',
      }),
      token,
    },
    201,
  )
).body.data;

const receipt = (
  await request(
    '/stock-receipts',
    {
      ...json({
        supplierId: supplier.id,
        warehouseId: warehouse.id,
        receiptDate: new Date().toISOString(),
        note: 'Nhập 20 tấm Jinko workflow.',
        items: [{ productId: product.id, quantity: 20, unitPrice: 3150000 }],
      }),
      token,
    },
    201,
  )
).body.data;
await request(`/stock-receipts/${receipt.id}/confirm`, { ...patch(), token });
let inventory = (
  await request(`/inventory/${warehouse.id}/${product.id}`, { token })
).body.data;
assert(
  inventory.quantity === 20,
  `Sau nhập phải là 20, thực tế ${inventory.quantity}.`,
);

const issue = (
  await request(
    '/stock-issues',
    {
      ...json({
        warehouseId: warehouse.id,
        projectId: project.id,
        issueDate: new Date().toISOString(),
        note: 'Xuất 5 tấm cho công trình workflow.',
        items: [{ productId: product.id, quantity: 5 }],
      }),
      token,
    },
    201,
  )
).body.data;
await request(`/stock-issues/${issue.id}/confirm`, { ...patch(), token });
inventory = (
  await request(`/inventory/${warehouse.id}/${product.id}`, { token })
).body.data;
assert(
  inventory.quantity === 15,
  `Sau xuất phải là 15, thực tế ${inventory.quantity}.`,
);

const excessive = (
  await request(
    '/stock-issues',
    {
      ...json({
        warehouseId: warehouse.id,
        projectId: project.id,
        issueDate: new Date().toISOString(),
        note: 'Ca lỗi xuất vượt tồn.',
        items: [{ productId: product.id, quantity: 30 }],
      }),
      token,
    },
    201,
  )
).body.data;
const rejected = await request(
  `/stock-issues/${excessive.id}/confirm`,
  { ...patch(), token },
  400,
);
assert(
  rejected.body.error?.message === 'Số lượng tồn kho không đủ.',
  `Thông báo thiếu tồn không đúng: ${JSON.stringify(rejected.body)}`,
);
inventory = (
  await request(`/inventory/${warehouse.id}/${product.id}`, { token })
).body.data;
assert(
  inventory.quantity === 15,
  'Rollback phiếu xuất lỗi không giữ nguyên tồn 15.',
);

const check = (
  await request(
    '/stock-checks',
    {
      ...json({
        warehouseId: warehouse.id,
        checkDate: new Date().toISOString(),
        note: 'Kiểm kê 15 thành 14.',
        items: [{ productId: product.id, actualQuantity: 14 }],
      }),
      token,
    },
    201,
  )
).body.data;
await request(`/stock-checks/${check.id}/confirm`, { ...patch(), token });
inventory = (
  await request(`/inventory/${warehouse.id}/${product.id}`, { token })
).body.data;
assert(
  inventory.quantity === 14,
  `Sau kiểm kê phải là 14, thực tế ${inventory.quantity}.`,
);

const history = await request(
  `/inventory-transactions?productId=${product.id}&warehouseId=${warehouse.id}&page=1&limit=20`,
  { token },
);
const movements = history.body.data.map((row) => `${row.type}:${row.quantity}`);
assert(
  movements.includes('IMPORT:20') &&
    movements.includes('EXPORT:-5') &&
    movements.includes('ADJUSTMENT:-1'),
  `Lịch sử thiếu giao dịch: ${movements.join(', ')}`,
);

const staffLogin = await request(
  '/auth/login',
  json({ email: 'staff@solar.local', password: 'Admin@123' }),
);
await request(
  '/categories',
  {
    ...json({ code: `DENY-${suffix}`, name: 'Không được tạo' }),
    token: staffLogin.body.data.accessToken,
  },
  403,
);
await request('/dashboard', {}, 401);
const swagger = await fetch('http://localhost:3001/api/docs');
assert(swagger.ok, `Swagger không sẵn sàng: ${swagger.status}`);

console.log(
  JSON.stringify(
    {
      status: 'PASS',
      workflow: {
        login: true,
        receipt: '0 → 20',
        issue: '20 → 15',
        excessiveIssue: 'REJECTED',
        stockCheck: '15 → 14',
        transactions: movements,
        rbac: 'PASS',
        swagger: 'PASS',
      },
    },
    null,
    2,
  ),
);
