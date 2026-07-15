# Backend Flight Booking App

Backend cung cấp API cho hệ thống đặt vé máy bay. Phần này xử lý các nghiệp vụ như xác thực người dùng, quản lý chuyến bay, đặt chỗ, hành khách, ghế, thanh toán, thông báo, đánh giá và các chức năng quản trị.

## Công nghệ sử dụng

1. Node.js và Express để xây dựng API server.
2. Supabase để kết nối và quản lý dữ liệu.
3. JWT và bcryptjs để xác thực và bảo mật tài khoản.
4. Zod để kiểm tra dữ liệu đầu vào.
5. Nodemailer để hỗ trợ gửi email.
6. Helmet, CORS, rate limit và compression để tăng bảo mật và hiệu năng.
7. Redis (tùy chọn) để cache tìm kiếm và soft lock request chọn ghế.

## Cấu trúc chính

```text
src
  config
  middlewares
  modules
  routes
  app.js
  server.js
```

Mỗi module nghiệp vụ được chia thành routes, controller, service, schema và queries để dễ bảo trì và mở rộng.

## Cài đặt

```bash
npm install
```

Tạo file môi trường từ file mẫu:

```bash
cp .env.example .env
```

Cấu hình các biến cần thiết trong `.env`, bao gồm Supabase, JWT, frontend URL và thông tin thanh toán nếu sử dụng.

## Chạy dự án

Chạy ở môi trường phát triển:

```bash
npm run dev
```

Chạy ở môi trường production:

```bash
npm start
```

Mặc định backend chạy tại `http://localhost:5000`.

## Biến môi trường chính

```text
PORT
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
JWT_SECRET
FRONTEND_URL
TRUST_PROXY
BODY_LIMIT
PAYMENT_PROVIDER
PAYMENT_SECRET_KEY
PAYMENT_WEBHOOK_SECRET
PAYMENT_RETURN_URL
PAYMENT_CANCEL_URL
REDIS_URL
SUPABASE_READ_URL
SUPABASE_READ_SERVICE_ROLE_KEY
```

`FRONTEND_URL` có thể chứa nhiều origin, phân tách bằng dấu phẩy, ví dụ `http://localhost:5173,https://example.com`.

## Cơ sở dữ liệu

Chạy schema và seed trước, sau đó chạy migration để có luồng booking/payment nguyên tử và RLS đã được siết chặt:

```bash
psql $DATABASE_URL -f database/schema.sql
psql $DATABASE_URL -f database/seed.sql
psql $DATABASE_URL -f database/migrations/20260714120000_secure_booking_and_payment.sql
psql $DATABASE_URL -f database/migrations/20260715140000_add_international_flights.sql
psql $DATABASE_URL -f database/migrations/20260715230000_harden_inventory_search_and_saga.sql
psql $DATABASE_URL -f database/migrations/20260716000000_add_private_avatar_storage.sql
```

Migration phải được chạy trước khi gọi các endpoint tạo chuyến bay, giữ ghế, đặt chỗ, thanh toán hoặc dashboard quản trị.

Migration avatar tạo bucket `avatars` ở chế độ private. API chỉ nhận JPEG, PNG hoặc WebP tối đa 2 MB; ảnh được trả về bằng signed URL ngắn hạn.

## Tồn ghế, tìm kiếm và thanh toán

- Ghế được khoá bằng transaction Postgres (`SELECT ... FOR UPDATE`), có TTL 10 phút và job backend dọn ghế hết hạn mỗi phút. Redis chỉ là soft lock, nên không thể tạo overbooking khi Redis mất kết nối.
- Tìm kiếm dùng index theo chặng/ngày, read client tùy chọn (`SUPABASE_READ_*`) và Redis cache 15 giây. Không cần Elasticsearch ở quy mô hiện tại; có thể thay query layer sau này nếu cần full-text search.
- Webhook thanh toán được ghi raw payload vào `payment_webhook_logs` trước khi xử lý. RPC idempotent chuyển booking theo state machine; callback thành công đến sau TTL sẽ thành `refund_pending` để xử lý bù trừ.
