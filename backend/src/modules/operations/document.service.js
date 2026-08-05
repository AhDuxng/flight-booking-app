import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import { fileURLToPath } from 'node:url';

const regularFont = fileURLToPath(
  new URL(
    '../../../node_modules/@fontsource/noto-sans/files/noto-sans-vietnamese-400-normal.woff',
    import.meta.url,
  ),
);
const boldFont = fileURLToPath(
  new URL(
    '../../../node_modules/@fontsource/noto-sans/files/noto-sans-vietnamese-700-normal.woff',
    import.meta.url,
  ),
);

const collectPdf = (render) =>
  new Promise((resolve, reject) => {
    const document = new PDFDocument({ size: 'A4', margin: 48, info: { Author: 'VietFly' } });
    document.registerFont('NotoSans', regularFont);
    document.registerFont('NotoSansBold', boldFont);
    document.font('NotoSans');
    const chunks = [];
    document.on('data', (chunk) => chunks.push(chunk));
    document.on('end', () => resolve(Buffer.concat(chunks)));
    document.on('error', reject);
    Promise.resolve(render(document)).then(() => document.end(), reject);
  });

const text = (value) => String(value ?? '-');
const dateTime = (value) =>
  value
    ? new Intl.DateTimeFormat('vi-VN', {
        dateStyle: 'medium',
        timeStyle: 'short',
        timeZone: 'Asia/Ho_Chi_Minh',
      }).format(new Date(value))
    : '-';

const drawHeader = (document, title, reference) => {
  document
    .fillColor('#0b3b70')
    .font('NotoSansBold')
    .fontSize(24)
    .text('VietFly', { continued: true });
  document.fillColor('#667085').fontSize(10).text('  Fly with confidence');
  document.moveDown(1.2).fillColor('#101828').font('NotoSansBold').fontSize(18).text(title);
  document
    .fillColor('#475467')
    .fontSize(10)
    .text(`Mã tham chiếu: ${text(reference)}`);
  document
    .moveDown()
    .strokeColor('#d0d5dd')
    .moveTo(48, document.y)
    .lineTo(547, document.y)
    .stroke()
    .moveDown();
};

export const createETicketPdf = async (booking) =>
  collectPdf(async (document) => {
    drawHeader(document, 'Vé điện tử / Hành trình', booking.booking_reference ?? booking.id);
    const flight = booking.flight;
    document
      .fillColor('#101828')
      .font('NotoSansBold')
      .fontSize(15)
      .text(`${text(flight?.origin_airport?.code)}  →  ${text(flight?.destination_airport?.code)}`);
    document
      .fillColor('#475467')
      .font('NotoSans')
      .fontSize(11)
      .text(`${text(flight?.airline?.name)} · ${text(flight?.flight_number)}`)
      .text(`Khởi hành: ${dateTime(flight?.departure_time)}`)
      .text(`Đến: ${dateTime(flight?.arrival_time)}`)
      .text(`Hạng giá: ${text(booking.fare?.name)}`);
    document.moveDown();
    for (const passenger of booking.passengers ?? []) {
      const ticket = booking.tickets?.find(
        (item) =>
          item.passenger_id === passenger.id && ['issued', 'reissued'].includes(item.status),
      );
      const seat = booking.booking_seats?.find((item) => item.passenger_id === passenger.id)?.seat;
      const top = document.y;
      document.roundedRect(48, top, 499, 76, 6).fillAndStroke('#f8fafc', '#e4e7ec');
      document
        .fillColor('#101828')
        .font('NotoSansBold')
        .fontSize(12)
        .text(`${text(passenger.last_name)} ${text(passenger.first_name)}`, 62, top + 10);
      document
        .fillColor('#475467')
        .font('NotoSans')
        .fontSize(10)
        .text(`Số vé: ${text(ticket?.ticket_number)}`, 62, top + 30)
        .text(`Ghế: ${text(seat?.seat_number)} · ${text(seat?.seat_class)}`, 62, top + 46)
        .text(`Trạng thái: ${text(ticket?.status ?? booking.status)}`, 310, top + 30);
      document.y = top + 88;
    }
    document
      .moveDown()
      .fontSize(9)
      .fillColor('#667085')
      .text(
        'Vui lòng mang theo giấy tờ tùy thân hợp lệ. Giá và khả dụng đã được xác nhận tại thời điểm tạo đặt chỗ.',
      );
  });

export const createBoardingPassPdf = async (checkIn) => {
  const qrDataUrl = await QRCode.toDataURL(checkIn.qr_payload, {
    errorCorrectionLevel: 'M',
    margin: 1,
    width: 260,
  });
  const qrBuffer = Buffer.from(qrDataUrl.split(',')[1], 'base64');
  return collectPdf(async (document) => {
    drawHeader(document, 'Thẻ lên máy bay', checkIn.boarding_pass_number);
    const flight = checkIn.flight;
    document
      .fillColor('#101828')
      .font('NotoSansBold')
      .fontSize(22)
      .text(`${text(flight?.origin_airport?.code)}  →  ${text(flight?.destination_airport?.code)}`);
    document
      .fillColor('#475467')
      .font('NotoSans')
      .fontSize(11)
      .text(
        `Hành khách: ${text(checkIn.passenger?.last_name)} ${text(checkIn.passenger?.first_name)}`,
      )
      .text(`Chuyến bay: ${text(flight?.flight_number)} · ${dateTime(flight?.departure_time)}`)
      .text(
        `Ghế: ${text(checkIn.seat?.seat_number)} · Cửa: ${text(flight?.gate)} · Nhà ga: ${text(flight?.terminal)}`,
      )
      .text(`Thứ tự lên máy bay: ${text(checkIn.boarding_sequence).padStart(3, '0')}`)
      .text(`Số vé: ${text(checkIn.ticket?.ticket_number)}`);
    document.image(qrBuffer, 178, document.y + 24, { width: 190 });
    document.y += 230;
    document
      .fillColor('#667085')
      .fontSize(9)
      .text('Quét mã tại cổng lên máy bay. Không chia sẻ mã QR công khai.', { align: 'center' });
  });
};
