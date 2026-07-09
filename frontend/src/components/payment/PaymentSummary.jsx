const formatCurrency = (value) => new Intl.NumberFormat("vi-VN").format(value);

export default function PaymentSummary({ items = [], total = 0 }) {
  return (
    <aside className="rounded-lg border border-surface-container-high bg-surface-container-lowest p-stack-md shadow-sm">
      <h2 className="mb-stack-md text-title-lg font-title-lg text-primary">Tóm tắt thanh toán</h2>
      <div className="grid gap-3">
        {items.map((item) => (
          <div className="flex items-center justify-between gap-4 text-body-sm font-body-sm" key={item.label}>
            <span className="text-on-surface-variant">{item.label}</span>
            <span className="text-right font-data-mono text-on-surface">{formatCurrency(item.value)} VND</span>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-end justify-between gap-4 border-t border-outline-variant pt-4">
        <span className="text-title-lg font-title-lg text-primary">Tổng cộng</span>
        <span className="text-right text-headline-md font-headline-md text-primary">{formatCurrency(total)} VND</span>
      </div>
    </aside>
  );
}
