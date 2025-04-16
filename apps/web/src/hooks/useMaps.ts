import { useEffect, useState } from "react"
import { Map } from "@/types/Map"
import axios from "axios"


const apiUrl = import.meta.env.VITE_API_URL 
export const useMaps = ()=>{
      const [maps, setMaps] = useState<Map[]>([])
      useEffect(()=>{
        
        const loadMaps = async ()=>{
            try{

                const response =  await fetchMaps();
                setMaps(response);
                
            }
            catch(error){
                console.log(error);
            }

        }
        loadMaps()

          
      },[])
      return maps

}
const fetchMaps = async ()=>{

    type mapResponse= {
      data:{
        maps:[]
      }
    }
    
     const response:mapResponse = await axios.get(`${apiUrl}/maps`)
     return response.data.maps
    


  }
