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
