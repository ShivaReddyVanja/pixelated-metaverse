import {create} from "zustand";

interface mediaStore {
remoteStreams : Record<string, MediaStream>
addRemoteStream: (peerId:string,stream:MediaStream) => void
removeRemoteStream: (peerId:string) => void
}

export const useMediaStore = create<mediaStore>() (
    (set,get)=>({
        remoteStreams: {},

        addRemoteStream: (peerId:string, stream:MediaStream)=>{
          set((state)=>({
            remoteStreams : {
                ...state.remoteStreams,
                [peerId]:stream
            }
          }))
        },

        removeRemoteStream: (peerId:string)=>{
            set((state)=> {
             const {[peerId] :  _removed, ...remaining} = state.remoteStreams
             return {remoteStreams:remaining}
            }
            )
        }
    })
)