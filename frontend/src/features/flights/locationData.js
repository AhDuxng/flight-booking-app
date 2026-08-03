export const DOMESTIC_LOCATIONS = [
  { code: "SGN", name: "TP. Hồ Chí Minh (Tân Sơn Nhất)", type: "domestic" },
  { code: "HAN", name: "Hà Nội (Nội Bài)", type: "domestic" },
  { code: "DAD", name: "Đà Nẵng", type: "domestic" },
  { code: "CXR", name: "Khánh Hòa (Cam Ranh)", type: "domestic" },
  { code: "PQC", name: "Kiên Giang (Phú Quốc)", type: "domestic" },
  { code: "HPH", name: "Hải Phòng (Cát Bi)", type: "domestic" },
  { code: "HUI", name: "Thừa Thiên Huế (Phú Bài)", type: "domestic" },
  { code: "VCA", name: "Cần Thơ", type: "domestic" },
  { code: "VDO", name: "Quảng Ninh (Vân Đồn)", type: "domestic" },
  { code: "VII", name: "Nghệ An (Vinh)", type: "domestic" },
  { code: "DLI", name: "Lâm Đồng (Liên Khương)", type: "domestic" },
  { code: "THD", name: "Thanh Hóa (Thọ Xuân)", type: "domestic" },
  { code: "DIN", name: "Điện Biên Phủ", type: "domestic" },
  { code: "VDH", name: "Quảng Bình (Đồng Hới)", type: "domestic" },
  { code: "UIH", name: "Bình Định (Phù Cát)", type: "domestic" },
  { code: "TBB", name: "Phú Yên (Tuy Hòa)", type: "domestic" },
  { code: "BMV", name: "Đắk Lắk (Buôn Ma Thuột)", type: "domestic" },
  { code: "PXU", name: "Gia Lai (Pleiku)", type: "domestic" },
  { code: "VCS", name: "Bà Rịa - Vũng Tàu (Côn Đảo)", type: "domestic" },
  { code: "VKG", name: "Kiên Giang (Rạch Giá)", type: "domestic" },
  { code: "VCL", name: "Quảng Nam (Chu Lai)", type: "domestic" },
  { code: "CAH", name: "Cà Mau", type: "domestic" },
];

export const INTERNATIONAL_LOCATIONS = [
  { code: "BKK", name: "Bangkok, Thái Lan", type: "international" },
  { code: "SIN", name: "Singapore, Singapore", type: "international" },
  { code: "ICN", name: "Seoul, Hàn Quốc", type: "international" },
  { code: "NRT", name: "Tokyo (Narita), Nhật Bản", type: "international" },
  { code: "TPE", name: "Đài Bắc, Đài Loan", type: "international" },
  { code: "KUL", name: "Kuala Lumpur, Malaysia", type: "international" },
  { code: "CDG", name: "Paris, Pháp", type: "international" },
  { code: "LHR", name: "London, Anh", type: "international" },
  { code: "SYD", name: "Sydney, Úc", type: "international" },
  { code: "LAX", name: "Los Angeles, Mỹ", type: "international" },
];

export const ALL_LOCATIONS = [...DOMESTIC_LOCATIONS, ...INTERNATIONAL_LOCATIONS];
