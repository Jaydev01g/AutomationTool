import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
interface ApiRequest {
  method: string;
  url: string;
  headers: { key: string; value: string }[];
  body: string;
}

interface ApiResponse {
  status: number;
  headers: Record<string, string>;
  body: string;
}

export default function ApiTest() {
  const [method, setMethod] = useState<string>("GET");
  const [url, setUrl] = useState<string>("");
  const [headers, setHeaders] = useState<{ key: string; value: string }[]>([]);
  const [body, setBody] = useState<string>("");
  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [searchParams] = useSearchParams();
  const mode = searchParams.get("mode");
  const isAPItestMode= mode==="APItest";

  const handleAddHeader = () => {
    setHeaders([...headers, { key: "", value: "" }]);
  };

  const handleHeaderChange = (index: number, field: "key" | "value", value: string) => {
    const updatedHeaders = [...headers];
    updatedHeaders[index][field] = value;
    setHeaders(updatedHeaders);
  };

  const handleRemoveHeader = (index: number) => {
    const updatedHeaders = headers.filter((_, i) => i !== index);
    setHeaders(updatedHeaders);
  };

  const handleSendRequest = async () => {
    if (!url) {
      alert("Please enter a valid URL.");
      return;
    }

    try {
      const response = await fetch("/api/test-api", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          method,
          url,
          headers,
          body: method !== "GET" ? body : undefined,
        }),
      });

      const result = await response.json();
      setResponse(result);
    } catch (error) {
      console.error("Error sending API request:", error);
      alert("An error occurred while sending the API request.");
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">API Testing Interface</h1>

      <Card>
        <CardHeader>
          <CardTitle>Request</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <label className="block font-bold mb-2">Method</label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="p-2 border rounded w-full"
            >
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="DELETE">DELETE</option>
            </select>
          </div>

          <div className="mb-4">
            <label className="block font-bold mb-2">URL</label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Enter API URL"
              className="p-2 border rounded w-full"
            />
          </div>

          <div className="mb-4">
            <label className="block font-bold mb-2">Headers</label>
            {headers.map((header, index) => (
              <div key={index} className="flex items-center mb-2">
                <input
                  type="text"
                  value={header.key}
                  onChange={(e) => handleHeaderChange(index, "key", e.target.value)}
                  placeholder="Key"
                  className="p-2 border rounded mr-2 flex-1"
                />
                <input
                  type="text"
                  value={header.value}
                  onChange={(e) => handleHeaderChange(index, "value", e.target.value)}
                  placeholder="Value"
                  className="p-2 border rounded mr-2 flex-1"
                />
                <Button onClick={() => handleRemoveHeader(index)}>Remove</Button>
              </div>
            ))}
            <Button onClick={handleAddHeader}>Add Header</Button>
          </div>

          {method !== "GET" && (
            <div className="mb-4">
              <label className="block font-bold mb-2">Body</label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Enter request body (JSON format)"
                className="p-2 border rounded w-full"
                rows={5}
              />
            </div>
          )}

          <Button onClick={handleSendRequest}>Send Request</Button>
        </CardContent>
      </Card>

      {response && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Response</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <label className="block font-bold mb-2">Status</label>
              <p>{response.status}</p>
            </div>

            <div className="mb-4">
              <label className="block font-bold mb-2">Headers</label>
              <pre className="p-2 border rounded bg-gray-100">{JSON.stringify(response.headers, null, 2)}</pre>
            </div>

            <div className="mb-4">
              <label className="block font-bold mb-2">Body</label>
              <pre className="p-2 border rounded bg-gray-100">{response.body}</pre>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}