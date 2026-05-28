import { Gallery } from "../components/Gallery";

export function GalleryPage() {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="pt-10">
        <Gallery />
      </div>
    </div>
  );
}
