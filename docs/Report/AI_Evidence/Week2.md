---

## Nhiệm vụ 1: Áp dụng JwtAuthGuard và RolesGuard toàn cục trong Gateway bootstrap main.ts

### 1. Câu hỏi gửi AI (Prompt)

```text
Chúng tôi cần thiết lập JWT authentication toàn cục trong NestJS gateway, nhưng cho phép một số endpoint là public. Làm sao để định nghĩa một global Guard và đọc custom metadata trong guard class?
```

### 2. Câu trả lời chi tiết của AI

Để làm việc này, tạo một decorator `@Public()` và cấu hình global guard sử dụng NestJS `Reflector`:

1. **Định nghĩa decorator public (`public.decorator.ts`):**
```typescript
import { SetMetadata } from '@nestjs/common';
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
```

2. **Kiểm tra metadata trong guard class (`jwt-auth.guard.ts`):**
```typescript
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }
  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;
    return super.canActivate(context);
  }
}
```

3. **Đăng ký toàn cục trong `main.ts`:**
```typescript
const reflector = app.get(Reflector);
app.useGlobalGuards(new JwtAuthGuard(reflector));
```

### 3. Đánh giá, chọn lọc & Tùy biến mã nguồn của Sinh viên

**Mô tả quá trình kiểm tra:**
Chúng tôi đã xem xét cấu hình guards toàn cục của AI. Chúng tôi chỉnh sửa nó vì việc đăng ký guards toàn cục trực tiếp trong main.ts yêu cầu tiêm Reflector một cách chính xác để giải quyết metadata ở cấp class và handler. Chúng tôi đã cấu hình lại JwtAuthGuard để sử dụng reflector.getAllAndOverride nhằm hỗ trợ decorator @Public() tùy chỉnh, giúp bỏ qua xác thực JWT một cách an toàn trên các API công khai như đăng nhập và đăng ký.

**Thông tin kiểm toán:**
- **Giai đoạn SDLC:** Triển khai
- **Công cụ AI sử dụng:** ChatGPT
- **Thước đo định lượng:** Cấu hình 2 guards toàn cục
- **Rủi ro & Hạn chế quan sát được:** Đặt Reflector không đúng vị trí có thể gây lỗi runtime khi đọc metadata.

---

## Nhiệm vụ 2: Viết integration test bằng Jest để kiểm tra việc chặn truy cập không có token

### 1. Câu hỏi gửi AI (Prompt)

```text
Vui lòng viết một bộ kiểm thử tích hợp sử dụng Jest và Supertest để kiểm tra rằng NestJS Gateway trả về 401 Unauthorized cho các route được bảo vệ khi không có token.
```

### 2. Câu trả lời chi tiết của AI

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Gateway Authentication Tests', () => {
  let app: INestApplication;
  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('GET /departments should fail with 401 without Bearer token', () => {
    return request(app.getHttpServer())
      .get('/departments')
      .expect(401)
      .expect((res) => {
        expect(res.body.message).toEqual('Unauthorized');
      });
  });
});
```

### 3. Đánh giá, chọn lọc & Tùy biến mã nguồn của Sinh viên

**Mô tả quá trình kiểm tra:**
Chúng tôi phân tích các test case do AI gợi ý. Mã nguồn của AI thiếu cấu hình mock cho Gateway ngoại vi. Chúng tôi đã sửa đổi bộ kiểm thử sử dụng TestingModule của NestJS để mock JWT Secret, đảm bảo mọi request không kèm Bearer token đều bị chặn và trả về đúng mã lỗi 401 Unauthorized cùng với cấu trúc payload lỗi chuẩn hóa của hệ thống.

**Thông tin kiểm toán:**
- **Giai đoạn SDLC:** Kiểm thử
- **Công cụ AI sử dụng:** ChatGPT
- **Thước đo định lượng:** Tạo 3 kịch bản kiểm thử tích hợp
- **Rủi ro & Hạn chế quan sát được:** Lỗi mock có thể khác biệt so với filter ngoại lệ thực tế của NestJS.

---

## Nhiệm vụ 3: Viết Jest test xác nhận route công khai vượt qua JwtAuthGuard thành công

### 1. Câu hỏi gửi AI (Prompt)

```text
Tạo file spec kiểm thử cho controller NestJS để kiểm tra rằng các route công khai như login/register bỏ qua JwtAuthGuard, trả về 200/201 thay vì 401.
```

### 2. Câu trả lời chi tiết của AI

Mock context thực thi của Guard và trả về true đối với việc kiểm tra metadata. Sử dụng Supertest gọi POST /auth/login và xác nhận mã HTTP trả về là 200 OK thay vì 401.

### 3. Đánh giá, chọn lọc & Tùy biến mã nguồn của Sinh viên

**Mô tả quá trình kiểm tra:**
Chúng tôi xem xét kịch bản kiểm thử và các xác nhận (assertions). Chúng tôi tùy biến để xác thực rằng các request HTTP tới `/auth/login` và `/auth/register` trả về mã 200/201 thành công và hoàn toàn bỏ qua xử lý của Guard. Chúng tôi cũng kiểm tra xem payload trả về có chứa đầy đủ các trường accessToken và refreshToken hay không.

**Thông tin kiểm toán:**
- **Giai đoạn SDLC:** Kiểm thử
- **Công cụ AI sử dụng:** GitHub Copilot
- **Thước đo định lượng:** Xác thực thành công 2 endpoint công khai
- **Rủi ro & Hạn chế quan sát được:** Copilot tạo cấu hình mock lỗi thời, cần sửa thủ công.

---

## Nhiệm vụ 4: Phân tích chiến lược vô hiệu hóa token khi người dùng đăng xuất sử dụng Redis

### 1. Câu hỏi gửi AI (Prompt)

```text
Cách tốt nhất để xử lý logout và thu hồi refresh token trong hệ thống microservices là gì? Nên dùng blacklist access token hay xóa refresh token trong Redis?
```

### 2. Câu trả lời chi tiết của AI

Khi đăng xuất, chiến lược hiệu quả nhất là xóa refresh token khỏi Redis. Vì access token là stateless và có thời gian sống ngắn, việc xóa refresh token sẽ ngăn người dùng tạo access token mới. Nếu cần thu hồi ngay lập tức access token trước khi hết hạn, bạn có thể lưu chữ ký access token vào Redis blacklist với thời gian sống (TTL) bằng thời gian còn lại của token đó.

### 3. Đánh giá, chọn lọc & Tùy biến mã nguồn của Sinh viên

**Mô tả quá trình kiểm tra:**
Chúng tôi đánh giá cả hai chiến lược thu hồi token do AI đề xuất: thiết lập blacklist access token và xóa refresh token. Chúng tôi đã từ chối phương án blacklist access token do số lượng ghi lớn và gây phình to bộ nhớ của Redis cho các token ngắn hạn. Chúng tôi quyết định chọn phương pháp xóa refresh token từ Redis khi đăng xuất, điều này ngăn chặn việc cấp access token mới khi hết hạn, trong khi để các access token cũ tự hết hạn tự nhiên để tiết kiệm tài nguyên.

**Thông tin kiểm toán:**
- **Giai đoạn SDLC:** Phân tích yêu cầu
- **Công cụ AI sử dụng:** ChatGPT
- **Thước đo định lượng:** Nghiên cứu 2 phương pháp thu hồi
- **Rủi ro & Hạn chế quan sát được:** Sự cố cụm Redis có thể làm mất đồng bộ trạng thái token.

---

## Nhiệm vụ 5: Thiết kế Redis keyspace và cấu trúc dữ liệu lưu trữ token

### 1. Câu hỏi gửi AI (Prompt)

```text
Chúng tôi cần lập kế hoạch cấu trúc keyspace Redis để lưu trữ refresh token. Làm sao để tránh xung đột và hỗ trợ việc xóa nhanh?
```

### 2. Câu trả lời chi tiết của AI

Sử dụng định dạng `rms:auth:refresh:<userId>`. Khi đăng xuất, thực hiện: `redis.del('rms:auth:refresh:' + user.id)`. Bạn cũng có thể lưu dưới dạng hash nếu muốn hỗ trợ nhiều phiên đăng nhập trên nhiều thiết bị cho cùng một người dùng.

### 3. Đánh giá, chọn lọc & Tùy biến mã nguồn của Sinh viên

**Mô tả quá trình kiểm tra:**
Chúng tôi kiểm tra định dạng keyspace. Chúng tôi đã chuẩn hóa cấu trúc đề xuất thành dạng phân cấp: `rms:auth:refresh:<userId>`. Cấu trúc tiền tố (prefix) này giúp ngăn ngừa trùng lặp namespace và dễ dàng thiết lập thời gian sống tự hủy (TTL) khớp với thời gian hết hạn của token (7 ngày).

**Thông tin kiểm toán:**
- **Giai đoạn SDLC:** Lập kế hoạch triển khai
- **Công cụ AI sử dụng:** ChatGPT
- **Thước đo định lượng:** Thiết lập 1 quy ước keyspace chuẩn
- **Rủi ro & Hạn chế quan sát được:** Xung đột khóa nếu các microservices khác dùng chung Redis không có prefix.

---

## Nhiệm vụ 6: Thiết lập các xác nhận kiểm thử cho yêu cầu refresh token sau khi đăng xuất

### 1. Câu hỏi gửi AI (Prompt)

```text
Tạo các xác nhận kiểm thử đơn vị để đảm bảo việc gửi yêu cầu refresh token sau khi token đã bị xóa sẽ trả về mã lỗi 401.
```

### 2. Câu trả lời chi tiết của AI

Xác nhận rằng việc gọi route `/auth/refresh` sẽ ném ra lỗi `UnauthorizedException` khi kết quả truy vấn redis client đối với khóa tương ứng trả về giá trị `null`.

### 3. Đánh giá, chọn lọc & Tùy biến mã nguồn của Sinh viên

**Mô tả quá trình kiểm tra:**
Chúng tôi kiểm thử logic giả lập Redis. Mã nguồn sinh ra bởi AI chưa bao quát trường hợp kết nối Redis bị lỗi hoặc trả về giá trị rỗng. Chúng tôi đã tùy biến kiểm thử để đảm bảo rằng khi truy vấn Redis trả về null, bộ xử lý AuthController sẽ ném ra ngoại lệ `UnauthorizedException` ngay lập tức.

**Thông tin kiểm toán:**
- **Giai đoạn SDLC:** Chuẩn bị kiểm thử
- **Công cụ AI sử dụng:** GitHub Copilot
- **Thước đo định lượng:** Tạo 3 kịch bản kiểm thử lỗi
- **Rủi ro & Hạn chế quan sát được:** Mã sinh tự động không kiểm soát thời gian timeout kết nối.

---

## Nhiệm vụ 7: Trích xuất và kiểm tra JWT từ HTTP Authorization Header trong Gateway

### 1. Câu hỏi gửi AI (Prompt)

```text
Viết mã trích xuất token cho JwtAuthGuard của NestJS để lấy token từ HTTP Authorization header.
```

### 2. Câu trả lời chi tiết của AI

```typescript
const request = context.switchToHttp().getRequest();
const [type, token] = request.headers.authorization?.split(' ') ?? [];
return type === 'Bearer' ? token : undefined;
```

### 3. Đánh giá, chọn lọc & Tùy biến mã nguồn của Sinh viên

**Mô tả quá trình kiểm tra:**
Chúng tôi kiểm tra mã tách chuỗi header. Chúng tôi đã tùy biến mã nguồn để xử lý không phân biệt chữ hoa chữ thường đối với tên header (ví dụ: `Authorization` hoặc `authorization`). Chúng tôi cũng thêm kiểm tra độ dài chuỗi sau phân tách để tránh lỗi chỉ mục khi client gửi chuỗi header không đúng định dạng.

**Thông tin kiểm toán:**
- **Giai đoạn SDLC:** Triển khai
- **Công cụ AI sử dụng:** ChatGPT, GitHub Copilot
- **Thước đo định lượng:** Xây dựng 1 bộ phân tích header
- **Rủi ro & Hạn chế quan sát được:** Request lỗi có thể gây sập app nếu thiếu khối try-catch.

