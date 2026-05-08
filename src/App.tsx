/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

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
  Zap
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
const createPriceIcon = (price: number) => {
  return L.divIcon({
    className: 'custom-div-icon',
    html: `<div class="bg-primary text-white rounded-[6px] px-2 py-1 font-black text-[10px] shadow-[0_4px_15px_rgba(0,102,255,0.4)] border border-white/20 whitespace-nowrap">${(price / 1000000).toFixed(1)}Tr</div>`,
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
    <div className="flex h-screen bg-bg-dark overflow-hidden font-sans selection:bg-primary/30 text-white">
      {/* Sidebar */}
      <aside className="w-80 bg-[#0d1117] border-r border-white/5 p-6 flex flex-col gap-6 shrink-0 relative z-20">
        <div className="flex items-center gap-3">
          <div className="bg-primary w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
            <Home className="text-white w-5 h-5" />
          </div>
          <div>
            <h1 className="text-white font-black text-xl tracking-tight leading-none uppercase">
              NHÀ TỐT <span className="text-accent bg-accent/10 px-1.5 py-0.5 rounded text-[10px] ml-1 align-middle tracking-widest leading-normal">AI PRO</span>
            </h1>
          </div>
        </div>

        <div className="flex flex-col gap-5 overflow-y-auto no-scrollbar pb-6 [&::-webkit-scrollbar]:hidden">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-white/40 uppercase tracking-widest flex items-center gap-2">
              <Search className="w-3 h-3" /> Fuzzy Search Khu vực
            </label>
            <div className="relative">
              <input 
                type="text"
                placeholder="Tìm phường, quận..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-primary outline-none transition-all placeholder:text-white/20"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 hover:text-white transition-colors"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-white/40 uppercase tracking-widest flex items-center gap-2">
              <MapPin className="w-3 h-3" /> Vị trí tâm điểm
            </label>
            <select 
              value={selectedPhuong}
              onChange={(e) => setSelectedPhuong(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-primary outline-none appearance-none cursor-pointer hover:bg-white/10 transition-colors"
            >
              {filteredRooms.length > 0 ? (
                filteredRooms.map(r => (
                  <option key={r.id} value={r.phuong} className="bg-[#161b22] text-white tracking-wide">{r.phuong}</option>
                ))
              ) : (
                <option className="bg-[#161b22] text-white">Không có kết quả</option>
              )}
            </select>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center text-[10px] font-black text-white/40 uppercase tracking-widest">
              <span className="flex items-center gap-2"><Navigation className="w-3 h-3" /> Bán kính tối ưu</span>
              <span className="text-accent">{radius}km</span>
            </div>
            <input 
              type="range" 
              min="0.5" 
              max="5.0" 
              step="0.1" 
              value={radius} 
              onChange={(e) => setRadius(parseFloat(e.target.value))}
              className="w-full accent-primary h-1.5 bg-white/5 rounded-full cursor-pointer hover:accent-accent transition-all" 
            />
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center text-[10px] font-black text-white/40 uppercase tracking-widest">
              <span className="flex items-center gap-2"><Settings2 className="w-3 h-3" /> Diện tích yêu cầu</span>
              <span className="text-accent">{areaReq}m²</span>
            </div>
            <input 
              type="range" 
              min="10" 
              max="100" 
              step="1" 
              value={areaReq} 
              onChange={(e) => setAreaReq(parseInt(e.target.value))}
              className="w-full accent-primary h-1.5 bg-white/5 rounded-full cursor-pointer hover:accent-accent transition-all" 
            />
          </div>

          <div className="space-y-3">
            <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Tiện ích ưu tiên</p>
            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={() => setAc(!ac)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2.5 rounded-xl border text-[11px] font-bold transition-all",
                  ac ? "bg-primary/20 border-primary text-primary" : "bg-white/5 border-white/5 text-white/40"
                )}
              >
                <Wind className="w-3 h-3" /> Máy lạnh
              </button>
              <button 
                onClick={() => setWc(!wc)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2.5 rounded-xl border text-[11px] font-bold transition-all",
                  wc ? "bg-primary/20 border-primary text-primary" : "bg-white/5 border-white/5 text-white/40"
                )}
              >
                <Bath className="w-3 h-3" /> WC riêng
              </button>
              <button 
                onClick={() => setPk(!pk)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2.5 rounded-xl border text-[11px] font-bold transition-all",
                  pk ? "bg-primary/20 border-primary text-primary" : "bg-white/5 border-white/5 text-white/40"
                )}
              >
                <Car className="w-3 h-3" /> Chỗ để xe
              </button>
              <button 
                onClick={() => setFt(!ft)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2.5 rounded-xl border text-[11px] font-bold transition-all",
                  ft ? "bg-primary/20 border-primary text-primary" : "bg-white/5 border-white/5 text-white/40"
                )}
              >
                <Clock className="w-3 h-3" /> Giờ tự do
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative bg-[#05070a]">
        <div className="flex-1 flex p-6 gap-6 overflow-hidden">
          {/* Map Section */}
          <div className="flex-[2.5] flex flex-col gap-6 overflow-hidden">
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-primary/5 border border-primary/20 rounded-[28px] p-5 backdrop-blur-xl relative overflow-hidden group shadow-2xl shrink-0"
            >
              <div className="absolute -top-4 -right-4 p-8 opacity-[0.03] pointer-events-none group-hover:scale-125 transition-transform duration-700">
                <Zap size={160} strokeWidth={1} className="text-white" />
              </div>
              
              <div className="relative z-10 flex justify-between items-center">
                <div>
                  <div className="text-[10px] font-black text-primary uppercase tracking-[2px] flex items-center gap-2">
                    <Zap className="w-3 h-3 fill-primary" /> AI Predicted Best Price
                  </div>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-5xl font-black text-white italic drop-shadow-sm tracking-tight">~{predPrice.toLocaleString()}đ</span>
                  </div>
                  <p className="text-[9px] font-bold text-white/40 uppercase mt-2 tracking-wide">Thuật toán Fuzzy weighting đang hoạt động tối ưu</p>
                </div>
                
                <div className="flex gap-8 border-l border-white/10 pl-8 h-full items-center">
                  <div className="text-center">
                    <p className="text-[8px] font-black text-white/30 uppercase tracking-widest mb-1">Surge</p>
                    <p className="text-accent font-black text-2xl">{surge.toFixed(1)}x</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[8px] font-black text-white/30 uppercase tracking-widest mb-1">Match</p>
                    <p className="text-white font-black text-2xl">98%</p>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <CheckCircle2 size={18} className="text-primary" />
                    <span className="text-[8px] font-black text-primary/60">PRO ACTIVE</span>
                  </div>
                </div>
              </div>
            </motion.div>

            <div className="flex-[4] rounded-[32px] overflow-hidden border border-white/5 shadow-2xl relative z-10">
              <MapContainer 
                center={centerCoords} 
                zoom={15} 
                style={{ height: '100%', width: '100%' }}
                zoomControl={false}
              >
                <ChangeView center={centerCoords} zoom={15} />
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                <Circle 
                  center={centerCoords}
                  radius={radius * 1000}
                  pathOptions={{ color: '#0066FF', fillColor: '#0066FF', fillOpacity: 0.08, weight: 1 }}
                />
                {filteredRooms.map(r => (
                  <Marker 
                    key={r.id} 
                    position={[r.lat, r.lng]} 
                    icon={createPriceIcon(r.price)}
                    eventHandlers={{
                      click: () => setSelectedRoom(r)
                    }}
                  >
                    <Popup className="custom-popup">
                      <div className="p-2 font-sans min-w-[120px]">
                        <p className="font-black text-xs text-[#101318] border-b border-gray-100 pb-1 mb-1">{r.phuong}</p>
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="text-gray-400 font-bold">{r.area}m²</span>
                          <span className="text-primary font-black">{r.price.toLocaleString()}đ</span>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
          </div>

          {/* List Section */}
          <div className="flex-1 flex flex-col gap-4 overflow-hidden">
            <div className="flex justify-between items-center px-1 text-white">
              <h2 className="text-[10px] font-black text-white/30 uppercase tracking-[2px] flex items-center gap-2">
                <Home className="w-3 h-3" /> Gợi ý hàng đầu
              </h2>
              <span className="text-[9px] font-black text-primary bg-primary/10 px-2 py-0.5 rounded tracking-tighter">
                {filteredRooms.length} PHÒNG HIỆN CÓ
              </span>
            </div>
            
            <div className="flex-1 overflow-y-auto no-scrollbar space-y-3 pb-24 [&::-webkit-scrollbar]:hidden">
              {filteredRooms.map((r, i) => (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => {
                    setSelectedRoom(r);
                    setSelectedPhuong(r.phuong);
                  }}
                  className={cn(
                    "bg-[#101318] border p-5 rounded-2xl cursor-pointer transition-all group relative overflow-hidden",
                    selectedRoom?.id === r.id 
                      ? "border-primary ring-1 ring-primary/40 shadow-xl shadow-primary/5 bg-primary/[0.02]" 
                      : "border-white/5 hover:border-primary/50 hover:bg-white/[0.03]"
                  )}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex flex-col">
                      <span className="text-sm font-black text-white group-hover:text-primary transition-colors tracking-tight">{r.phuong}</span>
                      <span className="text-[9px] font-bold text-white/20 uppercase tracking-tighter mt-0.5">{r.dist}km từ trung tâm</span>
                    </div>
                    {i < 3 && (
                      <span className="bg-accent text-[#05070a] text-[8px] font-black px-1.5 py-0.5 rounded shadow-sm tracking-widest shadow-accent/20">MATCHED</span>
                    )}
                  </div>
                  
                  <div className="flex justify-between items-end mt-4">
                    <span className="text-2xl font-black text-accent tracking-tighter italic">{r.price.toLocaleString()}đ</span>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-bold text-white/20">{r.area}m²</span>
                      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all shadow-lg shadow-black/20">
                        <ExternalLink className={cn("w-3.5 h-3.5", selectedRoom?.id === r.id ? "text-primary group-hover:text-white" : "text-white/20")} />
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
              {filteredRooms.length === 0 && (
                <div className="text-center py-12">
                  <Search className="w-12 h-12 text-white/5 mx-auto mb-4" />
                  <p className="text-xs font-bold text-white/20 uppercase tracking-widest">Không tìm thấy phòng phù hợp</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Overlay Info Card */}
        <AnimatePresence>
          {selectedRoom && (
            <motion.div
              initial={{ y: 150, opacity: 0, scale: 0.95 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 150, opacity: 0, scale: 0.95 }}
              className="absolute bottom-8 left-1/2 -translate-x-1/2 w-[92%] max-w-5xl z-50 px-10 py-8 bg-[#0d1117] border border-white/10 rounded-[32px] shadow-[0_30px_100px_rgba(0,0,0,0.9)] backdrop-blur-3xl flex items-center justify-between overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-1.5 h-full bg-primary" />
              
              <div className="flex items-center gap-8">
                <div className="bg-primary/10 w-20 h-20 rounded-[24px] flex items-center justify-center border border-primary/20 shadow-inner group overflow-hidden shrink-0">
                  <motion.div 
                    animate={{ y: [0, -5, 0] }} 
                    transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                  >
                    <Home className="text-primary w-10 h-10 drop-shadow-[0_0_10px_rgba(0,102,255,0.4)]" />
                  </motion.div>
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white tracking-tight italic mb-1 uppercase leading-none">{selectedRoom.phuong}</h3>
                  <div className="flex items-center gap-6 mt-2">
                    <span className="flex items-center gap-2 text-xs font-bold text-white/40">
                      <MapPin className="w-4 h-4 text-primary" /> {selectedRoom.dist}km từ trung tâm
                    </span>
                    <span className="flex items-center gap-2 text-xs font-bold text-white/40">
                      <Settings2 className="w-4 h-4 text-primary" /> {selectedRoom.area}m² diện tích
                    </span>
                    <span className={cn(
                      "flex items-center gap-2 text-xs font-black px-3 py-1 rounded-lg border",
                      selectedRoom.parking ? "text-primary border-primary/20 bg-primary/5" : "text-white/10 border-white/5"
                    )}>
                      <Car className="w-4 h-4" /> {selectedRoom.parking ? 'Có bãi xe rộng' : 'Hạn chế chỗ đậu'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-10">
                <div className="text-right">
                  <p className="text-[10px] font-black text-white/30 uppercase tracking-[3px] mb-1">Giá thuê hàng tháng</p>
                  <p className="text-4xl font-black text-accent italic tracking-tighter drop-shadow-sm leading-none">{selectedRoom.price.toLocaleString()}đ</p>
                </div>
                
                <div className="flex items-center gap-5">
                  <button className="bg-primary hover:bg-primary/80 text-white font-black px-10 py-5 rounded-[20px] shadow-2xl shadow-primary/30 transition-all active:scale-95 text-sm tracking-[1px] uppercase group cursor-pointer border-none">
                    <span className="group-hover:scale-105 inline-block transition-transform">KẾT NỐI NGAY</span>
                  </button>
                  <button 
                    onClick={() => setSelectedRoom(null)}
                    className="w-14 h-14 rounded-2xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all border border-white/10 group shadow-lg cursor-pointer"
                  >
                    <X className="w-6 h-6 text-white/30 group-hover:text-white group-hover:rotate-90 transition-all" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .leaflet-container {
          background: #e5e3df !important;
        }
        .custom-div-icon {
          background: none !important;
          border: none !important;
        }
        .leaflet-popup-content-wrapper {
          background: white !important;
          border-radius: 12px !important;
          padding: 4px !important;
          box-shadow: 0 10px 30px rgba(0,0,0,0.15) !important;
        }
        .leaflet-popup-tip {
          background: white !important;
        }
        input[type="range"] {
          -webkit-appearance: none;
          background: rgba(255, 255, 255, 0.05);
        }
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: #0066FF;
          cursor: pointer;
          border: 2px solid #0d1117;
          box-shadow: 0 0 10px rgba(0, 102, 255, 0.5);
        }
      `}</style>
    </div>
  );
}
