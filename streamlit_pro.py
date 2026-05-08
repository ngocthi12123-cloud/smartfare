import streamlit as st
import pandas as pd
import folium
from streamlit_folium import folium_static
from folium.features import DivIcon
from fuzzywuzzy import process

# 1. CẤU HÌNH TRANG & CSS CAO CẤP
st.set_page_config(page_title="Nhà Tốt AI Pro", layout="wide")

st.markdown(\"\"\"
<style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
    
    html, body, [class*=\"css\"] {
        font-family: 'Inter', sans-serif;
        background-color: #05070a !important;
        color: #ffffff !important;
    }

    [data-testid=\"stSidebar\"] {
        background-color: #0d1117 !important;
        border-right: 1px solid rgba(255,255,255,0.05);
    }

    /* Thẻ AI Prediction */
    .ai-card {
        background: rgba(0, 102, 255, 0.1);
        border: 1px solid rgba(0, 102, 255, 0.3);
        border-radius: 24px;
        padding: 24px;
        margin-bottom: 24px;
        backdrop-filter: blur(10px);
    }
    
    .ai-title {
        color: #0066FF;
        font-weight: 900;
        text-transform: uppercase;
        font-size: 11px;
        letter-spacing: 2px;
    }

    .price-main {
        font-size: 42px;
        font-weight: 900;
        margin: 10px 0;
        color: #FFFFFF;
    }

    /* Danh sách trọ bên phải */
    .room-card {
        background: #101318;
        border: 1px solid rgba(255,255,255,0.05);
        border-radius: 16px;
        padding: 16px;
        margin-bottom: 12px;
        transition: all 0.2s ease;
        cursor: pointer;
    }
    .room-card:hover {
        border-color: #0066FF;
        background: rgba(255,255,255,0.02);
    }

    /* Thanh thông tin chi tiết phía dưới (Bottom Card) */
    .detail-overlay {
        position: fixed;
        bottom: 20px;
        left: 20%;
        right: 2%;
        background: #0d1117;
        border: 1px solid rgba(255,255,255,0.1);
        border-radius: 20px;
        padding: 20px 30px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        z-index: 1000;
        box-shadow: 0 20px 50px rgba(0,0,0,0.8);
        backdrop-filter: blur(20px);
    }

    .marker-bubble {
        background: #0066FF;
        color: white;
        border-radius: 6px;
        padding: 4px 8px;
        font-weight: 900;
        font-size: 10px;
        box-shadow: 0 4px 15px rgba(0,102,255,0.4);
        border: 1px solid rgba(255,255,255,0.2);
    }

    .stButton>button {
        width: 100%;
        background-color: transparent !important;
        border: none !important;
        padding: 0 !important;
        color: inherit !important;
    }
</style>
\"\"\", unsafe_allow_html=True)

# 2. DỮ LIỆU PHÒNG THỰC TẾ
if 'selected_room' not in st.session_state:
    st.session_state.selected_room = None

ROOMS = [
    {\"id\": 1, \"phuong\": \"Phường 14, Quận 10\", \"dist\": 0.5, \"area\": 20, \"price\": 4200000, \"lat\": 10.7714, \"lng\": 106.6601, \"parking\": True, \"free\": True},
    {\"id\": 2, \"phuong\": \"Phường 12, Quận 10\", \"dist\": 1.2, \"area\": 35, \"price\": 6800000, \"lat\": 10.7765, \"lng\": 106.6669, \"parking\": True, \"free\": True},
    {\"id\": 3, \"phuong\": \"Phường 13, Quận 10\", \"dist\": 0.6, \"area\": 22, \"price\": 5000000, \"lat\": 10.7781, \"lng\": 106.6710, \"parking\": True, \"free\": False},
    {\"id\": 4, \"phuong\": \"Phường 4, Quận 5\", \"dist\": 2.5, \"area\": 32, \"price\": 6000000, \"lat\": 10.7610, \"lng\": 106.6680, \"parking\": True, \"free\": True},
    {\"id\": 5, \"phuong\": \"Phường 1, Quận 5\", \"dist\": 3.2, \"area\": 24, \"price\": 4500000, \"lat\": 10.7550, \"lng\": 106.6750, \"parking\": False, \"free\": True},
    {\"id\": 6, \"phuong\": \"Phường 9, Quận 10\", \"dist\": 1.8, \"area\": 55, \"price\": 8000000, \"lat\": 10.7680, \"lng\": 106.6720, \"parking\": True, \"free\": True},
]

# 3. LOGIC DỰ ĐOÁN (FUZZY LOGIC)
def predict_price_fuzzy(area, dist, ac, wc, pk, ft):
    # Fuzzy Weighting
    w_area = 1.0 if area < 20 else (1.2 if area < 40 else 1.5)
    w_dist = 1.3 if dist < 1.0 else (1.1 if dist < 2.5 else 0.9)
    
    base = 3500000 * w_area * w_dist
    
    if ac: base += 500000
    if wc: base += 400000
    if pk: base += 200000
    if ft: base += 300000
    
    return int(base), w_dist

# 4. SIDEBAR
st.sidebar.markdown(\"\"\"
<div style='display:flex; align-items:center; gap:12px; margin-bottom:40px; padding: 10px 0;'>
    <div style='background:#0066FF; width:42px; height:42px; border-radius:12px; display:flex; align-items:center; justify-content:center; box-shadow: 0 4px 15px rgba(0,102,255,0.3);'>🏠</div>
    <div>
        <h2 style='margin:0; font-weight:900; letter-spacing:-1.5px; font-size: 24px;'>NHÀ TỐT</h2>
        <span style='color:#FFD700; font-size:10px; font-weight:900; letter-spacing: 2px;'>AI PRO VERSION</span>
    </div>
</div>
\"\"\", unsafe_allow_html=True)

# Fuzzy Search Input
search_query = st.sidebar.text_input(\"🔍 Fuzzy Search Khu vực\", \"Quận 10\")
all_phuongs = list(set([r['phuong'] for r in ROOMS]))
fuzzy_results = process.extract(search_query, all_phuongs, limit=3)
selected_phuong = fuzzy_results[0][0] if fuzzy_results else all_phuongs[0]

# Sidebar Controls
radius = st.sidebar.slider(\"Bán kính tối ưu (km)\", 0.5, 5.0, 2.0)
area_req = st.sidebar.slider(\"Diện tích yêu cầu (m²)\", 10, 100, 25)

st.sidebar.markdown(\"<p style='font-size:10px; font-weight:900; opacity:0.4; text-transform:uppercase; margin-top: 20px;'>Tiện ích ưu tiên</p>\", unsafe_allow_html=True)
col_a, col_b = st.sidebar.columns(2)
ac = col_a.checkbox(\"Máy lạnh\", True)
wc = col_b.checkbox(\"WC riêng\", True)
pk = col_a.checkbox(\"Chỗ để xe\", True)
ft = col_b.checkbox(\"Giờ tự do\", True)

# 5. MAIN INTERFACE
p_val, surge = predict_price_fuzzy(area_req, radius, ac, wc, pk, ft)

col_viz, col_list = st.columns([2.5, 1], gap=\"large\")

with col_viz:
    # AI Prediction Card
    st.markdown(f\"\"\"
    <div class=\"ai-card\">
        <div style=\"display:flex; justify-content:space-between; align-items:start;\">
            <div>
                <div class=\"ai-title\">✨ AI Predicted Price</div>
                <div class=\"price-main\">~{p_val:,}đ</div>
                <p style=\"color:rgba(255,255,255,0.4); font-size:11px; margin-top:-5px;\">GIÁ THUÊ ĐỀ XUẤT TỐI ƯU CỦA HỆ THỐNG</p>
            </div>
            <div style=\"text-align:right;\">
                <div style=\"background:#0066FF; color:white; padding:4px 10px; border-radius:8px; font-size:10px; font-weight:900;\">FUZZY LOGIC ACTIVE</div>
                <div style=\"color:#FFD700; font-weight:900; font-size:24px; margin-top:10px;\">{surge:.1f}x</div>
                <div style=\"font-size:8px; opacity:0.5;\">DEMAND SURGE</div>
            </div>
        </div>
    </div>
    \"\"\", unsafe_allow_html=True)

    # Map with Google Maps vibe Colors
    center = next(r for r in ROOMS if r['phuong'] == selected_phuong)
    m = folium.Map(location=[center['lat'], center['lng']], zoom_start=15, tiles=\"OpenStreetMap\", zoom_control=False)
    
    folium.Circle([center['lat'], center['lng']], radius=radius*1000, color='#0066FF', fill=True, fill_opacity=0.08, weight=1).add_to(m)

    for r in ROOMS:
        folium.Marker(
            [r['lat'], r['lng']],
            icon=DivIcon(icon_size=(40,20), icon_anchor=(20,10),
            html=f'<div class=\"marker-bubble\">{(r[\"price\"]/1000000):.1f}Tr</div>'),
            popup=f\"<b>{r['phuong']}</b><br>{r['price']:,}đ\"
        ).add_to(m)
    
    folium_static(m, width=900, height=550)

with col_list:
    st.markdown(\"<p style='font-size:10px; font-weight:900; opacity:0.4; text-transform:uppercase; letter-spacing:1px; margin-bottom:15px;'>🏠 Hợp nhất với bạn</p>\", unsafe_allow_html=True)
    
    sorted_rooms = sorted(ROOMS, key=lambda x: abs(x['dist'] - radius))
    
    for r in sorted_rooms:
        card_id = f\"card_{r['id']}\"
        if st.button(f\"{r['phuong']}\", key=f\"btn_{r['id']}\"):
            st.session_state.selected_room = r
            
        st.markdown(f\"\"\"
        <div class=\"room-card\">
            <div style=\"display:flex; justify-content:space-between; margin-bottom:8px;\">
                <span style=\"font-size:13px; font-weight:900; color:#0066FF;\">PHÒNG HIỆN CÓ</span>
                <span style=\"background:#FFD700; color:black; font-size:8px; font-weight:900; padding:2px 6px; border-radius:4px;\">MATCHED</span>
            </div>
            <div style=\"margin-bottom:10px;\">
                <div style=\"font-size:11px; opacity:0.6;\">{r['phuong']}</div>
            </div>
            <div style=\"display:flex; justify-content:space-between; align-items:flex-end;\">
                <span style=\"color:#FFD700; font-weight:900; font-size:20px;\">{r['price']:,}đ</span>
                <span style=\"opacity:0.4; font-size:10px; font-weight:bold;\">{r['area']}m² • {r['dist']}km</span>
            </div>
        </div>
        \"\"\", unsafe_allow_html=True)

# 6. OVERLAY CHI TIẾT
if st.session_state.selected_room:
    room = st.session_state.selected_room
    st.markdown(f\"\"\"
    <div class=\"detail-overlay\">
        <div style=\"display:flex; align-items:center; gap:25px;\">
            <div style=\"background:rgba(0,102,255,0.1); width:50px; height:50px; border-radius:14px; display:flex; align-items:center; justify-content:center; border:1px solid rgba(0,102,255,0.3);\">🏢</div>
            <div>
                <h4 style=\"margin:0; font-weight:900; font-size:18px;\">{room['phuong']}</h4>
                <p style=\"margin:0; font-size:13px; opacity:0.5;\">📏 {room['area']}m² • 📍 {room['dist']}km • {'🚗 Chỗ để xe rộng' if room['parking'] else '🚲 Chỉ để xe máy'}</p>
            </div>
        </div>
        <div style=\"display:flex; align-items:center; gap:40px;\">
            <div style=\"text-align:right;\">
                <p style=\"margin:0; font-size:10px; font-weight:900; opacity:0.3; text-transform:uppercase;\">Giá niêm yết</p>
                <p style=\"margin:0; color:#FFD700; font-weight:900; font-size:26px;\">{room['price']:,}đ</p>
            </div>
            <button style=\"background:#0066FF; color:white; border:none; padding:12px 30px; border-radius:14px; font-weight:900; cursor:pointer; box-shadow: 0 10px 30px rgba(0,102,255,0.3);\">KẾT NỐI NGAY</button>
        </div>
    </div>
    \"\"\", unsafe_allow_html=True)
