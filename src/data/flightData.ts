export interface Airport {
  code: string;
  name: string;
  latitude: number;
  longitude: number;
}

export interface Route {
  from: string;
  to: string;
  airline: string;
  distance: number;
}

export const airports: Airport[] = [
  { code: "AAP", name: "APT Pranoto (Samarinda)", latitude: 0.3785, longitude: 117.5680 },
  { code: "AMQ", name: "Pattimura (Ambon)", latitude: -3.7103, longitude: 128.0895 },
  { code: "ARD", name: "Mali Airport (Alor)", latitude: -8.1323, longitude: 124.5970 },
  { code: "BDJ", name: "Syamsudin Noor (Banjarmasin)", latitude: -3.4422, longitude: 114.7606 },
  { code: "BDO", name: "Husein Sastranegara (Bandung)", latitude: -6.9006, longitude: 107.5750 },
  { code: "BEJ", name: "Kalimarau (Berau)", latitude: 2.1555, longitude: 117.4336 },
  { code: "BIK", name: "Frans Kaisiepo (Biak)", latitude: -1.1900, longitude: 136.1080 },
  { code: "BJW", name: "Soa Airport (Bajawa)", latitude: -8.7075, longitude: 120.9953 },
  { code: "BMU", name: "Sultan Muhammad Salahuddin (Bima)", latitude: -8.5406, longitude: 118.6866 },
  { code: "BPN", name: "SAMS Sepinggan (Balikpapan)", latitude: -1.2681, longitude: 116.8947 },
  { code: "BKS", name: "Fatmawati Soekarno (Bengkulu)", latitude: -3.8637, longitude: 102.3400 },
  { code: "BTH", name: "Hang Nadim (Batam)", latitude: 1.1204, longitude: 104.1197 },
  { code: "BTJ", name: "Sultan Iskandar Muda (Banda Aceh)", latitude: 5.5235, longitude: 95.4203 },
  { code: "BWX", name: "Banyuwangi", latitude: -8.3100, longitude: 114.3400 },
  { code: "CGK", name: "Soekarno-Hatta (Jakarta)", latitude: -6.1256, longitude: 106.6559 },
  { code: "DJB", name: "Sultan Thaha (Jambi)", latitude: -1.6380, longitude: 103.6440 },
  { code: "DJJ", name: "Sentani (Jayapura)", latitude: -2.5760, longitude: 140.5160 },
  { code: "DOB", name: "Dobo Airport (Kepulauan Aru)", latitude: -5.7722, longitude: 134.2100 },
  { code: "DPS", name: "Ngurah Rai (Denpasar)", latitude: -8.7482, longitude: 115.1670 },
  { code: "DTB", name: "Sisingamangaraja XII (Silangit)", latitude: 2.2594, longitude: 98.9919 },
  { code: "ENE", name: "Haji Hasan Aroeboesman (Ende)", latitude: -8.8493, longitude: 121.6600 },
  { code: "FKQ", name: "Fakfak Airport", latitude: -2.9200, longitude: 132.2670 },
  { code: "GNS", name: "Binaka (Gunung Sitoli)", latitude: 1.1664, longitude: 97.7046 },
  { code: "GTO", name: "Djalaluddin (Gorontalo)", latitude: 0.6371, longitude: 122.8520 },
  { code: "HLP", name: "Halim Perdanakusuma (Jakarta)", latitude: -6.2666, longitude: 106.8900 },
  { code: "JOG", name: "Adisutjipto (Yogyakarta)", latitude: -7.7882, longitude: 110.4310 },
  { code: "KBU", name: "Stagen Airport (Kotabaru)", latitude: -3.2947, longitude: 116.1650 },
  { code: "KDI", name: "Haluoleo (Kendari)", latitude: -4.0816, longitude: 122.4180 },
  { code: "KJT", name: "Kertajati (Majalengka)", latitude: -6.6556, longitude: 108.1670 },
  { code: "KNG", name: "Kaimana Airport", latitude: -3.6445, longitude: 133.6959 },
  { code: "KNO", name: "Kualanamu (Medan)", latitude: 3.6423, longitude: 98.8853 },
  { code: "KOE", name: "El Tari (Kupang)", latitude: -10.1716, longitude: 123.6710 },
  { code: "LLJ", name: "Silampari (Lubuk Linggau)", latitude: -3.2861, longitude: 102.9160 },
  { code: "LOP", name: "Zainuddin Abdul Madjid (Lombok)", latitude: -8.7573, longitude: 116.2767 },
  { code: "LUV", name: "Karel Sadsuitubun (Langgur)", latitude: -5.6616, longitude: 132.7318 },
  { code: "LBJ", name: "Komodo (Labuan Bajo)", latitude: -8.4867, longitude: 119.8890 },
  { code: "LUW", name: "Syukuran Aminuddin Amir (Luwuk)", latitude: -0.9185, longitude: 122.7860 },
  { code: "MDC", name: "Sam Ratulangi (Manado)", latitude: 1.5494, longitude: 124.9250 },
  { code: "MKQ", name: "Mopah (Merauke)", latitude: -8.5203, longitude: 140.4170 },
  { code: "MKW", name: "Rendani (Manokwari)", latitude: -0.8918, longitude: 134.0490 },
  { code: "MLG", name: "Abdul Rahman Saleh (Malang)", latitude: -7.9266, longitude: 112.7140 },
  { code: "MOF", name: "Fransiskus Xaverius Seda (Maumere)", latitude: -8.6406, longitude: 122.2370 },
  { code: "MOH", name: "Maleo (Morowali)", latitude: -2.2250, longitude: 121.4060 },
  { code: "NBX", name: "Douw Aturure (Nabire)", latitude: -3.3682, longitude: 135.4960 },
  { code: "NTX", name: "Ranai Airport (Natuna)", latitude: 3.9087, longitude: 108.3880 },
  { code: "OKL", name: "Oksibil Airport", latitude: -4.9069, longitude: 140.6270 },
  { code: "PDG", name: "Minangkabau (Padang)", latitude: -0.7869, longitude: 100.2800 },
  { code: "PGK", name: "Depati Amir (Pangkal Pinang)", latitude: -2.1622, longitude: 106.1390 },
  { code: "PKN", name: "Iskandar (Pangkalan Bun)", latitude: -2.7050, longitude: 111.6730 },
  { code: "PKU", name: "Sultan Syarif Kasim II (Pekanbaru)", latitude: 0.4608, longitude: 101.4450 },
  { code: "PKY", name: "Tjilik Riwut (Palangkaraya)", latitude: -2.2235, longitude: 113.9430 },
  { code: "PLM", name: "Sultan Mahmud Badaruddin II (Palembang)", latitude: -2.8983, longitude: 104.6990 },
  { code: "PLW", name: "Mutiara SIS Al-Jufri (Palu)", latitude: -0.9180, longitude: 119.9100 },
  { code: "PNK", name: "Supadio (Pontianak)", latitude: -0.1507, longitude: 109.4030 },
  { code: "RTG", name: "Frans Sales Lega (Ruteng)", latitude: -8.5960, longitude: 120.4770 },
  { code: "SMQ", name: "H. Asan (Sampit)", latitude: -2.5001, longitude: 112.9750 },
  { code: "SOC", name: "Adi Soemarmo (Solo)", latitude: -7.5161, longitude: 110.7570 },
  { code: "SOQ", name: "Domine Eduard Osok (Sorong)", latitude: -0.9250, longitude: 131.1210 },
  { code: "SRG", name: "Ahmad Yani (Semarang)", latitude: -6.9714, longitude: 110.3740 },
  { code: "SUB", name: "Juanda (Surabaya)", latitude: -7.3796, longitude: 112.7870 },
  { code: "SXK", name: "Saumlaki Airport", latitude: -7.9886, longitude: 131.3053 },
  { code: "TJQ", name: "H.A.S. Hanandjoeddin (Tanjung Pandan)", latitude: -2.7456, longitude: 107.7540 },
  { code: "TKG", name: "Raden Inten II (Lampung)", latitude: -5.2423, longitude: 105.1780 },
  { code: "TMC", name: "Lede Kalumbang (Tambolaka)", latitude: -9.4097, longitude: 119.2440 },
  { code: "TIM", name: "Moses Kilangin (Timika)", latitude: -4.5283, longitude: 136.8870 },
  { code: "TNJ", name: "Raja Haji Fisabilillah (Tanjung Pinang)", latitude: 0.9220, longitude: 104.5320 },
  { code: "TRK", name: "Juwata (Tarakan)", latitude: 3.3253, longitude: 117.5690 },
  { code: "TTE", name: "Sultan Babullah (Ternate)", latitude: 0.8314, longitude: 127.3810 },
  { code: "UPG", name: "Sultan Hasanuddin (Makassar)", latitude: -5.0616, longitude: 119.5540 },
  { code: "WGP", name: "Mau Hau Airport (Waingapu)", latitude: -9.6692, longitude: 120.3020 },
  { code: "WMX", name: "Wamena", latitude: -4.1025, longitude: 138.9570 },
  { code: "YIA", name: "New Yogyakarta Int'l (Kulon Progo)", latitude: -7.9056, longitude: 110.0560 }
];

export const airlines = {
  garuda: { name: "Garuda Indonesia", speed: 966.18 },
  lion: { name: "Lion Air", speed: 873.75 },
  airasia: { name: "Indonesia Airasia", speed: 1008.75 },
  wings: { name: "Wings Abadi Airlines", speed: 505 },
  trigana: { name: "Trigana Air Service", speed: 733.46 },
  sriwijaya: { name: "Sriwijaya Air", speed: 764 },
  batik: { name: "Batik Air", speed: 930.43 },
  nam: { name: "NAM Air", speed: 675 },
  citilink: { name: "Citilink Indonesia", speed: 871.88 }
};

// Function to calculate distance between two airports using Haversine formula
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Generate routes from routesByAirline data
const routesByAirline = {
  garuda: [
    ["ARD", "KOE"], ["AMQ", "SUB"], ["BPN", "SUB"], ["BPN", "YIA"], ["BTJ", "KNO"],
    ["BIK", "DJJ"], ["BIK", "UPG"], ["DPS", "KOE"], ["DPS", "UPG"], ["DPS", "LOP"],
    ["DPS", "SUB"], ["DPS", "TIM"], ["DPS", "YIA"], ["GTO", "UPG"], ["CGK", "BPN"],
    ["CGK", "BDJ"], ["CGK", "BTH"], ["CGK", "DPS"], ["CGK", "DJB"], ["CGK", "UPG"],
    ["CGK", "MLG"], ["CGK", "MDC"], ["CGK", "LOP"], ["CGK", "KNO"], ["CGK", "PDG"],
    ["CGK", "PKY"], ["CGK", "PLM"], ["CGK", "PGK"], ["CGK", "PKU"], ["CGK", "PNK"],
    ["CGK", "SRG"], ["CGK", "SOC"], ["CGK", "SUB"], ["CGK", "TKG"], ["CGK", "YIA"],
    ["DJJ", "UPG"], ["DJJ", "TIM"], ["KDI", "UPG"], ["UPG", "BPN"], ["UPG", "MDC"],
    ["UPG", "PLW"], ["UPG", "SUB"], ["UPG", "TTE"], ["MDC", "TTE"]
  ],
  lion: [
    ["AMQ", "UPG"], ["BPN", "UPG"], ["BPN", "SUB"], ["BPN", "TRK"], ["BPN", "YIA"],
    ["BTJ", "KNO"], ["BDJ", "SUB"], ["BDJ", "YIA"], ["BTH", "KNO"], ["BTH", "PKU"],
    ["BTH", "SUB"], ["DPS", "UPG"], ["DPS", "YIA"], ["GTO", "UPG"], ["CGK", "AMQ"],
    ["CGK", "BPN"], ["CGK", "BTJ"], ["CGK", "BDJ"], ["CGK", "BTH"], ["CGK", "BKS"],
    ["CGK", "DPS"], ["CGK", "DJB"], ["CGK", "KDI"], ["CGK", "UPG"], ["CGK", "MDC"],
    ["CGK", "LOP"], ["CGK", "KNO"], ["CGK", "PDG"], ["CGK", "PKY"], ["CGK", "PLM"],
    ["CGK", "PLW"], ["CGK", "PGK"], ["CGK", "PKU"], ["CGK", "PNK"], ["CGK", "SRG"],
    ["CGK", "SOC"], ["CGK", "SUB"], ["CGK", "YIA"], ["DJJ", "UPG"], ["KDI", "UPG"],
    ["KOE", "SUB"], ["UPG", "MDC"], ["UPG", "PLW"], ["UPG", "SUB"], ["UPG", "TTE"],
    ["MDC", "SUB"], ["LOP", "SUB"], ["PKY", "SUB"]
  ],
  airasia: [
    ["BDO", "DPS"], ["BDO", "PKU"], ["BDO", "SUB"], ["CGK", "DPS"], ["CGK", "SUB"],
    ["CGK", "YIA"], ["KNO", "PLM"], ["KNO", "YIA"]
  ],
  wings: [
    ["ARD", "KOE"], ["AMQ", "DOB"], ["AMQ", "FKQ"], ["AMQ", "KNG"], ["AMQ", "LUV"],
    ["AMQ", "MKW"], ["AMQ", "SXK"], ["AMQ", "SOQ"], ["BJW", "KOE"], ["BJW", "LBJ"],
    ["BPN", "BDJ"], ["BPN", "BEJ"], ["BPN", "PLW"], ["BTJ", "KNO"], ["TKG", "BDO"],
    ["BDO", "SRG"], ["BDO", "SOC"], ["BDO", "YIA"], ["BDJ", "KBU"], ["BTH", "BKS"],
    ["BTH", "NTX"], ["BTH", "PGK"], ["BTH", "DTB"], ["BMU", "DPS"], ["BMU", "LOP"]
  ],
  trigana: [
    ["AMQ", "LUV"], ["DOB", "LUV"], ["CGK", "PKN"], ["DJJ", "NBX"], ["DJJ", "OKL"],
    ["DJJ", "WMX"], ["PKN", "SRG"], ["PKN", "SUB"]
  ],
  sriwijaya: [
    ["AMQ", "TTE"], ["BPN", "BDJ"], ["BPN", "BEJ"], ["BPN", "UPG"], ["BPN", "PLW"],
    ["BPN", "SUB"], ["BPN", "TRK"], ["BPN", "YIA"], ["TKG", "BTH"], ["BDJ", "UPG"],
    ["BTH", "NTX"], ["BEJ", "SUB"], ["BIK", "DJJ"], ["BIK", "UPG"], ["DPS", "UPG"],
    ["GTO", "UPG"], ["CGK", "BPN"], ["CGK", "TKG"], ["CGK", "BTH"], ["CGK", "DPS"],
    ["CGK", "UPG"], ["CGK", "MLG"], ["CGK", "KNO"], ["CGK", "PDG"], ["CGK", "PGK"],
    ["CGK", "PNK"], ["CGK", "SRG"], ["CGK", "DTB"], ["CGK", "SOC"], ["CGK", "SUB"],
    ["CGK", "TJQ"], ["CGK", "TTE"], ["CGK", "YIA"], ["DJJ", "UPG"], ["DJJ", "MKW"],
    ["DJJ", "MKQ"], ["DJJ", "TIM"], ["KDI", "UPG"], ["KOE", "SUB"], ["LUW", "UPG"],
    ["UPG", "MKW"], ["UPG", "MKQ"], ["UPG", "SOQ"], ["UPG", "SUB"], ["UPG", "TTE"],
    ["UPG", "TIM"], ["MDC", "TTE"], ["MKW", "SOQ"], ["KNO", "PDG"], ["SRG", "SUB"],
    ["SUB", "TTE"], ["SUB", "YIA"]
  ],
  batik: [
    ["AMQ", "UPG"], ["AMQ", "SUB"], ["BPN", "TRK"], ["BTJ", "KNO"], ["GTO", "UPG"],
    ["CGK", "AMQ"], ["CGK", "BPN"], ["CGK", "BTH"], ["CGK", "DJJ"], ["CGK", "KDI"],
    ["CGK", "KOE"], ["CGK", "LOP"], ["CGK", "UPG"], ["CGK", "MDC"], ["CGK", "KNO"],
    ["CGK", "PDG"], ["CGK", "PLM"], ["CGK", "PKU"], ["CGK", "SRG"], ["CGK", "SUB"],
    ["CGK", "YIA"], ["KDI", "UPG"], ["UPG", "DJJ"], ["UPG", "PLW"], ["UPG", "SUB"],
    ["UPG", "TTE"]
  ],
  nam: [
    ["ARD", "KOE"], ["BJW", "KOE"], ["BDO", "SUB"], ["BTH", "DJB"], ["BTH", "KNO"],
    ["DPS", "LBJ"], ["DPS", "MOF"], ["DPS", "WGP"], ["DPS", "YIA"], ["ENE", "KOE"],
    ["CGK", "TKG"], ["CGK", "BKS"], ["CGK", "DJB"], ["CGK", "PLM"], ["CGK", "PGK"],
    ["CGK", "SRG"], ["CGK", "SOC"], ["CGK", "SOQ"], ["CGK", "TJQ"], ["CGK", "TNJ"],
    ["DJJ", "SOQ"], ["KOE", "MOF"], ["KOE", "RTG"], ["KOE", "WGP"], ["KNO", "PKU"],
    ["PLM", "PGK"], ["PLM", "YIA"], ["PGK", "TJQ"], ["PNK", "YIA"], ["SOQ", "TIM"]
  ],
  citilink: [
    ["BPN", "DPS"], ["BPN", "UPG"], ["BPN", "SUB"], ["BPN", "YIA"], ["BTJ", "KNO"],
    ["BDO", "BTH"], ["BDO", "DPS"], ["BDO", "KNO"], ["BDO", "PLM"], ["BDO", "PKU"],
    ["BDO", "SUB"], ["BDJ", "SUB"], ["BTH", "KNO"], ["BTH", "PDG"], ["BTH", "PLM"],
    ["BTH", "PKU"], ["BTH", "SUB"], ["DPS", "SUB"], ["CGK", "BPN"], ["CGK", "BDJ"],
    ["CGK", "BTH"], ["CGK", "BKS"], ["CGK", "DPS"], ["CGK", "DJB"], ["CGK", "LOP"],
    ["CGK", "UPG"], ["CGK", "MDC"], ["CGK", "KNO"], ["CGK", "PDG"], ["CGK", "PGK"],
    ["CGK", "PKU"], ["CGK", "PNK"], ["CGK", "SRG"], ["CGK", "SUB"], ["CGK", "TJQ"],
    ["CGK", "YIA"], ["KOE", "SUB"], ["LOP", "SUB"], ["UPG", "MDC"], ["UPG", "SUB"],
    ["MDC", "SUB"], ["KNO", "PKU"], ["PKY", "SUB"], ["PLM", "SUB"], ["PKU", "SUB"],
    ["PKU", "YIA"], ["PNK", "SUB"]
  ]
};

// Convert routesByAirline to routes array with calculated distances
export const routes: Route[] = [];

Object.entries(routesByAirline).forEach(([airlineCode, routesList]) => {
  routesList.forEach(([from, to]) => {
    const fromAirport = airports.find(a => a.code === from);
    const toAirport = airports.find(a => a.code === to);
    
    if (fromAirport && toAirport) {
      const distance = calculateDistance(
        fromAirport.latitude,
        fromAirport.longitude,
        toAirport.latitude,
        toAirport.longitude
      );
      
      routes.push({
        from,
        to,
        airline: airlines[airlineCode as keyof typeof airlines].name,
        distance
      });
    }
  });
});