import { PageHeader } from "@/components/dashboard/page-header";
import Dropzone from "./Dropzone";

export default function UploadPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Upload resumes"
        description="Drop PDF or DOCX resumes to extract text and create candidate profiles."
      />
      <Dropzone />
    </div>
  );
}
