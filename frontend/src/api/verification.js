import { request } from "./client";

export const myVerificationDocuments = () =>
  request({ method: "GET", url: "/verification/me" });

export const uploadVerificationDocument = (documentType, file) => {
  const formData = new FormData();
  formData.append("document_type", documentType);
  formData.append("file", file);
  return request({
    method: "POST",
    url: "/verification/upload",
    data: formData,
    headers: { "Content-Type": "multipart/form-data" },
  });
};