'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Layers, MapPin, Maximize2, Minimize2, X } from 'lucide-react';
import dynamic from 'next/dynamic';

const MapContainer = dynamic(() => import('react-leaflet').then((mod) => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then((mod) => mod.TileLayer), { ssr: false });
const CircleMarker = dynamic(() => import('react-leaflet').then((mod) => mod.CircleMarker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then((mod) => mod.Popup), { ssr: false });
const Tooltip = dynamic(() => import('react-leaflet').then((mod) => mod.Tooltip), { ssr: false });

const INDIA_STATE_COORDS: Record<string, { lat: number; lng: number; name: string }> = {
  'ANDHRA PRADESH': { lat: 15.9129, lng: 79.7400, name: 'Andhra Pradesh' },
  'ARUNACHAL PRADESH': { lat: 28.2180, lng: 94.7278, name: 'Arunachal Pradesh' },
  'ASSAM': { lat: 26.2006, lng: 92.9376, name: 'Assam' },
  'BIHAR': { lat: 25.0961, lng: 85.3131, name: 'Bihar' },
  'CHHATTISGARH': { lat: 21.2787, lng: 81.8661, name: 'Chhattisgarh' },
  'GOA': { lat: 15.2993, lng: 74.1240, name: 'Goa' },
  'GUJARAT': { lat: 22.2587, lng: 71.1924, name: 'Gujarat' },
  'HARYANA': { lat: 29.0588, lng: 76.0856, name: 'Haryana' },
  'HIMACHAL PRADESH': { lat: 31.1048, lng: 77.1734, name: 'Himachal Pradesh' },
  'JHARKHAND': { lat: 23.6102, lng: 85.2799, name: 'Jharkhand' },
  'KARNATAKA': { lat: 15.3173, lng: 75.7139, name: 'Karnataka' },
  'KERALA': { lat: 10.8505, lng: 76.2711, name: 'Kerala' },
  'MADHYA PRADESH': { lat: 22.9734, lng: 78.6569, name: 'Madhya Pradesh' },
  'MAHARASHTRA': { lat: 19.7515, lng: 75.7139, name: 'Maharashtra' },
  'MANIPUR': { lat: 24.6637, lng: 93.9063, name: 'Manipur' },
  'MEGHALAYA': { lat: 25.4670, lng: 91.3662, name: 'Meghalaya' },
  'MIZORAM': { lat: 23.1645, lng: 92.9376, name: 'Mizoram' },
  'NAGALAND': { lat: 26.1584, lng: 94.5624, name: 'Nagaland' },
  'ODISHA': { lat: 20.9517, lng: 85.0985, name: 'Odisha' },
  'PUNJAB': { lat: 31.1471, lng: 75.3412, name: 'Punjab' },
  'RAJASTHAN': { lat: 27.0238, lng: 74.2179, name: 'Rajasthan' },
  'SIKKIM': { lat: 27.5330, lng: 88.5122, name: 'Sikkim' },
  'TAMIL NADU': { lat: 11.1271, lng: 78.6569, name: 'Tamil Nadu' },
  'TELANGANA': { lat: 18.1124, lng: 79.0193, name: 'Telangana' },
  'TRIPURA': { lat: 23.9408, lng: 91.9882, name: 'Tripura' },
  'UTTAR PRADESH': { lat: 26.8467, lng: 80.9462, name: 'Uttar Pradesh' },
  'UTTARAKHAND': { lat: 30.0668, lng: 79.0193, name: 'Uttarakhand' },
  'WEST BENGAL': { lat: 22.9868, lng: 87.8550, name: 'West Bengal' },
  'DELHI': { lat: 28.7041, lng: 77.1025, name: 'Delhi' },
  'JAMMU AND KASHMIR': { lat: 33.7782, lng: 76.5762, name: 'Jammu & Kashmir' },
  'LADAKH': { lat: 34.1526, lng: 77.5771, name: 'Ladakh' },
  'PUDUCHERRY': { lat: 11.9416, lng: 79.8083, name: 'Puducherry' },
  'CHANDIGARH': { lat: 30.7333, lng: 76.7794, name: 'Chandigarh' },
};

const INDIA_CITY_COORDS: Record<string, { lat: number; lng: number; state: string }> = {
  'MUMBAI': { lat: 19.0760, lng: 72.8777, state: 'Maharashtra' },
  'DELHI': { lat: 28.6139, lng: 77.2090, state: 'Delhi' },
  'BANGALORE': { lat: 12.9716, lng: 77.5946, state: 'Karnataka' },
  'BENGALURU': { lat: 12.9716, lng: 77.5946, state: 'Karnataka' },
  'HYDERABAD': { lat: 17.3850, lng: 78.4867, state: 'Telangana' },
  'CHENNAI': { lat: 13.0827, lng: 80.2707, state: 'Tamil Nadu' },
  'KOLKATA': { lat: 22.5726, lng: 88.3639, state: 'West Bengal' },
  'AHMEDABAD': { lat: 23.0225, lng: 72.5714, state: 'Gujarat' },
  'PUNE': { lat: 18.5204, lng: 73.8567, state: 'Maharashtra' },
  'JAIPUR': { lat: 26.9124, lng: 75.7873, state: 'Rajasthan' },
  'LUCKNOW': { lat: 26.8467, lng: 80.9462, state: 'Uttar Pradesh' },
  'KANPUR': { lat: 26.4499, lng: 80.3319, state: 'Uttar Pradesh' },
  'NAGPUR': { lat: 21.1458, lng: 79.0882, state: 'Maharashtra' },
  'INDORE': { lat: 22.7196, lng: 75.8577, state: 'Madhya Pradesh' },
  'THANE': { lat: 19.2183, lng: 72.9781, state: 'Maharashtra' },
  'BHOPAL': { lat: 23.2599, lng: 77.4126, state: 'Madhya Pradesh' },
  'VISAKHAPATNAM': { lat: 17.6868, lng: 83.2185, state: 'Andhra Pradesh' },
  'PATNA': { lat: 25.5941, lng: 85.1376, state: 'Bihar' },
  'VADODARA': { lat: 22.3072, lng: 73.1812, state: 'Gujarat' },
  'LUDHIANA': { lat: 30.9010, lng: 75.8573, state: 'Punjab' },
  'AGRA': { lat: 27.1767, lng: 78.0081, state: 'Uttar Pradesh' },
  'NASHIK': { lat: 19.9975, lng: 73.7898, state: 'Maharashtra' },
  'RAJKOT': { lat: 22.3039, lng: 70.8022, state: 'Gujarat' },
  'VARANASI': { lat: 25.3176, lng: 82.9739, state: 'Uttar Pradesh' },
  'SRINAGAR': { lat: 34.0837, lng: 74.7973, state: 'Jammu and Kashmir' },
  'RANCHI': { lat: 23.3441, lng: 85.3096, state: 'Jharkhand' },
  'COIMBATORE': { lat: 11.0168, lng: 76.9558, state: 'Tamil Nadu' },
  'VIJAYAWADA': { lat: 16.5062, lng: 80.6480, state: 'Andhra Pradesh' },
  'MADURAI': { lat: 9.9252, lng: 78.1198, state: 'Tamil Nadu' },
  'RAIPUR': { lat: 21.2514, lng: 81.6296, state: 'Chhattisgarh' },
  'KOTA': { lat: 25.2138, lng: 75.8648, state: 'Rajasthan' },
  'GUWAHATI': { lat: 26.1445, lng: 91.7362, state: 'Assam' },
  'CHANDIGARH': { lat: 30.7333, lng: 76.7794, state: 'Chandigarh' },
  'HUBLI': { lat: 15.3647, lng: 75.1240, state: 'Karnataka' },
  'MYSORE': { lat: 12.2958, lng: 76.6394, state: 'Karnataka' },
  'GURGAON': { lat: 28.4595, lng: 77.0266, state: 'Haryana' },
  'BHUBANESWAR': { lat: 20.2961, lng: 85.8245, state: 'Odisha' },
  'NOIDA': { lat: 28.5355, lng: 77.3910, state: 'Uttar Pradesh' },
  'JAMSHEDPUR': { lat: 22.8046, lng: 86.2029, state: 'Jharkhand' },
  'KOCHI': { lat: 9.9312, lng: 76.2673, state: 'Kerala' },
  'DEHRADUN': { lat: 30.3165, lng: 78.0322, state: 'Uttarakhand' },
  'UDAIPUR': { lat: 24.5854, lng: 73.7125, state: 'Rajasthan' },
  'JAMMU': { lat: 32.7266, lng: 74.8570, state: 'Jammu and Kashmir' },
  'MANGALORE': { lat: 12.9141, lng: 74.8560, state: 'Karnataka' },
  'SHIMLA': { lat: 31.1048, lng: 77.1734, state: 'Himachal Pradesh' },
  'SURAT': { lat: 21.1702, lng: 72.8311, state: 'Gujarat' },
  'JODHPUR': { lat: 26.2389, lng: 73.0243, state: 'Rajasthan' },
  'AMRITSAR': { lat: 31.6340, lng: 74.8723, state: 'Punjab' },
  'AURANGABAD': { lat: 19.8762, lng: 75.3433, state: 'Maharashtra' },
  'THIRUVANANTHAPURAM': { lat: 8.5241, lng: 76.9366, state: 'Kerala' },
};

const formatIndianCurrency = (num: number): string => {
  if (num >= 10000000) return '₹' + (num / 10000000).toFixed(2) + ' Cr';
  if (num >= 100000) return '₹' + (num / 100000).toFixed(2) + ' L';
  if (num >= 1000) return '₹' + (num / 1000).toFixed(2) + ' K';
  return '₹' + num.toFixed(2);
};

interface StateData { name: string; value: number; quantity?: number; }
interface CityData { name: string; value: number; state?: string; }
interface IndiaMapProps { stateData: StateData[]; cityData: CityData[]; title?: string; loading?: boolean; }

function LeafletMapInner({ viewMode, statePins, cityPins, maxStateValue, maxCityValue, onSelectLocation }: any) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);
    setReady(true);
    return () => { if (link.parentNode) link.parentNode.removeChild(link); };
  }, []);

  if (!ready) return <div className="flex items-center justify-center h-full"><div className="animate-spin h-8 w-8 border-b-2 border-blue-600 rounded-full"></div></div>;

  const getColor = (value: number, maxValue: number, isState: boolean) => {
    const i = Math.min(value / maxValue, 1);
    if (isState) return i > 0.7 ? '#1d4ed8' : i > 0.4 ? '#3b82f6' : '#93c5fd';
    return i > 0.7 ? '#dc2626' : i > 0.4 ? '#ef4444' : '#fca5a5';
  };

  const getRadius = (value: number, maxValue: number, isState: boolean) => {
    const base = isState ? 12 : 8;
    const max = isState ? 30 : 20;
    return base + (value / maxValue) * (max - base);
  };

  return (
    <MapContainer center={[22.5, 82.5] as [number, number]} zoom={5} style={{ height: '100%', width: '100%' }} scrollWheelZoom={true}>
      <TileLayer attribution='OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {viewMode === 'state' && statePins.map((pin: any, idx: number) => (
        <CircleMarker key={'state-' + idx} center={[pin.lat, pin.lng] as [number, number]} radius={getRadius(pin.value, maxStateValue, true)} fillColor={getColor(pin.value, maxStateValue, true)} color="white" weight={2} opacity={1} fillOpacity={0.8} eventHandlers={{ click: () => onSelectLocation(pin) }}>
          <Tooltip direction="top" offset={[0, -10]} opacity={0.95}><div><strong>{pin.displayName}</strong><br/><span style={{color:'green'}}>{formatIndianCurrency(pin.value)}</span></div></Tooltip>
          <Popup><h3 style={{fontWeight:'bold',margin:0}}>{pin.displayName}</h3><p style={{color:'green',fontWeight:'bold',fontSize:'18px',margin:'4px 0'}}>{formatIndianCurrency(pin.value)}</p></Popup>
        </CircleMarker>
      ))}
      {viewMode === 'city' && cityPins.map((pin: any, idx: number) => (
        <CircleMarker key={'city-' + idx} center={[pin.lat, pin.lng] as [number, number]} radius={getRadius(pin.value, maxCityValue, false)} fillColor={getColor(pin.value, maxCityValue, false)} color="white" weight={2} opacity={1} fillOpacity={0.8} eventHandlers={{ click: () => onSelectLocation(pin) }}>
          <Tooltip direction="top" offset={[0, -10]} opacity={0.95}><div><strong>{pin.name}</strong><br/><small>{pin.stateName}</small><br/><span style={{color:'green'}}>{formatIndianCurrency(pin.value)}</span></div></Tooltip>
          <Popup><h3 style={{fontWeight:'bold',margin:0}}>{pin.name}</h3><p style={{color:'#666',margin:'2px 0',fontSize:'12px'}}>{pin.stateName}</p><p style={{color:'green',fontWeight:'bold',fontSize:'18px',margin:'4px 0'}}>{formatIndianCurrency(pin.value)}</p></Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}

export default function IndiaMap({ stateData, cityData, title = 'Geographic Revenue Distribution', loading = false }: IndiaMapProps) {
  const [viewMode, setViewMode] = useState<'state' | 'city'>('state');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<any>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => { setIsClient(true); }, []);

  const maxStateValue = useMemo(() => Math.max(...stateData.map(s => s.value), 1), [stateData]);
  const maxCityValue = useMemo(() => Math.max(...cityData.map(c => c.value), 1), [cityData]);

  const statePins = useMemo(() => stateData.map(state => {
    const coords = INDIA_STATE_COORDS[state.name.toUpperCase().trim()];
    if (!coords) return null;
    return { ...state, lat: coords.lat, lng: coords.lng, displayName: coords.name };
  }).filter(Boolean), [stateData]);

  const cityPins = useMemo(() => cityData.map(city => {
    const coords = INDIA_CITY_COORDS[city.name.toUpperCase().trim()];
    if (!coords) return null;
    return { ...city, lat: coords.lat, lng: coords.lng, stateName: coords.state };
  }).filter(Boolean), [cityData]);

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg">
          <div className="animate-spin h-10 w-10 border-b-2 border-blue-600 rounded-full"></div>
        </div>
      </div>
    );
  }

  const content = (
    <>
      <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-white">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <div className="flex items-center gap-2">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button onClick={() => setViewMode('state')} className={`px-3 py-1.5 text-sm font-medium rounded-md flex items-center gap-1.5 ${viewMode === 'state' ? 'bg-blue-500 text-white' : 'text-gray-600'}`}>
              <Layers className="h-3.5 w-3.5" />States
            </button>
            <button onClick={() => setViewMode('city')} className={`px-3 py-1.5 text-sm font-medium rounded-md flex items-center gap-1.5 ${viewMode === 'city' ? 'bg-red-500 text-white' : 'text-gray-600'}`}>
              <MapPin className="h-3.5 w-3.5" />Cities
            </button>
          </div>
          <button onClick={() => setIsFullscreen(!isFullscreen)} className="p-2 border border-gray-200 rounded-lg hover:bg-gray-100">
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
        </div>
      </div>
      <div className="flex">
        <div className="flex-1" style={{ height: isFullscreen ? 'calc(100vh - 70px)' : '500px' }}>
          {isClient ? (
            <LeafletMapInner viewMode={viewMode} statePins={statePins} cityPins={cityPins} maxStateValue={maxStateValue} maxCityValue={maxCityValue} onSelectLocation={setSelectedLocation} />
          ) : (
            <div className="flex items-center justify-center h-full bg-gray-100"><div className="animate-spin h-10 w-10 border-b-2 border-blue-600 rounded-full"></div></div>
          )}
        </div>
        <div className="w-64 border-l border-gray-100 bg-white p-4 overflow-y-auto" style={{ height: isFullscreen ? 'calc(100vh - 70px)' : '500px' }}>
          <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <MapPin className={`h-4 w-4 ${viewMode === 'state' ? 'text-blue-500' : 'text-red-500'}`} />
            Top {viewMode === 'state' ? 'States' : 'Cities'}
          </h4>
          <div className="space-y-2">
            {(viewMode === 'state' ? stateData : cityData).slice(0, 10).map((item, idx) => (
              <div key={idx} className="p-2 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer" onClick={() => {
                const pin = viewMode === 'state' ? statePins.find((p: any) => p?.name === item.name) : cityPins.find((p: any) => p?.name === item.name);
                if (pin) setSelectedLocation(pin);
              }}>
                <div className="flex justify-between"><span className="text-xs text-gray-600">#{idx + 1}</span><span className="text-xs font-bold text-green-600">{formatIndianCurrency(item.value)}</span></div>
                <div className="text-sm font-medium text-gray-900 truncate">{item.name}</div>
                <div className="mt-1 h-1 bg-gray-200 rounded-full"><div className={`h-full rounded-full ${viewMode === 'state' ? 'bg-blue-500' : 'bg-red-500'}`} style={{ width: `${(item.value / (viewMode === 'state' ? maxStateValue : maxCityValue)) * 100}%` }} /></div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Legend</h4>
            <div className="space-y-1 text-xs">
              <div className="flex items-center gap-2"><div className={`w-3 h-3 rounded-full ${viewMode === 'state' ? 'bg-blue-700' : 'bg-red-600'}`}></div><span>High Revenue</span></div>
              <div className="flex items-center gap-2"><div className={`w-3 h-3 rounded-full ${viewMode === 'state' ? 'bg-blue-400' : 'bg-red-400'}`}></div><span>Medium</span></div>
              <div className="flex items-center gap-2"><div className={`w-3 h-3 rounded-full ${viewMode === 'state' ? 'bg-blue-200' : 'bg-red-200'}`}></div><span>Low</span></div>
            </div>
          </div>
        </div>
      </div>
      {selectedLocation && (
        <div className="absolute bottom-4 left-4 bg-white rounded-xl shadow-xl p-4 z-[1000] w-72 border">
          <div className="flex justify-between">
            <div>
              <h3 className="font-bold text-gray-900">{selectedLocation.displayName || selectedLocation.name}</h3>
              {selectedLocation.stateName && <p className="text-xs text-gray-500">{selectedLocation.stateName}</p>}
            </div>
            <button onClick={() => setSelectedLocation(null)} className="p-1 hover:bg-gray-100 rounded-full"><X className="h-4 w-4 text-gray-400" /></button>
          </div>
          <div className="mt-2"><span className="text-2xl font-bold text-green-600">{formatIndianCurrency(selectedLocation.value)}</span><span className="text-sm text-gray-500 ml-1">revenue</span></div>
        </div>
      )}
    </>
  );

  if (isFullscreen) return <div className="fixed inset-0 z-50 bg-white">{content}</div>;
  return <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden relative">{content}</div>;
}
