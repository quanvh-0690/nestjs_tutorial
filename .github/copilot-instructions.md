# Hướng dẫn review cho GitHub Copilot

Project: Medium clone backend API (spec RealWorld) bằng NestJS 12 (ES Modules), TypeORM + PostgreSQL, Redis.
Khi review pull request, hãy kiểm tra và comment bằng tiếng Việt:

- Import nội bộ phải có đuôi `.js` (ESM). Quan hệ TypeORM giữa 2 entity import lẫn nhau phải dùng `Relation<>`.
- Không dùng `synchronize: true`; mọi thay đổi schema phải có migration với `down()` đảo ngược đúng `up()`.
- DTO phải có decorator class-validator, message dùng key i18n (`t('...')`). Không nhận field thừa.
- Response trả về qua serializer (`@Exclude()` class + `@Expose()` field), không lộ password, đường dẫn file nội bộ.
- Lỗi throw bằng HttpException với key i18n (vd `article.NOT_FOUND`), không trả message cứng.
- Query dùng tham số (`:param`), không nối chuỗi SQL. Tránh N+1 query.
- Route cần đăng nhập phải có `JwtAuthGuard`; kiểm tra quyền sở hữu (403) với thao tác sửa/xoá.
- Tuân thủ Google TypeScript Style Guide; tên biến/hàm rõ nghĩa, không để code chết, `console.log`.
