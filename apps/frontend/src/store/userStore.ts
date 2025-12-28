import { create } from 'zustand';

type User = {
  id: string;
  name?: string;
};

type UserStore = {
  user: User | null;
  getUser: ()=> User|null;
  setUser: (user: User) => void;
};

const useUserStore = create<UserStore>((set,get) => ({
  user: null,
  getUser:() =>get().user,
  setUser: (user) => set({ user }),
}));

export default useUserStore;
