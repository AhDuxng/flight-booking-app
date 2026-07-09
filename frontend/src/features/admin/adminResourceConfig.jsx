import { Link } from "react-router-dom";
import Button from "@/components/common/Button";
import StatusBadge from "@/components/common/StatusBadge";
import {
  adminAircrafts,
  adminAirlines,
  adminAirports,
  adminBookings,
  adminFlights,
  adminPayments,
  adminReviews,
  adminUsers,
} from "./adminMockData";

const statusColumn = {
  key: "statusLabel",
  label: "Trạng thái",
  render: (row) => <StatusBadge status={row.status}>{row.statusLabel ?? "Đang hoạt động"}</StatusBadge>,
};

export const adminResources = {
  aircrafts: {
    data: adminAircrafts,
    description: "Quản lý đội tàu bay, số ghế và trạng thái khai thác.",
    searchPlaceholder: "Tìm theo mã, dòng máy bay hoặc số đăng ký",
    title: "Tàu bay",
    columns: [
      { key: "id", label: "Mã tàu bay" },
      { key: "model", label: "Dòng máy bay" },
      { key: "registration", label: "Số đăng ký" },
      { key: "seats", label: "Số ghế" },
      statusColumn,
    ],
  },
  airlines: {
    data: adminAirlines,
    description: "Theo dõi hãng hàng không, mã hãng và loại hình vận hành.",
    searchPlaceholder: "Tìm theo tên hãng hoặc mã hãng",
    title: "Hãng bay",
    columns: [
      { key: "code", label: "Mã hãng" },
      { key: "name", label: "Tên hãng" },
      { key: "type", label: "Loại hình" },
      statusColumn,
    ],
  },
  airports: {
    data: adminAirports,
    description: "Quản lý sân bay, thành phố và nhà ga đang khai thác.",
    searchPlaceholder: "Tìm theo mã sân bay, thành phố hoặc tên sân bay",
    title: "Sân bay",
    columns: [
      { key: "id", label: "Mã sân bay" },
      { key: "name", label: "Tên sân bay" },
      { key: "city", label: "Thành phố" },
      { key: "terminal", label: "Nhà ga" },
      statusColumn,
    ],
  },
  bookings: {
    data: adminBookings,
    description: "Theo dõi đặt chỗ, trạng thái thanh toán và hành khách.",
    searchPlaceholder: "Tìm theo mã đặt chỗ, khách hàng hoặc chuyến bay",
    title: "Đơn đặt vé",
    columns: [
      { key: "id", label: "Mã đặt chỗ" },
      { key: "customer", label: "Khách hàng" },
      { key: "flight", label: "Chuyến bay" },
      { key: "route", label: "Chặng" },
      { key: "total", label: "Tổng tiền" },
      statusColumn,
    ],
  },
  flights: {
    action: (
      <Button as={Link} to="/admin/flights/create">
        Tạo chuyến bay
      </Button>
    ),
    data: adminFlights,
    description: "Quản lý lịch bay, giá vé, tải ghế và trạng thái mở bán.",
    searchPlaceholder: "Tìm theo mã chuyến, sân bay hoặc tàu bay",
    title: "Chuyến bay",
    columns: [
      { key: "id", label: "Mã chuyến" },
      { key: "route", label: "Chặng", render: (row) => `${row.origin} - ${row.destination}` },
      { key: "date", label: "Ngày bay" },
      { key: "time", label: "Giờ bay", render: (row) => `${row.departure} - ${row.arrival}` },
      { key: "seats", label: "Ghế đã bán" },
      statusColumn,
      {
        key: "actions",
        label: "",
        render: (row) => (
          <Link className="text-label-md font-label-md text-primary hover:underline" to={`/admin/flights/${row.id}/edit`}>
            Sửa
          </Link>
        ),
      },
    ],
  },
  payments: {
    data: adminPayments,
    description: "Kiểm tra giao dịch, phương thức thanh toán và trạng thái đối soát.",
    searchPlaceholder: "Tìm theo mã thanh toán hoặc mã đặt chỗ",
    title: "Thanh toán",
    columns: [
      { key: "id", label: "Mã giao dịch" },
      { key: "booking", label: "Mã đặt chỗ" },
      { key: "method", label: "Phương thức" },
      { key: "total", label: "Số tiền" },
      statusColumn,
    ],
  },
  reviews: {
    data: adminReviews,
    description: "Duyệt đánh giá sau chuyến bay và phản hồi khách hàng.",
    searchPlaceholder: "Tìm theo khách hàng hoặc chuyến bay",
    title: "Đánh giá",
    columns: [
      { key: "id", label: "Mã đánh giá" },
      { key: "customer", label: "Khách hàng" },
      { key: "flight", label: "Chuyến bay" },
      { key: "rating", label: "Điểm" },
      statusColumn,
    ],
  },
  users: {
    data: adminUsers,
    description: "Quản lý tài khoản khách hàng, vai trò và trạng thái hoạt động.",
    searchPlaceholder: "Tìm theo tên, email hoặc mã người dùng",
    title: "Người dùng",
    columns: [
      { key: "id", label: "Mã người dùng" },
      { key: "name", label: "Họ tên" },
      { key: "email", label: "Email" },
      { key: "role", label: "Vai trò" },
      {
        key: "actions",
        label: "",
        render: (row) => (
          <Link className="text-label-md font-label-md text-primary hover:underline" to={`/admin/users/${row.id}`}>
            Chi tiết
          </Link>
        ),
      },
    ],
  },
};
