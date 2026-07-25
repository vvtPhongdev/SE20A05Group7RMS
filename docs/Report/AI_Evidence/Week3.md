---

## Nhiệm vụ 1: Xây dựng service CRUD doanh nghiệp hỗ trợ phân trang và đếm số lượng thành viên

### 1. Câu hỏi gửi AI (Prompt)

```text
Viết một OrganizationService trong NestJS xử lý các hành động CRUD với Prisma. Triển khai phân trang dùng skip và take, kiểm tra slug trùng lặp, và lấy ra số lượng thành viên.
```

### 2. Câu trả lời chi tiết của AI

```typescript
async findAll(query: PaginateDto) {
  const [items, total] = await this.prisma.$transaction([
    this.prisma.organization.findMany({
      skip: (query.page - 1) * query.limit,
      take: query.limit,
      include: { _count: { select: { members: true } } },
    }),
    this.prisma.organization.count(),
  ]);
  return { items, total, totalPages: Math.ceil(total / query.limit) };
}
```

### 3. Đánh giá, chọn lọc & Tùy biến mã nguồn của Sinh viên

**Mô tả quá trình kiểm tra:**
Chúng tôi đã xem xét mã của AI. Đề xuất của AI chỉ trả về dữ liệu thô từ database. Chúng tôi đã tùy biến phương thức để bọc dữ liệu trong một DTO phản hồi chuẩn hóa bao gồm các trường metadata phân trang: `items`, `totalCount`, `page`, `limit` và `totalPages`. Chúng tôi cũng thêm bộ lọc Prisma để ẩn thông tin nhạy cảm của thành viên khi trả về danh sách.

**Thông tin kiểm toán:**
- **Giai đoạn SDLC:** Quản lý phòng ban & Doanh nghiệp
- **Công cụ AI sử dụng:** Gemini
- **Thước đo định lượng:** Hoàn thành 4 phương thức CRUD
- **Rủi ro & Hạn chế quan sát được:** Truy vấn kết bảng không tối ưu có thể gây chậm khi lượng doanh nghiệp tăng lớn.

---

## Nhiệm vụ 2: Viết unit test cho DepartmentService ngăn chặn việc xóa khi có yêu cầu tuyển dụng đang hoạt động

### 1. Câu hỏi gửi AI (Prompt)

```text
Tạo một unit test bằng Jest cho phương thức `delete()` của DepartmentService trong NestJS. Nếu phòng ban có yêu cầu tuyển dụng đang hoạt động, nó phải ném ra lỗi BadRequestException và không được gọi xóa database.
```

### 2. Câu trả lời chi tiết của AI

Mock kết quả của `prisma.recruitmentRequest.count` trả về `1` (lớn hơn 0), sau đó kiểm tra rằng việc gọi `service.delete(id)` ném ra ngoại lệ `BadRequestException`.

### 3. Đánh giá, chọn lọc & Tùy biến mã nguồn của Sinh viên

**Mô tả quá trình kiểm tra:**
Chúng tôi đã kiểm tra mã kiểm thử. Gợi ý của AI giả định rằng database sẽ tự động ném lỗi khóa ngoại. Chúng tôi quyết định tự viết một bước kiểm tra rõ ràng trong code dịch vụ bằng cách gọi `prisma.recruitmentRequest.count()` trước khi xóa. Nếu phòng ban đang có yêu cầu tuyển dụng hoạt động, hệ thống sẽ ném ra lỗi `BadRequestException` ngay lập tức, tránh việc rollback giao dịch ở mức database.

**Thông tin kiểm toán:**
- **Giai đoạn SDLC:** Kiểm thử
- **Công cụ AI sử dụng:** ChatGPT
- **Thước đo định lượng:** Tạo 5 kịch bản unit test
- **Rủi ro & Hạn chế quan sát được:** Cấu trúc mock Prisma cần cập nhật lại khi schema thay đổi.

---

## Nhiệm vụ 3: Viết kiểm thử đảm bảo tính tuần tự không ngắt quãng của các cấp phê duyệt trong ApprovalChain

### 1. Câu hỏi gửi AI (Prompt)

```text
Write unit tests in Jest verifying that creating an ApprovalChain checks that approval levels are strictly sequential (e.g. level 1, level 2) with no skips.
```

### 2. Câu trả lời chi tiết của AI

Tạo một test case kiểm tra xem việc gửi danh sách cấp độ `[1, 3]` có ném ra lỗi xác thực hay không vì thiếu cấp độ `2`. Mảng phải được sắp xếp và kiểm tra gia số bằng đúng 1.

### 3. Đánh giá, chọn lọc & Tùy biến mã nguồn của Sinh viên

**Mô tả quá trình kiểm tra:**
Chúng tôi xem xét logic kiểm thử của AI. Đoạn mã của AI chỉ kiểm tra việc sắp xếp mảng mà không kiểm tra tính liên tục. Chúng tôi đã bổ sung kiểm tra để đảm bảo tập hợp các cấp phê duyệt trong chuỗi không có khoảng trống (ví dụ: chuỗi `[1, 2, 3]` hợp lệ, nhưng `[1, 3]` sẽ bị từ chối vì thiếu cấp 2). Điều này đảm bảo quy trình phê duyệt tuần tự hoạt động đúng mà không bỏ sót bước.

**Thông tin kiểm toán:**
- **Giai đoạn SDLC:** Kiểm thử
- **Công cụ AI sử dụng:** ChatGPT
- **Thước đo định lượng:** Tạo 3 kịch bản kiểm thử
- **Rủi ro & Hạn chế quan sát được:** Mã nguồn mock dữ liệu mảng bị fix cứng trong các test case.

---

## Nhiệm vụ 4: Giả lập (Mock) phản hồi giao dịch lồng nhau (transaction) của Prisma Client trong Jest

### 1. Câu hỏi gửi AI (Prompt)

```text
Làm thế nào để mock `prisma.$transaction` trong Jest khi kiểm thử một phương thức service thực hiện nhiều truy vấn database một cách đồng thời?
```

### 2. Câu trả lời chi tiết của AI

Mock `$transaction` bằng cách nhận một mảng các promises hoặc một callback function, thực thi nó và trả về các giá trị mock tương ứng:
```typescript
prismaMock.$transaction.mockImplementation((promises) => Promise.all(promises));
```

### 3. Đánh giá, chọn lọc & Tùy biến mã nguồn của Sinh viên

**Mô tả quá trình kiểm tra:**
Chúng tôi đánh giá các mock gợi ý. Chúng tôi tùy biến cách mock `$transaction` bằng cách cho phép nó nhận một mảng các promises hoặc một hàm callback và thực thi chúng đồng thời. Điều này cho phép chúng tôi mô phỏng các lỗi lưu database để kiểm tra logic rollback của service.

**Thông tin kiểm toán:**
- **Giai đoạn SDLC:** Kiểm thử
- **Công cụ AI sử dụng:** ChatGPT
- **Thước đo định lượng:** Xác thực 2 bộ giả lập giao dịch
- **Rủi ro & Hạn chế quan sát được:** Mã mock transaction của Prisma khá dài dòng và phức tạp.

