import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24 text-center">
      <h1 className="text-4xl font-bold tracking-tight mb-4">
        Insurance Claim Verification Platform
      </h1>
      <p className="text-xl text-muted-foreground mb-8 max-w-2xl">
        Prevent claim rejections by instantly checking document readiness against policy requirements.
      </p>
      <div className="flex gap-4">
        <Link href="/login">
          <Button size="lg">Start Creating Claims</Button>
        </Link>
      </div>
    </div>
  );
}
