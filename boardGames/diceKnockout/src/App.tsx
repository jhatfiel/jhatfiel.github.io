import { useState, useEffect } from 'react';

interface PartialSet<T> {
  a: T;
  b: T;
  rest: T[];
};

function choose2<T>(arr: T[]): PartialSet<T>[] {
  let result = [];
  for (let i=0; i<arr.length-1; i++) {
    for (let j=i+1; j<arr.length; j++) {
      result.push({a: arr[i], b: arr[j], rest: [...arr.slice(0, i), ...arr.slice(i+1, j), ...arr.slice(j+1)]});
    }
  }
  return result;
}

type UnaryOperation = '^'|'_';
type BinaryOperation = '+'|'-'|'*'|'/';

abstract class ExpressionNode {
  abstract toHTML(): string;
  abstract toString(): string;
  abstract compute(): number;
  abstract operations(): number;
};

class LiteralNode extends ExpressionNode {
  constructor(public value: number) {
    super();
  };

  toHTML(): string {
    return this.toString();
  }

  toString(): string {
    return this.value.toString();
  }

  compute(): number {
    return this.value;
  }

  operations(): number {
    return 1;
  }
};

class UnaryNode extends ExpressionNode {
  constructor(public a: ExpressionNode, public op: UnaryOperation) {
    super();
  }

  toHTML(): string {
    let result = this.a.toHTML();
    if (!(this.a instanceof LiteralNode)) result = `(${result})`;
    if (this.op === '^') result += '&sup2;';
    if (this.op === '_') result = '&radic;' + result;

    return result;
  }

  toString(): string {
    let result = this.a.toString();
    if (!(this.a instanceof LiteralNode)) result = `(${result})`;
    return `${result}${this.op}`;
  }

  compute(): number {
    let result = 0;
    switch (this.op) {
      case '^':
        result = this.a.compute() ** 2;
        break;
      case '_':
        result = Math.sqrt(this.a.compute());
        if (Math.round(result) !== result) result = NaN;
        break;
    }

    return result;
  }

  operations(): number {
    return this.a.operations() + 1;
  }
};

class BinaryNode extends ExpressionNode {
  constructor(public a: ExpressionNode, public op: BinaryOperation, public b: ExpressionNode) {
    super();
  }

  toHTML(): string {
    let a = this.a.toHTML();
    let b = this.b.toHTML();
    if (!(this.a instanceof LiteralNode)) a = `(${a})`;
    if (!(this.b instanceof LiteralNode)) b = `(${b})`;
    return `${a} ${this.op} ${b}`;
  }

  toString(): string {
    let a = this.a.toString();
    let b = this.b.toString();
    if (!(this.a instanceof LiteralNode)) a = `(${a})`;
    if (!(this.b instanceof LiteralNode)) b = `(${b})`;
    return `${a} ${this.op} ${b}`;
  }

  compute(): number {
    let result = 0;
    switch (this.op) {
      case '+':
        result = this.a.compute() + this.b.compute();
        break;
      case '-':
        result = this.a.compute() - this.b.compute();
        break;
      case '*':
        result = this.a.compute() * this.b.compute();
        break;
      case '/':
        result = this.a.compute() / this.b.compute();
        if (Math.round(result) !== result) result = NaN;
        break;
    }

    return result;
  }

  operations(): number {
    return this.a.operations() + this.b.operations() + 1;
  }
};

const App = () => {
  const [numbersInput, setNumbersInput] = useState('');
  const [operations, setOperations] = useState({
    add: true,
    subtract: true,
    multiply: true,
    divide: true,
    square: true,
    unlimitedSquare: true,
    sqrt: true,
    unlimitedRoot: true,
  });
  const [maximum, setMaximum] = useState(19);
  const [tableData, setTableData] = useState<{target: number; equation: string, operations: number}[]>([]);
  const [created, setCreated] = useState(0);

  useEffect(() => {
    // Regenerate table rows when maximum changes
    const newTable = Array.from({ length: maximum }, (_, i) => ({
      target: i + 1,
      equation: '',
      operations: 0
    }));
    setTableData(newTable);
  }, [maximum]);

  const handleCheckboxChange = (key: keyof typeof operations) => {
    setOperations((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleCalculate = () => {
    console.log(`Processing ${numbersInput}`);
    const maxSquare = operations.square?operations.unlimitedSquare?5:1:0;
    const maxSqrt = operations.sqrt?operations.unlimitedRoot?5:1:0;
    const numbers = numbersInput.split(',').map(Number).filter(n=>!isNaN(n)).sort().map(n=>new LiteralNode(n));
    console.log({maxSquare, maxSqrt});

    let processed = new Set<string>();
    let buildExpressions = (arr: ExpressionNode[]): ExpressionNode[] => {
      let result: ExpressionNode[] = [];
      let addUnaries = (a: ExpressionNode, b: ExpressionNode, op: BinaryOperation) => {
        let ae = a;
        for (let i=0; i<=maxSquare; i++) {
          let be = b;
          for (let j=0; j<=maxSquare; j++) {
            result.push(new BinaryNode(ae, op, be));
            be = new UnaryNode(be, '^');
          }
          be = b;
          for (let j=0; j<=maxSqrt; j++) {
            result.push(new BinaryNode(ae, op, be));
            be = new UnaryNode(be, '_');
          }
          ae = new UnaryNode(ae, '^');
        }

        ae = a;
        for (let i=0; i<=maxSqrt; i++) {
          let be = b;
          for (let j=0; j<=maxSquare; j++) {
            result.push(new BinaryNode(ae, op, be));
            be = new UnaryNode(be, '^');
          }
          be = b;
          for (let j=0; j<=maxSqrt; j++) {
            result.push(new BinaryNode(ae, op, be));
            be = new UnaryNode(be, '_');
          }
          ae = new UnaryNode(ae, '_');
        }
      }

      if (arr.length === 2) {
        let [a,b] = arr;
        let [av, bv] = [a.compute(), b.compute()];

        if (operations.add) {
          addUnaries(a, b, '+');
        }

        if (operations.subtract) {
          addUnaries(b, a, '-');
          if (av !== bv) {
            addUnaries(a, b, '-');
          }
        }

        if (operations.multiply) {
          addUnaries(a, b, '*');
        }

        if (operations.divide) {
          addUnaries(b, a, '/');
          if (av !== bv) {
            addUnaries(a, b, '/');
          }
        }
      } else {
        choose2(arr).forEach(set => {
          let key = `${set.a.toString()}&${set.b.toString()}[${set.rest.map(e=>e.toString()).join(',')}]`;
          if (!processed.has(key)) {
            for (let expr of buildExpressions([set.a, set.b])) {
              result.push(...buildExpressions([expr, ...set.rest]));
            };
            processed.add(key);
          }
        });
      }
      return result;
    };

    const newTable = tableData.map(row => ({
      ...row,
      equation: '',
      operations: 0
    }));

    let count = 0;
    let expressions = buildExpressions(numbers);
    console.log(`Evaluating ${expressions.length} expressions`);
    for (let expr of expressions) {
      let value = expr.compute();
      if (value > 0 && value <= maximum) {
        let row = newTable.filter(td => td.target === value)[0];
        //console.log(`Found ${value} from ${expr.toString()}, row=${row.equation}`);
        if (row.equation === '' || expr.operations() < row.operations) {
          if (row.equation === '') count++;
          row.equation = expr.toHTML();
          row.operations = expr.operations();
          console.log(`${expr.toString()} = ${value}`);
        }
      }
    }

    setTableData(newTable);
    setCreated(count);
    console.log('complete');
  };

  return (
    <div className="p-4 max-w-screen-lg mx-auto font-sans">
      <h1 className="text-3xl font-bold mb-2">Dice Knockout</h1>

      <div className="mb-4 p-3 rounded shadow">
        <p className="text-sm">In Dice Knockout, the objective is to use the digits on some number of rolled dice to generate your target numbers (say, from 1-19).</p>
        <br/>
        <p className="text-sm">Enter your rolled dice and the rules then press&nbsp;<span className="font-mono, bg-black"> Calculate </span>&nbsp;to see what target numbers can be created.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-4">
        <input
          type="text"
          value={numbersInput}
          onChange={(e) => setNumbersInput(e.target.value)}
          onKeyUp={(e) => e.key === 'Enter' && handleCalculate()}
          placeholder="Enter your comma-separated dice"
          className="flex-1 p-2 border rounded"
        />

        <div className="grid grid-cols-2 gap-2 md:grid-cols-1">
          <label><input type="checkbox" checked={operations.add} onChange={() => handleCheckboxChange('add')} /> + (ADD)</label>
          <label><input type="checkbox" checked={operations.subtract} onChange={() => handleCheckboxChange('subtract')} /> - (SUBTRACT)</label>
          <label><input type="checkbox" checked={operations.multiply} onChange={() => handleCheckboxChange('multiply')} /> * (MULTIPLY)</label>
          <label><input type="checkbox" checked={operations.divide} onChange={() => handleCheckboxChange('divide')} /> / (DIVIDE)</label>
          <label><input type="checkbox" checked={operations.square} onChange={() => handleCheckboxChange('square')} /> ^2 (SQUARE)</label>
          <label>
            <input
              type="checkbox"
              checked={operations.unlimitedSquare}
              onChange={() => handleCheckboxChange('unlimitedSquare')}
              disabled={!operations.square}
            /> Unlimited Squaring
          </label>
          <label><input type="checkbox" checked={operations.sqrt} onChange={() => handleCheckboxChange('sqrt')} /> SQRT (Rooting)</label>
          <label>
            <input
              type="checkbox"
              checked={operations.unlimitedRoot}
              onChange={() => handleCheckboxChange('unlimitedRoot')}
              disabled={!operations.sqrt}
            /> Unlimited Rooting
          </label>
          <label>
            Maximum:
            <input
              type="number"
              min={1}
              value={maximum}
              onChange={(e) => setMaximum(Number(e.target.value))}
              className="ml-2 p-1 border rounded w-20"
            />
          </label>
        </div>
      </div>

      <button onClick={handleCalculate} className="mb-4 bg-blue-500 text-white px-4 py-2 rounded shadow hover:bg-blue-600">
        Calculate
      </button>
      Successfully Created: {created}

      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="border px-2 py-1 text-left">Target</th>
            <th className="border px-2 py-1 text-left">Equation</th>
          </tr>
        </thead>
        <tbody>
          {tableData.map((row) => (
            <tr key={row.target}>
              <td className="border px-2 py-1">{row.target}</td>
              <td className="border px-2 py-1" dangerouslySetInnerHTML={{'__html': row.equation}}></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default App;