"use client";

type Props = {
  satelliteId: number;
  satelliteName: string;
};

export default function AlertSignup({ satelliteId, satelliteName }: Props) {
  void satelliteId;
  void satelliteName;

  return (
    <div className="mt-3 pt-3 border-t border-white/5">
      <p className="text-[11px] text-muted font-body">
        Email pass alerts:{" "}
        <span className="text-signal font-mono">coming soon</span>. For now, use the{" "}
        <span className="text-ink">Pass Alert</span> quick action — it sends a browser
        notification as long as OrbitMap is open in a tab when the pass starts.
      </p>
    </div>
  );
}
