"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { AuthButton } from "@/components/AuthButton";

function Header() {
  const { user } = useAuth();
  return (
    <header className="bg-slate-950 h-16 flex items-center justify-center gap-0 px-4 select-none">

      <Link href="/#" className="group transition-colors duration-300">
        <div className="flex items-center gap-0 px-4">
          <h1 className="font-bold text-slate-400 text-xl tracking-wider uppercase transition-colors duration-300 group-hover:text-slate-500">
            CRAFT
          </h1>
          <h1 className="font-bold text-white text-xl tracking-wider uppercase transition-colors duration-300 group-hover:text-slate-300">
            SIGNS
          </h1>
        </div>
      </Link>

      <Link href="/#welcome" className="mx-4 hover:text-slate-300 transition-colors">
        ГЛАВНАЯ
      </Link>
      <Link href="/#portfolio" className="mx-4 hover:text-slate-300 transition-colors">
        НАШИ РАБОТЫ
      </Link>
      <Link href="/#services" className="mx-4 hover:text-slate-300 transition-colors">
        УСЛУГИ
      </Link>
      <Link href="/#contacts" className="mx-4 hover:text-slate-300 transition-colors">
        КОНТАКТЫ
      </Link>
      <Link href="/#delivery" className="mx-4 hover:text-slate-300 transition-colors">
        ДОСТАВКА
      </Link>
      <Link href="/#ie" className="mx-4 hover:text-slate-300 transition-colors">
        ИП ВИСТЯКОВ Д. Г.
      </Link>
      
      {user?.role === "admin" && (
        <Link 
          href="/admin"
          className="mx-4 bg-white hover:bg-gray-700 text-gray-700 hover:text-white px-6 py-2 rounded-lg transition-all duration-300"
        >
          АДМИН ПАНЕЛЬ
        </Link>
      )}
      <AuthButton />  
    </header>
  );
}

export default Header;
