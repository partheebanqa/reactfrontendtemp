import { JsonTreeNode } from "../JsonTreeNode";
import { useState } from "react";

export default function JsonTreeNodeExample() {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="p-6 space-y-2">
      <JsonTreeNode
        nodeKey="user"
        value={{ name: "John Doe", age: 30 }}
        path="$.user"
        depth={0}
        isExpanded={expanded}
        onToggle={() => setExpanded(!expanded)}
      />
      <JsonTreeNode
        nodeKey="count"
        value={42}
        path="$.count"
        depth={0}
        isExpanded={false}
        onToggle={() => {}}
      />
      <JsonTreeNode
        nodeKey="active"
        value={true}
        path="$.active"
        depth={0}
        isExpanded={false}
        onToggle={() => {}}
      />
    </div>
  );
}
