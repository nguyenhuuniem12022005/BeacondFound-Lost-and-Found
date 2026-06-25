import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap, useMapEvents } from 'react-leaflet';
import api from '../../api/axios';
import Icon from '../../components/Icons';
import { Spinner, TypeBadge, EmptyState } from '../../components/common';
import { pinForType, bluePin } from '../../components/leafletIcons';
import { timeAgo } from '../../utils/format';

const DEFAULT_CENTER = [10.7769, 106.7009]; // TP.HCM

function FlyTo({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.flyTo(center, 14);
  }, [center?.[0], center?.[1]]);
  return null;
}

function MapClickHandler({ onSelect }) {
  useMapEvents({
    click(e) {
      onSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function MapSearchPage() {
  const [address, setAddress] = useState('');
  const [center, setCenter] = useState(DEFAULT_CENTER);
  const [radius, setRadius] = useState(5);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [selectingLocation, setSelectingLocation] = useState(false);

  const search = async (lat = center[0], lng = center[1], r = radius) => {
    setLoading(true);
    setSearched(true);
    try {
      const res = await api.get('/search/map', { params: { lat, lng, radius: r } });
      setPosts(res.data.posts);
    } catch {
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    search();
  }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    let lat = center[0];
    let lng = center[1];
    if (address.trim()) {
      setGeocoding(true);
      try {
        // Geocode bằng Nominatim (OpenStreetMap)
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(address)}`
        );
        const data = await res.json();
        if (data[0]) {
          lat = Number(data[0].lat);
          lng = Number(data[0].lon);
          setCenter([lat, lng]);
        }
      } catch {
        // giữ vị trí hiện tại nếu geocode lỗi
      } finally {
        setGeocoding(false);
      }
    }
    search(lat, lng, radius);
  };

  const selectCenterOnMap = async (lat, lng) => {
    setCenter([lat, lng]);
    setAddress(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
    search(lat, lng, radius);

    setSelectingLocation(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
      );
      const data = await res.json();
      if (data.display_name) setAddress(data.display_name);
    } catch {
      // Giữ tọa độ trong ô địa chỉ nếu reverse geocode lỗi.
    } finally {
      setSelectingLocation(false);
    }
  };

  return (
    <div className="flex h-full flex-col md:flex-row">
      {/* Panel trái */}
      <div className="flex w-full shrink-0 flex-col border-r border-primary-100 bg-white md:w-80">
        <form onSubmit={onSubmit} className="space-y-3 border-b border-gray-100 p-4">
          <div>
            <label className="label">Nhập địa chỉ trung tâm</label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-primary-500">
                {Icon.pin('h-4 w-4')}
              </span>
              <input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Ví dụ: Quận 1, Hồ Chí Minh"
                className="input pl-9"
              />
            </div>
            <p className="mt-1.5 text-[11px] text-gray-400">
              {selectingLocation ? 'Đang lấy địa chỉ...' : 'Hoặc click trực tiếp trên bản đồ để chọn vị trí trung tâm.'}
            </p>
          </div>
          <div>
            <div className="flex items-center justify-between">
              <label className="label mb-0">Bán kính tìm kiếm</label>
              <span className="rounded bg-primary-700 px-2 py-0.5 text-xs font-bold text-white">{radius} km</span>
            </div>
            <input
              type="range"
              min={1}
              max={20}
              value={radius}
              onChange={(e) => setRadius(Number(e.target.value))}
              className="mt-2 w-full accent-primary-700"
            />
            <div className="flex justify-between text-[10px] text-gray-400">
              <span>1 km</span>
              <span>20 km</span>
            </div>
            <div className="mt-1 flex gap-1.5">
              {[1, 3, 5, 10].map((r) => (
                <button
                  type="button"
                  key={r}
                  onClick={() => setRadius(r)}
                  className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                    radius === r ? 'border-primary-600 bg-primary-50 text-primary-700' : 'border-gray-200 text-gray-500'
                  }`}
                >
                  {r}km
                </button>
              ))}
            </div>
          </div>
          <button type="submit" className="btn-primary w-full" disabled={loading || geocoding}>
            {geocoding ? 'Đang định vị...' : loading ? 'Đang tìm...' : (
              <>
                {Icon.search('h-4 w-4')} Tìm kiếm
              </>
            )}
          </button>
        </form>

        {/* Kết quả */}
        <div className="flex-1 overflow-y-auto p-3">
          {loading ? (
            <div className="flex justify-center py-10">
              <Spinner />
            </div>
          ) : posts.length === 0 && searched ? (
            <EmptyState
              icon={Icon.map('h-8 w-8')}
              title="Không có bài đăng trong khu vực"
              description="Thử mở rộng bán kính tìm kiếm hoặc chọn vị trí khác."
            />
          ) : (
            <div className="space-y-2">
              {posts.map((p) => (
                <Link
                  key={p.id}
                  to={`/posts/${p.id}`}
                  className="flex gap-3 rounded-xl border border-gray-100 bg-white p-2.5 shadow-sm transition hover:border-primary-200 hover:shadow"
                >
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                    {p.images?.[0] ? (
                      <img src={p.images[0].imageUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-gray-300">
                        {Icon.camera('h-6 w-6')}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <TypeBadge type={p.type} />
                    </div>
                    <p className="mt-0.5 line-clamp-1 text-sm font-bold text-gray-800">{p.title}</p>
                    <p className="line-clamp-1 text-xs text-gray-400">{p.address}</p>
                    <div className="mt-0.5 flex items-center gap-2 text-[11px]">
                      <span className="rounded bg-primary-50 px-1.5 py-0.5 font-bold text-primary-700">
                        Cách {p.distanceKm.toFixed(1)} km
                      </span>
                      <span className="text-gray-400">{timeAgo(p.createdAt)}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bản đồ */}
      <div className="h-72 flex-1 md:h-auto">
        <MapContainer center={DEFAULT_CENTER} zoom={13} className="h-full w-full">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapClickHandler onSelect={selectCenterOnMap} />
          <FlyTo center={center} />
          <Marker position={center} icon={bluePin}>
            <Popup>Vị trí trung tâm</Popup>
          </Marker>
          <Circle
            center={center}
            radius={radius * 1000}
            pathOptions={{ color: '#cd3033', fillColor: '#cd3033', fillOpacity: 0.08, dashArray: '6 6' }}
          />
          {posts.map((p) => (
            <Marker key={p.id} position={[p.latitude, p.longitude]} icon={pinForType(p.type)}>
              <Popup>
                <div className="w-48">
                  {p.images?.[0] && (
                    <img src={p.images[0].imageUrl} alt="" className="mb-2 h-24 w-full rounded object-cover" />
                  )}
                  <TypeBadge type={p.type} />
                  <p className="mt-1 text-sm font-bold">{p.title}</p>
                  <p className="text-xs text-gray-500">{p.address}</p>
                  <Link
                    to={`/posts/${p.id}`}
                    className="mt-2 block rounded-lg bg-primary-700 py-1.5 text-center text-xs font-bold text-white"
                  >
                    Xem chi tiết
                  </Link>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
