# Ma trận C2 (condition coverage) — ArticlesController

**Phạm vi:** `ArticlesController` cùng các hàm nó gọi trong `ArticlesService`, `TagsService.findOrCreate`, guard xác thực và validate DTO.
**Test:** `test/articles.e2e-spec.ts`. Tên mỗi test case có mã `[Cx-T]` / `[Cx-F]` để đối chiếu với bảng dưới.

> **Mức độ bao phủ**
> - **C0** (statement): mọi câu lệnh đều chạy ít nhất 1 lần.
> - **C1** (branch): mọi nhánh `if` / `else` đều được đi qua.
> - **C2** (condition): **từng điều kiện đơn** trong một biểu thức logic đều nhận cả giá trị TRUE lẫn FALSE.
>   Ví dụ `if (A && B)`: C1 chỉ cần 2 case (cả biểu thức đúng / sai), còn C2 cần A=T, A=F, B=T, B=F.

## Điều kiện trong code

| Mã | Vị trí | Điều kiện | Case TRUE | Case FALSE |
|---|---|---|---|---|
| C1 | `create` | `dto.description` được gửi (`?? ''`) | `[C1-T]` đủ field | `[C1-F]` không gửi description |
| C2 | `create` | `dto.tagList` được gửi (`?? []`) | `[C2-T]` | `[C2-F]` |
| C3 | `TagsService.findOrCreate` | `!unique.length` (danh sách tag rỗng sau khi trim/lọc trùng) | `[C3-T]` tag toàn khoảng trắng / `[]` | `[C3-F]` có tag hợp lệ |
| C4 | `findAll` | `query.tag` | `[C4-T]` | `[C4-F]` |
| C5 | `findAll` | `query.author` | `[C5-T]` | `[C5-F]` |
| C6 | `findAll` | `query.favorited` | `[C6-T]` | `[C6-F]` |
| C7 | `findAll` | `query.search` (title / description / body) | `[C7-T]` 4 case | `[C7-F]` |
| C8 | `feed` | `!authorIds.length` (chưa follow ai) | `[C8-T]` | `[C8-F]` |
| C9 | `findBySlugOrFail` | `!article` (slug không tồn tại) | `[C9-T]` 404 ở GET/PUT/DELETE/favorite | `[C9-F]` |
| C10 | `update` | `fields.title` có giá trị | `[C10-T]` | `[C10-F]` chỉ đổi body |
| C11 | `update` | `fields.title !== article.title` | `[C11-T]` title mới → slug mới | `[C11-F]` title giống cũ → giữ slug |
| C12 | `update` | `tagList` được gửi | `[C12-T]` thay tag / xoá hết tag | `[C12-F]` |
| C13 | `favorite` | insert được bản ghi mới (`raw.length > 0`) | `[C13-T]` lần đầu | `[C13-F]` đã favorite |
| C14 | `unfavorite` | xoá được bản ghi (`result.affected`) | `[C14-T]` | `[C14-F]` chưa favorite |
| C15 | `ensureOwner` | `article.authorId !== user.id` | `[C15-T]` 403 khi PUT/DELETE | `[C15-F]` tác giả |
| C16 | `serialize` | có `viewer` | `[C16-T]` | `[C16-F]` khách |
| C17 | `serialize` | `articles.length > 0` | `[C17-T]` | `[C17-F]` có viewer nhưng kết quả rỗng |
| C18 | `serialize` | `withBody` | `[C18-T]` chi tiết bài | `[C18-F]` danh sách |
| C19 | `serialize` | `favoritedIds.has(article.id)` | `[C19-T]` | `[C19-F]` |
| C20 | `serialize` | `followingIds.has(authorId)` | `[C20-T]` | `[C20-F]` |
| C21 | `JwtAuthGuard` | token hợp lệ | mọi case thành công | `[C21-F]` không token / token đã logout |
| C22 | `OptionalJwtAuthGuard` | token hợp lệ | `[C22-T]` | `[C22-F]` không token / token sai → coi như khách |
| V | DTO validation | dữ liệu vi phạm rule | `[V-T]` 422: thiếu field, quá dài, sai kiểu, `limit` ngoài [1,100], `offset` < 0 | `[V-F]` giá trị biên hợp lệ `limit=1`, `limit=100`, `offset=0` |

Biểu thức ghép `if (fields.title && fields.title !== article.title)` có đủ 3 tổ hợp: (F, –), (T, F), (T, T).
Biểu thức `if (viewer && articles.length)` có đủ: (F, –), (T, F), (T, T).

## Kiểm chứng bằng coverage

```bash
npm run test:e2e:cov
# mở coverage/e2e/index.html
```

Kết quả: `articles.controller.ts`, `articles.service.ts`, `tags.service.ts` đạt **100% statements / branches / functions**.

> Lưu ý: các file entity / serializer có thể hiện branch 50%. Đó là nhánh do TypeScript **tự sinh** khi biên dịch decorator (`emitDecoratorMetadata`), không phải logic của mình, nên không cần (và không thể) viết test cho chúng.
