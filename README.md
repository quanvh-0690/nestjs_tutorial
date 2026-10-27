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
