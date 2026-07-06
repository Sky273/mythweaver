import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { signOutAction } from "./actions";

export default async function Home() {
  const session = await auth();

  const campaigns = await prisma.campaign.findMany({
    where: { ownerId: session!.user.id },
    orderBy: { createdAt: "desc" },
  });

  const sharedCollaborations = await prisma.campaignCollaborator.findMany({
    where: { userId: session!.user.id },
    include: { campaign: { include: { owner: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Mes campagnes</h1>
        <Link
          href="/campaigns/new"
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
        >
          Nouvelle campagne
        </Link>
      </div>

      <div className="mt-2 flex items-center justify-between text-sm text-gray-500">
        <span>{session!.user.email}</span>
        <form action={signOutAction}>
          <button type="submit" className="text-indigo-500 hover:underline">
            Se déconnecter
          </button>
        </form>
      </div>

      {campaigns.length === 0 ? (
        <p className="mt-8 text-sm text-gray-500">
          Aucune campagne pour l&apos;instant.
        </p>
      ) : (
        <ul className="mt-8 divide-y divide-gray-200 dark:divide-gray-800">
          {campaigns.map((campaign) => (
            <li key={campaign.id} className="py-4">
              <Link
                href={`/campaigns/${campaign.id}`}
                className="font-medium hover:underline"
              >
                {campaign.name}
              </Link>
              <p className="text-sm text-gray-500">{campaign.system}</p>
            </li>
          ))}
        </ul>
      )}

      {sharedCollaborations.length > 0 && (
        <div className="mt-10">
          <h2 className="text-lg font-semibold">Campagnes partagées avec moi</h2>
          <ul className="mt-4 divide-y divide-gray-200 dark:divide-gray-800">
            {sharedCollaborations.map((collaboration) => (
              <li key={collaboration.id} className="py-4">
                <Link
                  href={`/campaigns/${collaboration.campaign.id}`}
                  className="font-medium hover:underline"
                >
                  {collaboration.campaign.name}
                </Link>
                <p className="text-sm text-gray-500">
                  {collaboration.campaign.system} — MJ : {collaboration.campaign.owner.email}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </main>
  );
}
