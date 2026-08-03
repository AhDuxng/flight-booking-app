import { useParams } from "react-router-dom";
import PaymentCheckoutFeature from "@/features/payments/PaymentCheckoutFeature";

export default function PaymentPage() {
  const { bookingId } = useParams();

  return <PaymentCheckoutFeature bookingId={bookingId} />;
}
