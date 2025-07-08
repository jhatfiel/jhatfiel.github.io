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
  getUsedDigitKey(): string {
    return this.getUsedDigits().sort().join(',');
  }
  abstract getUsedDigits(): number[];
  abstract toHTML(): string;
  abstract toString(): string;
  abstract compute(): number;
  abstract operations(): number;
};

class LiteralNode extends ExpressionNode {
  constructor(public value: number) {
    super();
  };

  getUsedDigits(): number[] {
    return [this.value];
  }

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

  getUsedDigits(): number[] {
    return this.a.getUsedDigits();
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

  getUsedDigits(): number[] {
    return [...this.a.getUsedDigits(), ...this.b.getUsedDigits()];
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
  const [isVisible, setIsVisible] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);
  const [showOperations, setShowOperations] = useState(false);
  const [pulse, setPulse] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);

  useEffect(() => {
    // Regenerate table rows when maximum changes
    initializeTable();
  }, [maximum]);

  const initializeTable = () => {
    const newTable = Array.from({ length: maximum }, (_, i) => ({
      target: i + 1,
      equation: '',
      operations: 0
    }));
    setTableData(newTable);
  }

  const handleCheckboxChange = (key: keyof typeof operations) => {
    setOperations((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const toggleResults = () => {
    setPulse(false);
    setIsVisible(!isVisible);
  }

  const toggleOperations = () => {
    setShowOperations(!showOperations);
  }

  const randomRoll = () => {
    let newValue = Array.from({length: 3}, _ => Math.floor(Math.random()*6)+1).sort().join(',');
    setNumbersInput(newValue);
    initializeTable();
    setCreated(-1);
    setIsCalculating(true);
    setTimeout(()=>_handleCalculate(newValue));
  }

  const handleCalculate = () => {
    initializeTable();
    setCreated(-1);
    setIsCalculating(true);
    setTimeout(()=>_handleCalculate(numbersInput));
  }

  const _handleCalculate = (numbersInput: string) => {
    const newTable = tableData.map(row => ({
      ...row,
      equation: '',
      operations: 0
    }));
    try {
      console.log(`Processing ${numbersInput}`);
      const maxSquare = operations.square?operations.unlimitedSquare?4:1:0;
      const maxSqrt = operations.sqrt?operations.unlimitedRoot?4:1:0;
      const numbers = numbersInput.split(',').map(Number).filter(n=>!isNaN(n)).sort().map(n=>new LiteralNode(n));
      // keep track of the best way to make any number.
      // If we ever come across a number that we already know how to make using the same digits, only keep this one if it is fewer operations
      // key is comma-separated digits that are being used (ascending order)
      // object is the expression that makes this 
      let cache: Map<string, ExpressionNode>[] = [];
      let processed = new Set<string>();

      let buildExpressions = (arr: ExpressionNode[]): ExpressionNode[] => {
        let result: ExpressionNode[] = [];
        let maybeAdd = (expr: ExpressionNode) => {
          let val = expr.compute();
          if (!isNaN(val) && val > 0) {
            let map = cache[val];
            if (map === undefined) {
              map = new Map<string, ExpressionNode>();
              cache[val] = map;
            }
            let key = expr.getUsedDigitKey();
            let current = map.get(key);
            if (current === undefined || expr.operations() < current.operations()) {
              map.set(key, expr);
              result.push(expr);
            }
          }
        }

        let addUnaries = (a: ExpressionNode, b: ExpressionNode, op: BinaryOperation) => {
          let ae = a;
          for (let i=0; i<=maxSquare; i++) {
            let be = b;
            for (let j=0; j<=maxSquare; j++) {
              maybeAdd(new BinaryNode(ae, op, be));
              be = new UnaryNode(be, '^');
            }
            be = b;
            for (let j=0; j<=maxSqrt; j++) {
              maybeAdd(new BinaryNode(ae, op, be));
              be = new UnaryNode(be, '_');
            }
            ae = new UnaryNode(ae, '^');
          }

          ae = a;
          for (let i=0; i<=maxSqrt; i++) {
            let be = b;
            for (let j=0; j<=maxSquare; j++) {
              maybeAdd(new BinaryNode(ae, op, be));
              be = new UnaryNode(be, '^');
            }
            be = b;
            for (let j=0; j<=maxSqrt; j++) {
              maybeAdd(new BinaryNode(ae, op, be));
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
              processed.add(key);
              for (let expr of buildExpressions([set.a, set.b])) {
                let key = `${expr.toString()}[${set.rest.map(e=>e.toString()).join(',')}]`;
                if (!processed.has(key)) {
                  processed.add(key);
                  for (let subExpr of buildExpressions([expr, ...set.rest])) {
                    result.push(subExpr);
                  }
                }
              };
            }
          });
        }
        return result;
      };

      let count = 0;
      let expressions = buildExpressions(numbers);
      for (let expr of expressions) {
        let value = expr.compute();
        if (value > 0 && value <= maximum) {
          let row = newTable.filter(td => td.target === value)[0];
          //console.log(`Found ${value} from ${expr.toString()}, row=${row.equation}`);
          if (row.equation === '' || expr.operations() < row.operations) {
            if (row.equation === '') count++;
            row.equation = expr.toHTML();
            row.operations = expr.operations();
          }
        }
      }

      setTableData(newTable);
      setCreated(count);
      console.log('complete');
    } catch (e) {
      console.error(e);
      alert('Too complicated, try reducing the number of checked options or the number of dice');
    } 
    setIsCalculating(false);
    setPulse(true);
  };

  return (
    <div className="p-4 max-w-screen-lg mx-auto font-sans">
      <h2 className="text-3xl font-bold mb-2">Dice Knockout</h2>
      <div className="mb-4 rounded shadow">
      {!showInstructions && (
        <><a onClick={()=>setShowInstructions(true)}>Show Instructions</a></>
      )}
      {showInstructions && (
        <><b>Instructions</b> <a onClick={()=>setShowInstructions(false)}>HIDE</a><br/>
        <p className="text-sm">In Dice Knockout, the objective is to use the digits on some number of rolled dice to generate your target numbers (say, from 1-19).</p>
        <p className="text-sm">Tap &nbsp;<span className="font-mono, bg-blue-700"> Roll 3 Dice </span>&nbsp; to simulate the roll of 3 dice or enter your rolled dice then tap&nbsp;<span className="font-mono, bg-blue-700"> Calculate </span>&nbsp;to see what target numbers can be created.</p></>
      )}
      </div>

      <div className="flex flex-col md:flex-row gap-2 mb-2">
        <div className="flex items-center justify-center">
          <button onClick={randomRoll} disabled={isCalculating} type="button"
          className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center me-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800 inline-flex items-center">
            Roll 3 Dice
          </button>
        </div>
        <div>
          <div className="flex flex-row">
            <input
              type="text"
              value={numbersInput}
              onChange={(e) => setNumbersInput(e.target.value)}
              onKeyUp={(e) => e.key === 'Enter' && handleCalculate()}
              placeholder="Enter your comma-separated dice"
              className="flex-1 p-2 m-2 border rounded"
            />
            <button onClick={handleCalculate} disabled={isCalculating} type="button"
             className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center me-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800 inline-flex items-center m-2">
              Calculate
            </button>
          </div>
        </div>
        {!showOperations && (
        <span onClick={toggleOperations}>Valid Operations: <span dangerouslySetInnerHTML={{'__html': 
          [
            (operations.add?'+':undefined),
            (operations.subtract?'-':undefined),
            (operations.multiply?'*':undefined),
            (operations.divide?'/':undefined),
            (operations.square?(operations.unlimitedSquare?'unlimited ':'') + '&sup2;':undefined),
            (operations.sqrt?(operations.unlimitedRoot?'unlimited ':'') + '&radic;':undefined),
          ].filter(o=>o).join(',')}}></span></span>
        )}
        {showOperations && (
        <div className="grid grid-cols-2 gap-2 md:grid-cols-1">
          <div className="col-span-2">Valid Operations <a onClick={toggleOperations}>HIDE</a></div>
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
        )}
      </div>

      {isVisible && (
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="border px-2 py-1 text-left">Target</th>
            <th className="border px-2 py-1 text-left relative">Equation ({created>=0?`${created} created`:'Calculating...'}) <div className="absolute right-1 top-0"><a className="right" onClick={toggleResults}>HIDE</a></div></th>
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
      )}
      {!isVisible && (
        (created>=0)?(<span onClick={toggleResults}><span className={pulse?'animate-pulse':''}>Tap to show</span> {created} results</span>):'Calculating...'
      )}
    </div>
  );
};

export default App;