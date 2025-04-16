import {useMaps} from "@/hooks/useMaps";
import { CircleX } from "lucide-react";
import { useState } from "react";
import axios from "axios";

type CreateSpaceModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

const apiUrl = import.meta.env.VITE_API_URL + "/space/create";

const createSpace = async (name: string, description: string, selectedMap: string, setValidErr: (msg: string | null) => void, setMsgtimer: (val: boolean) => void, timer: () => void) => {
  try {
    const token = localStorage.getItem("token");
    const response = await axios.post(apiUrl, { name, description, mapId: selectedMap }, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    console.log("Space created successfully:", response.data);
  } catch (error:any) {
   
      switch (error.response.status) {
        case 400:
          setValidErr("Validation failed");
          break;
        case 404:
          setValidErr("User or map does not exist");
          break;
        case 500:
          setValidErr("Internal server error");
          break;
        default:
          setValidErr("An unknown error occurred");
      }
    } 
  }


export default function CreateSpaceModal({ isOpen, onClose }: CreateSpaceModalProps) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedMap, setSelectedMap] = useState<string | null>(null);
  const [validErr, setValidErr] = useState<string | null>(null);
  const [msgtimer, setMsgtimer] = useState(false);
  const maps = useMaps();

  const handleNext = () => {
    if (step === 1 && (!name || !description)) {
      setValidErr("* Please fill out the following details");
      setMsgtimer(true);
      timer();
      return;
    }
    if (step < 2) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const timer = () => {
    setTimeout(() => {
      setMsgtimer(false);
    }, 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMap) {
      setValidErr("Must choose a map before submitting");
      setMsgtimer(true);
      timer();
      return;
    }
    createSpace(name, description, selectedMap, setValidErr, setMsgtimer, timer);
    onClose();
  };

  return (
    isOpen && (
      <div className="fixed inset-0 flex items-center justify-center bg-black/50">
        <div className="bg-white p-6 rounded-lg shadow-lg w-96 relative">
          <CircleX className="absolute top-4 right-4 cursor-pointer" onClick={onClose} />
          <h2 className="text-xl font-semibold mb-4">
            {step === 1 ? "Enter Details" : "Choose a Map"}
          </h2>

          {step === 1 && (
            <div>
              {validErr && msgtimer ? (
                <p className="text-red-400">{validErr}</p>
              ) : (
                <p></p>
              )}
              <label className="block text-sm font-medium">Name</label>
              <input
                type="text"
                required
                className="w-full border rounded p-2 mt-1"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />

              <label className="block text-sm font-medium mt-3">Description</label>
              <textarea
                required
                className="w-full border rounded p-2 mt-1"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          )}

          {step === 2 && (
            <div>
              {validErr && msgtimer ? (
                <p className="text-red-400">*{validErr}</p>
              ) : (
                <p></p>
              )}
              <p className="mb-2 text-sm text-gray-600">Select a Map:</p>
              {maps.map((map) => (
                <button
                  key={map.id}
                  className={`w-full p-2 border rounded mt-1 ${
                    selectedMap === map.id ? "bg-blue-500 text-white" : "bg-gray-100"
                  }`}
                  onClick={() =>
                    selectedMap ? setSelectedMap(null) : setSelectedMap(map.id)
                  }
                >
                  {map.name}
                </button>
              ))}
            </div>
          )}

          <div className="mt-4 flex justify-between">
            {step > 1 && (
              <button className="px-4 py-2 bg-gray-300 rounded" onClick={handleBack}>
                Back
              </button>
            )}

            {step < 2 ? (
              <button className="px-4 py-2 bg-blue-500 text-white rounded" onClick={handleNext}>
                Next
              </button>
            ) : (
              <button
                type="submit"
                className="px-4 py-2 bg-green-500 text-white rounded"
                onClick={handleSubmit}
              >
                Finish
              </button>
            )}
          </div>
        </div>
      </div>
    )
  );
}
