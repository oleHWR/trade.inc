import { NetWorthPanel, SidePanel } from './components/BottomPanels';

export function BottomPanelsRow({ onNews }: { onNews: (id: number) => void }) {
  return (
    <section className="bottom">
      <NetWorthPanel />
      <SidePanel onNews={onNews} />
    </section>
  );
}
