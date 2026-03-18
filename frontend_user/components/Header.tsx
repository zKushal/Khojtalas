import Image from "next/image";
import Link from "next/link";
import logo from "../public/logo.png";

export default function Header() {
  return (
    <header className="fixed top-0 inset-x-0 z-30 border-b border-white/10 bg-obsidian/95 backdrop-blur-xl">
      <div className="mx-auto flex max-w-md items-center gap-3 px-4 py-3">
        <Link href="/" className="flex items-center gap-3" aria-label="Go to home">
          <Image
            src={logo}
            alt="KhojTalas"
            width={40}
            height={40}
            className="rounded-lg"
          />
          <h1 className="text-xl font-bold text-white">KhojTalas</h1>
        </Link>
      </div>
    </header>
  );
}
