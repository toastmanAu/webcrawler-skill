import { useState } from "react";
import { Card } from "../../components/Card";
import { Field } from "../../components/Field";

export function ToolsPanel() {
  const [hexInput, setHexInput] = useState("");
  const [utf8Input, setUtf8Input] = useState("");

  function utf8ToHex(value: string) {
    return "0x" + Array.from(new TextEncoder().encode(value))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }

  function hexToUtf8(value: string) {
    try {
      const cleaned = value.replace(/^0x/, "");
      const bytes = new Uint8Array(cleaned.match(/.{1,2}/g)?.map((b) => parseInt(b, 16)) ?? []);
      return new TextDecoder().decode(bytes);
    } catch {
      return "Invalid hex";
    }
  }

  return (
    <Card title="Utility Tools">
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="UTF-8 → Hex">
          <textarea rows={4} value={utf8Input} onChange={(e) => setUtf8Input(e.target.value)} />
          <pre className="mt-2 rounded-lg border border-slate-800 bg-slate-950/70 p-3 text-xs">
            {utf8ToHex(utf8Input)}
          </pre>
        </Field>

        <Field label="Hex → UTF-8">
          <textarea rows={4} value={hexInput} onChange={(e) => setHexInput(e.target.value)} />
          <pre className="mt-2 rounded-lg border border-slate-800 bg-slate-950/70 p-3 text-xs">
            {hexToUtf8(hexInput)}
          </pre>
        </Field>
      </div>
    </Card>
  );
}