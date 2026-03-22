type ErrorStateProps = {
  message: string;
  debugMessage?: string;
};

export function ErrorState({ message, debugMessage }: ErrorStateProps) {
  return (
    <section className="glass-panel border border-rose-200/45 bg-rose-100/15 p-6">
      <p className="text-xs uppercase tracking-[0.18em] text-rose-50">
        Error
      </p>
      <h2 className="mt-3 text-2xl font-bold tracking-tight text-white">
        버스 정보를 불러오지 못했습니다
      </h2>
      <p className="mt-3 text-sm leading-6 text-slate-100">{message}</p>
      <p className="mt-2 text-sm leading-6 text-slate-200/80">
        잠시 후 다시 시도해주세요.
      </p>
      {debugMessage ? (
        <p className="mt-4 rounded-2xl border border-white/25 bg-slate-950/30 px-4 py-3 text-xs text-slate-200/80">
          개발용 메시지: {debugMessage}
        </p>
      ) : null}
    </section>
  );
}
