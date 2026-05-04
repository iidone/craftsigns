import { ProductCard } from "@/components/ProductCard";
import { Portfolio } from "@/components/sections/Portfolio";
import { Contacts } from "@/components/sections/Contacts";
import { Services } from "@/components/sections/Services";
import { Delivery } from "@/components/sections/Delivery";
import { IE } from "@/components/sections/IE";
import { Welcome } from "@/components/sections/Welcome";
import { Advantages } from "@/components/Advantages";
import { Info } from "@/components/sections/Info";

export default function Home() {
  return (
    <main className="pb-10 min-h-screen">
      <div className="flex flex-col gap-4">
        <Welcome />
        <Advantages />
        <Portfolio />
        <Info />
        <Services />
        <Contacts />
        <Delivery />
        <IE />
      </div>
    </main>
  );
}