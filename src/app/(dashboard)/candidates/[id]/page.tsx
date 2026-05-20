export default async function CandidateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div>
      <h1>Candidate: {id}</h1>
      <p>Coming soon...</p>
    </div>
  );
}
