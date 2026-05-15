import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { motion } from 'framer-motion'

const goldPin = L.divIcon({
  className: 'nomadway-pin',
  html: '<div style="background:#d4af37;border:3px solid #1a4d3a;width:18px;height:18px;border-radius:50%;box-shadow:0 0 0 4px rgba(212,175,55,.25)"></div>',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
})

const PLACES = [
  { name: 'Charyn Canyon', region: 'Almaty', lat: 43.3590, lon: 79.0833, image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b0/Charyn_Canyon%2C_Kazakhstan_03.jpg/320px-Charyn_Canyon%2C_Kazakhstan_03.jpg' },
  { name: 'Kolsai Lakes', region: 'Almaty', lat: 42.9355, lon: 78.3360, image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Kolsay_Lake_-_panoramio.jpg/320px-Kolsay_Lake_-_panoramio.jpg' },
  { name: 'Burabay (Borovoe)', region: 'Akmola', lat: 53.0801, lon: 70.3147, image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/Burabay_lake.jpg/320px-Burabay_lake.jpg' },
  { name: 'Bozzhyra, Mangystau', region: 'Mangystau', lat: 43.5450, lon: 53.5417, image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/89/Bozzhyra_tract%2C_Mangystau_Region%2C_Kazakhstan.jpg/320px-Bozzhyra_tract%2C_Mangystau_Region%2C_Kazakhstan.jpg' },
  { name: 'Khoja Ahmed Yasawi Mausoleum', region: 'Turkestan', lat: 43.2974, lon: 68.2742, image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/49/Mausoleum_of_Khoja_Ahmed_Yasawi-2.jpg/320px-Mausoleum_of_Khoja_Ahmed_Yasawi-2.jpg' },
  { name: 'Almaty / Kok-Tobe', region: 'Almaty', lat: 43.2220, lon: 76.9762, image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Almaty_View_Kok-Tobe.jpg/320px-Almaty_View_Kok-Tobe.jpg' },
  { name: 'Khan Tengri', region: 'Almaty', lat: 42.2179, lon: 80.1722, image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/40/Khan_Tengri_2007.jpg/320px-Khan_Tengri_2007.jpg' },
  { name: 'Alakol Lake', region: 'Almaty', lat: 46.1167, lon: 81.6000, image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/Alakol_lake.jpg/320px-Alakol_lake.jpg' },
  { name: 'Astana / Bayterek', region: 'Astana', lat: 51.1283, lon: 71.4308 },
  { name: 'Big Almaty Lake', region: 'Almaty', lat: 43.0500, lon: 76.9833 },
  { name: 'Singing Dune (Altyn-Emel)', region: 'Almaty', lat: 43.9667, lon: 78.6000 },
  { name: 'Tamgaly Petroglyphs', region: 'Almaty', lat: 43.8000, lon: 75.5333 },
]

export default function AttractionsMap() {
  return (
    <section id="map" className="py-24 px-6 relative overflow-hidden">
      <div className="max-w-7xl mx-auto relative">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="inline-block px-4 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs tracking-widest uppercase mb-4">
            Live map
          </span>
          <h2 className="font-display text-4xl md:text-5xl font-bold mb-4">
            Every place on the <span className="text-gradient">map</span>
          </h2>
          <p className="text-lg text-dark-300 max-w-2xl mx-auto">
            From Charyn Canyon to Mangystau's lunar landscapes — explore the whole country at a glance.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="glass-card overflow-hidden p-2 rounded-2xl"
          style={{ borderColor: 'rgba(212,175,55,0.2)' }}
        >
          <MapContainer
            center={[48.0, 68.0]}
            zoom={4}
            style={{ height: '520px', width: '100%', borderRadius: '14px', background: '#0F1B16' }}
            scrollWheelZoom={false}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />
            {PLACES.map((p) => (
              <Marker key={p.name} position={[p.lat, p.lon]} icon={goldPin}>
                <Popup>
                  <div style={{ minWidth: 180 }}>
                    {p.image ? (
                      <img
                        src={p.image}
                        alt={p.name}
                        style={{ width: '100%', height: 90, objectFit: 'cover', borderRadius: 8, marginBottom: 8 }}
                      />
                    ) : null}
                    <div style={{ fontWeight: 700, color: '#1a4d3a', fontSize: 14 }}>{p.name}</div>
                    <div style={{ color: '#666', fontSize: 12, marginTop: 2 }}>{p.region}</div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </motion.div>

        <p className="text-center text-dark-400 text-sm mt-6">
          Tap any pin for a preview. Open the app for full route planning and offline maps.
        </p>
      </div>
    </section>
  )
}
