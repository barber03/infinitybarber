import { ServicesList } from "../components/ServicesList";

export function ServicesPage() {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="pt-10">
        <ServicesList />
      </div>
    </div>
  );
}
