import { redirect } from "next/navigation";

export default function VerifyUuidPage({ params }: { params: { uuid: string } }) {
  redirect(`/lms/verify?query=${encodeURIComponent(params.uuid)}`);
}
