import { useNavigate } from 'react-router-dom';

const CtaButtons = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col sm:flex-row items-center gap-4">
      <button
        onClick={() => navigate("/create")}
        className="w-full sm:w-auto bg-pink-600 hover:bg-pink-700 text-white font-bold py-3 px-6 rounded-lg transition-transform transform hover:scale-105 duration-300"
      >
        Create a Meeting
      </button>
      <button
        onClick={() => navigate("/join")}
        className="w-full sm:w-auto bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 px-6 rounded-lg transition-transform transform hover:scale-105 duration-300"
      >
        Join Meeting
      </button>
    </div>
  );
};

export default CtaButtons;