import {create} from 'zustand'

type createRoomStore = {
    room : string | null,
    setRoom: (room:string)=>void;
}
type joinRoomStore = {
    room:string|null,
    setRoom:(room:string)
}
export const createRoomStore =create<createRoomStore> ((set)=>({
    room:null,
    setRoom:(room)=>set({room})
}));
