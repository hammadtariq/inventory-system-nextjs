import { useRouter } from "next/router";
import { useEffect } from "react";

export default function Detail() {
  const router = useRouter();
  useEffect(() => {
    router.push("/sales");
  }, [router]);
  return null;
}
