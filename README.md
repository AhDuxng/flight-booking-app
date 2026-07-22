# Flight Booking App

Flight Booking App là dự án web hỗ trợ tìm kiếm chuyến bay, đặt vé máy bay, quản lý hành khách, thanh toán và theo dõi trạng thái đặt chỗ. Dự án được tổ chức theo mô hình tách riêng frontend và backend, phù hợp cho việc phát triển, kiểm thử và mở rộng từng phân hệ một cách độc lập.

Repository cung cấp ứng dụng React hoàn chỉnh và API Express kết nối Supabase cho xác thực, tìm kiếm chuyến bay, booking nhiều hành khách, giữ ghế, thanh toán, hoàn tiền, thông báo, đánh giá và vận hành quản trị.

## Mục tiêu dự án

Xây dựng một nền tảng đặt vé máy bay có trải nghiệm rõ ràng cho người dùng cuối và bộ công cụ quản trị cho người vận hành hệ thống. Ứng dụng hướng đến việc gom các nghiệp vụ cốt lõi của một website bán vé máy bay vào một kiến trúc dễ bảo trì, dễ mở rộng và có thể triển khai theo từng giai đoạn.

## Tính năng chính

1. Tìm kiếm và xem danh sách chuyến bay theo hành trình, ngày bay và thông tin liên quan.
2. Xem chi tiết chuyến bay, hãng bay, sân bay, tàu bay và thông tin ghế.
3. Đăng ký, đăng nhập và quản lý thông tin tài khoản người dùng.
4. Tạo đặt chỗ, nhập thông tin hành khách và lựa chọn ghế.
5. Xử lý thanh toán tiền mặt end-to-end, webhook có chữ ký cho cổng thanh toán ngoài và quy trình hoàn tiền.
6. Theo dõi lịch sử đặt vé và chi tiết từng đơn đặt chỗ.
7. Quản trị chuyến bay, sân bay, hãng bay, tàu bay, người dùng, đặt chỗ, thanh toán và đánh giá.
8. Thông báo thay đổi chuyến bay/thanh toán, đánh giá sau chuyến và chatbot Gemini.
9. Quên mật khẩu, OAuth Google/GitHub, tự làm mới phiên và upload avatar riêng tư.

## Công nghệ sử dụng

Frontend sử dụng React, Vite, Tailwind CSS, shadcn/ui, React Router, Axios và lucide-react. Phần giao diện được tổ chức theo các nhóm component, page, feature, hook, service và store để tách biệt trách nhiệm giữa hiển thị, điều hướng, xử lý nghiệp vụ và giao tiếp API.

Backend sử dụng Node.js, Express, Supabase, JWT, bcryptjs, Zod, Nodemailer và các middleware bảo mật như Helmet, CORS, rate limit, compression và cookie parser. Cấu trúc backend được chia theo module nghiệp vụ, mỗi module có routes, controller, service, schema và queries riêng.

## Cấu trúc thư mục

```text
flight-booking-app
  backend
    database
    src
      config
      middlewares
      modules
      routes
  frontend
    src
      app
      components
      features
      hooks
      pages
      services
      store
      styles
```

## Backend

Thư mục backend chứa API server cho hệ thống. Các module nghiệp vụ được thiết kế xoay quanh những miền chính của ứng dụng như auth, users, flights, bookings, passengers, seats, payments, notifications, reviews, airlines, airports, aircrafts và admin.

Mỗi module được tách thành nhiều lớp xử lý:

1. routes tiếp nhận request và định nghĩa endpoint.
2. controller điều phối request và response.
3. service xử lý logic nghiệp vụ.
4. schema mô tả và kiểm tra dữ liệu đầu vào.
5. queries gồm các thao tác truy vấn dữ liệu.

Biến môi trường mẫu nằm tại `backend/.env.example`.

## Frontend

Thư mục frontend chứa ứng dụng React cho người dùng và quản trị viên. Cấu trúc frontend được chia theo trang, tính năng và component tái sử dụng, giúp việc phát triển giao diện đặt vé, thanh toán, quản lý tài khoản và trang quản trị rõ ràng hơn.

Biến môi trường mẫu nằm tại `frontend/.env.example`.

## Yêu cầu cài đặt

1. Node.js phiên bản phù hợp với Vite 5 và Express 4.
2. npm để cài đặt package.
3. Tài khoản Supabase nếu cần kết nối cơ sở dữ liệu và xác thực.
4. Thông tin cấu hình nhà cung cấp thanh toán nếu tích hợp cổng thanh toán ngoài; `cash` luôn dùng được.

## Hướng dẫn chạy dự án

Sao chép biến môi trường mẫu cho backend và frontend, sau đó điền các giá trị cần thiết.

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Cài đặt và chạy backend.

```bash
cd backend
npm install
npm run dev
```

Mặc định backend sử dụng cổng `5000` và frontend URL là `http://localhost:5173`.

Cài đặt và chạy frontend.

```bash
cd frontend
npm install
npm run dev
```

Mặc định frontend được phục vụ bởi Vite tại `http://localhost:5173`.

## Biến môi trường

Backend cần các biến cấu hình chính sau:

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

Frontend cần biến cấu hình sau:

```text
VITE_API_URL
```

## Script có sẵn

Backend:

```bash
npm run dev
npm start
npm test
npm run check
```

Frontend:

```bash
npm run dev
npm run build
npm run preview
npm test
npm run check
```

## Deploy Render và Netlify

Repo đã có sẵn `render.yaml` cho backend và `netlify.toml` cho frontend.

### Backend trên Render

Tạo một Blueprint/Web Service từ repository này. Render sẽ đọc `render.yaml` và chạy backend trong thư mục `backend`.

Các biến cần nhập trên Render:

```text
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
GEMINI_API_KEYS
FRONTEND_URL
```

`JWT_SECRET` được Render tự sinh từ `render.yaml`. `GEMINI_API_KEYS` là danh sách key Gemini cho chatbot, phân tách bằng dấu phẩy để backend xoay vòng theo từng lượt hỏi. `FRONTEND_URL` là origin của frontend Netlify, ví dụ `https://your-site.netlify.app`. Nếu cần cho nhiều domain, phân tách bằng dấu phẩy.

Các biến tùy chọn nếu bật cache hoặc thanh toán:

```text
REDIS_URL
PAYMENT_PROVIDER
PAYMENT_SECRET_KEY
PAYMENT_WEBHOOK_SECRET
PAYMENT_RETURN_URL
PAYMENT_CANCEL_URL
SUPABASE_READ_URL
SUPABASE_READ_SERVICE_ROLE_KEY
GEMINI_MODEL
GEMINI_REQUEST_TIMEOUT_MS
```

Backend có health check tại:

```text
/health
```

### Frontend trên Netlify

Tạo site từ repository này. Netlify sẽ đọc `netlify.toml`, đặt base directory là `frontend`, build bằng `npm run build` và publish thư mục `frontend/dist`.

Đặt biến môi trường trên Netlify:

```text
VITE_API_URL=https://your-render-service.onrender.com/api
```

File `netlify.toml` cũng đã cấu hình redirect `/* -> /index.html` để React Router hoạt động khi reload trực tiếp các route con.

### Thứ tự deploy khuyến nghị

1. Tạo site Netlify trước để lấy URL frontend. Lần build đầu có thể chưa gọi API đúng nếu chưa đặt `VITE_API_URL`.
2. Tạo backend trên Render, nhập `FRONTEND_URL` bằng URL Netlify.
3. Sau khi Render có URL backend, quay lại Netlify đặt `VITE_API_URL` bằng URL Render kèm `/api`.
4. Redeploy frontend trên Netlify.

## Trạng thái hiện tại

Dự án đã có các luồng người dùng và quản trị chính hoạt động xuyên suốt. Trước khi chạy trên một Supabase mới, cần áp dụng `schema.sql`, `seed.sql` và toàn bộ migration theo đúng thứ tự trong [backend/README.md](backend/README.md). Các dịch vụ ngoài vẫn cần cấu hình thật: Supabase OAuth/email, Gemini và adapter của từng cổng thanh toán trực tuyến.
