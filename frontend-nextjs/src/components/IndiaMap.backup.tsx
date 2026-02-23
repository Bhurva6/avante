'use client';

import React, { useState, useMemo, useRef } from 'react';
import { ZoomIn, ZoomOut, Maximize2, Minimize2, Layers, MapPin, Navigation, Search, X } from 'lucide-react';

// India state coordinates (approximate centers for pins)
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
  'ANDAMAN AND NICOBAR': { lat: 11.7401, lng: 92.6586, name: 'Andaman & Nicobar' },
  'DADRA AND NAGAR HAVELI': { lat: 20.1809, lng: 73.0169, name: 'Dadra & Nagar Haveli' },
  'DAMAN AND DIU': { lat: 20.4283, lng: 72.8397, name: 'Daman & Diu' },
  'LAKSHADWEEP': { lat: 10.5667, lng: 72.6417, name: 'Lakshadweep' },
};

// Major Indian cities with coordinates
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
  'GHAZIABAD': { lat: 28.6692, lng: 77.4538, state: 'Uttar Pradesh' },
  'LUDHIANA': { lat: 30.9010, lng: 75.8573, state: 'Punjab' },
  'AGRA': { lat: 27.1767, lng: 78.0081, state: 'Uttar Pradesh' },
  'NASHIK': { lat: 19.9975, lng: 73.7898, state: 'Maharashtra' },
  'FARIDABAD': { lat: 28.4089, lng: 77.3178, state: 'Haryana' },
  'MEERUT': { lat: 28.9845, lng: 77.7064, state: 'Uttar Pradesh' },
  'RAJKOT': { lat: 22.3039, lng: 70.8022, state: 'Gujarat' },
  'VARANASI': { lat: 25.3176, lng: 82.9739, state: 'Uttar Pradesh' },
  'SRINAGAR': { lat: 34.0837, lng: 74.7973, state: 'Jammu and Kashmir' },
  'AURANGABAD': { lat: 19.8762, lng: 75.3433, state: 'Maharashtra' },
  'DHANBAD': { lat: 23.7957, lng: 86.4304, state: 'Jharkhand' },
  'AMRITSAR': { lat: 31.6340, lng: 74.8723, state: 'Punjab' },
  'NAVI MUMBAI': { lat: 19.0330, lng: 73.0297, state: 'Maharashtra' },
  'ALLAHABAD': { lat: 25.4358, lng: 81.8463, state: 'Uttar Pradesh' },
  'PRAYAGRAJ': { lat: 25.4358, lng: 81.8463, state: 'Uttar Pradesh' },
  'RANCHI': { lat: 23.3441, lng: 85.3096, state: 'Jharkhand' },
  'HOWRAH': { lat: 22.5958, lng: 88.2636, state: 'West Bengal' },
  'COIMBATORE': { lat: 11.0168, lng: 76.9558, state: 'Tamil Nadu' },
  'JABALPUR': { lat: 23.1815, lng: 79.9864, state: 'Madhya Pradesh' },
  'GWALIOR': { lat: 26.2183, lng: 78.1828, state: 'Madhya Pradesh' },
  'VIJAYAWADA': { lat: 16.5062, lng: 80.6480, state: 'Andhra Pradesh' },
  'JODHPUR': { lat: 26.2389, lng: 73.0243, state: 'Rajasthan' },
  'MADURAI': { lat: 9.9252, lng: 78.1198, state: 'Tamil Nadu' },
  'RAIPUR': { lat: 21.2514, lng: 81.6296, state: 'Chhattisgarh' },
  'KOTA': { lat: 25.2138, lng: 75.8648, state: 'Rajasthan' },
  'GUWAHATI': { lat: 26.1445, lng: 91.7362, state: 'Assam' },
  'CHANDIGARH': { lat: 30.7333, lng: 76.7794, state: 'Chandigarh' },
  'SOLAPUR': { lat: 17.6599, lng: 75.9064, state: 'Maharashtra' },
  'HUBLI': { lat: 15.3647, lng: 75.1240, state: 'Karnataka' },
  'TIRUCHIRAPPALLI': { lat: 10.7905, lng: 78.7047, state: 'Tamil Nadu' },
  'BAREILLY': { lat: 28.3670, lng: 79.4304, state: 'Uttar Pradesh' },
  'MYSORE': { lat: 12.2958, lng: 76.6394, state: 'Karnataka' },
  'MYSURU': { lat: 12.2958, lng: 76.6394, state: 'Karnataka' },
  'TIRUPPUR': { lat: 11.1085, lng: 77.3411, state: 'Tamil Nadu' },
  'GURGAON': { lat: 28.4595, lng: 77.0266, state: 'Haryana' },
  'GURUGRAM': { lat: 28.4595, lng: 77.0266, state: 'Haryana' },
  'ALIGARH': { lat: 27.8974, lng: 78.0880, state: 'Uttar Pradesh' },
  'JALANDHAR': { lat: 31.3260, lng: 75.5762, state: 'Punjab' },
  'BHUBANESWAR': { lat: 20.2961, lng: 85.8245, state: 'Odisha' },
  'SALEM': { lat: 11.6643, lng: 78.1460, state: 'Tamil Nadu' },
  'WARANGAL': { lat: 17.9784, lng: 79.5941, state: 'Telangana' },
  'GUNTUR': { lat: 16.3067, lng: 80.4365, state: 'Andhra Pradesh' },
  'BHIWANDI': { lat: 19.2813, lng: 73.0633, state: 'Maharashtra' },
  'SAHARANPUR': { lat: 29.9680, lng: 77.5510, state: 'Uttar Pradesh' },
  'GORAKHPUR': { lat: 26.7606, lng: 83.3732, state: 'Uttar Pradesh' },
  'BIKANER': { lat: 28.0229, lng: 73.3119, state: 'Rajasthan' },
  'AMRAVATI': { lat: 20.9374, lng: 77.7796, state: 'Maharashtra' },
  'NOIDA': { lat: 28.5355, lng: 77.3910, state: 'Uttar Pradesh' },
  'JAMSHEDPUR': { lat: 22.8046, lng: 86.2029, state: 'Jharkhand' },
  'BHILAI': { lat: 21.2094, lng: 81.4285, state: 'Chhattisgarh' },
  'CUTTACK': { lat: 20.4625, lng: 85.8830, state: 'Odisha' },
  'FIROZABAD': { lat: 27.1591, lng: 78.3957, state: 'Uttar Pradesh' },
  'KOCHI': { lat: 9.9312, lng: 76.2673, state: 'Kerala' },
  'COCHIN': { lat: 9.9312, lng: 76.2673, state: 'Kerala' },
  'NELLORE': { lat: 14.4426, lng: 79.9865, state: 'Andhra Pradesh' },
  'BHAVNAGAR': { lat: 21.7645, lng: 72.1519, state: 'Gujarat' },
  'DEHRADUN': { lat: 30.3165, lng: 78.0322, state: 'Uttarakhand' },
  'DURGAPUR': { lat: 23.5204, lng: 87.3119, state: 'West Bengal' },
  'ASANSOL': { lat: 23.6739, lng: 86.9524, state: 'West Bengal' },
  'ROURKELA': { lat: 22.2604, lng: 84.8536, state: 'Odisha' },
  'NANDED': { lat: 19.1383, lng: 77.3210, state: 'Maharashtra' },
  'KOLHAPUR': { lat: 16.7050, lng: 74.2433, state: 'Maharashtra' },
  'AJMER': { lat: 26.4499, lng: 74.6399, state: 'Rajasthan' },
  'GULBARGA': { lat: 17.3297, lng: 76.8343, state: 'Karnataka' },
  'KALABURAGI': { lat: 17.3297, lng: 76.8343, state: 'Karnataka' },
  'JAMNAGAR': { lat: 22.4707, lng: 70.0577, state: 'Gujarat' },
  'UJJAIN': { lat: 23.1765, lng: 75.7885, state: 'Madhya Pradesh' },
  'LONI': { lat: 28.7512, lng: 77.2893, state: 'Uttar Pradesh' },
  'SILIGURI': { lat: 26.7271, lng: 88.6393, state: 'West Bengal' },
  'JHANSI': { lat: 25.4484, lng: 78.5685, state: 'Uttar Pradesh' },
  'ULHASNAGAR': { lat: 19.2215, lng: 73.1645, state: 'Maharashtra' },
  'JAMMU': { lat: 32.7266, lng: 74.8570, state: 'Jammu and Kashmir' },
  'SANGLI': { lat: 16.8524, lng: 74.5815, state: 'Maharashtra' },
  'MANGALORE': { lat: 12.9141, lng: 74.8560, state: 'Karnataka' },
  'MANGALURU': { lat: 12.9141, lng: 74.8560, state: 'Karnataka' },
  'ERODE': { lat: 11.3410, lng: 77.7172, state: 'Tamil Nadu' },
  'BELGAUM': { lat: 15.8497, lng: 74.4977, state: 'Karnataka' },
  'BELAGAVI': { lat: 15.8497, lng: 74.4977, state: 'Karnataka' },
  'AMBATTUR': { lat: 13.1143, lng: 80.1548, state: 'Tamil Nadu' },
  'TIRUNELVELI': { lat: 8.7139, lng: 77.7567, state: 'Tamil Nadu' },
  'MALEGAON': { lat: 20.5579, lng: 74.5089, state: 'Maharashtra' },
  'GAYA': { lat: 24.7955, lng: 85.0002, state: 'Bihar' },
  'UDAIPUR': { lat: 24.5854, lng: 73.7125, state: 'Rajasthan' },
  'MAHESHTALA': { lat: 22.5095, lng: 88.2640, state: 'West Bengal' },
  'DAVANAGERE': { lat: 14.4644, lng: 75.9218, state: 'Karnataka' },
  'KOZHIKODE': { lat: 11.2588, lng: 75.7804, state: 'Kerala' },
  'CALICUT': { lat: 11.2588, lng: 75.7804, state: 'Kerala' },
  'AKOLA': { lat: 20.7002, lng: 77.0082, state: 'Maharashtra' },
  'KURNOOL': { lat: 15.8281, lng: 78.0373, state: 'Andhra Pradesh' },
  'BOKARO': { lat: 23.6693, lng: 86.1511, state: 'Jharkhand' },
  'RAJAHMUNDRY': { lat: 16.9891, lng: 81.7840, state: 'Andhra Pradesh' },
  'BALLARI': { lat: 15.1394, lng: 76.9214, state: 'Karnataka' },
  'BELLARY': { lat: 15.1394, lng: 76.9214, state: 'Karnataka' },
  'AGARTALA': { lat: 23.8315, lng: 91.2868, state: 'Tripura' },
  'BHAGALPUR': { lat: 25.2425, lng: 87.0079, state: 'Bihar' },
  'LATUR': { lat: 18.4088, lng: 76.5604, state: 'Maharashtra' },
  'DHULE': { lat: 20.9042, lng: 74.7749, state: 'Maharashtra' },
  'KORBA': { lat: 22.3595, lng: 82.7501, state: 'Chhattisgarh' },
  'BHILWARA': { lat: 25.3407, lng: 74.6313, state: 'Rajasthan' },
  'BRAHMAPUR': { lat: 19.3150, lng: 84.7941, state: 'Odisha' },
  'MUZAFFARPUR': { lat: 26.1209, lng: 85.3647, state: 'Bihar' },
  'AHMEDNAGAR': { lat: 19.0948, lng: 74.7480, state: 'Maharashtra' },
  'MATHURA': { lat: 27.4924, lng: 77.6737, state: 'Uttar Pradesh' },
  'KOLLAM': { lat: 8.8932, lng: 76.6141, state: 'Kerala' },
  'AVADI': { lat: 13.1067, lng: 80.1009, state: 'Tamil Nadu' },
  'KADAPA': { lat: 14.4674, lng: 78.8241, state: 'Andhra Pradesh' },
  'ANANTAPUR': { lat: 14.6819, lng: 77.6006, state: 'Andhra Pradesh' },
  'KAMARHATI': { lat: 22.6762, lng: 88.3740, state: 'West Bengal' },
  'SAMBALPUR': { lat: 21.4669, lng: 83.9812, state: 'Odisha' },
  'BILASPUR': { lat: 22.0796, lng: 82.1391, state: 'Chhattisgarh' },
  'SHAHJAHANPUR': { lat: 27.8839, lng: 79.9058, state: 'Uttar Pradesh' },
  'SATARA': { lat: 17.6805, lng: 74.0183, state: 'Maharashtra' },
  'BIJAPUR': { lat: 16.8302, lng: 75.7100, state: 'Karnataka' },
  'VIJAYAPURA': { lat: 16.8302, lng: 75.7100, state: 'Karnataka' },
  'RAMPUR': { lat: 28.8019, lng: 79.0250, state: 'Uttar Pradesh' },
  'SHIVAMOGGA': { lat: 13.9299, lng: 75.5681, state: 'Karnataka' },
  'SHIMOGA': { lat: 13.9299, lng: 75.5681, state: 'Karnataka' },
  'CHANDRAPUR': { lat: 19.9615, lng: 79.2961, state: 'Maharashtra' },
  'JUNAGADH': { lat: 21.5222, lng: 70.4579, state: 'Gujarat' },
  'THRISSUR': { lat: 10.5276, lng: 76.2144, state: 'Kerala' },
  'ALWAR': { lat: 27.5530, lng: 76.6346, state: 'Rajasthan' },
  'BARDHAMAN': { lat: 23.2324, lng: 87.8615, state: 'West Bengal' },
  'KULTI': { lat: 23.7281, lng: 86.8533, state: 'West Bengal' },
  'KAKINADA': { lat: 16.9891, lng: 82.2475, state: 'Andhra Pradesh' },
  'NIZAMABAD': { lat: 18.6725, lng: 78.0941, state: 'Telangana' },
  'PARBHANI': { lat: 19.2704, lng: 76.7697, state: 'Maharashtra' },
  'TUMKUR': { lat: 13.3379, lng: 77.1173, state: 'Karnataka' },
  'TUMAKURU': { lat: 13.3379, lng: 77.1173, state: 'Karnataka' },
  'KHAMMAM': { lat: 17.2473, lng: 80.1514, state: 'Telangana' },
  'OZHUKARAI': { lat: 11.9416, lng: 79.7711, state: 'Puducherry' },
  'BIHAR SHARIF': { lat: 25.1982, lng: 85.5239, state: 'Bihar' },
  'PANIPAT': { lat: 29.3909, lng: 76.9635, state: 'Haryana' },
  'DARBHANGA': { lat: 26.1542, lng: 85.8918, state: 'Bihar' },
  'BALLY': { lat: 22.6500, lng: 88.3400, state: 'West Bengal' },
  'AIZAWL': { lat: 23.7271, lng: 92.7176, state: 'Mizoram' },
  'DEWAS': { lat: 22.9623, lng: 76.0508, state: 'Madhya Pradesh' },
  'ICHALKARANJI': { lat: 16.6910, lng: 74.4594, state: 'Maharashtra' },
  'KARNAL': { lat: 29.6857, lng: 76.9905, state: 'Haryana' },
  'BATHINDA': { lat: 30.2110, lng: 74.9455, state: 'Punjab' },
  'JALNA': { lat: 19.8347, lng: 75.8816, state: 'Maharashtra' },
  'ELURU': { lat: 16.7107, lng: 81.0952, state: 'Andhra Pradesh' },
  'BARASAT': { lat: 22.7203, lng: 88.4803, state: 'West Bengal' },
  'KIRARI SULEMAN NAGAR': { lat: 28.7578, lng: 76.9966, state: 'Delhi' },
  'PURNIA': { lat: 25.7771, lng: 87.4753, state: 'Bihar' },
  'SATNA': { lat: 24.5672, lng: 80.8322, state: 'Madhya Pradesh' },
  'MAU': { lat: 25.9419, lng: 83.5611, state: 'Uttar Pradesh' },
  'SONIPAT': { lat: 28.9288, lng: 77.0913, state: 'Haryana' },
  'FARRUKHABAD': { lat: 27.3906, lng: 79.5820, state: 'Uttar Pradesh' },
  'SAGAR': { lat: 23.8388, lng: 78.7378, state: 'Madhya Pradesh' },
  'DURG': { lat: 21.1904, lng: 81.2849, state: 'Chhattisgarh' },
  'IMPHAL': { lat: 24.8170, lng: 93.9368, state: 'Manipur' },
  'RATLAM': { lat: 23.3341, lng: 75.0367, state: 'Madhya Pradesh' },
  'HAPUR': { lat: 28.7437, lng: 77.7628, state: 'Uttar Pradesh' },
  'ARRAH': { lat: 25.5549, lng: 84.6602, state: 'Bihar' },
  'KARIMNAGAR': { lat: 18.4386, lng: 79.1288, state: 'Telangana' },
  'ANANTAPURAM': { lat: 14.6819, lng: 77.6006, state: 'Andhra Pradesh' },
  'ETAWAH': { lat: 26.7856, lng: 79.0158, state: 'Uttar Pradesh' },
  'AMBERNATH': { lat: 19.1863, lng: 73.1918, state: 'Maharashtra' },
  'NORTH DUMDUM': { lat: 22.6574, lng: 88.4029, state: 'West Bengal' },
  'BHARATPUR': { lat: 27.2152, lng: 77.5030, state: 'Rajasthan' },
  'BEGUSARAI': { lat: 25.4182, lng: 86.1272, state: 'Bihar' },
  'NEW DELHI': { lat: 28.6139, lng: 77.2090, state: 'Delhi' },
  'GANDHIDHAM': { lat: 23.0753, lng: 70.1337, state: 'Gujarat' },
  'BARANAGAR': { lat: 22.6435, lng: 88.3767, state: 'West Bengal' },
  'TIRUVOTTIYUR': { lat: 13.1600, lng: 80.3000, state: 'Tamil Nadu' },
  'PONDICHERRY': { lat: 11.9416, lng: 79.8083, state: 'Puducherry' },
  'SIKAR': { lat: 27.6094, lng: 75.1398, state: 'Rajasthan' },
  'THOOTHUKUDI': { lat: 8.7642, lng: 78.1348, state: 'Tamil Nadu' },
  'TUTICORIN': { lat: 8.7642, lng: 78.1348, state: 'Tamil Nadu' },
  'REWA': { lat: 24.5362, lng: 81.2985, state: 'Madhya Pradesh' },
  'MIRZAPUR': { lat: 25.1460, lng: 82.5690, state: 'Uttar Pradesh' },
  'RAICHUR': { lat: 16.2120, lng: 77.3439, state: 'Karnataka' },
  'PALI': { lat: 25.7711, lng: 73.3234, state: 'Rajasthan' },
  'RAMAGUNDAM': { lat: 18.8048, lng: 79.4740, state: 'Telangana' },
  'SILCHAR': { lat: 24.8333, lng: 92.7789, state: 'Assam' },
  'HARIDWAR': { lat: 29.9457, lng: 78.1642, state: 'Uttarakhand' },
  'VIJAYANAGARAM': { lat: 18.1066, lng: 83.3956, state: 'Andhra Pradesh' },
  'TENALI': { lat: 16.2428, lng: 80.6400, state: 'Andhra Pradesh' },
  'NAGERCOIL': { lat: 8.1833, lng: 77.4119, state: 'Tamil Nadu' },
  'SRI GANGANAGAR': { lat: 29.9038, lng: 73.8772, state: 'Rajasthan' },
  'KARAWAL NAGAR': { lat: 28.7695, lng: 77.2930, state: 'Delhi' },
  'MANGO': { lat: 22.8260, lng: 86.2167, state: 'Jharkhand' },
  'THANJAVUR': { lat: 10.7870, lng: 79.1378, state: 'Tamil Nadu' },
  'BULANDSHAHR': { lat: 28.4070, lng: 77.8498, state: 'Uttar Pradesh' },
  'ULUBERIA': { lat: 22.4700, lng: 88.1100, state: 'West Bengal' },
  'MURWARA': { lat: 23.8388, lng: 80.3916, state: 'Madhya Pradesh' },
  'KATNI': { lat: 23.8388, lng: 80.3916, state: 'Madhya Pradesh' },
  'SAMBHAL': { lat: 28.5904, lng: 78.5718, state: 'Uttar Pradesh' },
  'SINGRAULI': { lat: 24.1990, lng: 82.6758, state: 'Madhya Pradesh' },
  'NADIAD': { lat: 22.6916, lng: 72.8634, state: 'Gujarat' },
  'SECUNDERABAD': { lat: 17.4399, lng: 78.4983, state: 'Telangana' },
  'NAIHATI': { lat: 22.8917, lng: 88.4217, state: 'West Bengal' },
  'YAMUNANAGAR': { lat: 30.1290, lng: 77.2674, state: 'Haryana' },
  'BIDHANNAGAR': { lat: 22.5958, lng: 88.4225, state: 'West Bengal' },
  'PALLAVARAM': { lat: 12.9675, lng: 80.1491, state: 'Tamil Nadu' },
  'BIDAR': { lat: 17.9133, lng: 77.5197, state: 'Karnataka' },
  'MUNGER': { lat: 25.3708, lng: 86.4716, state: 'Bihar' },
  'PANCHKULA': { lat: 30.6942, lng: 76.8606, state: 'Haryana' },
  'BURHANPUR': { lat: 21.3104, lng: 76.2301, state: 'Madhya Pradesh' },
  'RAURKELA INDUSTRIAL TOWNSHIP': { lat: 22.2604, lng: 84.8536, state: 'Odisha' },
  'KHARAGPUR': { lat: 22.3460, lng: 87.2320, state: 'West Bengal' },
  'DINDIGUL': { lat: 10.3624, lng: 77.9695, state: 'Tamil Nadu' },
  'GANDHINAGAR': { lat: 23.2156, lng: 72.6369, state: 'Gujarat' },
  'HOSPET': { lat: 15.2689, lng: 76.3909, state: 'Karnataka' },
  'HOSAPETE': { lat: 15.2689, lng: 76.3909, state: 'Karnataka' },
  'NANGLOI JAT': { lat: 28.6833, lng: 77.0667, state: 'Delhi' },
  'MALDA': { lat: 25.0108, lng: 88.1411, state: 'West Bengal' },
  'ENGLISH BAZAR': { lat: 25.0108, lng: 88.1411, state: 'West Bengal' },
  'ONGOLE': { lat: 15.5057, lng: 80.0499, state: 'Andhra Pradesh' },
  'DEOGHAR': { lat: 24.4855, lng: 86.6962, state: 'Jharkhand' },
  'CHAPRA': { lat: 25.7848, lng: 84.7463, state: 'Bihar' },
  'HALDIA': { lat: 22.0667, lng: 88.0698, state: 'West Bengal' },
  'KHANDWA': { lat: 21.8264, lng: 76.3528, state: 'Madhya Pradesh' },
  'MORENA': { lat: 26.5000, lng: 78.0000, state: 'Madhya Pradesh' },
  'AMROHA': { lat: 28.9044, lng: 78.4673, state: 'Uttar Pradesh' },
  'BHIND': { lat: 26.5645, lng: 78.7871, state: 'Madhya Pradesh' },
  'PORBANDAR': { lat: 21.6417, lng: 69.6293, state: 'Gujarat' },
  'BHUSAWAL': { lat: 21.0486, lng: 75.7828, state: 'Maharashtra' },
  'ORAI': { lat: 25.9917, lng: 79.4517, state: 'Uttar Pradesh' },
  'BAHRAICH': { lat: 27.5706, lng: 81.5938, state: 'Uttar Pradesh' },
  'VELLORE': { lat: 12.9165, lng: 79.1325, state: 'Tamil Nadu' },
  'MEHSANA': { lat: 23.5880, lng: 72.3693, state: 'Gujarat' },
  'RAIGANJ': { lat: 25.6217, lng: 88.1247, state: 'West Bengal' },
  'SIRSA': { lat: 29.5350, lng: 75.0283, state: 'Haryana' },
  'DANAPUR': { lat: 25.6000, lng: 85.0500, state: 'Bihar' },
  'SERAMPORE': { lat: 22.7500, lng: 88.3400, state: 'West Bengal' },
  'SULTAN PUR MAJRA': { lat: 28.6970, lng: 77.0842, state: 'Delhi' },
  'GUNA': { lat: 24.6481, lng: 77.3148, state: 'Madhya Pradesh' },
  'JAUNPUR': { lat: 25.7464, lng: 82.6837, state: 'Uttar Pradesh' },
  'PANVEL': { lat: 18.9894, lng: 73.1175, state: 'Maharashtra' },
  'SHIVPURI': { lat: 25.4258, lng: 77.6631, state: 'Madhya Pradesh' },
  'SURENDRANAGAR DUDHREJ': { lat: 22.7364, lng: 71.6258, state: 'Gujarat' },
  'UNNAO': { lat: 26.5393, lng: 80.4878, state: 'Uttar Pradesh' },
  'HUGLI CHINSURAH': { lat: 22.9000, lng: 88.3833, state: 'West Bengal' },
  'ALAPPUZHA': { lat: 9.4981, lng: 76.3388, state: 'Kerala' },
  'ALLEPPEY': { lat: 9.4981, lng: 76.3388, state: 'Kerala' },
  'KOTTAYAM': { lat: 9.5916, lng: 76.5222, state: 'Kerala' },
  'MACHILIPATNAM': { lat: 16.1875, lng: 81.1389, state: 'Andhra Pradesh' },
  'SHIMLA': { lat: 31.1048, lng: 77.1734, state: 'Himachal Pradesh' },
  'ADONI': { lat: 15.6279, lng: 77.2750, state: 'Andhra Pradesh' },
  'UDUPI': { lat: 13.3389, lng: 74.7451, state: 'Karnataka' },
  'KATIHAR': { lat: 25.5392, lng: 87.5719, state: 'Bihar' },
  'PRODDATUR': { lat: 14.7502, lng: 78.5481, state: 'Andhra Pradesh' },
  'MAHBUBNAGAR': { lat: 16.7488, lng: 77.9855, state: 'Telangana' },
  'SAHARSA': { lat: 25.8803, lng: 86.5979, state: 'Bihar' },
  'DIBRUGARH': { lat: 27.4728, lng: 94.9120, state: 'Assam' },
  'GANGTOK': { lat: 27.3389, lng: 88.6065, state: 'Sikkim' },
  'KOHIMA': { lat: 25.6751, lng: 94.1086, state: 'Nagaland' },
  'ITANAGAR': { lat: 27.0844, lng: 93.6053, state: 'Arunachal Pradesh' },
  'SHILLONG': { lat: 25.5788, lng: 91.8933, state: 'Meghalaya' },
  'PORT BLAIR': { lat: 11.6234, lng: 92.7265, state: 'Andaman and Nicobar' },
  'KAVARATTI': { lat: 10.5593, lng: 72.6358, state: 'Lakshadweep' },
  'SILVASSA': { lat: 20.2766, lng: 73.0166, state: 'Dadra and Nagar Haveli' },
  'DAMAN': { lat: 20.3974, lng: 72.8328, state: 'Daman and Diu' },
  'DIU': { lat: 20.7141, lng: 70.9875, state: 'Daman and Diu' },
};

// Format Indian currency
const formatIndianCurrency = (num: number): string => {
  if (num >= 10000000) {
    return `₹${(num / 10000000).toFixed(2)} Cr`;
  } else if (num >= 100000) {
    return `₹${(num / 100000).toFixed(2)} L`;
  } else if (num >= 1000) {
    return `₹${(num / 1000).toFixed(2)} K`;
  }
  return `₹${num.toFixed(2)}`;
};

interface StateData {
  name: string;
  value: number;
  quantity?: number;
}

interface CityData {
  name: string;
  value: number;
  state?: string;
}

interface IndiaMapProps {
  stateData: StateData[];
  cityData: CityData[];
  title?: string;
  viewMode?: 'state' | 'city';
  loading?: boolean;
}

// Convert lat/lng to SVG coordinates
const latLngToSvg = (lat: number, lng: number, width: number, height: number) => {
  // India bounds approximately: lat 8-37, lng 68-98
  const minLat = 6;
  const maxLat = 38;
  const minLng = 66;
  const maxLng = 100;
  
  const x = ((lng - minLng) / (maxLng - minLng)) * width;
  const y = height - ((lat - minLat) / (maxLat - minLat)) * height;
  
  return { x, y };
};

export const IndiaMap: React.FC<IndiaMapProps> = ({
  stateData,
  cityData,
  title = '🗺️ Geographic Revenue Distribution',
  viewMode = 'state',
  loading = false,
}) => {
  const [hoveredItem, setHoveredItem] = useState<{ name: string; value: number; x: number; y: number; state?: string } | null>(null);
  const [currentViewMode, setCurrentViewMode] = useState<'state' | 'city'>(viewMode);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<any>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  
  const baseWidth = 500;
  const baseHeight = 550;
  
  // Calculate max values for scaling
  const maxStateValue = useMemo(() => {
    return Math.max(...stateData.map(s => s.value), 1);
  }, [stateData]);
  
  const maxCityValue = useMemo(() => {
    return Math.max(...cityData.map(c => c.value), 1);
  }, [cityData]);

  // Get color based on value intensity
  const getColorIntensity = (value: number, maxValue: number, isState: boolean) => {
    const intensity = Math.min(value / maxValue, 1);
    if (isState) {
      // Blue shades for states
      if (intensity > 0.8) return { fill: '#1e40af', stroke: '#1e3a8a', opacity: 0.85 };
      if (intensity > 0.6) return { fill: '#2563eb', stroke: '#1d4ed8', opacity: 0.8 };
      if (intensity > 0.4) return { fill: '#3b82f6', stroke: '#2563eb', opacity: 0.75 };
      if (intensity > 0.2) return { fill: '#60a5fa', stroke: '#3b82f6', opacity: 0.7 };
      return { fill: '#93c5fd', stroke: '#60a5fa', opacity: 0.65 };
    } else {
      // Red/Orange shades for cities (like Google Maps markers)
      if (intensity > 0.8) return { fill: '#dc2626', stroke: '#b91c1c', opacity: 0.9 };
      if (intensity > 0.6) return { fill: '#ef4444', stroke: '#dc2626', opacity: 0.85 };
      if (intensity > 0.4) return { fill: '#f87171', stroke: '#ef4444', opacity: 0.8 };
      if (intensity > 0.2) return { fill: '#fca5a5', stroke: '#f87171', opacity: 0.75 };
      return { fill: '#fecaca', stroke: '#fca5a5', opacity: 0.7 };
    }
  };
  
  // Generate state pins
  const statePins = useMemo(() => {
    return stateData.map(state => {
      const normalizedName = state.name.toUpperCase().trim();
      const coords = INDIA_STATE_COORDS[normalizedName];
      
      if (!coords) return null;
      
      const { x, y } = latLngToSvg(coords.lat, coords.lng, baseWidth, baseHeight);
      const size = 10 + (state.value / maxStateValue) * 25;
      const colors = getColorIntensity(state.value, maxStateValue, true);
      
      return {
        ...state,
        x,
        y,
        size,
        displayName: coords.name,
        ...colors,
      };
    }).filter(Boolean);
  }, [stateData, maxStateValue]);
  
  // Generate city pins
  const cityPins = useMemo(() => {
    return cityData.map(city => {
      const normalizedName = city.name.toUpperCase().trim();
      const coords = INDIA_CITY_COORDS[normalizedName];
      
      if (!coords) return null;
      
      const { x, y } = latLngToSvg(coords.lat, coords.lng, baseWidth, baseHeight);
      const size = 6 + (city.value / maxCityValue) * 18;
      const colors = getColorIntensity(city.value, maxCityValue, false);
      
      return {
        ...city,
        x,
        y,
        size,
        stateName: coords.state,
        ...colors,
      };
    }).filter(Boolean);
  }, [cityData, maxCityValue]);

  // Filter pins based on search
  const filteredStatePins = useMemo(() => {
    if (!searchQuery) return statePins;
    return statePins.filter((pin: any) => 
      pin.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pin.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [statePins, searchQuery]);

  const filteredCityPins = useMemo(() => {
    if (!searchQuery) return cityPins;
    return cityPins.filter((pin: any) => 
      pin.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pin.stateName?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [cityPins, searchQuery]);

  // Zoom controls
  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.5));
  const handleResetView = () => { setZoom(1); setPan({ x: 0, y: 0 }); };

  // Toggle fullscreen
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    if (!isFullscreen) {
      setZoom(1.2);
    } else {
      setZoom(1);
      setPan({ x: 0, y: 0 });
    }
  };

  // Handle pin click
  const handlePinClick = (pin: any) => {
    setSelectedLocation(pin);
    // Center view on selected location
    const offsetX = (baseWidth / 2 - pin.x) * zoom;
    const offsetY = (baseHeight / 2 - pin.y) * zoom;
    setPan({ x: offsetX * 0.5, y: offsetY * 0.5 });
  };
  
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-center h-96 bg-gradient-to-b from-blue-50 to-green-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-3 text-sm text-gray-500">Loading map...</p>
          </div>
        </div>
      </div>
    );
  }

  const containerClass = isFullscreen 
    ? 'fixed inset-0 z-50 bg-white' 
    : 'relative bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden';
  
  return (
    <div className={containerClass} ref={mapContainerRef} style={{ minHeight: isFullscreen ? '100vh' : '550px' }}>
      {/* Top Bar - Google Maps Style */}
      <div className="absolute top-0 left-0 right-0 z-20 p-3 flex items-center gap-3">
        {/* Search Box */}
        <div className={`flex-1 max-w-md transition-all duration-200 ${showSearch ? 'opacity-100' : 'opacity-90'}`}>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder={`Search ${currentViewMode === 'state' ? 'states' : 'cities'}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setShowSearch(true)}
              className="w-full pl-10 pr-10 py-2.5 bg-white border-0 rounded-lg shadow-lg text-sm focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
            />
            {searchQuery && (
              <button
                onClick={() => { setSearchQuery(''); setShowSearch(false); }}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>
          
          {/* Search Results Dropdown */}
          {showSearch && searchQuery && (
            <div className="absolute top-full left-0 right-0 mt-1 max-w-md bg-white rounded-lg shadow-lg border border-gray-100 max-h-60 overflow-y-auto">
              {(currentViewMode === 'state' ? filteredStatePins : filteredCityPins).slice(0, 8).map((pin: any, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    handlePinClick(pin);
                    setShowSearch(false);
                  }}
                  className="w-full px-4 py-2.5 text-left hover:bg-gray-50 flex items-center gap-3 border-b border-gray-50 last:border-0"
                >
                  <MapPin className={`h-4 w-4 ${currentViewMode === 'state' ? 'text-blue-500' : 'text-red-500'}`} />
                  <div>
                    <div className="text-sm font-medium text-gray-900">{pin.displayName || pin.name}</div>
                    <div className="text-xs text-gray-500">{formatIndianCurrency(pin.value)}</div>
                  </div>
                </button>
              ))}
              {(currentViewMode === 'state' ? filteredStatePins : filteredCityPins).length === 0 && (
                <div className="px-4 py-3 text-sm text-gray-500 text-center">No results found</div>
              )}
            </div>
          )}
        </div>

        {/* View Toggle - Layers Button */}
        <div className="bg-white rounded-lg shadow-lg flex overflow-hidden">
          <button
            onClick={() => setCurrentViewMode('state')}
            className={`px-3 py-2 text-sm font-medium flex items-center gap-1.5 transition-colors ${
              currentViewMode === 'state'
                ? 'bg-blue-500 text-white'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Layers className="h-4 w-4" />
            States
          </button>
          <button
            onClick={() => setCurrentViewMode('city')}
            className={`px-3 py-2 text-sm font-medium flex items-center gap-1.5 transition-colors ${
              currentViewMode === 'city'
                ? 'bg-red-500 text-white'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <MapPin className="h-4 w-4" />
            Cities
          </button>
        </div>

        {/* Fullscreen Toggle */}
        <button
          onClick={toggleFullscreen}
          className="p-2.5 bg-white rounded-lg shadow-lg text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
          title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
        >
          {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </button>
      </div>

      {/* Map Container */}
      <div 
        className={`overflow-hidden bg-gradient-to-b from-sky-100 via-sky-50 to-emerald-50 ${isFullscreen ? 'h-screen pt-16' : 'h-[500px] pt-16'}`}
        onClick={() => { setShowSearch(false); setSelectedLocation(null); }}
      >
        {/* Grid pattern overlay for map feel */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }} />

        <svg
          viewBox={`0 0 ${baseWidth} ${baseHeight}`}
          className="w-full h-full"
          style={{ 
            transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
            transformOrigin: 'center center',
            transition: 'transform 0.3s ease-out'
          }}
        >
          {/* Map background with subtle water color */}
          <rect x="0" y="0" width={baseWidth} height={baseHeight} fill="transparent" />
          
          {/* Simplified India outline - cleaner Google Maps style */}
          <path
            d="M 140 80 
               Q 180 40, 220 50
               Q 260 30, 300 60
               Q 340 40, 380 70
               Q 400 100, 410 140
               Q 430 180, 420 220
               Q 440 260, 430 300
               Q 450 340, 440 380
               Q 460 420, 420 460
               Q 380 500, 340 490
               Q 300 510, 260 480
               Q 220 500, 180 470
               Q 140 490, 120 450
               Q 90 420, 100 380
               Q 80 340, 90 300
               Q 70 260, 80 220
               Q 60 180, 80 140
               Q 70 100, 100 80
               Q 120 60, 140 80
               Z"
            fill="#f0fdf4"
            stroke="#86efac"
            strokeWidth="2"
            opacity="0.9"
          />
          
          {/* State pins with Google Maps-like markers */}
          {currentViewMode === 'state' && filteredStatePins.map((pin: any, idx) => (
            <g 
              key={`state-${idx}`} 
              className="cursor-pointer"
              onClick={(e) => { e.stopPropagation(); handlePinClick(pin); }}
              onMouseEnter={() => {
                setHoveredItem({
                  name: pin.displayName || pin.name,
                  value: pin.value,
                  x: pin.x,
                  y: pin.y,
                });
              }}
              onMouseLeave={() => setHoveredItem(null)}
            >
              {/* Marker shadow */}
              <ellipse
                cx={pin.x}
                cy={pin.y + pin.size * 0.3}
                rx={pin.size * 0.6}
                ry={pin.size * 0.2}
                fill="rgba(0,0,0,0.15)"
              />
              {/* Main circle marker */}
              <circle
                cx={pin.x}
                cy={pin.y}
                r={pin.size}
                fill={pin.fill}
                stroke="white"
                strokeWidth="3"
                opacity={pin.opacity}
                className="transition-all duration-200 hover:opacity-100"
                style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }}
              />
              {/* Inner highlight */}
              <circle
                cx={pin.x - pin.size * 0.3}
                cy={pin.y - pin.size * 0.3}
                r={pin.size * 0.25}
                fill="rgba(255,255,255,0.4)"
              />
              {/* Revenue label for larger pins */}
              {pin.size > 18 && zoom >= 1 && (
                <text
                  x={pin.x}
                  y={pin.y + 4}
                  textAnchor="middle"
                  fontSize="8"
                  fill="white"
                  fontWeight="bold"
                  style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}
                >
                  {formatIndianCurrency(pin.value).replace('₹', '')}
                </text>
              )}
            </g>
          ))}
          
          {/* City pins with Google Maps-like red markers */}
          {currentViewMode === 'city' && filteredCityPins.map((pin: any, idx) => (
            <g 
              key={`city-${idx}`}
              className="cursor-pointer"
              onClick={(e) => { e.stopPropagation(); handlePinClick(pin); }}
              onMouseEnter={() => {
                setHoveredItem({
                  name: pin.name,
                  value: pin.value,
                  x: pin.x,
                  y: pin.y,
                  state: pin.stateName,
                });
              }}
              onMouseLeave={() => setHoveredItem(null)}
            >
              {/* Marker pin shape - like Google Maps */}
              <path
                d={`M ${pin.x} ${pin.y + pin.size * 1.5} 
                    C ${pin.x - pin.size * 0.8} ${pin.y + pin.size * 0.5}, ${pin.x - pin.size} ${pin.y - pin.size * 0.3}, ${pin.x} ${pin.y - pin.size}
                    C ${pin.x + pin.size} ${pin.y - pin.size * 0.3}, ${pin.x + pin.size * 0.8} ${pin.y + pin.size * 0.5}, ${pin.x} ${pin.y + pin.size * 1.5}
                    Z`}
                fill={pin.fill}
                stroke="white"
                strokeWidth="2"
                opacity={pin.opacity}
                className="transition-all duration-200 hover:opacity-100"
                style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}
              />
              {/* Inner circle */}
              <circle
                cx={pin.x}
                cy={pin.y}
                r={pin.size * 0.4}
                fill="white"
                opacity="0.9"
              />
            </g>
          ))}
        </svg>

        {/* Hover Tooltip - Google Maps style */}
        {hoveredItem && !selectedLocation && (
          <div
            className="absolute bg-white px-3 py-2 rounded-lg shadow-xl text-sm pointer-events-none z-30 border border-gray-100"
            style={{
              left: `${(hoveredItem.x / baseWidth) * 100}%`,
              top: `${(hoveredItem.y / baseHeight) * 100}%`,
              transform: `translate(-50%, calc(-100% - 20px)) scale(${1/zoom})`,
            }}
          >
            <div className="font-semibold text-gray-900">{hoveredItem.name}</div>
            {hoveredItem.state && <div className="text-xs text-gray-500">{hoveredItem.state}</div>}
            <div className="text-green-600 font-bold">{formatIndianCurrency(hoveredItem.value)}</div>
            {/* Tooltip arrow */}
            <div className="absolute left-1/2 bottom-0 transform -translate-x-1/2 translate-y-full">
              <div className="border-8 border-transparent border-t-white" style={{ filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.1))' }} />
            </div>
          </div>
        )}
      </div>

      {/* Zoom Controls - Google Maps Style (Bottom Right) */}
      <div className="absolute bottom-24 right-4 z-20 flex flex-col gap-1">
        <button
          onClick={handleZoomIn}
          className="p-2 bg-white rounded-t-lg shadow-lg text-gray-600 hover:text-gray-900 hover:bg-gray-50 border-b border-gray-100"
          title="Zoom in"
        >
          <ZoomIn className="h-5 w-5" />
        </button>
        <button
          onClick={handleZoomOut}
          className="p-2 bg-white shadow-lg text-gray-600 hover:text-gray-900 hover:bg-gray-50 border-b border-gray-100"
          title="Zoom out"
        >
          <ZoomOut className="h-5 w-5" />
        </button>
        <button
          onClick={handleResetView}
          className="p-2 bg-white rounded-b-lg shadow-lg text-gray-600 hover:text-gray-900 hover:bg-gray-50"
          title="Reset view"
        >
          <Navigation className="h-5 w-5" />
        </button>
      </div>

      {/* Selected Location Card - Google Maps Style (Bottom Left) */}
      {selectedLocation && (
        <div className="absolute bottom-4 left-4 right-4 md:right-auto md:w-80 z-20 bg-white rounded-xl shadow-xl overflow-hidden">
          <div className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-gray-900 text-lg">
                  {selectedLocation.displayName || selectedLocation.name}
                </h3>
                {selectedLocation.stateName && (
                  <p className="text-sm text-gray-500">{selectedLocation.stateName}</p>
                )}
              </div>
              <button
                onClick={() => setSelectedLocation(null)}
                className="p-1 hover:bg-gray-100 rounded-full"
              >
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-green-600">
                {formatIndianCurrency(selectedLocation.value)}
              </span>
              <span className="text-sm text-gray-500">revenue</span>
            </div>
            {selectedLocation.quantity && (
              <p className="text-sm text-gray-600 mt-1">
                {selectedLocation.quantity.toLocaleString('en-IN')} units sold
              </p>
            )}
          </div>
          {/* Progress bar showing relative revenue */}
          <div className="h-1 bg-gray-100">
            <div 
              className={`h-full ${currentViewMode === 'state' ? 'bg-blue-500' : 'bg-red-500'}`}
              style={{ 
                width: `${(selectedLocation.value / (currentViewMode === 'state' ? maxStateValue : maxCityValue)) * 100}%` 
              }}
            />
          </div>
        </div>
      )}

      {/* Legend - Google Maps Style (Bottom Right, above zoom) */}
      <div className="absolute bottom-4 right-4 z-10 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg px-3 py-2 text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className={`w-3 h-3 rounded-full ${currentViewMode === 'state' ? 'bg-blue-500' : 'bg-red-500'}`} />
            <span className="text-gray-600 font-medium">
              {currentViewMode === 'state' ? statePins.length : cityPins.length} {currentViewMode === 'state' ? 'States' : 'Cities'}
            </span>
          </div>
          <div className="text-gray-400">|</div>
          <span className="text-gray-500">Size = Revenue</span>
        </div>
      </div>

      {/* Scale indicator - Google Maps style */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10 text-xs text-gray-500 bg-white/80 px-2 py-1 rounded">
        Zoom: {Math.round(zoom * 100)}%
      </div>

      {/* Top Locations Mini-list (when not fullscreen) */}
      {!isFullscreen && !selectedLocation && (
        <div className="absolute bottom-4 left-4 z-10 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-3 w-56">
          <h4 className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
            <MapPin className={`h-3 w-3 ${currentViewMode === 'state' ? 'text-blue-500' : 'text-red-500'}`} />
            Top {currentViewMode === 'state' ? 'States' : 'Cities'}
          </h4>
          <div className="space-y-1.5">
            {(currentViewMode === 'state' ? stateData : cityData).slice(0, 5).map((item, idx) => (
              <div key={idx} className="flex justify-between items-center text-xs">
                <span className="text-gray-700 truncate flex-1">{idx + 1}. {item.name}</span>
                <span className="text-green-600 font-semibold ml-2">{formatIndianCurrency(item.value)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default IndiaMap;
