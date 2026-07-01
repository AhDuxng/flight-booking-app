import TrustSignalCard from "./TrustSignalCard";

const TRUST_SIGNALS = [
  {
    id: "ts-1",
    icon: "savings",
    title: "Giá tốt nhất",
    description: "Luôn đảm bảo mức giá cạnh tranh cùng nhiều ưu đãi độc quyền cho thành viên.",
  },
  {
    id: "ts-2",
    icon: "support_agent",
    title: "Hỗ trợ 24/7",
    description: "Đội ngũ chuyên viên chăm sóc khách hàng luôn sẵn sàng giải đáp mọi thắc mắc của bạn.",
  },
  {
    id: "ts-3",
    icon: "verified_user",
    title: "Thanh toán an toàn",
    description: "Hệ thống bảo mật tối tân, hỗ trợ đa dạng phương thức thanh toán tại Việt Nam.",
  },
];

export default function TrustSignals() {
  return (
    <section className="bg-surface-container-low py-section-gap px-container-padding">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-stack-lg">
          <h2 className="text-headline-lg font-headline-lg text-primary mb-2">
            Tại sao chọn VietFly?
          </h2>
          <p className="text-body-lg font-body-lg text-on-surface-variant">
            Cam kết mang lại trải nghiệm bay tuyệt vời nhất cho bạn
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-stack-lg">
          {TRUST_SIGNALS.map((signal) => (
            <TrustSignalCard
              key={signal.id}
              icon={signal.icon}
              title={signal.title}
              description={signal.description}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
