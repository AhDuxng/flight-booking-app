# Backend Flight Booking App

Backend cung cấp API cho hệ thống đặt vé máy bay. Phần này xử lý các nghiệp vụ như xác thực người dùng, quản lý chuyến bay, đặt chỗ, hành khách, ghế, thanh toán, thông báo, đánh giá và các chức năng quản trị.

## Công nghệ sử dụng

1. Node.js và Express để xây dựng API server.
2. Supabase để kết nối và quản lý dữ liệu.
3. JWT và bcryptjs để xác thực và bảo mật tài khoản.
4. Zod để kiểm tra dữ liệu đầu vào.
5. Nodemailer để hỗ trợ gửi email.
6. Helmet, CORS, rate limit và compression để tăng bảo mật và hiệu năng.

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
PAYMENT_PROVIDER
PAYMENT_SECRET_KEY
PAYMENT_WEBHOOK_SECRET
PAYMENT_RETURN_URL
PAYMENT_CANCEL_URL
```
