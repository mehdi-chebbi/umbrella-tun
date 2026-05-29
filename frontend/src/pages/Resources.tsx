import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function Resources() {
  return (
    <div className="bg-white text-black font-sans antialiased">
      <Navbar darkOnInit />
      <main className="min-h-[70vh] flex items-center justify-center">
        <h1 className="font-serif text-4xl md:text-5xl tracking-tight text-black/80">
          Hello from Ressources
        </h1>
      </main>
      <Footer />
    </div>
  );
}
