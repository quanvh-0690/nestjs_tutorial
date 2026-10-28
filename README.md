# Medium API (NestJS)

Backend API clone Medium theo spec [RealWorld](https://realworld-docs.netlify.app/specifications/backend/endpoints/).

## Chạy local

```bash
cp .env.example .env
npm install
npm run start:dev
```

- Hello world: http://localhost:3000/api/hello?name=Quan&lang=vi
- API docs (Swagger): http://localhost:3000/api/docs

## Coding standard

```bash
npm run lint        # oxlint
npm run lint:sun    # Sunlint — bắt buộc 0 error trước khi tạo PR
```

## Quy trình pull request

1. Tạo branch từ `main`, code, tự review diff.
2. Chạy lint + Sunlint, đính kèm ảnh vào PR.
3. Request **Copilot review** → fix / trả lời comment.
4. Request **mentor review** → merge khi được approve.

## Database migration (TypeORM)

```bash
docker compose up -d     # postgres + redis
npm run migration:run
```

| Thao tác | Lệnh | Laravel tương đương |
|---|---|---|
| **Add** — tạo migration rỗng để viết tay | `npm run migration:create -- src/database/migrations/TenMigration` | `make:migration` |
| **Add** — sinh từ thay đổi entity | `npm run migration:generate -- src/database/migrations/TenMigration` | — |
| **Apply** | `npm run migration:run` | `migrate` |
| Xem trạng thái | `npm run migration:show` | `migrate:status` |
| **Revert** migration gần nhất | `npm run migration:revert` | `migrate:rollback --step=1` |
| **Reset** — xoá schema, chạy lại từ đầu | `npm run migration:reset` | `migrate:fresh` |

## File upload (private)

- Ảnh đại diện upload qua `PUT /api/user` (multipart/form-data, field `image`, tối đa 2MB, JPG/PNG/WEBP/GIF).
- File lưu ở `storage/private/` (không public). Thông tin file lưu ở bảng `attachments` (polymorphic: `attachable_type`, `attachable_id`; id là UUID).
- Lấy file: `GET /api/attachments/:id` — bắt buộc đăng nhập và có quyền xem.

## Test

```bash
npm test               # unit test
npm run test:e2e       # e2e: database medium_test, Redis db 1, storage/test
npm run test:e2e:cov   # e2e + coverage (coverage/e2e/index.html)
```

- Mỗi test case tự tạo dữ liệu giả bằng factory (`test/factories`, dùng faker) và database được **truncate sau mỗi test case**.
- `test/articles.e2e-spec.ts`: test cấp độ **C2** cho `ArticlesController`, ma trận điều kiện ở `test/C2-articles.md`.
