type ZoomControlProps = {
  zoom: number;
  onZoomChange: (value: number) => void;
};

export function ZoomControl({ zoom, onZoomChange }: ZoomControlProps) {
  const zoomIn = () => {
    if (zoom >= 150) return;
    onZoomChange(zoom + 10);
  };

  const zoomOut = () => {
    if (zoom <= 20) return;
    onZoomChange(zoom - 10);
  };

  return (
    <div className="zoom-control">
      <button type="button" className="icon-btn" onClick={zoomOut} aria-label="Zoom out">
        −
      </button>
      <span>{zoom}%</span>
      <button type="button" className="icon-btn" onClick={zoomIn} aria-label="Zoom in">
        +
      </button>
    </div>
  );
}