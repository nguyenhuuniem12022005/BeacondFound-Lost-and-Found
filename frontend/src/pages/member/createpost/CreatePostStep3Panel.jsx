import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import Icon from '../../../components/Icons';
import { useToast } from '../../../context/ToastContext';
import { redPin } from '../../../components/leafletIcons';

function LocationPicker({ position, onSelect }) {
  useMapEvents({
    click(e) {
      onSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return position ? <Marker position={position} icon={redPin} /> : null;
}

function FlyTo({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.flyTo(center, 15);
  }, [center?.[0], center?.[1]]);
  return null;
}

/**
 * CreatePostStep3Panel - Bước 3: nhập địa chỉ và ghim vị trí trên bản đồ.
 */
export default function CreatePostStep3Panel({
  address,
  setAddress,
  position,
  setPosition,
  geocoding,
  setGeocoding,
  onNext,
  onBack,
}) {
  const { toast } = useToast();

  const geocodeAddress = async () => {
    if (!address.trim()) return;
    setGeocoding(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(address)}`
      );
      const data = await res.json();
      if (data[0]) setPosition([Number(data[0].lat), Number(data[0].lon)]);
      else toast('Không tìm thấy địa chỉ, hãy ghim trực tiếp trên bản đồ', 'info');
    } catch {
      toast('Không thể định vị địa chỉ, hãy ghim trực tiếp trên bản đồ', 'info');
    } finally {
      setGeocoding(false);
    }
  };

  const handlePinLocation = async (lat, lng) => {
    setPosition([lat, lng]);
    setAddress(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
    setGeocoding(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
      );
      const data = await res.json();
      if (data.display_name) setAddress(data.display_name);
    } catch {
      // Giữ tọa độ trong ô địa chỉ nếu không lấy được tên địa điểm.
    } finally {
      setGeocoding(false);
    }
  };

  const handleNext = () => {
    if (!address.trim()) {
      toast('Vui lòng nhập địa chỉ', 'error');
      return;
    }
    onNext();
  };

  const handleBack = () => onBack();

  return (
    <div>
      <h1 className="text-xl font-extrabold text-gray-900">Ghim vị trí trên bản đồ</h1>
      <div className="mt-4">
        <label className="label">Địa chỉ *</label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              {Icon.search('h-4 w-4')}
            </span>
            <input
              className="input pl-9"
              placeholder="Nhập địa chỉ..."
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), geocodeAddress())}
            />
          </div>
          <button type="button" onClick={geocodeAddress} className="btn-secondary shrink-0" disabled={geocoding}>
            {geocoding ? '...' : 'Định vị'}
          </button>
        </div>
      </div>
      <div className="mt-4 overflow-hidden rounded-xl border border-gray-200">
        <div className="h-72">
          <MapContainer center={position} zoom={13} className="h-full w-full">
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <FlyTo center={position} />
            <LocationPicker position={position} onSelect={handlePinLocation} />
          </MapContainer>
        </div>
        <div className="flex items-center justify-between bg-primary-50 px-3 py-2 text-xs text-gray-600">
          <span className="flex items-center gap-1 font-semibold text-primary-700">
            {Icon.pin('h-3.5 w-3.5')} {position[0].toFixed(6)}, {position[1].toFixed(6)}
          </span>
          <span>{geocoding ? 'Đang lấy địa chỉ...' : 'Click lên bản đồ để ghim chính xác vị trí'}</span>
        </div>
      </div>

      <div className="mt-8 flex items-center justify-between">
        <button onClick={handleBack} className="btn-secondary">
          ← Quay lại
        </button>
        <button onClick={handleNext} className="btn-primary px-6">
          Tiếp theo →
        </button>
      </div>
    </div>
  );
}
