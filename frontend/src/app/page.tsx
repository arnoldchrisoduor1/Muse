import Button from "@/components/Button";
import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <>
      <div className="flex justify-center">
        <Button title="Dive In" href="/auth" />
      </div>
    </>
  );
}
