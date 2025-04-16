import type { Space } from "@/types/space"
import { SquareArrowRight } from "lucide-react"
import { useNavigate } from "react-router-dom";
import { api } from "@/utils/api";
import useUserStore from "./../../store/userStore";

type SpaceCardProps = {
  space: Space
}

export default function SpaceCard({ space }: SpaceCardProps) {
  const navigate = useNavigate();

  const handleClick = async () => {
    navigate("/create",{
      state: { spaceId:space.id },
    })
  }
  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden transition-transform duration-300 hover:scale-105 relative">
      <SquareArrowRight onClick={handleClick} className="absolute z-10 left-50 top-30 text-3xl"/>
      <div className="relative h-48">
        <img
          src={space.thumbnail || "/placeholder.svg"}
          alt={space.name}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="p-4">
        <h2 className="text-lg font-semibold text-gray-900">{space.name}</h2>
        <p className="text-sm text-gray-500">{new Date(space.createdAt).toLocaleDateString()}</p>
        <p className="mt-2 text-sm text-gray-600">{space.description}</p>
      </div>
    </div>
  )
}
