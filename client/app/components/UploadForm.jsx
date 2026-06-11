"use client";

import axios from "axios";
import { useState } from "react";

export default function UploadForm({
  setResults,
  setInsights,
  setLoading,
}) {
  const [googleFile, setGoogleFile] =
    useState(null);

  const [metaFile, setMetaFile] =
    useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!googleFile || !metaFile) {
      alert("Upload both files");
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();

      formData.append(
        "googleFile",
        googleFile
      );

      formData.append("metaFile", metaFile);

      const response = await axios.post(
        "http://localhost:5000/api/analyze",
        formData,
        {
          headers: {
            "Content-Type":
              "multipart/form-data",
          },
        }
      );

      console.log(response.data);

      setResults(response.data);
    } catch (error) {
      console.error(error);

      alert(
        error?.response?.data?.error ||
          "Upload failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "18px",
        }}
      >
        <div>
          <label
            style={{
              fontWeight: "700",
              display: "block",
              marginBottom: "8px",
            }}
          >
            Google Ads CSV
          </label>

          <input
            type="file"
            accept=".csv"
            onChange={(e) =>
              setGoogleFile(
                e.target.files[0]
              )
            }
          />
        </div>

        <div>
          <label
            style={{
              fontWeight: "700",
              display: "block",
              marginBottom: "8px",
            }}
          >
            Meta Ads CSV
          </label>

          <input
            type="file"
            accept=".csv"
            onChange={(e) =>
              setMetaFile(
                e.target.files[0]
              )
            }
          />
        </div>

        <button
          type="submit"
          style={{
            background: "#2563eb",
            color: "#fff",
            border: "none",
            padding: "14px 24px",
            borderRadius: "12px",
            fontWeight: "700",
            cursor: "pointer",
            width: "220px",
          }}
        >
          Run AI Analysis
        </button>
      </div>
    </form>
  );
}