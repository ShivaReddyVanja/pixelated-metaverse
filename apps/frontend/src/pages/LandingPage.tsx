import CtaButtons from '@/components/CtaButtons';

// Icon components
const MapPinIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
        <circle cx="12" cy="10" r="3" />
    </svg>
);

const MicIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
        <line x1="12" x2="12" y1="19" y2="22" />
    </svg>
);

const PuzzleIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M19.439 7.852c-2.102-2.102-5.638-2.102-7.74 0L10 9.568l-1.571 1.571-1.423-1.423c-2.102-2.102-5.638-2.102-7.74 0-2.102 2.102-2.102 5.638 0 7.74l1.423 1.423L2.414 20.29l1.414 1.414 1.432-1.432 1.59-1.59c2.102 2.102 5.638 2.102 7.74 0l7.127-7.127c2.102-2.102 2.102-5.638 0-7.74z" />
    </svg>
);

export default function LandingPage() {
    return (
        <div className="bg-slate-900 text-white min-h-screen w-full">
            <main className="container mx-auto px-6 lg:px-8">
                {/* Hero Section */}
                <section className="min-h-screen flex flex-col items-center justify-center text-center">
                    <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-4">
                        Escape the Grid.
                        <br />
                        <span className="bg-gradient-to-r from-pink-500 to-violet-500 bg-clip-text text-transparent">
                            Meet in a World.
                        </span>
                    </h1>
                    <p className="max-w-2xl mx-auto text-lg md:text-xl text-slate-400 mb-8">
                        Move beyond boring video calls. Meet, chat, and collaborate in a vibrant 2D pixel world you can call your own.
                    </p>
                    <CtaButtons />
                    <div className="mt-16 w-full max-w-4xl p-4 bg-slate-800 rounded-lg border border-slate-700 shadow-2xl shadow-pink-500/10">
                        <div className="aspect-video bg-slate-900 rounded-md flex items-center justify-center">
                            <p className="text-slate-500">Your awesome 2D map will be shown here!</p>
                        </div>
                    </div>
                </section>

                {/* Features Section */}
                <section className="py-20 lg:py-32">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold">Why You&apos;ll Love It</h2>
                        <p className="text-slate-400 mt-2">A new dimension of virtual interaction.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                        <div className="bg-slate-800 p-8 rounded-xl border border-slate-700">
                            <div className="flex items-center justify-center h-12 w-12 rounded-full bg-pink-600/20 mx-auto mb-4">
                                <MapPinIcon className="h-6 w-6 text-pink-400" />
                            </div>
                            <h3 className="text-xl font-semibold mb-2">Customizable Spaces</h3>
                            <p className="text-slate-400">
                                Design your own office, lounge, or conference hall. Express your team&apos;s culture in every pixel.
                            </p>
                        </div>
                        <div className="bg-slate-800 p-8 rounded-xl border border-slate-700">
                            <div className="flex items-center justify-center h-12 w-12 rounded-full bg-pink-600/20 mx-auto mb-4">
                                <MicIcon className="h-6 w-6 text-pink-400" />
                            </div>
                            <h3 className="text-xl font-semibold mb-2">Spatial Audio</h3>
                            <p className="text-slate-400">
                                Talk to people near you, just like in real life. Move away to have a private conversation.
                            </p>
                        </div>
                        <div className="bg-slate-800 p-8 rounded-xl border border-slate-700">
                            <div className="flex items-center justify-center h-12 w-12 rounded-full bg-pink-600/20 mx-auto mb-4">
                                <PuzzleIcon className="h-6 w-6 text-pink-400" />
                            </div>
                            <h3 className="text-xl font-semibold mb-2">Interactive Elements</h3>
                            <p className="text-slate-400">
                                Engage with whiteboards, shared documents, and embedded apps directly within your virtual space.
                            </p>
                        </div>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="border-t border-slate-800 text-center py-6">
                <p className="text-slate-500">© 2025 PixelMeet. All rights reserved.</p>
            </footer>
        </div>
    );
}
