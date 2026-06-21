# Flight Booking App

Flight Booking App là dự án web hỗ trợ tìm kiếm chuyến bay, đặt vé máy bay, quản lý hành khách, thanh toán và theo dõi trạng thái đặt chỗ. Dự án được tổ chức theo mô hình tách riêng frontend và backend, phù hợp cho việc phát triển, kiểm thử và mở rộng từng phân hệ một cách độc lập.

Repository hiện cung cấp cấu trúc nền tảng cho một hệ thống đặt vé máy bay gồm ứng dụng React ở phía client và API Node.js Express ở phía server. Backend dự kiến kết nối Supabase để quản lý dữ liệu, xác thực, thông tin chuyến bay, đặt chỗ, ghế, thanh toán và các tác vụ quản trị.

## Mục tiêu dự án

Xây dựng một nền tảng đặt vé máy bay có trải nghiệm rõ ràng cho người dùng cuối và bộ công cụ quản trị cho người vận hành hệ thống. Ứng dụng hướng đến việc gom các nghiệp vụ cốt lõi của một website bán vé máy bay vào một kiến trúc dễ bảo trì, dễ mở rộng và có thể triển khai theo từng giai đoạn.

## Tính năng chính

1. Tìm kiếm và xem danh sách chuyến bay theo hành trình, ngày bay và thông tin liên quan.
2. Xem chi tiết chuyến bay, hãng bay, sân bay, tàu bay và thông tin ghế.
3. Đăng ký, đăng nhập và quản lý thông tin tài khoản người dùng.
4. Tạo đặt chỗ, nhập thông tin hành khách và lựa chọn ghế.
5. Xử lý thanh toán và hiển thị kết quả thanh toán.
6. Theo dõi lịch sử đặt vé và chi tiết từng đơn đặt chỗ.
7. Quản trị chuyến bay, sân bay, hãng bay, tàu bay, người dùng, đặt chỗ, thanh toán và đánh giá.
8. Hỗ trợ thông báo và đánh giá dịch vụ sau chuyến bay.

## Công nghệ sử dụng

Frontend sử dụng React, Vite, Tailwind CSS, React Router, Axios và lucide-react. Phần giao diện được tổ chức theo các nhóm component, page, feature, hook, service và store để tách biệt trách nhiệm giữa hiển thị, điều hướng, xử lý nghiệp vụ và giao tiếp API.

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
4. Thông tin cấu hình nhà cung cấp thanh toán nếu bật tính năng thanh toán.

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
```

Frontend:

```bash
npm run dev
npm run build
npm run preview
```

## Định hướng phát triển

1. Hoàn thiện API và kết nối Supabase cho các module nghiệp vụ.
2. Xây dựng giao diện người dùng cho luồng tìm kiếm, đặt vé, chọn ghế và thanh toán.
3. Xây dựng giao diện quản trị cho việc quản lý dữ liệu vận hành.
4. Bổ sung validation, phân quyền, xử lý lỗi và thông báo hệ thống.
5. Bổ sung dữ liệu mẫu, tài liệu API và test cho các luồng nghiệp vụ quan trọng.

## Trạng thái hiện tại

Dự án đang ở giai đoạn khởi tạo cấu trúc. Các thư mục, module, package và biến môi trường nền tảng đã được định hướng sẵn sàng cho việc triển khai chi tiết.
