export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div>
      <h1>Job: {id}</h1>
      <p>Coming soon...</p>
    </div>
  );
}
