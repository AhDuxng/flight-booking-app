# Database — Ghi chú thiết kế

## Tổng quan

Database sử dụng PostgreSQL thông qua Supabase. Auth được quản lý bởi Supabase Auth (`auth.users`), bảng `users` chỉ lưu thông tin mở rộng.

---

## Danh sách bảng

| Bảng | Mô tả |
|---|---|
| `airlines` | Hãng hàng không |
| `airports` | Sân bay (dùng mã IATA) |
| `aircrafts` | Tàu bay thuộc hãng |
| `flights` | Chuyến bay |
| `users` | Thông tin mở rộng người dùng |
| `bookings` | Đặt chỗ |
| `passengers` | Hành khách trong booking |
| `seats` | Ghế ngồi theo chuyến bay |
| `booking_seats` | Liên kết hành khách ↔ ghế |
| `payments` | Thanh toán |
| `baggage_options` | Gói hành lý ký gửi theo chuyến |
| `booking_baggage` | Hành lý đã chọn trong booking |
| `meal_options` | Suất ăn theo chuyến bay |
| `booking_meals` | Suất ăn đã chọn trong booking |
| `discounts` | Mã giảm giá / khuyến mãi |
| `booking_discounts` | Mã giảm giá đã áp dụng |
| `notifications` | Thông báo người dùng |
| `reviews` | Đánh giá sau chuyến bay |
| `admin_logs` | Nhật ký hành động quản trị |

---

## Quyết định thiết kế quan trọng

### Primary Key
Tất cả bảng dùng `UUID DEFAULT gen_random_uuid()` — tránh enumeration và phù hợp với Supabase.

### Giá tiền
Dùng `NUMERIC(12,2)` — không dùng `FLOAT` tránh lỗi làm tròn.

### Price Snapshot
`bookings.price_snapshot` lưu giá tại thời điểm đặt. `booking_baggage.price_snapshot` và `booking_meals.price_snapshot` tương tự. Không bao giờ JOIN ngược sang bảng gốc để lấy giá sau khi booking đã tạo.

### Trạng thái booking
```
pending → paid → confirmed → cancelled → refund_pending → refunded
```

### Trạng thái ghế
```
available → held → booked
                 ↘ available (nếu held quá 10 phút, pg_cron tự giải phóng)
```

### Race condition ghế
Dùng Postgres function `hold_seat()` với `SELECT FOR UPDATE` — không check rồi update riêng ở JS.

### Discount
`discounts.applicable_to` phân loại áp dụng cho: `all`, `flight`, `baggage`, `meal`. Hàm `apply_discount()` kiểm tra hợp lệ và tính toán ngay trong DB.

---

## RLS Summary

| Bảng | User | Admin |
|---|---|---|
| airlines, airports, aircrafts, flights | SELECT (public) | ALL |
| users | SELECT/UPDATE/INSERT own | ALL |
| bookings, passengers | SELECT/INSERT own | ALL |
| seats, baggage_options, meal_options | SELECT (public) | ALL |
| booking_baggage, booking_meals, booking_seats | SELECT/INSERT own | ALL |
| payments | SELECT own | ALL |
| discounts | SELECT (active + in-date) | ALL |
| notifications | ALL own | — |
| reviews | SELECT (visible), INSERT/UPDATE own | ALL |
| admin_logs | — | SELECT |

---

## Realtime

Chỉ bật trên 2 bảng:
- `bookings` — cập nhật trạng thái booking real-time
- `notifications` — nhận thông báo ngay lập tức

---

## Storage Buckets

| Bucket | Access | Dùng cho |
|---|---|---|
| `avatars` | authenticated | Ảnh đại diện user |
| `tickets` | private (signed URL 15 phút) | PDF vé sau khi confirm |

---

## Chạy schema

```bash
# Chạy schema trước
psql $DATABASE_URL -f database/schema.sql

# Chạy seed data sau
psql $DATABASE_URL -f database/seed.sql
```

Hoặc trên Supabase Dashboard: SQL Editor → paste nội dung file.

---

## pg_cron (tùy chọn)

Nếu Supabase plan hỗ trợ, bỏ comment ở cuối `schema.sql` để tự động giải phóng ghế `held` quá 10 phút mỗi 5 phút một lần.
