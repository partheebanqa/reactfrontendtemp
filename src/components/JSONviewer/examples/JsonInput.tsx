import { JsonInput } from "../JsonInput";
import { useState } from "react";

export default function JsonInputExample() {
  const [value, setValue] = useState('{\n  "name": "Example",\n  "value": 123\n}');
  const [error] = useState<string | null>(null);

  return (
    <div className="h-screen p-6">
      <JsonInput
        value={value}
        onChange={setValue}
        onParse={() => console.log("Parse triggered")}
        error={error}
      />
    </div>
  );
}
