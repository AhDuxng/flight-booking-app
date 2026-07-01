import { useParams } from "react-router-dom";
import ETicketDetailFeature from "@/features/bookings/ETicketDetailFeature";

export default function BookingDetailPage() {
  const { bookingId } = useParams();

  return <ETicketDetailFeature bookingId={bookingId} />;
}
