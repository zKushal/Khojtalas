import Image from "next/image";
import logo from "../public/logo.png";

export default function SplashScreen() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-obsidian px-6 text-white">
      <div className="flex flex-col items-center gap-8 text-center">
        <Image
          src={logo}
          alt="KhojTalas logo"
          width={96}
          height={96}
          priority
          className="rounded-[1.75rem] border border-white/10 bg-white/5 p-4 shadow-[0_0_32px_rgba(0,242,234,0.22),0_0_56px_rgba(255,0,80,0.16)]"
        />
        <div>
          <h1 className="text-shadow-glow text-3xl font-bold tracking-wide">KhojTalas</h1>
          <div className="mx-auto mt-4 h-9 w-9 animate-spin rounded-full border-[3px] border-white/15 border-t-cyan border-r-magenta" />
        </div>
      </div>
    </main>
  );
}
