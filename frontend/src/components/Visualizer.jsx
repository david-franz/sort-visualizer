import { useState } from 'react';
import Editor from '@monaco-editor/react';

function Visualizer() {
  const defaultCode = `// TypeScript sorting algorithm
function bubbleSort(arr: number[]): number[] {
  const a = [...arr];
  for (let i = 0; i < a.length; i++) {
    for (let j = 0; j < a.length - i - 1; j++) {
      if (a[j] > a[j + 1]) {
        [a[j], a[j + 1]] = [a[j + 1], a[j]];
      }
    }
  }
  return a;
}
`;
  const [code, setCode] = useState(defaultCode);

  return (
    <div>
      <h2>Edit</h2>
      <Editor
        height="70vh"
        width="70vh"
        defaultLanguage="typescript"
        defaultValue={defaultCode}
        onChange={value => setCode(value)}
      />
    </div>
  );
}

export default Visualizer;