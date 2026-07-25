import os
import openpyxl
from openpyxl.styles import Font, Alignment, Border, Side
from openpyxl.utils import get_column_letter

# Define detailed weekly data in Vietnamese
WEEKLY_DATA = {
    "Week1": [
        {
            "SDLC Phase": "Phân tích yêu cầu",
            "Task / Activity": "Nghiên cứu và lựa chọn chiến lược tìm kiếm ứng viên tối ưu (Tìm kiếm kết hợp Hybrid vs tìm kiếm ngữ nghĩa Vector)",
            "AI Tool Used": "Gemini",
            "AI Output": "Khuyên dùng giải pháp tìm kiếm kết hợp (hybrid search) kết hợp từ khóa (BM25) và vector nhúng (dense embeddings) sử dụng PGVector trên PostgreSQL, kết hợp thuật toán RRF để xếp hạng kết quả.",
            "Student’s Validation / Modification": "Chúng tôi đã xem xét đề xuất của AI về việc sử dụng cấu trúc hai cơ sở dữ liệu (Elasticsearch cho tìm kiếm văn bản và pgvector cho vector nhúng) và đã bác bỏ nó vì chi phí vận hành cao và độ trễ đồng bộ dữ liệu. Thay vào đó, chúng tôi chọn giải pháp sử dụng khả năng tích hợp sẵn của PostgreSQL: kết hợp FTS (tsvector/tsquery) và pgvector cosine similarity (<=>). Chúng tôi triển khai thuật toán Reciprocal Rank Fusion (RRF) trực tiếp trong một truy vấn SQL thuần để đảm bảo độ trễ dưới 100ms và tính nhất quán giao dịch dữ liệu tuyệt đối.",
            "Evidence / Link": "https://github.com/vvtPhongdev/SE20A05Group7RMS/blob/main/docs/Report/AI_Evidence/Week1.docx",
            "Quantitative Measure": "Phân tích 2 phương pháp tìm kiếm, chọn Hybrid",
            "Value Added (1-5)": 5,
            "Risks / Limitations Observed": "Có thể giảm hiệu năng khi cơ sở dữ liệu phình to, cần tối ưu hóa và tinh chỉnh chỉ mục.",
            "Prompt": "Chúng tôi đang xây dựng Hệ thống quản lý tuyển dụng (RMS). Nhà tuyển dụng cần tìm kiếm ứng viên dựa trên văn bản CV. Tìm kiếm từ khóa quá hạn chế, nhưng tìm kiếm ngữ nghĩa thuần túy (vector) lại bỏ sót các từ viết tắt hoặc từ khóa công nghệ cụ thể. Làm thế nào để xây dựng tìm kiếm kết hợp (hybrid search) hiệu quả? Cơ sở dữ liệu và stack nào tốt nhất cho Node.js?",
            "Response": "Tôi khuyên bạn nên sử dụng phương pháp Tìm kiếm Kết hợp (Hybrid Search) với cơ sở dữ liệu PostgreSQL tích hợp hai tính năng chính:\n1. **Tiện ích PGVector**: để lưu trữ các vector nhúng (dense embeddings). Bạn có thể dùng mô hình sentence-transformers 'all-MiniLM-L6-v2' (384 chiều) để tạo vector cho văn bản CV.\n2. **Tìm kiếm toàn văn PostgreSQL (Full-Text Search - FTS)**: để lập chỉ mục các từ khóa thưa thớt (sparse keywords) sử dụng `tsvector` và `tsquery` (hỗ trợ các từ khóa kỹ thuật như JWT, OAuth, NestJS).\n\nĐể kết hợp kết quả, hãy sử dụng **Reciprocal Rank Fusion (RRF)**. Trong Node.js/Prisma, bạn có thể thực thi một truy vấn SQL thuần thông qua `prisma.$queryRaw` để tính toán cả khoảng cách cosine và xếp hạng FTS, cộng tổng các xếp hạng nghịch đảo của chúng và trả về kết quả ứng viên được xếp hạng. Điều này giúp tránh sự phức tạp khi sử dụng hai cơ sở dữ liệu riêng biệt."
        },
        {
            "SDLC Phase": "Thiết kế",
            "Task / Activity": "Thiết kế sơ đồ cơ sở dữ liệu (ERD) ban đầu cho hệ thống đa doanh nghiệp (recruiter, department head, campaign, candidate, CV)",
            "AI Tool Used": "Gemini",
            "AI Output": "Đề xuất cấu trúc bảng SQL bao gồm: Doanh nghiệp, Người dùng, Phòng ban, Yêu cầu tuyển dụng, Chiến dịch, Hồ sơ ứng viên, CV, Phỏng vấn, Đánh giá, và các khóa ngoại liên quan.",
            "Student’s Validation / Modification": "Chúng tôi đã kiểm tra sơ đồ đề xuất của AI đối với các yêu cầu dự án. Chúng tôi chọn lọc và tùy biến các mối quan hệ thực thể: (1) đơn giản hóa mô hình ApprovalChain để ánh xạ trực tiếp các cấp bậc phê duyệt tới Trưởng bộ phận và quản lý HR, (2) bắt buộc thêm ràng buộc cô lập dữ liệu trên tất cả các thực thể chính bằng khóa ngoại organizationId, và (3) lập chỉ mục trên các khóa ngoại để tối ưu hóa hiệu năng truy vấn và ngăn chặn quét toàn bảng (table scans).",
            "Evidence / Link": "https://github.com/vvtPhongdev/SE20A05Group7RMS/blob/main/docs/Report/AI_Evidence/Week1.docx",
            "Quantitative Measure": "Tạo ra 9 bảng thực thể và 12 mối quan hệ",
            "Value Added (1-5)": 5,
            "Risks / Limitations Observed": "Prisma schema không hỗ trợ vẽ biểu đồ trực quan, cần đồng bộ thủ công với Draw.io.",
            "Prompt": "Vui lòng viết một cấu trúc cơ sở dữ liệu mẫu bằng cú pháp Prisma cho hệ thống RMS đa doanh nghiệp (multi-tenant). Chúng tôi cần các bảng: Organizations (doanh nghiệp), Users (roles: GLOBAL_ADMIN, ORG_ADMIN, DEPT_HEAD, HR_USER), Departments, RecruitmentRequests, ApprovalChains, Campaigns, CandidateProfiles, CVs, và Interviews.",
            "Response": "Dưới đây là cấu trúc Prisma schema được đề xuất:\n\n```prisma\ndatasource db {\n  provider = \"postgresql\"\n  url      = env(\"DATABASE_URL\")\n}\n\ngenerator client {\n  provider = \"prisma-client-js\"\n}\n\nenum Role {\n  GLOBAL_ADMIN\n  ORG_ADMIN\n  DEPT_HEAD\n  HR_USER\n}\n\nmodel Organization {\n  id        String   @id @default(uuid())\n  name      String\n  slug      String   @unique\n  users     User[]\n  departments Department[]\n  createdAt DateTime @default(now())\n}\n\nmodel User {\n  id             String        @id @default(uuid())\n  email          String        @unique\n  name           String\n  role           Role\n  organizationId String\n  organization   Organization  @relation(fields: [organizationId], references: [id])\n  createdAt      DateTime      @default(now())\n}\n\nmodel Department {\n  id             String        @id @default(uuid())\n  name           String\n  organizationId String\n  organization   Organization  @relation(fields: [organizationId], references: [id])\n}\n```\n\nHãy đảm bảo tất cả các truy vấn đa doanh nghiệp luôn lọc theo `organizationId` để đảm bảo cô lập dữ liệu."
        }
    ],
    "Week2": [
        {
            "SDLC Phase": "Triển khai",
            "Task / Activity": "Áp dụng JwtAuthGuard và RolesGuard toàn cục trong Gateway bootstrap main.ts",
            "AI Tool Used": "ChatGPT",
            "AI Output": "Cung cấp cấu hình tiêu chuẩn sử dụng app.useGlobalGuards(new JwtAuthGuard(reflector)) và hướng dẫn hỗ trợ bỏ qua xác thực bằng Reflector.",
            "Student’s Validation / Modification": "Chúng tôi đã xem xét cấu hình guards toàn cục của AI. Chúng tôi chỉnh sửa nó vì việc đăng ký guards toàn cục trực tiếp trong main.ts yêu cầu tiêm Reflector một cách chính xác để giải quyết metadata ở cấp class và handler. Chúng tôi đã cấu hình lại JwtAuthGuard để sử dụng reflector.getAllAndOverride nhằm hỗ trợ decorator @Public() tùy chỉnh, giúp bỏ qua xác thực JWT một cách an toàn trên các API công khai như đăng nhập và đăng ký.",
            "Evidence / Link": "https://github.com/vvtPhongdev/SE20A05Group7RMS/blob/main/docs/Report/AI_Evidence/Week2.docx",
            "Quantitative Measure": "Cấu hình 2 guards toàn cục",
            "Value Added (1-5)": 5,
            "Risks / Limitations Observed": "Đặt Reflector không đúng vị trí có thể gây lỗi runtime khi đọc metadata.",
            "Prompt": "Chúng tôi cần thiết lập JWT authentication toàn cục trong NestJS gateway, nhưng cho phép một số endpoint là public. Làm sao để định nghĩa một global Guard và đọc custom metadata trong guard class?",
            "Response": "Để làm việc này, tạo một decorator `@Public()` và cấu hình global guard sử dụng NestJS `Reflector`:\n\n1. **Định nghĩa decorator public (`public.decorator.ts`):**\n```typescript\nimport { SetMetadata } from '@nestjs/common';\nexport const IS_PUBLIC_KEY = 'isPublic';\nexport const Public = () => SetMetadata(IS_PUBLIC_KEY, true);\n```\n\n2. **Kiểm tra metadata trong guard class (`jwt-auth.guard.ts`):**\n```typescript\n@Injectable()\nexport class JwtAuthGuard extends AuthGuard('jwt') {\n  constructor(private reflector: Reflector) {\n    super();\n  }\n  canActivate(context: ExecutionContext) {\n    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [\n      context.getHandler(),\n      context.getClass(),\n    ]);\n    if (isPublic) return true;\n    return super.canActivate(context);\n  }\n}\n```\n\n3. **Đăng ký toàn cục trong `main.ts`:**\n```typescript\nconst reflector = app.get(Reflector);\napp.useGlobalGuards(new JwtAuthGuard(reflector));\n```"
        },
        {
            "SDLC Phase": "Kiểm thử",
            "Task / Activity": "Viết integration test bằng Jest để kiểm tra việc chặn truy cập không có token",
            "AI Tool Used": "ChatGPT",
            "AI Output": "Đề xuất cấu trúc bộ kiểm thử sử dụng thư viện supertest để gửi request đến route bảo mật mà không kèm Bearer token.",
            "Student’s Validation / Modification": "Chúng tôi phân tích các test case do AI gợi ý. Mã nguồn của AI thiếu cấu hình mock cho Gateway ngoại vi. Chúng tôi đã sửa đổi bộ kiểm thử sử dụng TestingModule của NestJS để mock JWT Secret, đảm bảo mọi request không kèm Bearer token đều bị chặn và trả về đúng mã lỗi 401 Unauthorized cùng với cấu trúc payload lỗi chuẩn hóa của hệ thống.",
            "Evidence / Link": "https://github.com/vvtPhongdev/SE20A05Group7RMS/blob/main/docs/Report/AI_Evidence/Week2.docx",
            "Quantitative Measure": "Tạo 3 kịch bản kiểm thử tích hợp",
            "Value Added (1-5)": 4,
            "Risks / Limitations Observed": "Lỗi mock có thể khác biệt so với filter ngoại lệ thực tế của NestJS.",
            "Prompt": "Vui lòng viết một bộ kiểm thử tích hợp sử dụng Jest và Supertest để kiểm tra rằng NestJS Gateway trả về 401 Unauthorized cho các route được bảo vệ khi không có token.",
            "Response": "```typescript\nimport { Test, TestingModule } from '@nestjs/testing';\nimport { INestApplication } from '@nestjs/common';\nimport * as request from 'supertest';\nimport { AppModule } from '../src/app.module';\n\ndescribe('Gateway Authentication Tests', () => {\n  let app: INestApplication;\n  beforeAll(async () => {\n    const moduleFixture: TestingModule = await Test.createTestingModule({\n      imports: [AppModule],\n    }).compile();\n    app = moduleFixture.createNestApplication();\n    await app.init();\n  });\n\n  it('GET /departments should fail with 401 without Bearer token', () => {\n    return request(app.getHttpServer())\n      .get('/departments')\n      .expect(401)\n      .expect((res) => {\n        expect(res.body.message).toEqual('Unauthorized');\n      });\n  });\n});\n```"
        },
        {
            "SDLC Phase": "Kiểm thử",
            "Task / Activity": "Viết Jest test xác nhận route công khai vượt qua JwtAuthGuard thành công",
            "AI Tool Used": "GitHub Copilot",
            "AI Output": "Tạo file kiểm thử mocking các phụ thuộc của AuthGuard.",
            "Student’s Validation / Modification": "Chúng tôi xem xét kịch bản kiểm thử và các xác nhận (assertions). Chúng tôi tùy biến để xác thực rằng các request HTTP tới `/auth/login` và `/auth/register` trả về mã 200/201 thành công và hoàn toàn bỏ qua xử lý của Guard. Chúng tôi cũng kiểm tra xem payload trả về có chứa đầy đủ các trường accessToken và refreshToken hay không.",
            "Evidence / Link": "https://github.com/vvtPhongdev/SE20A05Group7RMS/blob/main/docs/Report/AI_Evidence/Week2.docx",
            "Quantitative Measure": "Xác thực thành công 2 endpoint công khai",
            "Value Added (1-5)": 4,
            "Risks / Limitations Observed": "Copilot tạo cấu hình mock lỗi thời, cần sửa thủ công.",
            "Prompt": "Tạo file spec kiểm thử cho controller NestJS để kiểm tra rằng các route công khai như login/register bỏ qua JwtAuthGuard, trả về 200/201 thay vì 401.",
            "Response": "Mock context thực thi của Guard và trả về true đối với việc kiểm tra metadata. Sử dụng Supertest gọi POST /auth/login và xác nhận mã HTTP trả về là 200 OK thay vì 401."
        },
        {
            "SDLC Phase": "Phân tích yêu cầu",
            "Task / Activity": "Phân tích chiến lược vô hiệu hóa token khi người dùng đăng xuất sử dụng Redis",
            "AI Tool Used": "ChatGPT",
            "AI Output": "Giải thích cơ chế xóa khóa refresh token và thiết lập danh sách đen (blacklist) access token trong Redis.",
            "Student’s Validation / Modification": "Chúng tôi đánh giá cả hai chiến lược thu hồi token do AI đề xuất: thiết lập blacklist access token và xóa refresh token. Chúng tôi đã từ chối phương án blacklist access token do số lượng ghi lớn và gây phình to bộ nhớ của Redis cho các token ngắn hạn. Chúng tôi quyết định chọn phương pháp xóa refresh token từ Redis khi đăng xuất, điều này ngăn chặn việc cấp access token mới khi hết hạn, trong khi để các access token cũ tự hết hạn tự nhiên để tiết kiệm tài nguyên.",
            "Evidence / Link": "https://github.com/vvtPhongdev/SE20A05Group7RMS/blob/main/docs/Report/AI_Evidence/Week2.docx",
            "Quantitative Measure": "Nghiên cứu 2 phương pháp thu hồi",
            "Value Added (1-5)": 5,
            "Risks / Limitations Observed": "Sự cố cụm Redis có thể làm mất đồng bộ trạng thái token.",
            "Prompt": "Cách tốt nhất để xử lý logout và thu hồi refresh token trong hệ thống microservices là gì? Nên dùng blacklist access token hay xóa refresh token trong Redis?",
            "Response": "Khi đăng xuất, chiến lược hiệu quả nhất là xóa refresh token khỏi Redis. Vì access token là stateless và có thời gian sống ngắn, việc xóa refresh token sẽ ngăn người dùng tạo access token mới. Nếu cần thu hồi ngay lập tức access token trước khi hết hạn, bạn có thể lưu chữ ký access token vào Redis blacklist với thời gian sống (TTL) bằng thời gian còn lại của token đó."
        },
        {
            "SDLC Phase": "Lập kế hoạch triển khai",
            "Task / Activity": "Thiết kế Redis keyspace và cấu trúc dữ liệu lưu trữ token",
            "AI Tool Used": "ChatGPT",
            "AI Output": "Gợi ý định dạng lưu trữ dạng khóa redis.del('refresh_token:' + userId) khi nhận sự kiện đăng xuất.",
            "Student’s Validation / Modification": "Chúng tôi kiểm tra định dạng keyspace. Chúng tôi đã chuẩn hóa cấu trúc đề xuất thành dạng phân cấp: `rms:auth:refresh:<userId>`. Cấu trúc tiền tố (prefix) này giúp ngăn ngừa trùng lặp namespace và dễ dàng thiết lập thời gian sống tự hủy (TTL) khớp với thời gian hết hạn của token (7 ngày).",
            "Evidence / Link": "https://github.com/vvtPhongdev/SE20A05Group7RMS/blob/main/docs/Report/AI_Evidence/Week2.docx",
            "Quantitative Measure": "Thiết lập 1 quy ước keyspace chuẩn",
            "Value Added (1-5)": 5,
            "Risks / Limitations Observed": "Xung đột khóa nếu các microservices khác dùng chung Redis không có prefix.",
            "Prompt": "Chúng tôi cần lập kế hoạch cấu trúc keyspace Redis để lưu trữ refresh token. Làm sao để tránh xung đột và hỗ trợ việc xóa nhanh?",
            "Response": "Sử dụng định dạng `rms:auth:refresh:<userId>`. Khi đăng xuất, thực hiện: `redis.del('rms:auth:refresh:' + user.id)`. Bạn cũng có thể lưu dưới dạng hash nếu muốn hỗ trợ nhiều phiên đăng nhập trên nhiều thiết bị cho cùng một người dùng."
        },
        {
            "SDLC Phase": "Chuẩn bị kiểm thử",
            "Task / Activity": "Thiết lập các xác nhận kiểm thử cho yêu cầu refresh token sau khi đăng xuất",
            "AI Tool Used": "GitHub Copilot",
            "AI Output": "Mã boilerplate xác nhận lỗi 401 Unauthorized khi cố gắng refresh token bằng token đã bị xóa.",
            "Student’s Validation / Modification": "Chúng tôi kiểm thử logic giả lập Redis. Mã nguồn sinh ra bởi AI chưa bao quát trường hợp kết nối Redis bị lỗi hoặc trả về giá trị rỗng. Chúng tôi đã tùy biến kiểm thử để đảm bảo rằng khi truy vấn Redis trả về null, bộ xử lý AuthController sẽ ném ra ngoại lệ `UnauthorizedException` ngay lập tức.",
            "Evidence / Link": "https://github.com/vvtPhongdev/SE20A05Group7RMS/blob/main/docs/Report/AI_Evidence/Week2.docx",
            "Quantitative Measure": "Tạo 3 kịch bản kiểm thử lỗi",
            "Value Added (1-5)": 4,
            "Risks / Limitations Observed": "Mã sinh tự động không kiểm soát thời gian timeout kết nối.",
            "Prompt": "Tạo các xác nhận kiểm thử đơn vị để đảm bảo việc gửi yêu cầu refresh token sau khi token đã bị xóa sẽ trả về mã lỗi 401.",
            "Response": "Xác nhận rằng việc gọi route `/auth/refresh` sẽ ném ra lỗi `UnauthorizedException` khi kết quả truy vấn redis client đối với khóa tương ứng trả về giá trị `null`."
        },
        {
            "SDLC Phase": "Triển khai",
            "Task / Activity": "Trích xuất và kiểm tra JWT từ HTTP Authorization Header trong Gateway",
            "AI Tool Used": "ChatGPT, GitHub Copilot",
            "AI Output": "Cung cấp mã tách chuỗi 'Bearer <token>' và giải mã chữ ký bằng JwtService.",
            "Student’s Validation / Modification": "Chúng tôi kiểm tra mã tách chuỗi header. Chúng tôi đã tùy biến mã nguồn để xử lý không phân biệt chữ hoa chữ thường đối với tên header (ví dụ: `Authorization` hoặc `authorization`). Chúng tôi cũng thêm kiểm tra độ dài chuỗi sau phân tách để tránh lỗi chỉ mục khi client gửi chuỗi header không đúng định dạng.",
            "Evidence / Link": "https://github.com/vvtPhongdev/SE20A05Group7RMS/blob/main/docs/Report/AI_Evidence/Week2.docx",
            "Quantitative Measure": "Xây dựng 1 bộ phân tích header",
            "Value Added (1-5)": 5,
            "Risks / Limitations Observed": "Request lỗi có thể gây sập app nếu thiếu khối try-catch.",
            "Prompt": "Viết mã trích xuất token cho JwtAuthGuard của NestJS để lấy token từ HTTP Authorization header.",
            "Response": "```typescript\nconst request = context.switchToHttp().getRequest();\nconst [type, token] = request.headers.authorization?.split(' ') ?? [];\nreturn type === 'Bearer' ? token : undefined;\n```"
        }
    ],
    "Week3": [
        {
            "SDLC Phase": "Quản lý phòng ban & Doanh nghiệp",
            "Task / Activity": "Xây dựng service CRUD doanh nghiệp hỗ trợ phân trang và đếm số lượng thành viên",
            "AI Tool Used": "Gemini",
            "AI Output": "NestJS service class sử dụng Prisma client truy vấn skip/take để phân trang và dùng _count để đếm quan hệ.",
            "Student’s Validation / Modification": "Chúng tôi đã xem xét mã của AI. Đề xuất của AI chỉ trả về dữ liệu thô từ database. Chúng tôi đã tùy biến phương thức để bọc dữ liệu trong một DTO phản hồi chuẩn hóa bao gồm các trường metadata phân trang: `items`, `totalCount`, `page`, `limit` và `totalPages`. Chúng tôi cũng thêm bộ lọc Prisma để ẩn thông tin nhạy cảm của thành viên khi trả về danh sách.",
            "Evidence / Link": "https://github.com/vvtPhongdev/SE20A05Group7RMS/blob/main/docs/Report/AI_Evidence/Week3.docx",
            "Quantitative Measure": "Hoàn thành 4 phương thức CRUD",
            "Value Added (1-5)": 4,
            "Risks / Limitations Observed": "Truy vấn kết bảng không tối ưu có thể gây chậm khi lượng doanh nghiệp tăng lớn.",
            "Prompt": "Viết một OrganizationService trong NestJS xử lý các hành động CRUD với Prisma. Triển khai phân trang dùng skip và take, kiểm tra slug trùng lặp, và lấy ra số lượng thành viên.",
            "Response": "```typescript\nasync findAll(query: PaginateDto) {\n  const [items, total] = await this.prisma.$transaction([\n    this.prisma.organization.findMany({\n      skip: (query.page - 1) * query.limit,\n      take: query.limit,\n      include: { _count: { select: { members: true } } },\n    }),\n    this.prisma.organization.count(),\n  ]);\n  return { items, total, totalPages: Math.ceil(total / query.limit) };\n}\n```"
        },
        {
            "SDLC Phase": "Kiểm thử",
            "Task / Activity": "Viết unit test cho DepartmentService ngăn chặn việc xóa khi có yêu cầu tuyển dụng đang hoạt động",
            "AI Tool Used": "ChatGPT",
            "AI Output": "Mã kiểm thử giả lập Prisma trả về lỗi ngoại lệ khi xóa phòng ban.",
            "Student’s Validation / Modification": "Chúng tôi đã kiểm tra mã kiểm thử. Gợi ý của AI giả định rằng database sẽ tự động ném lỗi khóa ngoại. Chúng tôi quyết định tự viết một bước kiểm tra rõ ràng trong code dịch vụ bằng cách gọi `prisma.recruitmentRequest.count()` trước khi xóa. Nếu phòng ban đang có yêu cầu tuyển dụng hoạt động, hệ thống sẽ ném ra lỗi `BadRequestException` ngay lập tức, tránh việc rollback giao dịch ở mức database.",
            "Evidence / Link": "https://github.com/vvtPhongdev/SE20A05Group7RMS/blob/main/docs/Report/AI_Evidence/Week3.docx",
            "Quantitative Measure": "Tạo 5 kịch bản unit test",
            "Value Added (1-5)": 4,
            "Risks / Limitations Observed": "Cấu trúc mock Prisma cần cập nhật lại khi schema thay đổi.",
            "Prompt": "Tạo một unit test bằng Jest cho phương thức `delete()` của DepartmentService trong NestJS. Nếu phòng ban có yêu cầu tuyển dụng đang hoạt động, nó phải ném ra lỗi BadRequestException và không được gọi xóa database.",
            "Response": "Mock kết quả của `prisma.recruitmentRequest.count` trả về `1` (lớn hơn 0), sau đó kiểm tra rằng việc gọi `service.delete(id)` ném ra ngoại lệ `BadRequestException`."
        },
        {
            "SDLC Phase": "Kiểm thử",
            "Task / Activity": "Viết kiểm thử đảm bảo tính tuần tự không ngắt quãng của các cấp phê duyệt trong ApprovalChain",
            "AI Tool Used": "ChatGPT",
            "AI Output": "Mã kiểm thử kiểm tra tính hợp lệ của mảng cấp bậc phê duyệt khi tạo mới.",
            "Student’s Validation / Modification": "Chúng tôi xem xét logic kiểm thử của AI. Đoạn mã của AI chỉ kiểm tra việc sắp xếp mảng mà không kiểm tra tính liên tục. Chúng tôi đã bổ sung kiểm tra để đảm bảo tập hợp các cấp phê duyệt trong chuỗi không có khoảng trống (ví dụ: chuỗi `[1, 2, 3]` hợp lệ, nhưng `[1, 3]` sẽ bị từ chối vì thiếu cấp 2). Điều này đảm bảo quy trình phê duyệt tuần tự hoạt động đúng mà không bỏ sót bước.",
            "Evidence / Link": "https://github.com/vvtPhongdev/SE20A05Group7RMS/blob/main/docs/Report/AI_Evidence/Week3.docx",
            "Quantitative Measure": "Tạo 3 kịch bản kiểm thử",
            "Value Added (1-5)": 4,
            "Risks / Limitations Observed": "Mã nguồn mock dữ liệu mảng bị fix cứng trong các test case.",
            "Prompt": "Write unit tests in Jest verifying that creating an ApprovalChain checks that approval levels are strictly sequential (e.g. level 1, level 2) with no skips.",
            "Response": "Tạo một test case kiểm tra xem việc gửi danh sách cấp độ `[1, 3]` có ném ra lỗi xác thực hay không vì thiếu cấp độ `2`. Mảng phải được sắp xếp và kiểm tra gia số bằng đúng 1."
        },
        {
            "SDLC Phase": "Kiểm thử",
            "Task / Activity": "Giả lập (Mock) phản hồi giao dịch lồng nhau (transaction) của Prisma Client trong Jest",
            "AI Tool Used": "ChatGPT",
            "AI Output": "Đoạn mã ví dụ chỉ cách giả lập prisma.$transaction sử dụng Jest mock functions.",
            "Student’s Validation / Modification": "Chúng tôi đánh giá các mock gợi ý. Chúng tôi tùy biến cách mock `$transaction` bằng cách cho phép nó nhận một mảng các promises hoặc một hàm callback và thực thi chúng đồng thời. Điều này cho phép chúng tôi mô phỏng các lỗi lưu database để kiểm tra logic rollback của service.",
            "Evidence / Link": "https://github.com/vvtPhongdev/SE20A05Group7RMS/blob/main/docs/Report/AI_Evidence/Week3.docx",
            "Quantitative Measure": "Xác thực 2 bộ giả lập giao dịch",
            "Value Added (1-5)": 4,
            "Risks / Limitations Observed": "Mã mock transaction của Prisma khá dài dòng và phức tạp.",
            "Prompt": "Làm thế nào để mock `prisma.$transaction` trong Jest khi kiểm thử một phương thức service thực hiện nhiều truy vấn database một cách đồng thời?",
            "Response": "Mock `$transaction` bằng cách nhận một mảng các promises hoặc một callback function, thực thi nó và trả về các giá trị mock tương ứng:\n```typescript\nprismaMock.$transaction.mockImplementation((promises) => Promise.all(promises));\n```"
        }
    ],
    "Week4": [
        {
            "SDLC Phase": "Triển khai",
            "Task / Activity": "Triển khai RolesGuard hỗ trợ đa doanh nghiệp sử dụng Reflector",
            "AI Tool Used": "Gemini",
            "AI Output": "Tạo decorator @Roles() và RolesGuard trích xuất quyền người dùng để so sánh với metadata của route.",
            "Student’s Validation / Modification": "Chúng tôi xem xét mã của RolesGuard. Chúng tôi đã tùy biến lớp guard này để thực hiện kiểm tra kép: (1) người dùng có quyền thích hợp (ví dụ: `DEPT_HEAD`) và (2) người dùng thuộc đúng tổ chức đang được yêu cầu (`user.organizationId === req.params.orgId`). Điều này ngăn chặn việc leo thang đặc quyền theo chiều ngang giữa các doanh nghiệp khác nhau.",
            "Evidence / Link": "https://github.com/vvtPhongdev/SE20A05Group7RMS/blob/main/docs/Report/AI_Evidence/Week4.docx",
            "Quantitative Measure": "Cấu hình phân quyền cho 3 vai trò",
            "Value Added (1-5)": 5,
            "Risks / Limitations Observed": "Thay đổi vai trò người dùng trong DB không cập nhật ngay vào session token đang hoạt động.",
            "Prompt": "Viết một RolesGuard trong NestJS để kiểm tra vai trò người dùng dựa trên metadata. Guard phải hỗ trợ đa doanh nghiệp bằng cách đối chiếu organizationId của người dùng với request params.",
            "Response": "Guard nên trích xuất vai trò từ Reflector. Nếu vai trò khớp, trích xuất `user.organizationId` và đối chiếu với parameter `req.params.orgId`. Trả về lỗi ForbiddenException nếu không khớp."
        },
        {
            "SDLC Phase": "Triển khai",
            "Task / Activity": "Truyền thông tin ngữ cảnh người dùng (userId, orgId) qua TCP microservice transporter",
            "AI Tool Used": "Gemini",
            "AI Output": "Cung cấp giải pháp dùng ClientProxy trong NestJS để đính kèm thêm tham số vào payload khi gửi tin nhắn RPC.",
            "Student’s Validation / Modification": "Chúng tôi xem xét cơ chế giao tiếp microservice. Vì NestJS TCP transporter không có header HTTP truyền thống để lưu session, chúng tôi đã đóng gói dữ liệu request trong một cấu trúc chuẩn chứa trường `context` (gồm userId và organizationId). Ở phía microservice nhận, chúng tôi xây dựng một Interceptor để tự động trích xuất thông tin ngữ cảnh này và đặt vào luồng thực thi.",
            "Evidence / Link": "https://github.com/vvtPhongdev/SE20A05Group7RMS/blob/main/docs/Report/AI_Evidence/Week4.docx",
            "Quantitative Measure": "Truyền ngữ cảnh qua lại giữa 2 microservices",
            "Value Added (1-5)": 4,
            "Risks / Limitations Observed": "Payload TCP ở dạng read-only, cần clone trước khi chèn ngữ cảnh.",
            "Prompt": "Làm thế nào để truyền userId và organizationId của người dùng đã xác thực từ Gateway xuống các microservices qua NestJS TCP transporter?",
            "Response": "Đóng gói các payload gửi qua TCP vào một wrapper object chứa thông tin ngữ cảnh:\n```typescript\nthis.client.send('pattern', { data: payload, context: { userId, orgId } });\n```"
        },
        {
            "SDLC Phase": "Kiểm thử",
            "Task / Activity": "Viết integration test đảm bảo cô lập dữ liệu giữa các doanh nghiệp",
            "AI Tool Used": "Gemini",
            "AI Output": "Tạo các request Jest giả lập việc truy cập chéo tài nguyên của doanh nghiệp khác để mong đợi mã lỗi 403.",
            "Student’s Validation / Modification": "Chúng tôi đã cấu hình các kịch bản kiểm thử tích hợp. Chúng tôi xác thực tính cô lập bằng cách cho Người dùng thuộc Doanh nghiệp A gửi request kèm JWT hợp lệ, nhưng thay đổi tham số ID tài nguyên thành ID thuộc Doanh nghiệp B. Chúng tôi kiểm tra xem API có chặn và trả về đúng lỗi 403 Forbidden hay không.",
            "Evidence / Link": "https://github.com/vvtPhongdev/SE20A05Group7RMS/blob/main/docs/Report/AI_Evidence/Week4.docx",
            "Quantitative Measure": "Thực thi 6 kịch bản kiểm thử tích hợp",
            "Value Added (1-5)": 4,
            "Risks / Limitations Observed": "Nếu mock dữ liệu không khớp UUID thì database có thể báo lỗi định dạng trước khi chạy logic cô lập.",
            "Prompt": "Tạo các bộ integration test bằng Jest để kiểm tra rằng người dùng thuộc Doanh nghiệp A không thể xem hoặc chỉnh sửa tài nguyên của Doanh nghiệp B.",
            "Response": "Gửi request đến endpoint bảo mật bằng token của người dùng A nhưng truyền tham số ID tổ chức của doanh nghiệp B. Kiểm tra xem Gateway có trả về lỗi 403 Forbidden hay không."
        }
    ],
    "Week5": [
        {
            "SDLC Phase": "Triển khai",
            "Task / Activity": "Xây dựng logic xử lý phê duyệt tuần tự các cấp cho Yêu cầu tuyển dụng",
            "AI Tool Used": "Gemini",
            "AI Output": "Cung cấp mã Prisma transaction cập nhật trạng thái yêu cầu và tìm kiếm người phê duyệt tiếp theo dựa trên thứ tự cấp.",
            "Student’s Validation / Modification": "Chúng tôi kiểm tra mã xử lý phê duyệt. Chúng tôi đã đóng gói toàn bộ quy trình này vào một Prisma transaction: (1) cập nhật trạng thái cấp hiện tại thành APPROVED, (2) tìm kiếm cấp N+1 tiếp theo trong chuỗi, (3) nếu tồn tại, chuyển trạng thái yêu cầu sang PENDING_APPROVAL và gửi thông báo cho người phê duyệt mới, (4) nếu không còn cấp nào, cập nhật trạng thái cuối cùng của yêu cầu thành APPROVED. Chúng tôi cũng thêm kiểm tra trạng thái tài khoản của người duyệt tiếp theo để đảm bảo tài khoản của họ vẫn đang hoạt động.",
            "Evidence / Link": "https://github.com/vvtPhongdev/SE20A05Group7RMS/blob/main/docs/Report/AI_Evidence/Week5.docx",
            "Quantitative Measure": "Xác thực 3 bước chuyển đổi trạng thái phê duyệt",
            "Value Added (1-5)": 5,
            "Risks / Limitations Observed": "Có thể gây deadlock database nếu nhiều người cùng bấm duyệt một lúc trên cùng bản ghi.",
            "Prompt": "Triển khai logic phê duyệt tuần tự trong NestJS với Prisma: khi cấp N được phê duyệt, tìm cấp N+1 và cập nhật trạng thái thành PENDING_APPROVAL. Nếu không có cấp N+1, cập nhật trạng thái yêu cầu thành APPROVED.",
            "Response": "Thực hiện một giao dịch Prisma. Tải thông tin ApprovalRequest và chuỗi phê duyệt của nó. Kiểm tra cấp độ đã duyệt. Tìm người duyệt cấp N+1. Cập nhật trạng thái và lưu lịch sử. Nếu không còn cấp tiếp theo, đặt trạng thái thành `APPROVED`."
        },
        {
            "SDLC Phase": "Thiết kế kiến trúc",
            "Task / Activity": "Tích hợp hàng đợi xử lý ngầm (background job) gửi email thông báo sử dụng BullMQ",
            "AI Tool Used": "ChatGPT",
            "AI Output": "Cấu hình Producer và Consumer của BullMQ trong NestJS để đẩy tác vụ gửi thư vào hàng đợi lưu trữ trên Redis.",
            "Student’s Validation / Modification": "Chúng tôi thiết lập BullMQ. Mã của AI thiếu phần xử lý lỗi kết nối SMTP và giới hạn số lần thử lại. Chúng tôi đã chỉnh sửa cấu hình job gửi mail để tự động thử lại tối đa 3 lần với khoảng thời gian trễ tăng dần (exponential backoff) nhằm tránh mất mát email thông báo khi mạng chập chờn.",
            "Evidence / Link": "https://github.com/vvtPhongdev/SE20A05Group7RMS/blob/main/docs/Report/AI_Evidence/Week5.docx",
            "Quantitative Measure": "Giảm tải 60% thời gian phản hồi API do xử lý ngầm",
            "Value Added (1-5)": 5,
            "Risks / Limitations Observed": "Công việc có thể tích tụ trong hàng đợi nếu hệ thống SMTP gặp sự cố kéo dài.",
            "Prompt": "Cấu hình BullMQ trong microservice NestJS để gửi email thông báo bất đồng bộ. Hàng đợi và worker nên được cấu trúc như thế nào?",
            "Response": "Cài đặt `@nestjs/bullmq` và `bullmq`. Cấu hình `BullModule.forRoot` kết nối Redis. Trong service của bạn, inject Queue và thêm các job. Định nghĩa một lớp Worker với decorator `@Processor('queue-name')` để xử lý việc gửi mail thực tế."
        },
        {
            "SDLC Phase": "Kiểm thử",
            "Task / Activity": "Kiểm thử tình trạng tranh chấp (race condition) khi nhiều người duyệt phê duyệt cùng lúc",
            "AI Tool Used": "ChatGPT",
            "AI Output": "Tạo kịch bản gửi đồng thời nhiều request cập nhật trạng thái bằng Promise.all để bắt lỗi xung đột.",
            "Student’s Validation / Modification": "Chúng tôi thực hiện kiểm thử tranh chấp. Chúng tôi viết một test case sử dụng `Promise.all` gửi đồng thời 2 yêu cầu phê duyệt cho cùng một bản ghi. Chúng tôi cấu hình database sử dụng cơ chế khóa bi quan hoặc kiểm tra phiên bản bản ghi để đảm bảo chỉ có 1 request thực thi thành công, request còn lại bị từ chối với lỗi 409 Conflict.",
            "Evidence / Link": "https://github.com/vvtPhongdev/SE20A05Group7RMS/blob/main/docs/Report/AI_Evidence/Week5.docx",
            "Quantitative Measure": "Gửi đồng thời 10 request song song trong môi trường kiểm thử",
            "Value Added (1-5)": 4,
            "Risks / Limitations Observed": "Prisma không hỗ trợ cú pháp select-for-update nguyên bản, cần dùng raw SQL.",
            "Prompt": "Làm thế nào để kiểm thử race condition khi phê duyệt yêu cầu trong Jest? Đảm bảo rằng nếu hai người duyệt nhấn phê duyệt cùng một mili giây, chỉ có một transaction thành công.",
            "Response": "Viết một test case sử dụng `Promise.all([\n  service.approve(id, user1),\n  service.approve(id, user2)\n])`. Xác nhận rằng một promise sẽ thành công và promise còn lại sẽ thất bại với lỗi 409 Conflict."
        }
    ],
    "Week6": [
        {
            "SDLC Phase": "Triển khai",
            "Task / Activity": "Đồng nhất định dạng lỗi của microservices bằng Exception Filters toàn cục",
            "AI Tool Used": "Gemini",
            "AI Output": "Cung cấp mã lớp filter RpcExceptionFilter giúp bắt các lỗi giao tiếp TCP và định dạng lại cấu trúc JSON phản hồi cho client.",
            "Student’s Validation / Modification": "Chúng tôi xem xét bộ lọc ngoại lệ. Mã gốc của AI chỉ hiển thị thông báo lỗi chung chung. Chúng tôi đã chỉnh sửa để bộ lọc có khả năng phân tích chi tiết lỗi xác thực đầu vào (class-validator) từ microservice gửi lên và phản hồi dạng mảng lỗi cụ thể cho client, đồng thời che giấu các vết lỗi hệ thống (stack trace) ở môi trường production.",
            "Evidence / Link": "https://github.com/vvtPhongdev/SE20A05Group7RMS/blob/main/docs/Report/AI_Evidence/Week6.docx",
            "Quantitative Measure": "Đồng bộ hóa 100% định dạng lỗi đầu ra",
            "Value Added (1-5)": 5,
            "Risks / Limitations Observed": "Cần cẩn thận tránh lộ thông tin kết nối database trong nội dung lỗi.",
            "Prompt": "Tạo một NestJS exception filter tại Gateway để bắt các ngoại lệ RPC từ microservice truyền qua TCP và tuần tự hóa chúng thành phản hồi HTTP chuẩn cho client.",
            "Response": "Triển khai `ExceptionFilter` bắt `RpcException`. Trích xuất response object, ánh xạ mã lỗi nội bộ (như lỗi Prisma hoặc lỗi nghiệp vụ) sang mã HTTP tương thích và trả về định dạng JSON chuẩn."
        },
        {
            "SDLC Phase": "Tối ưu hóa hiệu năng",
            "Task / Activity": "Triển khai chiến lược bộ đệm Redis Cache cho các API lấy dữ liệu tĩnh",
            "AI Tool Used": "ChatGPT",
            "AI Output": "Cấu hình CacheInterceptor trong NestJS với thời gian sống (TTL) tùy chỉnh cho từng endpoint.",
            "Student’s Validation / Modification": "Chúng tôi thiết lập bộ đệm. Để tránh rò rỉ dữ liệu giữa các doanh nghiệp khác nhau trong hệ thống đa thuê bao, chúng tôi đã tùy biến bộ phát sinh khóa cache (cache key generator) để tự động đính kèm ID tổ chức vào khóa (ví dụ: `cache:metadata:orgId:<key>`). Chúng tôi cũng thêm cơ chế xóa cache (cache invalidation) khi có hoạt động cập nhật hoặc xóa dữ liệu.",
            "Evidence / Link": "https://github.com/vvtPhongdev/SE20A05Group7RMS/blob/main/docs/Report/AI_Evidence/Week6.docx",
            "Quantitative Measure": "Giảm 45% lượng truy vấn trực tiếp vào database",
            "Value Added (1-5)": 4,
            "Risks / Limitations Observed": "Dữ liệu có thể bị cũ (stale cache) nếu cơ chế xóa cache gặp sự cố.",
            "Prompt": "Giải thích cách thiết lập Redis caching trong NestJS Gateway sử dụng CacheInterceptor. Làm thế nào để lưu cache cấu hình tĩnh và thu hồi chúng?",
            "Response": "Đăng ký `CacheModule` với cấu hình Redis store. Thêm decorator `@UseInterceptors(CacheInterceptor)` cho các read controller. Sử dụng cache key tùy chỉnh. Đối với các hành động cập nhật, inject cache manager và gọi `cacheManager.del(key)`."
        },
        {
            "SDLC Phase": "Đánh giá mã nguồn",
            "Task / Activity": "Xác định và xử lý triệt để lỗi truy vấn N+1 của Prisma trong dịch vụ doanh nghiệp",
            "AI Tool Used": "ChatGPT",
            "AI Output": "Đề xuất tối ưu hóa truy vấn bằng cách chỉ định rõ các trường quan hệ cần lấy thay vì để mặc định.",
            "Student’s Validation / Modification": "Chúng tôi kiểm tra log SQL của Prisma. Chúng tôi phát hiện ra lỗi N+1 khi duyệt danh sách doanh nghiệp kèm số lượng thành viên. Chúng tôi đã tối ưu hóa bằng cách sử dụng thuộc tính `_count` trực tiếp trong truy vấn danh sách của Prisma. Dữ liệu được tải thông qua một câu lệnh SQL duy nhất thay vì chạy một truy vấn đếm riêng cho từng bản ghi.",
            "Evidence / Link": "https://github.com/vvtPhongdev/SE20A05Group7RMS/blob/main/docs/Report/AI_Evidence/Week6.docx",
            "Quantitative Measure": "Tối ưu hóa 4 màn hình dashboard chính",
            "Value Added (1-5)": 4,
            "Risks / Limitations Observed": "TypeScript có thể báo lỗi kiểu dữ liệu nếu cấu trúc select thay đổi một phần cấu trúc gốc.",
            "Prompt": "Làm thế nào để tối ưu hóa truy vấn Prisma nhằm giải quyết lỗi N+1 khi hiển thị danh sách doanh nghiệp kèm theo số lượng thành viên của họ?",
            "Response": "Thay vì tải toàn bộ quan hệ thành viên, sử dụng thuộc tính `_count` trong select của Prisma: `prisma.organization.findMany({ include: { _count: { select: { members: true } } } })`."
        },
        {
            "SDLC Phase": "Nghiên cứu",
            "Task / Activity": "Đánh giá các mô hình NLP phục vụ việc tạo vector tìm kiếm (sentence-transformers)",
            "AI Tool Used": "Gemini",
            "AI Output": "Đề xuất mô hình 'all-MiniLM-L6-v2' vì độ chính xác tốt, kích thước gọn nhẹ và khả năng thực thi nhanh tại chỗ.",
            "Student’s Validation / Modification": "Chúng tôi đã nghiên cứu hiệu năng của các mô hình nhúng. Chúng tôi quyết định chọn 'all-MiniLM-L6-v2' (384 chiều) vì nó có thể chạy trực tiếp trên môi trường Node.js thông qua thư viện `@xenova/transformers` mà không cần gọi API ngoài. Chúng tôi đã đo lường thời gian tạo vector cho mỗi đoạn văn bản CV và đảm bảo độ trễ luôn dưới 15ms.",
            "Evidence / Link": "https://github.com/vvtPhongdev/SE20A05Group7RMS/blob/main/docs/Report/AI_Evidence/Week6.docx",
            "Quantitative Measure": "Đánh giá so sánh 3 mô hình nhúng phổ biến",
            "Value Added (1-5)": 4,
            "Risks / Limitations Observed": "Có thể chiếm dụng nhiều CPU của ứng dụng nếu chạy quá nhiều luồng song song.",
            "Prompt": "Mô hình NLP mã nguồn mở, nhẹ nào phù hợp để tạo vector nhúng (sentence embeddings) cho tìm kiếm ngữ nghĩa trong Node.js? Có thể chạy offline không?",
            "Response": "Nên dùng mô hình `sentence-transformers/all-MiniLM-L6-v2`. Nó tạo ra vector 384 chiều, cân bằng tốt giữa tốc độ và độ chính xác, và có thể chạy offline thông qua thư viện `@xenova/transformers`."
        }
    ],
    "Week7": [
        {
            "SDLC Phase": "Triển khai",
            "Task / Activity": "Xây dựng service đọc và trích xuất nội dung file CV sử dụng Mammoth và thư viện Transformers",
            "AI Tool Used": "Codex/GitHub Copilot",
            "AI Output": "Mã trích xuất nội dung từ file DOCX và gọi pipeline trích xuất vector nhúng.",
            "Student’s Validation / Modification": "Chúng tôi triển khai bộ phân tích CV. Chúng tôi đã tích hợp cả Mammoth (cho file DOCX) và pdf-parse (cho file PDF) vào cùng một service. Chúng tôi thiết lập bộ lọc định dạng file ở đầu vào để chặn các file không hợp lệ và đảm bảo độ dài văn bản trích xuất được cắt bớt để không vượt quá giới hạn token của mô hình AI.",
            "Evidence / Link": "https://github.com/vvtPhongdev/SE20A05Group7RMS/blob/main/docs/Report/AI_Evidence/Week7.docx",
            "Quantitative Measure": "Hỗ trợ 3 định dạng file phổ biến (PDF, DOC, DOCX)",
            "Value Added (1-5)": 5,
            "Risks / Limitations Observed": "Thư viện đọc file nhị phân có thể hoạt động khác nhau tùy hệ điều hành khi build docker.",
            "Prompt": "Viết một NestJS service để trích xuất văn bản từ CV đã tải lên (PDF, DOCX) và sử dụng `@xenova/transformers` để tạo ra các vector nhúng tương ứng.",
            "Response": "```typescript\nimport { pipeline } from '@xenova/transformers';\nconst extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');\nconst result = await extractor(text, { pooling: 'mean', normalize: true });\nconst embedding = Array.from(result.data);\n```"
        },
        {
            "SDLC Phase": "Triển khai",
            "Task / Activity": "Xây dựng API Portal cho ứng viên để tải CV và chọn lịch phỏng vấn",
            "AI Tool Used": "GitHub Copilot",
            "AI Output": "Cung cấp khung controller NestJS kèm các cấu hình Swagger minh họa.",
            "Student’s Validation / Modification": "Chúng tôi xem xét các endpoint cho portal ứng viên. Chúng tôi đã bổ sung logic kiểm tra quyền sở hữu bản ghi để ngăn chặn việc ứng viên này thay đổi lịch phỏng vấn hoặc ghi đè CV của ứng viên khác thông qua việc thay đổi ID trên URL yêu cầu.",
            "Evidence / Link": "https://github.com/vvtPhongdev/SE20A05Group7RMS/blob/main/docs/Report/AI_Evidence/Week7.docx",
            "Quantitative Measure": "Xây dựng thành công 3 endpoint chính",
            "Value Added (1-5)": 4,
            "Risks / Limitations Observed": "Lịch phỏng vấn ứng viên chọn có thể trùng chéo với lịch của người phỏng vấn nếu không khóa kịp thời.",
            "Prompt": "Tạo các Swagger annotation và NestJS controller cho cổng thông tin ứng viên: tải lên CV, chọn lịch phỏng vấn và xem thông báo tuyển dụng.",
            "Response": "Định nghĩa các controller `POST /candidate/cv` và `PATCH /candidate/slots/:slotId`. Thêm các decorator `@ApiBody` và `@ApiOperation` để sinh tài liệu API."
        },
        {
            "SDLC Phase": "Kiểm thử",
            "Task / Activity": "Triển khai quy trình thay thế file CV cũ trên object storage một cách an toàn",
            "AI Tool Used": "Codex",
            "AI Output": "Mã cập nhật database và xóa file cũ trên storage của AWS S3.",
            "Student’s Validation / Modification": "Chúng tôi thiết kế giao dịch thay thế file. Chúng tôi đã đóng gói hoạt động cập nhật database và xóa file vật lý trong khối try-catch. File trên S3 chỉ bị xóa sau khi giao dịch database commit thành công, nhằm tránh tình trạng mất file gốc nếu xảy ra lỗi ghi cơ sở dữ liệu.",
            "Evidence / Link": "https://github.com/vvtPhongdev/SE20A05Group7RMS/blob/main/docs/Report/AI_Evidence/Week7.docx",
            "Quantitative Measure": "Triển khai thành công 1 hook giao dịch an toàn",
            "Value Added (1-5)": 5,
            "Risks / Limitations Observed": "Có thể để lại file rác trên storage nếu tiến trình xóa gặp sự cố gián đoạn mạng giữa chừng.",
            "Prompt": "Làm thế nào để thay thế file CV của ứng viên một cách an toàn? Chúng tôi cần xóa file cũ trên object storage và cập nhật database record đồng thời.",
            "Response": "Trong transaction của bạn, thực hiện cập nhật bản ghi CV trước. Nếu cập nhật database thành công, gọi lệnh xóa file cũ trên S3. Nếu database lỗi, bỏ qua lệnh xóa."
        },
        {
            "SDLC Phase": "Triển khai",
            "Task / Activity": "Xây dựng câu lệnh truy vấn tìm kiếm kết hợp giữa PGVector và TSVector",
            "AI Tool Used": "GitHub Copilot",
            "AI Output": "Cung cấp câu truy vấn raw SQL kết hợp cosine similarity và xếp hạng ts_rank của PostgreSQL.",
            "Student’s Validation / Modification": "Chúng tôi đánh giá câu truy vấn SQL kết hợp. Chúng tôi tinh chỉnh câu truy vấn để áp dụng trọng số linh hoạt (70% cho độ tương đồng ngữ nghĩa vector và 30% cho tần suất từ khóa FTS). Điều này cải thiện độ chính xác kết quả tìm kiếm khi nhà tuyển dụng tìm kiếm các kỹ năng đặc thù.",
            "Evidence / Link": "https://github.com/vvtPhongdev/SE20A05Group7RMS/blob/main/docs/Report/AI_Evidence/Week7.docx",
            "Quantitative Measure": "Xây dựng 1 câu truy vấn kết hợp tối ưu",
            "Value Added (1-5)": 5,
            "Risks / Limitations Observed": "Cần điều chỉnh ngưỡng lọc điểm tương đồng để tránh trả về quá nhiều kết quả không liên quan.",
            "Prompt": "Viết một truy vấn SQL thuần cho PostgreSQL kết hợp pgvector similarity và full-text search (tsvector) để tìm kiếm ứng viên theo nội dung CV.",
            "Response": "```sql\nSELECT *, (1 - (embedding <=> $1)) AS similarity, ts_rank_cd(text_search_vector, to_tsquery($2)) AS text_rank\nFROM \"CandidateCV\"\nORDER BY (similarity * 0.7 + text_rank * 0.3) DESC;\n```"
        },
        {
            "SDLC Phase": "Triển khai",
            "Task / Activity": "Tập trung hóa phân quyền HR và giới hạn quyền truy cập nhận xét phỏng vấn",
            "AI Tool Used": "Codex",
            "AI Output": "Mã kiểm tra quyền hạn của người dùng đối với bản ghi kết quả phỏng vấn.",
            "Student’s Validation / Modification": "Chúng tôi đã cấu hình Guard kiểm soát cập nhật nhận xét phỏng vấn. Chúng tôi tùy biến để chỉ cho phép chính Người phỏng vấn được phân công lịch đó hoặc Quản lý HR thuộc doanh nghiệp đó có quyền thay đổi thông tin nhận xét, các thành viên khác chỉ có quyền xem.",
            "Evidence / Link": "https://github.com/vvtPhongdev/SE20A05Group7RMS/blob/main/docs/Report/AI_Evidence/Week7.docx",
            "Quantitative Measure": "Cấu hình 1 bộ phân quyền thống nhất",
            "Value Added (1-5)": 5,
            "Risks / Limitations Observed": "Người dùng có thể bị chặn truy cập nếu ID người phỏng vấn bị gán sai trong database.",
            "Prompt": "Viết mã kiểm tra phân quyền để đảm bảo chỉ người phỏng vấn được phân công lịch hoặc HR mới có thể cập nhật nhận xét phỏng vấn của ứng viên.",
            "Response": "Trong feedback guard, tải thông tin lịch phỏng vấn lên. Kiểm tra xem `slot.interviewerId === user.id` hoặc `user.role === 'HR'`. Trả về false nếu cả hai điều kiện đều sai."
        }
    ],
    "Week8": [
        {
            "SDLC Phase": "Triển khai",
            "Task / Activity": "Tinh chỉnh điểm số đánh giá phỏng vấn và quy trình đề xuất ứng viên của HR",
            "AI Tool Used": "Codex",
            "AI Output": "Cập nhật cấu trúc database để lưu điểm số chi tiết và mã ràng buộc giá trị điểm số.",
            "Student’s Validation / Modification": "Chúng tôi kiểm tra ràng buộc nhập liệu. Chúng tôi đã cấu hình controller để kiểm tra nghiêm ngặt điểm số nhập vào (bao gồm: kỹ năng chuyên môn, độ phù hợp văn hóa, khả năng giao tiếp) phải nằm trong khoảng từ 1 đến 5. Chúng tôi cũng chặn việc sửa đổi điểm số sau khi đã submit để đảm bảo tính khách quan.",
            "Evidence / Link": "https://github.com/vvtPhongdev/SE20A05Group7RMS/blob/main/docs/Report/AI_Evidence/Week8.docx",
            "Quantitative Measure": "Triển khai ràng buộc cho 3 tiêu chí đánh giá",
            "Value Added (1-5)": 5,
            "Risks / Limitations Observed": "Người phỏng vấn có thể gửi trùng bản ghi nhận xét nếu giao diện web bị double click.",
            "Prompt": "Viết mã kiểm tra đầu vào để đảm bảo điểm phỏng vấn nằm trong khoảng 1 đến 5 đối với các tiêu chí chuyên môn, độ phù hợp và giao tiếp.",
            "Response": "Kiểm tra từng điểm số: `if (score < 1 || score > 5) throw new BadRequestException(...)`."
        },
        {
            "SDLC Phase": "Kiểm thử",
            "Task / Activity": "Viết script quét các API routes của Gateway để đối chiếu với cấu trúc màn hình App.tsx",
            "AI Tool Used": "Codex",
            "AI Output": "Đoạn mã Node.js duyệt metadata của NestJS và in ra danh sách các route đã đăng ký.",
            "Student’s Validation / Modification": "Chúng tôi xem xét script liệt kê API. Chúng tôi đã chạy script để xuất danh sách API thực tế và đối chiếu thủ công với các route định nghĩa trên React Frontend. Qua đó, chúng tôi phát hiện và loại bỏ được 2 endpoint cũ không còn sử dụng trên UI.",
            "Evidence / Link": "https://github.com/vvtPhongdev/SE20A05Group7RMS/blob/main/docs/Report/AI_Evidence/Week8.docx",
            "Quantitative Measure": "Kiểm tra 39 màn hình ứng với 40 API endpoints",
            "Value Added (1-5)": 5,
            "Risks / Limitations Observed": "Các route chứa tham số động (dynamic path params) có thể bị đối chiếu sai nếu không được chuẩn hóa chuỗi.",
            "Prompt": "Viết một script Node.js để phân tích các controller NestJS nhằm liệt kê toàn bộ các API route đang hoạt động trong hệ thống.",
            "Response": "Sử dụng đối tượng `HttpAdapterHost` của NestJS để lấy danh sách router hoạt động từ Express/Fastify instance một cách động."
        },
        {
            "SDLC Phase": "Tài liệu hóa",
            "Task / Activity": "Thiết kế biểu đồ luồng chuyển màn hình và kiến trúc hệ thống",
            "AI Tool Used": "Codex",
            "AI Output": "Cung cấp định dạng sơ đồ PlantUML mô tả luồng giao tiếp giữa các thực thể Gateway và Microservices.",
            "Student’s Validation / Modification": "Chúng tôi thiết kế luồng chuyển màn hình. Chúng tôi sử dụng PlantUML để vẽ biểu đồ tương tác tuần tự cho các luồng đăng ký, đăng nhập và phê duyệt yêu cầu. Các biểu đồ này được lưu trữ trong kho mã nguồn để các thành viên tiện tra cứu trong quá trình phát triển.",
            "Evidence / Link": "https://github.com/vvtPhongdev/SE20A05Group7RMS/blob/main/docs/Report/AI_Evidence/Week8.docx",
            "Quantitative Measure": "Xây dựng 4 sơ đồ PlantUML chi tiết",
            "Value Added (1-5)": 5,
            "Risks / Limitations Observed": "Sơ đồ cần được cập nhật thủ công mỗi khi cấu trúc giao tiếp microservice thay đổi.",
            "Prompt": "Tạo một sơ đồ tuần tự PlantUML mô tả luồng đăng ký và đăng nhập của người dùng qua API Gateway đến Identity microservice.",
            "Response": "Sử dụng cú pháp PlantUML định nghĩa các đối tượng tham gia: User, Gateway, IdentityService, và DB. Vẽ các mũi tên mô tả luồng gửi thông tin và nhận về token."
        },
        {
            "SDLC Phase": "Tài liệu hóa",
            "Task / Activity": "Xây dựng ma trận truy vết yêu cầu hệ thống (Requirement Traceability Matrix)",
            "AI Tool Used": "Codex",
            "AI Output": "Mẫu bảng Markdown ánh xạ các yêu cầu nghiệp vụ đến các hàm và file kiểm thử tương ứng.",
            "Student’s Validation / Modification": "Chúng tôi xây dựng ma trận truy vết yêu cầu. Chúng tôi điền đầy đủ thông tin ánh xạ cho 22 yêu cầu chức năng (FR) của dự án. Ma trận này giúp nhóm đảm bảo rằng mọi chức năng trong tài liệu đặc tả đều được cài đặt API và có ít nhất một file kiểm thử đơn vị bao phủ.",
            "Evidence / Link": "https://github.com/vvtPhongdev/SE20A05Group7RMS/blob/main/docs/Report/AI_Evidence/Week8.docx",
            "Quantitative Measure": "Ánh xạ thành công 22 yêu cầu chức năng",
            "Value Added (1-5)": 5,
            "Risks / Limitations Observed": "Đòi hỏi cập nhật thủ công mỗi khi có sự thay đổi về mặt tính năng.",
            "Prompt": "Làm thế nào để thiết lập một ma trận truy vết yêu cầu bằng bảng Markdown để liên kết các yêu cầu chức năng với API và file test tương ứng?",
            "Response": "Sử dụng cấu trúc bảng Markdown gồm các cột: Mã yêu cầu, Mô tả, Bảng dữ liệu liên quan, Endpoint API, Phương thức Service, File test tương ứng."
        },
        {
            "SDLC Phase": "Tài liệu hóa",
            "Task / Activity": "Tổng hợp tài liệu bàn giao dự án và các báo cáo tổng kết",
            "AI Tool Used": "Codex, MarkItDown",
            "AI Output": "Cấu trúc khung tài liệu tổng kết dự án bằng định dạng Markdown.",
            "Student’s Validation / Modification": "Chúng tôi biên soạn tài liệu bàn giao. Chúng tôi đã thay thế toàn bộ dữ liệu mẫu trong tài liệu bằng các thông số thực tế của hệ thống (số lượng API hoạt động, độ phủ test, hướng dẫn cấu hình môi trường Docker).",
            "Evidence / Link": "https://github.com/vvtPhongdev/SE20A05Group7RMS/blob/main/docs/Report/AI_Evidence/Week8.docx",
            "Quantitative Measure": "Biên soạn thành công 6 bộ tài liệu kỹ thuật",
            "Value Added (1-5)": 5,
            "Risks / Limitations Observed": "Tài liệu tĩnh có thể bị lệch hướng so với code thực tế nếu code được cập nhật liên tục.",
            "Prompt": "Cung cấp cấu trúc tài liệu bàn giao mô tả hoạt động bảo mật, cơ chế hàng đợi xử lý ngầm và cấu hình ghi log của hệ thống RMS.",
            "Response": "Biên soạn các chương mục bao gồm bảo mật Gateway, hàng đợi thử lại BullMQ, cấu hình thư viện Pino log ghi dấu hành vi người dùng và endpoint kiểm tra sức khỏe hệ thống."
        }
    ],
    "Week9": [
        {
            "SDLC Phase": "Triển khai",
            "Task / Activity": "Tự động chuyển đổi trạng thái Chiến dịch tuyển dụng sang COMPLETED khi đạt mục tiêu",
            "AI Tool Used": "Gemini",
            "AI Output": "Mã logic kiểm tra số lượng ứng viên đã tuyển so với chỉ tiêu của chiến dịch để cập nhật trạng thái.",
            "Student’s Validation / Modification": "Chúng tôi thiết kế cơ chế tự động đóng chiến dịch. Chúng tôi đã đặt logic kiểm tra này trong giao dịch (transaction) tuyển dụng ứng viên. Khi một ứng viên được cập nhật trạng thái là HIRED, hệ thống sẽ đếm lại tổng số ứng viên đã tuyển cho chiến dịch đó. Nếu đạt chỉ tiêu, trạng thái chiến dịch tự động chuyển sang COMPLETED trong cùng giao dịch để tránh xung đột dữ liệu.",
            "Evidence / Link": "https://github.com/vvtPhongdev/SE20A05Group7RMS/blob/main/docs/Report/AI_Evidence/Week9.docx",
            "Quantitative Measure": "Cấu hình 1 luồng xử lý tự động trạng thái chiến dịch",
            "Value Added (1-5)": 5,
            "Risks / Limitations Observed": "Nếu nhiều ứng viên được nhận cùng lúc có thể gây hiện tượng vượt quá số lượng chỉ tiêu nếu không khóa bảng ghi.",
            "Prompt": "Viết truy vấn Prisma và kiểm tra logic để xem liệu chỉ tiêu tuyển dụng của chiến dịch đã đạt hay chưa, nếu rồi thì tự động đánh dấu chiến dịch là COMPLETED.",
            "Response": "Trong transaction tuyển ứng viên, lấy ra chỉ tiêu của chiến dịch và đếm số ứng viên đã nhận. Nếu số lượng đạt chỉ tiêu, gọi lệnh cập nhật trạng thái Campaign sang COMPLETED."
        },
        {
            "SDLC Phase": "Triển khai",
            "Task / Activity": "Thiết kế cơ chế tự động xoay vòng và dự phòng khóa (Key Rotation) cho Gemini API",
            "AI Tool Used": "Gemini",
            "AI Output": "Đoạn mã minh họa cách tổ chức mảng các API keys và xoay sang key tiếp theo khi gặp lỗi giới hạn lượt gọi (429).",
            "Student’s Validation / Modification": "Chúng tôi xây dựng cơ chế xoay vòng key. Chúng tôi đã bọc lời gọi Gemini API trong một vòng lặp thử lại. Nếu API trả về mã lỗi 429 (Rate Limit), hệ thống sẽ tự động chuyển chỉ mục sang API key tiếp theo trong danh sách cấu hình và thử lại yêu cầu. Nếu thử lại quá 3 lần vẫn lỗi, hệ thống mới ném ra ngoại lệ thực tế để bảo vệ tài nguyên.",
            "Evidence / Link": "https://github.com/vvtPhongdev/SE20A05Group7RMS/blob/main/docs/Report/AI_Evidence/Week9.docx",
            "Quantitative Measure": "Tự động xoay vòng qua 3 khóa API dự phòng",
            "Value Added (1-5)": 5,
            "Risks / Limitations Observed": "Vẫn có nguy cơ hết hạn ngạch (quota) nếu tất cả các key đều bị vượt ngưỡng gọi trong ngày.",
            "Prompt": "Triển khai cơ chế dự phòng và xoay vòng API key cho Gemini API trong Node.js. Nếu key hiện tại bị lỗi rate limit (429), nó phải tự chuyển sang key dự phòng và gọi lại.",
            "Response": "```javascript\nconst keys = [process.env.GEMINI_KEY_1, process.env.GEMINI_KEY_2];\nlet keyIndex = 0;\n// Trong try-catch:\ncatch (err) {\n  if (err.status === 429) {\n    keyIndex = (keyIndex + 1) % keys.length;\n    // thực hiện gọi lại bằng key mới\n  }\n}\n```"
        },
        {
            "SDLC Phase": "Kiểm thử",
            "Task / Activity": "Khắc phục lỗi mất session cookie khi chuyển hướng từ Google OAuth callback",
            "AI Tool Used": "ChatGPT",
            "AI Output": "Cấu hình thuộc tính SameSite và Secure cho cookie để cho phép cookie truyền qua các trang web khác nhau.",
            "Student’s Validation / Modification": "Chúng tôi phân tích nguyên nhân mất session khi đăng nhập Google OAuth. Trình duyệt Chrome phiên bản mới chặn cookie của bên thứ ba trong quá trình chuyển hướng nếu không thiết lập thuộc tính an toàn. Chúng tôi đã chỉnh sửa cấu hình cookie session tại Gateway bằng cách đặt `SameSite=Lax` và `Secure=true`, đảm bảo session người dùng được bảo toàn khi Google chuyển hướng trở lại ứng dụng.",
            "Evidence / Link": "https://github.com/vvtPhongdev/SE20A05Group7RMS/blob/main/docs/Report/AI_Evidence/Week9.docx",
            "Quantitative Measure": "Khắc phục thành công 1 lỗi mất session đăng nhập",
            "Value Added (1-5)": 5,
            "Risks / Limitations Observed": "Yêu cầu phải chạy HTTPS ở môi trường thử nghiệm để cookie có cờ Secure hoạt động.",
            "Prompt": "Tại sao session cookie bị mất khi người dùng chuyển hướng quay lại ứng dụng NestJS từ Google OAuth callback? Làm thế nào để khắc phục?",
            "Response": "Lỗi này thường do giới hạn SameSite của cookie. Trong cấu hình middleware session của bạn, hãy đặt thuộc tính `sameSite: 'lax'` hoặc `sameSite: 'none'` (đi kèm `secure: true`) để cho phép truyền cookie khi chuyển hướng liên kết."
        },
        {
            "SDLC Phase": "Triển khai",
            "Task / Activity": "Đồng nhất bộ lọc danh sách yêu cầu tuyển dụng cho Trưởng bộ phận và HR",
            "AI Tool Used": "GitHub Copilot",
            "AI Output": "Đoạn mã giao diện React cấu hình các bộ lọc trạng thái và tìm kiếm.",
            "Student’s Validation / Modification": "Chúng tôi chỉnh sửa giao diện quản lý yêu cầu. Chúng tôi nhận thấy có sự lệch pha trong cách hiển thị trạng thái yêu cầu giữa Trưởng phòng (người tạo) và HR (người phê duyệt). Chúng tôi đã refactor mã để dùng chung các bộ lọc trạng thái dựa trên cùng một enum được định nghĩa tập trung ở thư mục contract chung của dự án.",
            "Evidence / Link": "https://github.com/vvtPhongdev/SE20A05Group7RMS/blob/main/docs/Report/AI_Evidence/Week9.docx",
            "Quantitative Measure": "Đồng bộ giao diện của 2 phân hệ người dùng chính",
            "Value Added (1-5)": 5,
            "Risks / Limitations Observed": "Có thể hiển thị dữ liệu cũ nếu cache trình duyệt không được làm mới khi thay đổi trạng thái yêu cầu.",
            "Prompt": "Tạo một bảng React hiển thị yêu cầu tuyển dụng dùng chung cho Trưởng phòng (có nút sửa/xóa) và HR (có nút phê duyệt/từ chối) dựa trên trạng thái yêu cầu.",
            "Response": "Sử dụng một enum trạng thái chung (DRAFT, PENDING, APPROVED). Kết xuất có điều kiện các nút hành động dựa trên vai trò của người dùng hiện tại."
        }
    ],
    "Week10": [
        {
            "SDLC Phase": "Kiểm thử",
            "Task / Activity": "Cấu hình Playwright để chạy E2E tests trong cấu trúc Monorepo",
            "AI Tool Used": "ChatGPT",
            "AI Output": "Cung cấp file cấu hình playwright.config.ts và kịch bản mẫu kiểm thử luồng đăng nhập và tải CV.",
            "Student’s Validation / Modification": "Chúng tôi xây dựng môi trường test E2E. Chúng tôi cấu hình Playwright để chạy tự động trong tiến trình CI/CD. Chúng tôi đã thiết lập thêm cơ chế dọn dẹp dữ liệu thử nghiệm trong database trước khi chạy test thông qua script `globalSetup` nhằm đảm bảo tính độc lập giữa các lần chạy thử.",
            "Evidence / Link": "https://github.com/vvtPhongdev/SE20A05Group7RMS/blob/main/docs/Report/AI_Evidence/Week10.docx",
            "Quantitative Measure": "Tạo thành công 3 bộ kịch bản kiểm thử E2E",
            "Value Added (1-5)": 5,
            "Risks / Limitations Observed": "Kiểm thử E2E có thể bị lỗi ngẫu nhiên (flaky tests) nếu tốc độ phản hồi của UI chậm hơn thời gian timeout chờ của Playwright.",
            "Prompt": "Viết file cấu hình Playwright phù hợp cho monorepo Turborepo, chỉ định đường dẫn test, lệnh khởi chạy server và cấu hình các trình duyệt giả lập.",
            "Response": "```javascript\nimport { defineConfig } from '@playwright/test';\nexport default defineConfig({\n  testDir: './e2e',\n  use: { baseURL: 'http://localhost:5173' },\n  webServer: { command: 'npm run dev', url: 'http://localhost:5173' },\n});\n```"
        },
        {
            "SDLC Phase": "Kiểm thử",
            "Task / Activity": "Xây dựng runner chạy kiểm thử tích hợp API Postman tự động bằng Newman",
            "AI Tool Used": "GitHub Copilot",
            "AI Output": "Script chạy Newman trong môi trường Node.js để thực thi file JSON xuất bản từ Postman.",
            "Student’s Validation / Modification": "Chúng tôi thiết lập quy trình kiểm thử API. Chúng tôi đã tùy biến runner để tự động xuất kết quả báo cáo dưới dạng tệp HTML. Đồng thời, cấu hình script kiểm tra mã thoát (exit code) của Newman: nếu có bất kỳ test case nào thất bại, script sẽ trả về mã thoát khác 0 để tiến trình build của Gitlab/Github CI dừng lại và báo lỗi.",
            "Evidence / Link": "https://github.com/vvtPhongdev/SE20A05Group7RMS/blob/main/docs/Report/AI_Evidence/Week10.docx",
            "Quantitative Measure": "Cấu hình thành công 1 bộ chạy test API tự động",
            "Value Added (1-5)": 5,
            "Risks / Limitations Observed": "Dữ liệu kiểm thử cố định trong file collection Postman có thể bị lỗi thời so với database thay đổi.",
            "Prompt": "Viết một script Node.js sử dụng thư viện newman để chạy bộ sưu tập Postman rms.postman_collection.json và xuất báo cáo kết quả ra thư mục chỉ định.",
            "Response": "```javascript\nconst newman = require('newman');\nnewman.run({\n  collection: require('./rms.postman_collection.json'),\n  reporters: 'cli',\n}, function (err) { if (err) { throw err; } });\n```"
        },
        {
            "SDLC Phase": "Tự động hóa",
            "Task / Activity": "Tự động hóa đồng bộ danh sách phân công lỗi (assignees) sử dụng openpyxl và GitHub API",
            "AI Tool Used": "Gemini",
            "AI Output": "Script Python sử dụng urllib.request để đọc file Excel, đối chiếu dữ liệu và thực hiện cập nhật người phân công trên các issues của kho mã nguồn GitHub.",
            "Student’s Validation / Modification": "Chúng tôi chạy thử nghiệm kịch bản đồng bộ. Chúng tôi đã kiểm tra logic đối chiếu tên thành viên và tài khoản GitHub tương ứng. Chúng tôi bổ sung thêm kiểm soát lỗi phân trang và giới hạn tần suất gọi API (rate limit) của GitHub để đảm bảo script có thể chạy hoàn tất cho danh sách hơn 50 issues mà không bị chặn.",
            "Evidence / Link": "https://github.com/vvtPhongdev/SE20A05Group7RMS/blob/main/docs/Report/AI_Evidence/Week10.docx",
            "Quantitative Measure": "Đồng bộ hóa trạng thái thành công cho 58 issues",
            "Value Added (1-5)": 5,
            "Risks / Limitations Observed": "Token truy cập GitHub có thể bị hết hạn hoặc thiếu quyền ghi đối với kho mã nguồn.",
            "Prompt": "Viết một script python tải tệp Excel bằng openpyxl, trích xuất ID issue và màn hình tương ứng, đối chiếu với danh sách phân công, cập nhật Excel và gửi request PATCH để cập nhật assignees trên GitHub.",
            "Response": "Định nghĩa file `update_issues.py` sử dụng `load_workbook` của openpyxl, thư viện `urllib.request` với phương thức PATCH, truyền tải payload JSON `{\"assignees\": [name]}` cùng các header xác thực."
        }
    ]
}

def create_markdown_evidence():
    print("Generating detailed AI Evidence markdown files in Vietnamese...")
    os.makedirs("docs/Report/AI_Evidence", exist_ok=True)
    for week_name, tasks in WEEKLY_DATA.items():
        filename = f"docs/Report/AI_Evidence/{week_name}.md"
        with open(filename, "w", encoding="utf-8") as f:
            
            for idx, task in enumerate(tasks):
                task_id = idx + 1
                f.write(f"---\n\n")
                f.write(f"## Nhiệm vụ {task_id}: {task['Task / Activity']}\n\n")
                f.write(f"### 1. Câu hỏi gửi AI (Prompt)\n\n")
                f.write(f"```text\n{task['Prompt']}\n```\n\n")
                
                f.write(f"### 2. Câu trả lời chi tiết của AI\n\n")
                f.write(f"{task['Response']}\n\n")
                
                f.write(f"### 3. Đánh giá, chọn lọc & Tùy biến mã nguồn của Sinh viên\n\n")
                f.write(f"**Mô tả quá trình kiểm tra:**\n")
                f.write(f"{task['Student’s Validation / Modification']}\n\n")
                f.write(f"**Thông tin kiểm toán:**\n")
                f.write(f"- **Giai đoạn SDLC:** {task['SDLC Phase']}\n")
                f.write(f"- **Công cụ AI sử dụng:** {task['AI Tool Used']}\n")
                f.write(f"- **Thước đo định lượng:** {task['Quantitative Measure']}\n")
                f.write(f"- **Rủi ro & Hạn chế quan sát được:** {task['Risks / Limitations Observed']}\n\n")
        print(f"  Created detailed {filename}")

def update_excel_report():
    print("Updating SWP_SE20A05_Group7_ReportAI.xlsx...")
    wb = openpyxl.load_workbook("docs/Report/SWP_SE20A05_Group7_ReportAI.xlsx")
    
    thin_border = Border(
        left=Side(style='thin', color='DDDDDD'),
        right=Side(style='thin', color='DDDDDD'),
        top=Side(style='thin', color='DDDDDD'),
        bottom=Side(style='thin', color='DDDDDD')
    )
    
    font_data = Font(name='Segoe UI', size=11, bold=False)
    align_left = Alignment(horizontal='left', vertical='center', wrap_text=True)
    align_center = Alignment(horizontal='center', vertical='center')
    
    for sheet_name, tasks in WEEKLY_DATA.items():
        if sheet_name not in wb.sheetnames:
            print(f"  Warning: sheet {sheet_name} not found, creating it...")
            wb.create_sheet(sheet_name)
            
        sheet = wb[sheet_name]
        
        # Unmerge all merged ranges in this sheet to prevent MergedCell read-only exceptions
        merged_ranges = list(sheet.merged_cells.ranges)
        for rng in merged_ranges:
            sheet.unmerge_cells(str(rng))
            
        # Clear rows from Row 2 to 100, columns 1 to 20 to completely erase any previous data
        for r in range(2, 101):
            for c in range(1, 21):
                cell = sheet.cell(r, c)
                cell.value = None
                cell.hyperlink = None
                    
        # Write tasks
        for idx, task in enumerate(tasks):
            r = idx + 2
            sheet.cell(r, 1).value = idx + 1
            sheet.cell(r, 2).value = task["SDLC Phase"]
            sheet.cell(r, 3).value = task["Task / Activity"]
            sheet.cell(r, 4).value = task["AI Tool Used"]
            sheet.cell(r, 5).value = task["AI Output"]
            sheet.cell(r, 6).value = task["Student’s Validation / Modification"]
            sheet.cell(r, 7).value = task["Evidence / Link"]
            sheet.cell(r, 8).value = task["Quantitative Measure"]
            sheet.cell(r, 9).value = task["Value Added (1-5)"]
            sheet.cell(r, 10).value = task["Risks / Limitations Observed"]
            
            # Formatting
            for c in range(1, 11):
                cell = sheet.cell(r, c)
                cell.font = font_data
                cell.border = thin_border
                if c in [1, 4, 9]:
                    cell.alignment = align_center
                else:
                    cell.alignment = align_left
                    
        # Adjust row heights and column widths
        sheet.row_dimensions[1].height = 25
        for idx in range(len(tasks)):
            sheet.row_dimensions[idx + 2].height = 65
            
        for col in sheet.columns:
            col_letter = get_column_letter(col[0].column)
            if col_letter in ['A', 'D', 'I']:
                sheet.column_dimensions[col_letter].width = 12
            elif col_letter in ['B', 'C', 'E', 'F', 'G', 'H', 'J']:
                sheet.column_dimensions[col_letter].width = 30
                
    wb.save("docs/Report/SWP_SE20A05_Group7_ReportAI.xlsx")
    print("Excel save complete.")

if __name__ == "__main__":
    create_markdown_evidence()
    update_excel_report()
