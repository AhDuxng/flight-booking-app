import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import ErrorMessage from "@/components/common/ErrorMessage";
import Loading from "@/components/common/Loading";
import { getErrorMessage } from "@/lib/apiError";
import { operationService } from "./operationService";

export default function ContentFeature() {
  const { slug } = useParams();
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => { setLoading(true); operationService.getContent({ slug }).then((response) => { setContent(response.data?.[0] ?? null); setError(""); }).catch((requestError) => setError(getErrorMessage(requestError, "Không thể tải nội dung."))).finally(() => setLoading(false)); }, [slug]);
  if (loading) return <Loading label="Đang tải nội dung" />;
  if (error || !content) return <div className="mx-auto max-w-4xl px-container-padding py-section-gap"><ErrorMessage message={error || "Nội dung chưa được xuất bản."} /></div>;
  return <article className="mx-auto min-h-[60vh] max-w-4xl px-container-padding py-section-gap"><p className="text-label-md uppercase text-secondary">{content.type}</p><h1 className="mt-2 text-headline-lg text-primary">{content.title}</h1>{content.summary ? <p className="mt-3 text-body-lg text-on-surface-variant">{content.summary}</p> : null}{content.image_url ? <img alt="" className="mt-6 max-h-96 w-full rounded-xl object-cover" src={content.image_url} /> : null}<div className="mt-8 whitespace-pre-wrap rounded-xl bg-surface-container-lowest p-container-padding text-body-md leading-7 shadow-sm">{content.body}</div></article>;
}
