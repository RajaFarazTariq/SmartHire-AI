import Dropzone from "./Dropzone";

export default function UploadPage() {
  return (
    <div className="max-w-3xl">
      <h1 className="mb-2 text-2xl font-semibold">Upload resumes</h1>
      <p className="mb-6 text-sm text-gray-600">
        Drop PDF or DOCX resumes to extract text and create candidate profiles.
      </p>
      <Dropzone />
    </div>
  );
}
