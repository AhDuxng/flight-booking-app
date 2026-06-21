# Frontend Flight Booking App

Frontend là giao diện người dùng cho hệ thống đặt vé máy bay. Phần này hỗ trợ tìm kiếm chuyến bay, xem chi tiết chuyến bay, đăng nhập, đăng ký, đặt vé, chọn ghế, thanh toán, xem lịch sử đặt chỗ và truy cập các trang quản trị.

## Công nghệ sử dụng

1. React để xây dựng giao diện.
2. Vite để phát triển và build ứng dụng.
3. React Router để quản lý điều hướng.
4. Axios để gọi API backend.
5. lucide-react để sử dụng biểu tượng trong giao diện.
6. Bắt buộc sử dụng icon trong thư viện React Icons

## Cấu trúc chính

```text
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

Cấu trúc này giúp tách biệt phần giao diện dùng chung, trang, tính năng, gọi API, trạng thái ứng dụng và style.

## Cài đặt

```bash
npm install
```

Tạo file môi trường từ file mẫu:

```bash
cp .env.example .env
```

Cấu hình API backend trong `.env`:

```text
VITE_API_URL=http://localhost:5000/api
```

## Chạy dự án

Chạy ở môi trường phát triển:

```bash
npm run dev
```

Build ứng dụng:

```bash
npm run build
```

Xem bản build:

```bash
npm run preview
```

Mặc định frontend chạy tại `http://localhost:5173`.
