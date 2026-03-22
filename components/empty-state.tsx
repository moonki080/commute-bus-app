type EmptyStateProps = {
  stopName: string;
};

export function EmptyState({ stopName }: EmptyStateProps) {
  return (
    <section className="glass-panel bg-white/15 p-6 text-center">
      <p className="text-xs uppercase tracking-[0.18em] text-slate-100/80">
        Empty
      </p>
      <h2 className="mt-3 text-2xl font-bold tracking-tight text-white">
        도착예정 정보가 없습니다
      </h2>
      <p className="mt-3 text-sm leading-6 text-slate-100/85">
        현재 {stopName} 정류장으로 들어오는 차량 정보가 비어 있습니다.
        잠시 후 새로고침해 다시 확인해주세요.
      </p>
    </section>
  );
}
