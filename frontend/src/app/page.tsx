import Link from "next/link";

export default function Home() {
  return (
    <>
      <div className="flex justify-center">
        <Link href="/login" className="px-4 py-2 rounded-sm bg-primary border mt-10">
          Login
        </Link>
      </div>
    </>
  );
}
