import MapCard from "@/components/MapCard"
import {useMaps} from "@/hooks/useMaps"


export default function MapsPage() {
     
     const maps= useMaps()

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8" style={{ fontFamily: '"Press Start 2P", cursive' }}>
        Metaverse Maps
      </h1>
      <div className="flex justify-between mb-6">
        <div className="space-x-2">
    
        </div>
        <select
          
          className="px-4 py-2 rounded bg-gray-200 text-gray-800"
          style={{
            fontFamily: '"Press Start 2P", cursive',
            appearance: "none",
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='8' viewBox='0 0 8 8'%3E%3Cpath fill='%23000000' d='M0 0h8L4 8z'/%3E%3C/svg%3E\")",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "right 0.5rem center",
            backgroundSize: "8px 8px",
            paddingRight: "1.5rem",
          }}
        >
          <option value="name">Sort by Name</option>
          <option value="activeUsers">Sort by Active Users</option>
        </select>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {maps.map((map) => (
        <MapCard key={map.id} map={map} />
        ))}
      </div>
    </div>
  )
}

