import { UserProfile } from "@/app/components/UserProfile";

interface UserPageProps {
  params: Promise<{ address: string }>;
}

export default async function UserPage({ params }: UserPageProps) {
  const { address } = await params;
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <UserProfile address={address} />
    </div>
  );
}
