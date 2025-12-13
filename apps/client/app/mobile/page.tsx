export default function MobileNotSupported() {
  return (
    <div className="w-screen h-screen flex flex-col items-center justify-center bg-gray-900 text-white p-6 text-center">
      
      <h1 className="text-3xl font-semibold mb-4">
        Mobile Not Supported
      </h1>

      <p className="text-gray-300 max-w-md mb-6">
        This experience is designed for desktop devices only.  
        Please open this website on a laptop or desktop computer.
      </p>

      <div className="text-sm text-gray-500">
        Thank you for understanding.
      </div>
    </div>
  );
}
