import React, { useState, useMemo, useEffect } from 'react';
import { 
  Home, 
  MapPin, 
  Car, 
  Clock, 
  Wind, 
  Bath, 
  Settings2, 
  Search, 
  CheckCircle2, 
  X,
  Navigation,
  ExternalLink,
  Zap,
  Filter,
  Layers,
  ChevronUp,
  Map as MapIcon,
  List as ListIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import Fuse from 'fuse.js';
import { ROOMS, Room, predictPrice } from './types';
import { cn } from './lib/utils';

// Fix for default Leaflet marker icons in React
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

// Custom price icon for markers
const createPriceIcon = (price: number, isSelected: boolean) => {
  const color = isSelected ? '#FFD700' : '#0066FF';
  const textColor = isSelected ? '#000' : '#fff';
  return L.divIcon({
    className: 'custom-div-icon',
    html: `<div class="transition-all duration-300 transform ${isSelected ? 'scale-125 z-50' : 'scale-100'}" 
                style="background: ${color}; color: ${textColor}; border-radius: 6px; padding: 4px 8px; font-weight: 900; font-size: 10px; box-shadow: 0 4px 15px rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.2); white-space: nowrap;">
                ${(price / 1000000).toFixed(1)}Tr
           </div>`,
    iconSize: [40, 20],
    iconAnchor: [20, 10],
  });
};

function ChangeView({ center, zoom }: { center: [number, number], zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

export default function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPhuong, setSelectedPhuong] = useState(ROOMS[0].phuong);
  const [radius, setRadius] = useState(2.0);
  const [areaReq, setAreaReq] = useState(25);
  const [ac, setAc] = useState(true);
  const [wc, setWc] = useState(true);
  const [pk, setPk] = useState(true);
  const [ft, setFt] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);

  const { price: predPrice, surge } = useMemo(() => 
    predictPrice(areaReq, radius, ac, wc, pk, ft), 
    [areaReq, radius, ac, wc, pk, ft]
  );

  const fuse = useMemo(() => new Fuse(ROOMS, {
    keys: ['phuong'],
    threshold: 0.4,
  }), []);

  const filteredRooms = useMemo(() => {
    let baseResults = ROOMS;
    if (searchQuery.trim()) {
      const fuzzyResults = fuse.search(searchQuery);
      baseResults = fuzzyResults.map(r => r.item);
    }
    return [...baseResults].sort((a, b) => Math.abs(a.dist - radius) - Math.abs(b.dist - radius));
  }, [searchQuery, fuse, radius]);

  const centerCoords = useMemo(() => {
    const room = filteredRooms.find(r => r.phuong === selectedPhuong) || filteredRooms[0] || ROOMS[0];
    return [room.lat, room.lng] as [number, number];
  }, [selectedPhuong, filteredRooms]);

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-bg-dark overflow-hidden font-sans selection:bg-primary/30 text-white">
      
      {/* Mobile Top Bar */}
      <div className="lg:hidden flex items-center justify-between px-4 h-16 bg-[#0d1117] border-b border-white/5 z-[60]">
        <div className="flex items-center gap-2">
          <div className="bg-primary p-2 rounded-lg">
            <Home className="text-white w-4 h-4" />
          </div>
          <h1 className="font-black text-sm tracking-tighter uppercase italic">DỰ ĐOÁN GIÁ TRỌ <span className="text-accent underline underline-offset-4 decoration-2">AI</span></h1>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setViewMode(viewMode === 'map' ? 'list' : 'map')}
            className="p-2.5 bg-white/5 rounded-xl border border-white/10"
          >
            {viewMode === 'map' ? <ListIcon size={18} /> : <MapIcon size={18} />}
          </button>
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2.5 bg-primary text-white rounded-xl shadow-lg shadow-primary/20"
          >
            <Filter size={18} />
          </button>
        </div>
      </div>

      {/* Sidebar / Filters (Drawer on Mobile) */}
      <AnimatePresence>
        {(isSidebarOpen || window.innerWidth >= 1024) && (
          <motion.aside 
            initial={{ x: -320 }}
            animate={{ x: 0 }}
            exit={{ x: -320 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={cn(
              "fixed inset-y-0 left-0 w-80 bg-[#0d1117] border-r border-white/5 p-6 flex flex-col gap-6 z-[70] lg:relative lg:translate-x-0 lg:flex shrink-0",
              !isSidebarOpen && "hidden lg:flex"
            )}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-primary w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                  <Home className="text-white w-5 h-5" />
                </div>
                <h1 className="text-white font-black text-xl tracking-tight leading-none uppercase">
                  DỰ ĐOÁN GIÁ TRỌ <span className="text-accent bg-accent/10 px-1.5 py-0.5 rounded text-[10px] ml-1 align-middle tracking-widest leading-normal">PRO</span>
                </h1>
              </div>
              <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-2 text-white/40 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <div className="flex flex-col gap-5 overflow-y-auto no-scrollbar pb-6 [&::-webkit-scrollbar]:hidden">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest flex items-center gap-2">
                  <Search className="w-3 h-3" /> Fuzzy Search Khu vực
                </label>
                <input 
                  type="text" placeholder="Tìm phường, quận..." value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-primary outline-none transition-all placeholder:text-white/20"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest flex items-center gap-2">
                  <MapPin className="w-3 h-3" /> Vị trí tâm điểm
                </label>
                <select 
                  value={selectedPhuong}
                  onChange={(e) => setSelectedPhuong(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-primary outline-none appearance-none cursor-pointer"
                >
                  {filteredRooms.map(r => (
                    <option key={r.id} value={r.phuong} className="bg-[#161b22]">{r.phuong}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center text-[10px] font-black text-white/40 uppercase tracking-widest">
                  <span className="flex items-center gap-2"><Navigation className="w-3 h-3" /> Bán kính: <span className="text-accent">{radius}km</span></span>
                </div>
                <input 
                  type="range" min="0.5" max="5.0" step="0.1" value={radius} 
                  onChange={(e) => setRadius(parseFloat(e.target.value))}
                  className="w-full accent-primary h-1.5 bg-white/5 rounded-full cursor-pointer" 
                />
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center text-[10px] font-black text-white/40 uppercase tracking-widest">
                  <span className="flex items-center gap-2"><Layers className="w-3 h-3" /> Diện tích: <span className="text-accent">{areaReq}m²</span></span>
                </div>
                <input 
                  type="range" min="10" max="100" step="1" value={areaReq} 
                  onChange={(e) => setAreaReq(parseInt(e.target.value))}
                  className="w-full accent-primary h-1.5 bg-white/5 rounded-full cursor-pointer" 
                />
              </div>

              <div className="space-y-3">
                <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Tiện ích ưu tiên</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { state: ac, set: setAc, icon: Wind, label: 'Máy lạnh' },
                    { state: wc, set: setWc, icon: Bath, label: 'WC riêng' },
                    { state: pk, set: setPk, icon: Car, label: 'Để xe' },
                    { state: ft, set: setFt, icon: Clock, label: 'Giờ tự do' },
                  ].map((item) => (
                    <button 
                      key={item.label}
                      onClick={() => item.set(!item.state)}
                      className={cn(
                        "flex flex-col items-center justify-center gap-2 p-3 rounded-xl border text-[10px] font-bold transition-all",
                        item.state ? "bg-primary/20 border-primary text-primary" : "bg-white/5 border-white/5 text-white/40"
                      )}
                    >
                      <item.icon className="w-4 h-4" />
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button 
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden mt-auto w-full bg-primary text-white font-black py-4 rounded-xl shadow-lg active:scale-95 transition-all text-sm uppercase"
            >
              Xem {filteredRooms.length} kết quả
            </button>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Backdrop for mobile drawer */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[65] lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Content Area */}
      <main className="flex-1 relative bg-[#05070a] flex flex-col md:flex-row h-full overflow-hidden">
        
        {/* Map / Visualization Area */}
        <section className={cn(
          "flex-1 relative flex flex-col transition-all duration-500",
          viewMode === 'list' ? 'hidden lg:flex' : 'flex'
        )}>
          {/* AI Banner Card */}
          <div className="absolute top-4 left-4 right-4 z-40 lg:top-8 lg:left-8 lg:w-96 pointer-events-none">
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-primary/10 border border-primary/20 rounded-[24px] p-4 lg:p-5 backdrop-blur-2xl shadow-2xl pointer-events-auto"
            >
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-[10px] font-black text-primary uppercase tracking-[2px] flex items-center gap-2">
                    <Zap className="w-3 h-3 fill-primary" /> AI Recommended
                  </div>
                  <div className="flex items-baseline gap-1.5 mt-1">
                    <span className="text-3xl lg:text-4xl font-black text-white italic truncate tracking-tight">~{predPrice.toLocaleString()}đ</span>
                  </div>
                </div>
                <div className="flex gap-4 border-l border-white/5 pl-4 overflow-hidden">
                  <div className="text-center min-w-[50px]">
                    <div className="text-[8px] font-black text-white/20 uppercase mb-1 whitespace-nowrap">Surge</div>
                    <div className="text-accent font-black text-xl leading-none">{surge.toFixed(1)}x</div>
                  </div>
                  <div className="text-center min-w-[50px]">
                    <div className="text-[8px] font-black text-white/20 uppercase mb-1 whitespace-nowrap">Độ chính xác</div>
                    <div className="text-primary font-black text-xl leading-none">98%</div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          <div className="flex-1 relative z-10 w-full h-full">
            <MapContainer 
              center={centerCoords} zoom={15} style={{ height: '100%', width: '100%' }} zoomControl={false}
            >
              <ChangeView center={centerCoords} zoom={15} />
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OSM" />
              <Circle 
                center={centerCoords} radius={radius * 1000}
                pathOptions={{ color: '#0066FF', fillColor: '#0066FF', fillOpacity: 0.08, weight: 1 }}
              />
              {filteredRooms.map(r => (
                <Marker 
                  key={r.id} position={[r.lat, r.lng]} 
                  icon={createPriceIcon(r.price, selectedRoom?.id === r.id)}
                  eventHandlers={{
                    click: () => {
                      setSelectedRoom(r);
                      setSelectedPhuong(r.phuong);
                    }
                  }}
                />
              ))}
            </MapContainer>
          </div>

          {/* Mobile Overlay Quick Card (if room selected) */}
          <AnimatePresence>
            {selectedRoom && viewMode === 'map' && (
              <motion.div 
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                className="lg:hidden absolute bottom-6 left-4 right-4 z-50 bg-[#0d1117] border border-white/10 rounded-[28px] p-5 shadow-2xl flex items-center gap-4 border-b-4 border-b-primary"
              >
                <div className="bg-primary/10 w-14 h-14 rounded-2xl flex items-center justify-center border border-primary/20 shrink-0">
                  <Home className="text-primary w-7 h-7" />
                </div>
                <div className="flex-1 truncate">
                  <h4 className="font-black text-sm uppercase italic truncate">{selectedRoom.phuong}</h4>
                  <p className="text-accent font-black text-xl italic">{selectedRoom.price.toLocaleString()}đ</p>
                </div>
                <button 
                  onClick={() => setSelectedRoom(null)}
                  className="p-2 bg-white/5 rounded-full"
                >
                  <X size={18} className="text-white/30" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* List Side Section */}
        <section className={cn(
          "w-full lg:w-96 lg:border-l lg:border-white/5 bg-[#05070a] flex flex-col transition-all duration-500 overflow-hidden",
          viewMode === 'map' ? 'hidden lg:flex' : 'flex'
        )}>
          <div className="p-6 pb-2 border-b border-white/5 flex items-center justify-between shrink-0">
            <h2 className="text-[10px] font-black text-white/30 uppercase tracking-[2px] flex items-center gap-2">
              <ListIcon className="w-3 h-3" /> {filteredRooms.length} Phòng khả dụng
            </h2>
            <div className="flex gap-1">
              <span className="w-1 h-1 rounded-full bg-primary" />
              <span className="w-1 h-1 rounded-full bg-accent" />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto no-scrollbar space-y-3 p-6 pb-40">
            {filteredRooms.map((r, i) => (
              <motion.div
                key={r.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                onClick={() => {
                  setSelectedRoom(r);
                  setSelectedPhuong(r.phuong);
                  if (window.innerWidth < 1024) setViewMode('map');
                }}
                className={cn(
                  "bg-[#101318] border p-5 rounded-2xl cursor-pointer transition-all group relative overflow-hidden",
                  selectedRoom?.id === r.id ? "border-primary bg-primary/[0.03]" : "border-white/5 hover:border-primary/20"
                )}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="text-[13px] font-black tracking-tight group-hover:text-primary transition-colors">{r.phuong}</span>
                  {i < 3 && <span className="text-[8px] font-black text-accent bg-accent/5 px-2 py-0.5 rounded border border-accent/20">PREMIUM</span>}
                </div>
                <div className="flex justify-between items-end mt-4">
                  <div className="flex flex-col">
                    <span className="text-2xl font-black text-accent italic leading-none">{r.price.toLocaleString()}đ</span>
                    <span className="text-[9px] font-bold text-white/20 uppercase mt-1 tracking-tighter">{r.dist}km từ trung tâm</span>
                  </div>
                  <div className="text-[10px] font-bold text-white/20">{r.area}m²</div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Global Detail Card Overlay (Desktop & Mobile Tablet) */}
        <AnimatePresence>
          {selectedRoom && (
            <motion.div
              initial={{ y: 200, opacity: 0, scale: 0.9 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 200, opacity: 0, scale: 0.9 }}
              className="hidden md:flex absolute bottom-8 left-1/2 -translate-x-1/2 w-[90%] max-w-5xl z-50 px-10 py-8 bg-[#0d1117] border border-white/10 rounded-[32px] shadow-[0_40px_120px_-20px_rgba(0,0,0,0.9)] backdrop-blur-3xl items-center justify-between border-t-4 border-t-primary"
            >
              <div className="flex items-center gap-8">
                <div className="bg-primary/10 w-20 h-20 rounded-[28px] flex items-center justify-center border border-primary/20 shadow-inner overflow-hidden shrink-0">
                  <Home className="text-primary w-10 h-10 drop-shadow-[0_0_15px_rgba(0,102,255,0.4)]" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white tracking-tight italic mb-1 uppercase drop-shadow-sm">{selectedRoom.phuong}</h3>
                  <div className="flex items-center gap-6 mt-2">
                    <span className="flex items-center gap-2 text-xs font-bold text-white/40">
                      <MapPin className="w-4 h-4 text-primary" /> {selectedRoom.dist}km
                    </span>
                    <span className="flex items-center gap-2 text-xs font-bold text-white/40">
                      <Layers className="w-4 h-4 text-primary" /> {selectedRoom.area}m²
                    </span>
                    <span className={cn(
                      "flex items-center gap-2 text-xs font-black px-3 py-1 rounded-lg border",
                      selectedRoom.parking ? "text-primary border-primary/20 bg-primary/5" : "text-white/10"
                    )}>
                      <Car className="w-4 h-4" /> Bãi xe rộng
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-10">
                <div className="text-right">
                  <p className="text-[10px] font-black text-white/30 uppercase tracking-[3px] mb-1">Giá thuê đề xuất</p>
                  <p className="text-4xl font-black text-accent italic tracking-tighter drop-shadow-sm leading-none">{selectedRoom.price.toLocaleString()}đ</p>
                </div>
                <div className="flex items-center gap-5">
                  <button className="bg-primary hover:bg-primary/80 text-white font-black px-10 py-5 rounded-[20px] shadow-2xl shadow-primary/30 transition-all active:scale-95 text-xs tracking-widest uppercase cursor-pointer border-none scale-110">
                    KẾT NỐI NGAY
                  </button>
                  <button 
                    onClick={() => setSelectedRoom(null)}
                    className="w-14 h-14 rounded-2xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all border border-white/10 group cursor-pointer"
                  >
                    <X className="w-6 h-6 text-white/30 group-hover:text-white transition-all" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .leaflet-container { background: #e5e3df !important; }
        .custom-div-icon { background: none !important; border: none !important; }
        input[type="range"] { -webkit-appearance: none; background: rgba(255, 255, 255, 0.05); }
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none; height: 16px; width: 16px; border-radius: 50%;
          background: #0066FF; cursor: pointer; border: 2px solid white;
          box-shadow: 0 4px 10px rgba(0, 102, 255, 0.4);
        }
      `}</style>
    </div>
  );
}
