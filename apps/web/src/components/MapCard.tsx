import { useState } from "react"
import { Map } from "@/types/Map"


const MapCard: React.FC<{ map: Map }> = ({ map }) => {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div
      className="bg-white rounded-lg shadow-lg overflow-hidden transition-transform duration-300 ease-in-out transform hover:scale-105"
      style={{ imageRendering: "pixelated", boxShadow: "4px 4px 0 rgba(0, 0, 0, 0.2)" }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative">
      {/* //place your image here */}
      <img src={map.thumbnail} alt={map.name} loading="lazy" />
        {isHovered && (
          <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center">
            <div className="text-white text-center">
              
            </div>
          </div>
        )}
      </div>
      <div className="p-4">
        <h2 className="text-xl font-bold mb-2" style={{ fontFamily: '"Press Start 2P", cursive' }}>
          {map.name}
        </h2>
        <p className="text-gray-600" style={{ fontFamily: '"Press Start 2P", cursive' }}>
          {map.width}x{map.height} 
        </p>
      </div>
    </div>
  )
}
export default MapCard;