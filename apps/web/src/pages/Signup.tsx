import { useNavigate } from "react-router-dom"
import { useState } from "react"
import axios from "axios"

const apiUrl = import.meta.env.VITE_API_URL + "/signup";
const Signup = () => {
      const [email, setEmail] = useState("")
      const [password, setPassword] = useState("")
      const [username,setUsername] =useState("")
      const navigate = useNavigate();
    

  const handleSignup = async (e:React.FormEvent) => {
    e.preventDefault();
    
    try{
        const response:any = await axios.post(apiUrl,{
            username,
            password,
            email
        })
        console.log("User created successfully:",response.data)
        navigate("/signin")
    }
    catch(error:any){
        if(!error.response){
            console.log("Network error .Please try again later")
        }
        else if(error.response.staus === 400){
            console.log("Data validation failed. please check your inputs")

        }
        else if(error.response.status === 409){
            console.log("Username or email already exists")
        }
        else{
            console.log("Internal server error. Please try again later")
        }
    }

  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-black">
      <div className="w-full max-w-md p-8 space-y-8 bg-black bg-opacity-50 backdrop-blur-lg rounded-2xl shadow-2xl">
        <div className="text-center">
          <h2 className="mt-6 text-4xl font-bold text-white">Join the Metaverse</h2>
          <p className="mt-2 text-sm text-blue-300">Sign up to explore new dimensions</p>
        </div>
        <div className="rounded-md shadow-sm -space-y-px">
        <div>
              <label htmlFor="username" className="sr-only">
                Username
              </label>
              <input
                id="email-address"
                name="username"
                type="username"
                autoComplete="username"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-white rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="email-address" className="sr-only">
                Email address
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-white rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-white rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <button
            onClick={handleSignup}
            className="mt-2 group w-full flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-300 ease-in-out transform hover:scale-105"
          >Submit</button>
          </div>
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-400">By signing up, you agree to our Terms of Service and Privacy Policy</p>
        </div>
      </div>
    </div>
  )
}

export default Signup

