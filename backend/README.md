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

Cấu hình các biến cần thiết trong `.env`, bao gồm Supabase, JWT, frontend URL và thông tin thanh toán nếu sử dụng. Chatbot Gemini dùng biến `GEMINI_API_KEYS` dạng danh sách key phân tách bằng dấu phẩy để backend xoay vòng key theo từng lượt hỏi.

## Chạy dự án

Chạy ở môi trường phát triển:

```bash
npm run dev
```

Chạy ở môi trường production:

```bash
npm start
```

Kiểm tra cú pháp và chạy test:

```bash
npm run check
npm test
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
PAYMENT_CHECKOUT_API_URL
PAYMENT_REFUND_API_URL
PAYMENT_REFUND_STATUS_API_URL
PAYMENT_REQUEST_TIMEOUT_MS
PAYMENT_WEBHOOK_REPLAY_WINDOW_SECONDS
PAYMENT_WEBHOOK_SECRET
PAYMENT_RETURN_URL
PAYMENT_CANCEL_URL
BACKEND_PUBLIC_URL
SMTP_HOST
SMTP_PORT
SMTP_SECURE
SMTP_USER
SMTP_PASSWORD
SMTP_FROM
SCHEDULE_GENERATION_HORIZON_DAYS
SCHEDULE_GENERATION_INTERVAL_MS
OUTBOX_POLL_INTERVAL_MS
REFUND_RECONCILIATION_INTERVAL_MS
INVENTORY_RECONCILIATION_INTERVAL_MS
INVENTORY_RECONCILIATION_AUTO_REPAIR
REDIS_URL
SUPABASE_READ_URL
SUPABASE_READ_SERVICE_ROLE_KEY
GEMINI_API_KEYS
GEMINI_MODEL
GEMINI_REQUEST_TIMEOUT_MS
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
psql $DATABASE_URL -f database/migrations/20260721000000_harden_cancellation_and_refunds.sql
psql $DATABASE_URL -f database/migrations/20260725000000_complete_mvp_operations.sql
psql $DATABASE_URL -f database/migrations/20260802000000_harden_core_transactions.sql
```

Sau migrations, có thể tạo bộ dữ liệu demo lớn từ 05/08/2026 đến 05/09/2026 bằng:

```bash
psql $DATABASE_URL -f database/seed-flights-2026-08-05-to-2026-09-05.sql
```

Seed này gồm 15 hãng, 22 sân bay, 66 lịch bay nội địa/quốc tế, 1.771 chuyến cùng tối đa khoảng 127.000 ghế, hành lý, suất ăn và mã giảm giá. File dùng upsert/natural key nên có thể chạy lại; mỗi chuyến giới hạn tối đa 72 ghế demo để giữ thời gian chạy hợp lý.

Migration phải được chạy trước khi gọi các endpoint tạo chuyến bay, giữ ghế, đặt chỗ, thanh toán hoặc dashboard quản trị.

Migration avatar tạo bucket `avatars` ở chế độ private. API chỉ nhận JPEG, PNG hoặc WebP tối đa 2 MB; ảnh được trả về bằng signed URL ngắn hạn.

## Tồn ghế, tìm kiếm và thanh toán

- Ghế được khoá bằng transaction Postgres (`SELECT ... FOR UPDATE`), có TTL 10 phút và job backend dọn ghế hết hạn mỗi phút. Redis chỉ là soft lock, nên không thể tạo overbooking khi Redis mất kết nối.
- Tìm kiếm dùng index theo chặng/ngày, read client tùy chọn (`SUPABASE_READ_*`) và Redis cache 15 giây. Không cần Elasticsearch ở quy mô hiện tại; có thể thay query layer sau này nếu cần full-text search.
- Webhook thanh toán xác thực raw HTTP body, event ID và timestamp chống replay. RPC idempotent chuyển booking theo state machine; callback thành công đến sau TTL sẽ thành `refund_pending` để xử lý bù trừ.
- `cash` hoạt động đầy đủ: người dùng tạo yêu cầu, admin xác nhận/từ chối.
- `POST /api/payments/intent` bắt buộc có `Idempotency-Key` (8-200 ký tự). `POST /api/bookings` cũng nhận header này để retry an toàn. Muốn sửa giá booking, gọi `PATCH /api/payments/intent/:paymentId/expire` trước khi thay fare/ancillary.
- Thanh toán online dùng adapter chuẩn hóa cấu hình qua `PAYMENT_CHECKOUT_API_URL`. Adapter nhận `provider`, `bookingId`, `transactionRef`, `amount`, `currency`, `returnUrl`, `cancelUrl`, `webhookUrl` và trả `{ "checkoutUrl": "https://..." }`. Adapter phải dùng `transactionRef` làm idempotency key ở provider.
- VNPAY 2.1.0 là adapter trực tiếp, không cần `PAYMENT_CHECKOUT_API_URL`: bật bằng `PAYMENT_PROVIDER=vnpay` và cấu hình `VNPAY_TMN_CODE`, `VNPAY_HASH_SECRET`, `VNPAY_PAY_URL`, `VNPAY_RETURN_URL`. Return URL là `GET /api/payments/vnpay/return`; IPN HTTPS công khai cần đăng ký với VNPAY là `GET /api/payments/vnpay/ipn`. IPN kiểm tra HMAC-SHA512, merchant, mã giao dịch và số tiền trước khi gọi payment state machine; Return URL không cập nhật giao dịch.
- Callback chuẩn hóa phải gửi `x-payment-event-id`, `x-payment-timestamp` và `x-payment-signature`. Chữ ký là HMAC-SHA256 dạng hex của chuỗi `<timestamp>.<raw-json-body>` với `PAYMENT_WEBHOOK_SECRET`. Body gồm `bookingId`, `transactionRef`, `provider`, `amount`, `currency`, `status` và `eventType`. Adapter phải chuẩn hóa `eventType` thành `payment.succeeded`, `payment.failed` hoặc `payment.ignored`; event và status phải khớp.
- Hoàn tiền online dùng `PAYMENT_REFUND_API_URL`, luôn gửi `Idempotency-Key: refund:<refund_request_id>`. `PAYMENT_REFUND_STATUS_API_URL` phục vụ worker đối soát các refund đang `processing/requires_review`.
- Hủy booking và hủy cả chuyến bay đi qua RPC version 2, giải phóng tồn kho, offload check-in, void vé và tạo refund/outbox trong một transaction.
- Các endpoint public hold/release ghế đã bị loại bỏ. Chỉ `POST /api/bookings` được phép tạo seat hold.
- Notification/email core được worker transactional outbox xử lý bằng `FOR UPDATE SKIP LOCKED`; inventory và refund có worker reconciliation riêng.

## Xác thực và dịch vụ ngoài

- Password reset và OAuth dùng cấu hình Email/Google/GitHub trong Supabase Auth. Redirect URL cần cho phép `/reset-password` và `/auth/callback` của frontend.
- `GEMINI_API_KEYS` nhận một hoặc nhiều key phân tách bằng dấu phẩy. Khi bỏ trống, endpoint chatbot trả `503` rõ ràng.
- Không commit `.env`, service-role key, Gemini key hoặc webhook secret vào repository.

## Module MVP mở rộng

- `operations/cms`, `operations/flight-status`, `operations/fares`, `operations/ancillaries` là API public.
- Vé điện tử, check-in, boarding pass, đổi chuyến, ancillary booking và support ticket yêu cầu đăng nhập.
- `/api/operations/admin/*` cung cấp network schedule, fare, live status, refund approval, CMS, support SLA và ancillary catalog cho admin.
- Job lịch bay chạy khi server khởi động và theo `SCHEDULE_GENERATION_INTERVAL_MS`, tự sinh flight/seat trong số ngày `SCHEDULE_GENERATION_HORIZON_DAYS`.
- Email vé là best-effort: khi chưa cấu hình SMTP, thanh toán vẫn xác nhận và PDF vẫn tải được trong chi tiết booking.
