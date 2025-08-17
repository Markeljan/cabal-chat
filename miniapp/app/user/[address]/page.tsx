import { UserProfile } from "@/app/components/UserProfile";

interface UserPageProps {
  params: {
    address: string;
  };
}

export default function UserPage({ params }: UserPageProps) {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <UserProfile address={params.address} />
    </div>
  );
}
