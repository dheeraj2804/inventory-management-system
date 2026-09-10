"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { startDemo } from "@/src/lib/api";
import PageSkeleton from "@/components/PageSkeleton";
import Link from "next/link";
export default function DemoPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    void Promise.resolve()
      .then(() => {
        if (!active) return;
        startDemo();
        router.replace("/dashboard");
      })
      .catch(() => {
        if (active)
          setError(
            "The demo could not open. Check that browser storage is enabled, then try again from the login page.",
          );
      });
    return () => {
      active = false;
    };
  }, [router]);
  if (error)
    return (
      <div className="error-panel" role="alert">
        <h1>Couldn’t open the demo</h1>
        <p>{error}</p>
        <Link href="/login" className="button primary">
          Back to login
        </Link>
      </div>
    );
  return <PageSkeleton />;
}
