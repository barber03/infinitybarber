import { BarbersList } from "../components/BarbersList";

export function TeamPage() {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="pt-10">
        <BarbersList />
      </div>
    </div>
  );
}
