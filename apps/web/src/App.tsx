import { useEffect } from 'react';
import { Routes, Route, BrowserRouter, useNavigate } from "react-router-dom";
import Login from './pages/Login';
import Signup from './pages/Signup';
import Spaces from './pages/Spaces';
import MapsPage from './pages/MapsPage';
import Game from './Game';
import JoinOrCreate from './JoinOrCreate';
import NotFound from './pages/NotFound';

const App = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/signup");
    }
  }, []);

  return (
    <div className="App">
   
        <Routes>
          <Route path="/" element={<Spaces />} />
          <Route path="/maps" element={<MapsPage />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/signin" element={<Login />} />
          <Route path="/start" element={<Game />}/>
          <Route path="/create" element={<JoinOrCreate/> }/>
          <Route path="/join/:roomid" element={<JoinOrCreate/>}/>
          <Route path="*" element={<NotFound />} />
        </Routes>
 
    </div>
  );
}

export default App;